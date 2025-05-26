import React, { useState, useEffect, useRef } from "react";
import { Upload, ChevronLeft, ChevronRight, X } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "./FileUpload.css";

const isOfficeDoc = (name) => {
  const ext = name.split(".").pop().toLowerCase();
  return ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext);
};

const isPdf = (type) => type === "application/pdf";
const getFileTypeLabel = (name) => name.split(".").pop().toUpperCase();

const FileUpload = ({
  onToggleCollapse,
  onFilesChange,
  taskId,
  eventId,
  organizationId,
  initialFiles = [],
  externalLoading = false
}) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [description, setDescription] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const dropRef = useRef(null);

  const effectiveLoading = externalLoading || loading;

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const SkeletonPreviewGrid = () => (
    <div className="preview-grid">
      {[1, 2, 3].map((_, i) => (
        <div className="file-preview" key={i}>
          <Skeleton height={100} />
          <Skeleton height={15} width={`60%`} style={{ marginTop: 8 }} />
        </div>
      ))}
    </div>
  );

  useEffect(() => {
    if (Array.isArray(initialFiles)) {
      const enriched = initialFiles.map(file => ({
        ...file,
        url: file.url || (file.file ? URL.createObjectURL(file.file) : ""),
        type: file.type || (file.file ? file.file.type : "application/octet-stream")
      }));
      setUploadedFiles(enriched);
    }
  }, [initialFiles]);

  useEffect(() => {
    onToggleCollapse(isCollapsed);
  }, [isCollapsed, onToggleCollapse]);

  useEffect(() => {
    return () => {
      uploadedFiles.forEach(file => {
        if (file.url && file.url.startsWith("blob:")) {
          URL.revokeObjectURL(file.url);
        }
      });
    };
  }, [uploadedFiles]);

  const uploadFileToBackend = async (file) => {
    const formData = new FormData();
    formData.append("File", file);
    formData.append("description", file.name);

    const response = await fetch("/apis/document/upload_document", {
      method: "POST",
      body: formData,
      headers: { "ngrok-skip-browser-warning": "1" }
    });

    if (!response.ok) throw new Error("Upload failed");
    const data = await response.json();
    return data.documentId;
  };

  const linkDocumentToTask = async (documentId) => {
    const payload = {
      eventId,
      organizationId,
      documentId,
    };
    if (taskId) payload.taskId = taskId;

    const response = await fetch("/apis/Document-Details", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "1",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("Linking failed");
    return await response.json();
  };

  const processFiles = async (files) => {
    setLoading(true);
    const processed = [];

    for (const file of files) {
      try {
        const documentId = await uploadFileToBackend(file);
        await linkDocumentToTask(documentId);

        const preview = {
          file,
          name: file.name,
          type: file.type,
          url: URL.createObjectURL(file),
          documentId,
        };
        processed.push(preview);
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
      }
    }

    const updated = [...uploadedFiles, ...processed];
    const newDescription = updated.map((f) => `${f.name} (${f.type})`).join(", ");
    setUploadedFiles(updated);
    setDescription(newDescription);
    onFilesChange({ files: updated, description: newDescription });
    setLoading(false);
  };

  const handleFileChange = (e) => {
    processFiles(Array.from(e.target.files));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const removeFile = (index) => {
    const updated = [...uploadedFiles];
    const [removed] = updated.splice(index, 1);

    if (removed.url && removed.url.startsWith("blob:")) {
      URL.revokeObjectURL(removed.url);
    }

    const updatedDescription = updated
      .map((f) => `${f.name} (${f.type})`)
      .join(", ");
    setUploadedFiles(updated);
    setDescription(updatedDescription);
    onFilesChange({ files: updated, description: updatedDescription });
  };

  return (
    <div
      className={`file-upload-container ${isCollapsed ? "collapsed" : ""} ${dragOver ? "drag-over" : ""}`}
      ref={dropRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {!isCollapsed && (
        <div className="content">
          {uploadedFiles.length === 0 && !effectiveLoading ? (
            <div className="empty">
              <label className="upload-label">
                <input
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  hidden
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                />
                <span className="upload-text">
                  <Upload className="icon" />
                </span>
              </label>
              <p>Drag & Drop or Click to Upload</p>
            </div>
          ) : effectiveLoading ? (
            <SkeletonPreviewGrid />
          ) : (
            <div className="preview-grid">
              {uploadedFiles.map((file, index) => (
                <div className="file-preview" key={index}>
                  {file.type.startsWith("image/") ? (
                    <img src={file.url} alt={file.name} />
                  ) : file.type.startsWith("video/") ? (
                    <video src={file.url} controls />
                  ) : file.type.startsWith("audio/") ? (
                    <audio src={file.url} controls />
                  ) : isPdf(file.type) ? (
                    <iframe
                      src={file.url}
                      title={file.name}
                      className="doc-preview"
                      sandbox="allow-same-origin allow-scripts"
                    />
                  ) : isOfficeDoc(file.name) ? (
                    <iframe
                      src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`}
                      title={file.name}
                      className="doc-preview"
                      sandbox="allow-same-origin allow-scripts"
                    />
                  ) : (
                    <div className="file-icon-preview">
                      <p className="file-type-label">{getFileTypeLabel(file.name)}</p>
                      <p className="file-name">{file.name}</p>
                    </div>
                  )}
                  <button className="remove-button" onClick={() => removeFile(index)}>
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <button className="side-button" onClick={toggleCollapse}>
        {isCollapsed ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
      </button>
    </div>
  );
};

export default FileUpload;
