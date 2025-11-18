import React, { useEffect, useRef } from 'react';
import { useFileManager } from '../../Context/FileManagerContext';
import { X, Download } from 'lucide-react';
import './FilePreviewModal.css';

const FilePreviewModal = () => {
  const { previewFile, closePreview, getFileUploader } = useFileManager();
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') closePreview();
    };

    if (previewFile) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [previewFile, closePreview]);

  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) closePreview();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleDownload = () => {
    if (previewFile.url) {
      const link = document.createElement('a');
      link.href = previewFile.url;
      link.download = previewFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderPreviewContent = () => {
    if (!previewFile) return null;

    const { type, url, name } = previewFile;

    if (type.startsWith('image/')) {
      return <div className="fm-preview-content fm-preview-image"><img src={url} alt={name} /></div>;
    } else if (type.startsWith('video/')) {
      return <div className="fm-preview-content fm-preview-video"><video controls><source src={url} type={type} />Your browser does not support video.</video></div>;
    } else if (type.startsWith('audio/')) {
      return <div className="fm-preview-content fm-preview-audio"><audio controls><source src={url} type={type} />Your browser does not support audio.</audio></div>;
    } else if (type === 'application/pdf') {
      return <div className="fm-preview-content fm-preview-pdf"><iframe src={url} title={name} width="100%" height="100%" /></div>;
    }

    return null;
  };

  if (!previewFile) return null;

  const uploader = getFileUploader(previewFile.uploadedBy);

  return (
    <div className="fm-preview-modal" ref={modalRef} onClick={handleBackdropClick}>
      <div className="fm-modal-content">
        <div className="fm-modal-header">
          <div className="fm-modal-file-info">
            <h2 className="fm-modal-file-name">{previewFile.name}</h2>
            <div className="fm-modal-file-meta">
              <span>{formatFileSize(previewFile.size)}</span>
              <span>•</span>
              <span className="fm-file-type">{previewFile.type}</span>
            </div>
          </div>
          
          <div className="fm-modal-actions">
            {previewFile.url && (
              <button className="fm-modal-btn fm-download-btn" onClick={handleDownload}>
                <Download size={18} />
                Download
              </button>
            )}
            <button className="fm-modal-btn fm-close-btn" onClick={closePreview}>
              <X size={20} />
            </button>
          </div>
        </div>

        {renderPreviewContent()}

        <div className="fm-modal-footer">
          <div className="fm-uploader-details">
            <div className="fm-uploader-avatar-lg">
              {uploader?.name.charAt(0).toUpperCase()}
            </div>
            <div className="fm-uploader-text">
              <div>Uploaded by <strong>{uploader?.name}</strong></div>
              <div className="fm-upload-time">{formatDate(previewFile.uploadedAt)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
