import React from 'react';
import { useFileManager } from '../../Context/FileManagerContext';
import { Eye, FileText, Image, Film, Music, File as FileIcon } from 'lucide-react';
import './FileGrid.css';

const FileGrid = () => {
  const {
    currentFiles,
    loading,
    handleFilePreview,
    handleFileDownload,
    getFileUploader,
    getFileApprover
  } = useFileManager();

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <Image size={32} />;
    if (fileType.startsWith('video/')) return <Film size={32} />;
    if (fileType.startsWith('audio/')) return <Music size={32} />;
    if (fileType === 'application/pdf') return <FileText size={32} />;
    return <FileIcon size={32} />;
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
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const canPreviewFile = (fileType) => {
    return fileType.startsWith('image/') || fileType.startsWith('video/') || 
           fileType.startsWith('audio/') || fileType === 'application/pdf';
  };

  const getStatusBadge = (file) => {
    if (file.status === 'published') {
      return <span className="fm-status-badge fm-published">Published</span>;
    }
    if (file.status === 'approved') {
      return <span className="fm-status-badge fm-approved">Approved</span>;
    }
    return null;
  };

  return (
    <div className="fm-grid-container">
      <div className="fm-grid-header">
        <div className="fm-grid-title-section">
          <h2 className="fm-grid-title">Published & Approved Files</h2>
          <span className="fm-files-count">{currentFiles.length} files</span>
        </div>
      </div>

      {loading ? (
        <div className="fm-empty-large">
          <p>Loading files...</p>
        </div>
      ) : currentFiles.length === 0 ? (
        <div className="fm-empty-large">
          <FileIcon size={64} strokeWidth={1} />
          <h3>No Files</h3>
          <p>No files have been uploaded yet</p>
        </div>
      ) : (
        <div className="fm-grid">
          {currentFiles.map(file => {
            const uploader = getFileUploader(file.uploadedBy);
            const approver = file.approvedBy ? getFileApprover(file.approvedBy) : null;
            const publisher = file.publishedBy ? getFileApprover(file.publishedBy) : null;
            const isPreviewable = canPreviewFile(file.type);

            return (
              <div key={file.id} className="fm-file-tile">
                <div className="fm-file-preview" onClick={() => isPreviewable && handleFilePreview(file)}
                  style={{ cursor: isPreviewable ? 'pointer' : 'default' }}>
                  {file.type.startsWith('image/') && file.url ? (
                    <img src={file.url} alt={file.name} />
                  ) : (
                    <div className="fm-file-icon-wrapper">
                      {getFileIcon(file.type)}
                    </div>
                  )}
                  {isPreviewable && (
                    <div className="fm-preview-overlay">
                      <Eye size={24} />
                      <span>Preview</span>
                    </div>
                  )}
                </div>
                
                <div className="fm-file-info">
                  <div className="fm-file-header">
                    <div className="fm-file-name" title={file.name}>{file.name}</div>
                    {getStatusBadge(file)}
                  </div>
                  <div className="fm-file-meta">
                    <span className="fm-file-size">{formatFileSize(file.size)}</span>
                  </div>
                  <div className="fm-file-footer">
                    <div className="fm-uploader-info">
                      <div className="fm-uploader-avatar">
                        {uploader?.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="fm-uploader-details">
                        <span className="fm-uploader-name">By {uploader?.name}</span>
                        {approver && <span className="fm-approver-name">Approved by {approver?.name}</span>}
                        {publisher && <span className="fm-approver-name">Published by {publisher?.name}</span>}
                      </div>
                    </div>
                    <div className="fm-upload-date">{formatDate(file.uploadedAt)}</div>
                  </div>
                  {file.url && (
                    <button className="fm-download-file-btn" onClick={(e) => { e.stopPropagation(); handleFileDownload(file); }}>
                      Download
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FileGrid;
