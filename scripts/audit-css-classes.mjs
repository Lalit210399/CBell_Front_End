#!/usr/bin/env node
/**
 * CSS/ClassName audit (AST-based)
 *
 * Scans src (recursively) for .js/.jsx/.ts/.tsx that import CSS.
 * Extracts className usage (string literals + simple templates/clsx/classnames).
 * Compares against classes defined in imported CSS files and also against all CSS under src/.
 * Writes a markdown report to CSS_CLASS_AUDIT_REPORT.md
 */

import fs from 'fs';
import path from 'path';
import process from 'process';

import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule?.default ?? traverseModule;

const projectRoot = process.cwd();
const SRC_DIR = path.join(projectRoot, 'src');
const REPORT_PATH = path.join(projectRoot, 'CSS_CLASS_AUDIT_REPORT.md');

const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);

const DEFAULT_IGNORE = new Set([
  // common state tokens
  'active', 'disabled', 'open', 'closed', 'expanded', 'collapsed', 'selected', 'unread', 'read',
  'hidden', 'visible', 'loading',
  // common semantic tokens
  'primary', 'secondary', 'success', 'error', 'warning', 'info',
]);

function isSubPath(parent, child) {
  const rel = path.relative(parent, child);
  return !!rel && !rel.startsWith('..') && !path.isAbsolute(rel);
}

function listFilesRecursive(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    const entries = fs.readdirSync(cur, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(cur, e.name);
      if (e.isDirectory()) {
        stack.push(full);
      } else if (e.isFile()) {
        out.push(full);
      }
    }
  }
  return out;
}

function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function normalizeCssImport(fromFile, importPath) {
  if (!importPath) return null;
  // ignore css modules? treat them same
  // resolve relative only; absolute imports not supported in this repo
  if (importPath.startsWith('.')) {
    return path.normalize(path.join(path.dirname(fromFile), importPath));
  }
  // Try resolving from src/ as absolute-ish (CRA allows this sometimes)
  // e.g. import 'Styles/Global.css'
  const maybe = path.normalize(path.join(SRC_DIR, importPath));
  return maybe;
}

function extractCssClasses(cssText) {
  // Conservative regex: matches .className in selectors.
  // Avoid numeric classes like .5 by requiring leading alpha/_.
  const set = new Set();
  const re = /\.(?<c>[A-Za-z_][A-Za-z0-9_-]*)/g;
  let m;
  while ((m = re.exec(cssText))) {
    set.add(m.groups.c);
  }
  return set;
}

function splitClassTokens(value) {
  return value
    .split(/\s+/)
    .map(s => s.trim())
    .filter(Boolean)
    .filter(s => /^[A-Za-z_][A-Za-z0-9_-]*$/.test(s));
}

function addTokens(set, tokens) {
  for (const t of tokens) {
    if (!t) continue;
    if (DEFAULT_IGNORE.has(t)) continue;
    set.add(t);
  }
}

function evalStaticString(node) {
  // Best-effort static evaluation for strings.
  if (!node) return null;

  switch (node.type) {
    case 'StringLiteral':
      return node.value;
    case 'TemplateLiteral': {
      // Only take raw text parts; drop expressions.
      const parts = node.quasis.map(q => q.value?.cooked ?? '');
      return parts.join(' ');
    }
    case 'BinaryExpression': {
      if (node.operator !== '+') return null;
      const left = evalStaticString(node.left);
      const right = evalStaticString(node.right);
      if (left == null || right == null) return null;
      return `${left}${right}`;
    }
    case 'ConditionalExpression': {
      // If both branches are static strings, union will be handled by caller.
      return null;
    }
    default:
      return null;
  }
}

function collectClassTokensFromExpression(expr, outSet) {
  if (!expr) return;

  // Direct static strings
  const s = evalStaticString(expr);
  if (typeof s === 'string') {
    addTokens(outSet, splitClassTokens(s));
    return;
  }

  // Conditional expression: collect both sides
  if (expr.type === 'ConditionalExpression') {
    collectClassTokensFromExpression(expr.consequent, outSet);
    collectClassTokensFromExpression(expr.alternate, outSet);
    return;
  }

  // LogicalExpression: collect both
  if (expr.type === 'LogicalExpression') {
    collectClassTokensFromExpression(expr.left, outSet);
    collectClassTokensFromExpression(expr.right, outSet);
    return;
  }

  // ArrayExpression: often used with clsx
  if (expr.type === 'ArrayExpression') {
    for (const el of expr.elements) {
      if (el) collectClassTokensFromExpression(el, outSet);
    }
    return;
  }

  // ObjectExpression: keys might be class names (classnames pattern)
  if (expr.type === 'ObjectExpression') {
    for (const prop of expr.properties) {
      if (prop.type !== 'ObjectProperty') continue;
      if (prop.key.type === 'StringLiteral') {
        addTokens(outSet, splitClassTokens(prop.key.value));
      }
    }
    return;
  }

  // CallExpression: clsx/classnames
  if (expr.type === 'CallExpression') {
    const calleeName = expr.callee?.type === 'Identifier' ? expr.callee.name : null;
    if (calleeName === 'clsx' || calleeName === 'classnames') {
      for (const arg of expr.arguments) {
        if (arg && arg.type !== 'SpreadElement') collectClassTokensFromExpression(arg, outSet);
      }
    }
    return;
  }
}

