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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
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

  // Sort helper for newest first
  const sortByNewest = (arr) =>
    [...arr].sort(
      (a, b) =>
        new Date(b.uploadedAt || b.createdAt || 0) -
        new Date(a.uploadedAt || a.createdAt || 0)
    );

  useEffect(() => {
    if (Array.isArray(initialFiles)) {
      // Sort initial files to show latest first (if timestamps exist)
      const enriched = sortByNewest(
        initialFiles.map((file) => ({
          ...file,
          url: file.url || (file.file ? URL.createObjectURL(file.file) : ""),
          type: file.type || (file.file ? file.file.type : "application/octet-stream"),
        }))
      );
      setUploadedFiles(enriched);
    }
  }, [initialFiles]);

  useEffect(() => {
    onToggleCollapse(isCollapsed);
  }, [isCollapsed, onToggleCollapse]);

  useEffect(() => {
    return () => {
      uploadedFiles.forEach((file) => {
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
          uploadedAt: new Date().toISOString(), // Add timestamp for sorting
        };
        processed.push(preview);
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
      }
    }

    // Add new files to the front (latest first), then sort all
    const updated = sortByNewest([...processed, ...uploadedFiles]);
    const newDescription = updated.map((f) => `${f.name} (${f.type})`).join(", ");
    setUploadedFiles(updated);
    onFilesChange({ files: updated, description: newDescription });
    setCurrentIndex(0); // Show newest file after upload
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
    onFilesChange({ files: updated, description: updatedDescription });
    setCurrentIndex((prev) => {
      if (updated.length === 0) return 0;
      if (prev >= updated.length) return updated.length - 1;
      if (prev === index && index > 0) return prev - 1;
      return prev;
    });
  };

  // --- SLIDER LOGIC FOR NEWEST-FIRST ORDER ---
  // Left arrow: previous (older, higher index)
  // Right arrow: next (newer, lower index)
  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? uploadedFiles.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev === uploadedFiles.length - 1 ? 0 : prev + 1
    );
  };
  // --- END SLIDER LOGIC ---

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
            <>
              {uploadedFiles.length > 0 && (
                <>
                  <div className="media-slider">
                    <div className="media-viewer-square">
                      <button
                        className="slider-btn left"
                        onClick={handlePrev}
                        aria-label="Previous (older)"
                        type="button"
                        disabled={uploadedFiles.length < 2}
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <div
                        className="media-preview-box"
                        style={{ width: "100%", height: "100%" }}
                        onDoubleClick={() => {
                          const file = uploadedFiles[currentIndex];
                          if (file && file.url) {
                            window.open(file.url, "_blank", "noopener,noreferrer");
                          }
                        }}
                      >
                        {(() => {
                          const file = uploadedFiles[currentIndex];
                          if (!file) return null;
                          if (file.type.startsWith("image/")) {
                            return <img src={file.url} alt={file.name} />;
                          } else if (file.type.startsWith("video/")) {
                            return <video src={file.url} controls />;
                          } else if (file.type.startsWith("audio/")) {
                            return <audio src={file.url} controls />;
                          } else if (isPdf(file.type)) {
                            if (file.url && !file.url.startsWith("blob:")) {
                              return (
                                <div style={{ position: "relative", height: "100%" }}>
                                  <iframe
                                    src={file.url}
                                    title={file.name}
                                    className="pdf-full-preview"
                                    style={{
                                      width: "100%",
                                      height: "500px",
                                      border: "none"
                                    }}
                                  />
                                  <div style={{ marginTop: 8, textAlign: "right" }}>
                                    <a
                                      href={file.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="open-pdf-link"
                                    >
                                      Open PDF in new tab
                                    </a>
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <div className="pdf-open-link">
                                  <span className="pdf-thumb-large">PDF</span>
                                  <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="open-pdf-link"
                                  >
                                    Open PDF in new tab
                                  </a>
                                </div>
                              );
                            }
                          } else if (isOfficeDoc(file.name)) {
                            return (
                              <iframe
                                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`}
                                title={file.name}
                                className="doc-preview"
                                sandbox="allow-same-origin allow-scripts"
                              />
                            );
                          }
                          return (
                            <div className="file-icon-preview">
                              <span className="file-icon" role="img" aria-label="File">📄</span>
                              <p className="file-type-label">{getFileTypeLabel(file.name)}</p>
                              <p className="file-name">{file.name}</p>
                            </div>
                          );
                        })()}
                        <button
                          className="remove-button"
                          type="button"
                          onClick={() => {
                            removeFile(currentIndex);
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <button
                        className="slider-btn right"
                        onClick={handleNext}
                        aria-label="Next (newer)"
                        type="button"
                        disabled={uploadedFiles.length < 2}
                      >
                        <ChevronRight size={24} />
                      </button>
                    </div>
                    <div className="preview-strip">
                      {uploadedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className={`preview-thumb${idx === currentIndex ? " active" : ""}`}
                          onClick={() => setCurrentIndex(idx)}
                          onDoubleClick={() => {
                            if (file.url) window.open(file.url, "_blank", "noopener,noreferrer");
                          }}
                          title={file.name}
                        >
                          {file.type.startsWith("image/") ? (
                            <img src={file.url} alt={file.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : file.type.startsWith("video/") ? (
                            <video src={file.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : file.type.startsWith("audio/") ? (
                            <span className="audio-thumb">AUDIO</span>
                          ) : isPdf(file.type) ? (
                            <span className="pdf-thumb">PDF</span>
                          ) : isOfficeDoc(file.name) ? (
                            <span className="office-thumb">{getFileTypeLabel(file.name)}</span>
                          ) : (
                            <span className="file-thumb">{getFileTypeLabel(file.name)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
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