function safeAtob(value) {
  if (typeof atob === "function") return atob(value);
  if (typeof Buffer !== "undefined") return Buffer.from(value, "base64").toString("binary");
  throw new Error("Base64 decoder not available");
}

function normalizeBase64(segment = "") {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4)) % 4;
  return normalized + "=".repeat(padding);
}

export function decodeGuestToken(token) {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = safeAtob(normalizeBase64(parts[1]));
    try {
      return JSON.parse(payload);
    } catch (_) {
      const decoded = decodeURIComponent(
        payload
          .split("")
          .map(char => `%${("00" + char.charCodeAt(0).toString(16)).slice(-2)}`)
          .join("")
      );
      return JSON.parse(decoded);
    }
  } catch (err) {
    console.warn("Failed to decode guest token", err);
    return null;
  }
}

function appendCandidate(list, seen, candidate) {
  if (candidate === null || candidate === undefined) return;
  let value = candidate;
  if (typeof value === "object" && value?.id) value = value.id;
  if (typeof value === "string") value = value.trim();
  if (value === "" || value === null || value === undefined) return;
  const key = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (seen.has(key)) return;
  seen.add(key);
  list.push(value);
}

function collectFromSource(source, list, seen) {
  if (!source) return;
  appendCandidate(list, seen, source.taskId);
  appendCandidate(list, seen, source.task?.id ?? source.task);
  const group = source.taskIds ?? source.tasks;
  if (Array.isArray(group)) {
    group.forEach(item => appendCandidate(list, seen, item));
  } else {
    appendCandidate(list, seen, group);
  }
}

export function gatherTaskIds(...sources) {
  const list = [];
  const seen = new Set();
  sources.forEach(src => collectFromSource(src, list, seen));
  return list;
}

export function resolveTaskId(source) {
  const [first] = gatherTaskIds(source);
  return first ?? null;
}

export function resolveTaskIdFromToken(token) {
  return resolveTaskId(decodeGuestToken(token));
}
