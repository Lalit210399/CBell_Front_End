import React, { useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import "./TextEditor.css"; // Your custom styling

const TextEditor = ({ initialContent = "", onContentChange, isFullWidth, mode = "edit", hasError = false, errorMessage = "", showRequiredAsterisk = true }) => {
  const editorRef = useRef(null);
  const quillInstance = useRef(null);
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    if (editorRef.current && !quillInstance.current) {
      quillInstance.current = new Quill(editorRef.current, {
        theme: "snow",
        readOnly: mode === "view",
        modules: {
          toolbar: mode === "view" ? false : [
            // Text styles
            ["bold", "italic", "underline", "strike"],
            ["blockquote", "code-block"],

            // Headers
            [{ header: 1 }, { header: 2 }],
            [{ header: [1, 2, 3, 4, 5, 6, false] }],

            // Lists
            [{ list: "ordered" }, { list: "bullet" }],
            [{ indent: "-1" }, { indent: "+1" }],

            // Scripts
            [{ script: "sub" }, { script: "super" }],

            // Alignment
            [{ align: [] }],

            // Fonts and sizes
            [{ font: [] }],
            [{ size: ["small", false, "large", "huge"] }],

            // Colors & backgrounds
            [{ color: [] }, { background: [] }],

            // Links, images, video
            ["link", "image", "video"],

            // Tables
            ["table"],

            // Remove formatting
            ["clean"]
          ],
          table: true
        }
      });


      quillInstance.current.root.innerHTML = initialContent;

      // Handle paste events to clean up table formatting
      quillInstance.current.root.addEventListener('paste', (e) => {
        e.preventDefault();
        
        const text = e.clipboardData?.getData('text/html') || e.clipboardData?.getData('text/plain') || '';
        
        if (text) {
          // Create a temporary div to parse the pasted content
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = text;
          
          // Check if pasted content contains tables
          const hasTables = tempDiv.querySelector('table');
          
          if (hasTables) {
            // Clean up table HTML: remove styling attributes that cause width issues
            const tables = tempDiv.querySelectorAll('table');
            tables.forEach(table => {
              // Remove inline styles that might restrict width
              table.removeAttribute('style');
              table.removeAttribute('width');
              
              // Clean up all cells
              const cells = table.querySelectorAll('td, th');
              cells.forEach(cell => {
                // Remove restrictive styles but keep cell content
                cell.removeAttribute('style');
                cell.removeAttribute('width');
                cell.removeAttribute('height');
              });
            });
          }
          
          // Insert the cleaned HTML
          const selection = quillInstance.current.getSelection();
          if (selection) {
            quillInstance.current.clipboard.dangerouslyPasteHTML(
              selection.index,
              tempDiv.innerHTML,
              'user'
            );
          }
        }
      });

      quillInstance.current.on('text-change', () => {
        const html = quillInstance.current.root.innerHTML;
        // Normalize empty content: if only HTML tags and no text, set to empty string
        const textContent = html.replace(/<[^>]*>/g, '').trim();
        const normalizedHtml = textContent ? html : '';
        setContent(normalizedHtml);
        onContentChange?.(normalizedHtml);
      });
    }

    if (quillInstance.current) {
      quillInstance.current.enable(mode !== "view");
    }
  }, [mode]);

  useEffect(() => {
    if (quillInstance.current && initialContent !== content) {
      quillInstance.current.root.innerHTML = initialContent;
    }
  }, [initialContent]);

  return (
    <div className={`text-editor-container ${isFullWidth ? "full-width" : ""} ${hasError ? "error" : ""}`}>
      <label className="text-editor-label">
        Content for Creation (Description) {showRequiredAsterisk && <span style={{ color: "red" }}>*</span>}
      </label>
      <div ref={editorRef} style={{ flex: 1, minHeight: 0 }} />
      {hasError && errorMessage && (
        <div className="text-editor-error-message">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default TextEditor;
