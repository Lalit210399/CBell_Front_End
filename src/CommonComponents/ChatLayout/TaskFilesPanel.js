import React, { useState } from 'react';
import { FileText, Download, Eye, X, Image, Film, Music, FileIcon, Loader2 } from 'lucide-react';
import './TaskFilesPanel.css';

const TaskFilesPanel = ({ files, loading, onClose }) => {
  const [previewFile, setPreviewFile] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const getFileIcon = (type) => {
    switch (type) {
      case 'image':
        return <Image size={20} />;
      case 'video':
        return <Film size={20} />;
      case 'audio':
        return <Music size={20} />;
      case 'pdf':
        return <FileText size={20} />;
      default:
        return <FileIcon size={20} />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleDownload = async (file) => {
    try {
      const response = await fetch(`/apis/document/view/${file.documentId}`, {
        headers: { 'ngrok-skip-browser-warning': '1' }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handlePreview = async (file) => {
    setPreviewLoading(true);
    setPreviewFile(file);
    
    // For images, videos, and audio, fetch and create blob URL for preview
    if (file.type === 'image' || file.type === 'video' || file.type === 'audio') {
      try {
        const response = await fetch(`/apis/document/view/${file.documentId}`, {
          headers: { 'ngrok-skip-browser-warning': '1' }
        });
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setPreviewFile({ ...file, previewSrc: blobUrl });
      } catch (error) {
        console.error(`Error loading ${file.type} preview:`, error);
        setPreviewFile({ ...file, previewSrc: file.src });
      } finally {
        setPreviewLoading(false);
      }
    } else {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    // Clean up blob URL if it was created
    if (previewFile?.previewSrc && previewFile.previewSrc.startsWith('blob:')) {
      URL.revokeObjectURL(previewFile.previewSrc);
    }
    setPreviewFile(null);
    setPreviewLoading(false);
  };

  return (
    <>
      <div className="task-files-panel">
        <div className="files-panel-header">
          <div className="files-panel-title">
            <FileText size={18} />
            <h4>Work Submissions</h4>
            <span className="files-count">({files?.length || 0})</span>
          </div>
          <button className="files-panel-close" onClick={onClose} aria-label="Close files panel">
            <X size={20} />
          </button>
        </div>

        <div className="files-panel-content">
          {loading ? (
            <div className="files-loading-state">
              <Loader2 size={24} className="spinner-icon" />
              <p>Loading files...</p>
            </div>
          ) : files && files.length > 0 ? (
            <div className="files-list">
              {/* Work Submission Files */}
              {files.filter(f => f.category === 'Work Submission').length > 0 && (
                <>
                  <div className="files-category-header">Work Submission Files</div>
                  {files.filter(f => f.category === 'Work Submission').map((file, index) => (
                    <div key={file.documentId || index} className="file-item">
                      <div className="file-item-icon">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="file-item-details">
                        <div className="file-item-name" title={file.name}>
                          {file.name}
                        </div>
                        <div className="file-item-meta">
                          {file.uploadDate && (
                            <span className="file-date">{formatDate(file.uploadDate)}</span>
                          )}
                          {file.userInfo?.fullName && (
                            <>
                              {file.uploadDate && <span className="file-meta-divider">•</span>}
                              <span className="file-uploader">{file.userInfo.fullName}</span>
                            </>
                          )}
                        </div>
                        {file.status && (
                          <span className={`file-status status-${file.status.toLowerCase()}`}>
                            {file.status}
                          </span>
                        )}
                      </div>
                      <div className="file-item-actions">
                        {(file.type === 'image' || file.type === 'pdf' || file.type === 'video' || file.type === 'audio') && (
                          <button 
                            className="file-action-btn" 
                            onClick={() => handlePreview(file)}
                            title="Preview"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        <button 
                          className="file-action-btn" 
                          onClick={() => handleDownload(file)}
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Reference Files */}
              {files.filter(f => f.category === 'Reference').length > 0 && (
                <>
                  <div className="files-category-header">Reference Files</div>
                  {files.filter(f => f.category === 'Reference').map((file, index) => (
                    <div key={file.documentId || index} className="file-item">
                      <div className="file-item-icon">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="file-item-details">
                        <div className="file-item-name" title={file.name}>
                          {file.name}
                        </div>
                        <div className="file-item-meta">
                          {file.uploadDate && (
                            <span className="file-date">{formatDate(file.uploadDate)}</span>
                          )}
                          {file.userInfo?.fullName && (
                            <>
                              {file.uploadDate && <span className="file-meta-divider">•</span>}
                              <span className="file-uploader">{file.userInfo.fullName}</span>
                            </>
                          )}
                        </div>
                        {file.status && (
                          <span className={`file-status status-${file.status.toLowerCase()}`}>
                            {file.status}
                          </span>
                        )}
                      </div>
                      <div className="file-item-actions">
                        {(file.type === 'image' || file.type === 'pdf' || file.type === 'video' || file.type === 'audio') && (
                          <button 
                            className="file-action-btn" 
                            onClick={() => handlePreview(file)}
                            title="Preview"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        <button 
                          className="file-action-btn" 
                          onClick={() => handleDownload(file)}
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            <div className="files-empty-state">
              <FileText size={48} className="empty-icon" />
              <p>No work submissions yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div className="file-preview-modal" onClick={closePreview}>
          <div className="file-preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="file-preview-header">
              <h3>{previewFile.name}</h3>
              <button className="preview-close-btn" onClick={closePreview}>
                <X size={24} />
              </button>
            </div>
            <div className="file-preview-body">
              {previewLoading && (
                <div className="preview-loading-overlay">
                  <Loader2 size={48} className="spinner-icon" />
                  <p>Loading preview...</p>
                </div>
              )}
              {previewFile.type === 'image' ? (
                <img 
                  src={previewFile.previewSrc || previewFile.src} 
                  alt={previewFile.name}
                  style={{ display: previewLoading ? 'none' : 'block' }}
                />
              ) : previewFile.type === 'video' ? (
                <video 
                  src={previewFile.previewSrc || previewFile.src} 
                  controls
                  className="preview-video"
                  style={{ display: previewLoading ? 'none' : 'block' }}
                >
                  Your browser does not support the video tag.
                </video>
              ) : previewFile.type === 'audio' ? (
                <audio 
                  src={previewFile.previewSrc || previewFile.src} 
                  controls
                  className="preview-audio"
                  style={{ display: previewLoading ? 'none' : 'block' }}
                >
                  Your browser does not support the audio tag.
                </audio>
              ) : previewFile.type === 'pdf' ? (
                <iframe 
                  src={previewFile.src} 
                  title={previewFile.name}
                  width="100%" 
                  height="100%"
                  style={{ display: previewLoading ? 'none' : 'block' }}
                />
              ) : (
                <p>Preview not available for this file type</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskFilesPanel;
