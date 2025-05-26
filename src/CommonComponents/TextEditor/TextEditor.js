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
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'font': [] }, { 'size': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['clean']
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
