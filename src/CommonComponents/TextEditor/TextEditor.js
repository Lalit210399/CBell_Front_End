import React, { useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import "./TextEditor.css"; // Your custom styling

const TextEditor = ({ initialContent = "", onContentChange, isFullWidth, mode = "edit" }) => {
  const editorRef = useRef(null);
  const quillInstance = useRef(null);
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    if (editorRef.current && !quillInstance.current) {
      quillInstance.current = new Quill(editorRef.current, {
        theme: "snow",
        readOnly: mode === "view",
        modules: {
          toolbar: [
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

            // Remove formatting
            ["clean"]
          ]
        }
      });


      quillInstance.current.root.innerHTML = initialContent;

      quillInstance.current.on('text-change', () => {
        const html = quillInstance.current.root.innerHTML;
        setContent(html);
        onContentChange?.(html);
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
    <div className={`text-editor-container ${isFullWidth ? "full-width" : ""}`}>
      <label className="text-editor-label">
        Content for Creation (Description) <span style={{ color: "red" }}>*</span>
      </label>
      <div ref={editorRef} style={{ minHeight: 300 }} />
    </div>
  );
};

export default TextEditor;