function parseFileAst(code, filePath) {
  return parse(code, {
    sourceType: 'module',
    sourceFilename: filePath,
    plugins: [
      'jsx',
      'typescript',
      'classProperties',
      'classPrivateProperties',
      'classPrivateMethods',
      'dynamicImport',
      'importMeta',
      'optionalChaining',
      'nullishCoalescingOperator',
      'objectRestSpread',
      'topLevelAwait',
    ],
    errorRecovery: true,
  });
}

function audit() {
  const srcFiles = listFilesRecursive(SRC_DIR);

  const allCssFiles = srcFiles.filter(f => f.endsWith('.css'));
  const allCssIndex = new Map(); // class -> Set(files)

  for (const cssFile of allCssFiles) {
    const cssText = safeReadFile(cssFile);
    if (!cssText) continue;
    for (const cls of extractCssClasses(cssText)) {
      if (!allCssIndex.has(cls)) allCssIndex.set(cls, new Set());
      allCssIndex.get(cls).add(path.relative(projectRoot, cssFile));
    }
  }

  const codeFiles = srcFiles.filter(f => EXTENSIONS.has(path.extname(f)));
  const findings = [];

  for (const file of codeFiles) {
    const code = safeReadFile(file);
    if (!code) continue;
    if (!code.includes('.css')) continue;

    let ast;
    try {
      ast = parseFileAst(code, file);
    } catch {
      // If parsing fails, skip (should be rare).
      continue;
    }

    const cssImports = new Set();
    const classTokens = new Set();

    traverse(ast, {
      ImportDeclaration(p) {
        const v = p.node?.source?.value;
        if (typeof v === 'string' && v.endsWith('.css')) {
          cssImports.add(v);
        }
      },
      CallExpression(p) {
        // require('./x.css')
        const callee = p.node.callee;
        if (callee?.type === 'Identifier' && callee.name === 'require') {
          const arg0 = p.node.arguments?.[0];
          if (arg0?.type === 'StringLiteral' && arg0.value.endsWith('.css')) {
            cssImports.add(arg0.value);
          }
        }
      },
      JSXAttribute(p) {
        if (p.node.name?.type !== 'JSXIdentifier') return;
        if (p.node.name.name !== 'className') return;

        const v = p.node.value;
        if (!v) return;
        if (v.type === 'StringLiteral') {
          addTokens(classTokens, splitClassTokens(v.value));
          return;
        }
        if (v.type === 'JSXExpressionContainer') {
          collectClassTokensFromExpression(v.expression, classTokens);
        }
      },
    });

    if (cssImports.size === 0 || classTokens.size === 0) continue;

    // Gather classes from imported css
    const importedCssPaths = [];
    const missingCssFiles = [];
    const importedCssClasses = new Set();

    for (const imp of cssImports) {
      const resolved = normalizeCssImport(file, imp);
      if (!resolved) continue;
      importedCssPaths.push(resolved);

      const cssText = safeReadFile(resolved);
      if (!cssText) {
        missingCssFiles.push(imp);
        continue;
      }
      for (const cls of extractCssClasses(cssText)) importedCssClasses.add(cls);
    }

    const missingInImported = [];
    const notFoundAnywhere = [];

    for (const cls of classTokens) {
      if (importedCssClasses.has(cls)) continue;
      missingInImported.push(cls);
      if (!allCssIndex.has(cls)) notFoundAnywhere.push(cls);
    }

    if (missingCssFiles.length || missingInImported.length) {
      findings.push({
        file: path.relative(projectRoot, file),
        cssImports: Array.from(cssImports),
        missingCssFiles,
        missingInImported: missingInImported.sort(),
        notFoundAnywhere: notFoundAnywhere.sort(),
      });
    }
  }

  // Sort: highest-confidence first
  findings.sort((a, b) => {
    const ac = b.notFoundAnywhere.length - a.notFoundAnywhere.length;
    if (ac !== 0) return ac;
    const bc = b.missingInImported.length - a.missingInImported.length;
    if (bc !== 0) return bc;
    return a.file.localeCompare(b.file);
  });

  // Write report
  const lines = [];
  lines.push('# CSS Class Audit Report');
  lines.push('');
  lines.push('Scans src/**/*.{js,jsx,ts,tsx} that import CSS and compares className usage against the imported CSS selectors.');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Total files flagged: ${findings.length}`);
  lines.push('');

  for (const f of findings) {
    lines.push('---');
    lines.push(`File: ${f.file}`);
    lines.push(`CSS imports: ${f.cssImports.join(', ')}`);
    if (f.missingCssFiles.length) {
      lines.push(`Missing CSS imports: ${f.missingCssFiles.join(', ')}`);
    }
    if (f.missingInImported.length) {
      lines.push(`Missing in imported CSS (${f.missingInImported.length}): ${f.missingInImported.slice(0, 80).join(', ')}`);
    }
    if (f.notFoundAnywhere.length) {
      lines.push(`Not found anywhere in src CSS (${f.notFoundAnywhere.length}): ${f.notFoundAnywhere.slice(0, 80).join(', ')}`);
    }
    lines.push('');
  }

  fs.writeFileSync(REPORT_PATH, lines.join('\n'), 'utf8');

  return { findingsCount: findings.length, reportPath: REPORT_PATH };
}

const result = audit();
console.log(`Wrote report: ${path.relative(projectRoot, result.reportPath)}`);
console.log(`Total files flagged: ${result.findingsCount}`);
process.exit(result.findingsCount === 0 ? 0 : 2);
