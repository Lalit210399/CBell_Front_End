import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import {
  Image as ImageIcon,
  Music as MusicIcon,
  Clapperboard,
  File as FileIcon,
  FileText,
  Loader2,
  X,
  Trash2,
  Check,
} from 'lucide-react';
import './FilesandUploads.css';

const FilesUploads = ({
  files = [],
  onDataChange,
  taskId,
  eventId,
  organizationId,
  readOnly = false,
  mode,
  selectedFiles = [],
  onFileSelect,
  enableSelectionRadio = false, // ← NEW PROP for radio button selection
}) => {
  // const [links, setLinks] = useState([]); // commented out for now
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [description, setDescription] = useState('');
  const [approvedFiles, setApprovedFiles] = useState([]);
  const filesRef = useRef([]);
  const uploadedFilesRef = useRef([]);


  // Handle click outside to close preview modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (previewFile && event.target.classList.contains('popup')) {
        setPreviewFile(null);
      }
    };

    if (previewFile) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [previewFile]);

  // Prevent body scroll when preview modal is open
  useEffect(() => {
    if (previewFile) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [previewFile]);

  useEffect(() => {
    // Update refs
    filesRef.current = files;
    
    // Extract approved files from the files data
    const approved = files.filter(file => file.status === 'Approved');
    setApprovedFiles(approved.map(file => file.documentId));

    // If there are approved files, automatically select them
    if (approved.length > 0 && onFileSelect) {
      approved.forEach(file => {
        onFileSelect(file.documentId, true);
      });
    }
  }, [files, onFileSelect]);

  // Temporarily disable cleanup to test if it's causing the issue
  // useEffect(() => {
  //   return () => {
  //     [...filesRef.current, ...uploadedFilesRef.current].forEach(file => {
  //       if (file.src && file.src.startsWith('blob:')) {
  //         URL.revokeObjectURL(file.src);
  //       }
  //     });
  //   };
  // }, []); // Empty dependency array - only run on unmount

  useEffect(() => {
    uploadedFilesRef.current = uploadedFiles;
    onDataChange?.({ uploadedFiles });
  }, [uploadedFiles, onDataChange]);

  const getFileTypeFromMime = (mime) => {
    if (!mime) return 'file';
    if (mime.startsWith('image')) return 'image';
    if (mime.startsWith('video')) return 'video';
    if (mime.startsWith('audio')) return 'audio';
    if (mime === 'application/pdf') return 'pdf';
    return 'file';
  };


  const isFilePublished = (file) => {
    return file.publishedTo && file.publishedTo.length > 0 && 
           file.publishedTo.some(p => p.isPublished === true);
  };

  // const handleAddLink = () => {
  //   const newLink = prompt("Enter the new link URL:");
  //   if (newLink) {
  //     const updatedLinks = [...links, newLink];
  //     setLinks(updatedLinks);
  //     onDataChange?.({ links: updatedLinks, uploadedFiles });
  //   }
  // };

  const uploadFileToBackend = async (file, description) => {
    const formData = new FormData();
    formData.append('File', file);
    formData.append('description', description || file.name);

    const response = await fetch('/apis/document/upload_document', {
      method: 'POST',
      body: formData,
      headers: { 'ngrok-skip-browser-warning': '1' }
    });

    if (!response.ok) throw new Error('File upload failed');
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

    const response = await fetch('/apis/Document-Details', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '1'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Failed to link document to task');
    return await response.json();
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/apis/document/delete/${fileId}`, {
        method: 'DELETE',
        headers: { 'ngrok-skip-browser-warning': '1' }
      });

      if (!response.ok) throw new Error('Failed to delete file');

      setUploadedFiles(prev => prev.filter(f => f.documentId !== fileId));
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  const handleFileUpload = async (e) => {
    const filesToUpload = Array.from(e.target.files);
    if (filesToUpload.length === 0) return;

    setCurrentFile(filesToUpload[0]);
    setShowUploadModal(true);
  };

  const confirmUpload = async () => {
    if (!currentFile) return;

    setIsUploading(true);
    setShowUploadModal(false);

    try {
      const documentId = await uploadFileToBackend(currentFile, description);
      await linkDocumentToTask(documentId);

      const type = getFileTypeFromMime(currentFile.type);
      const src = URL.createObjectURL(currentFile);

      const newFile = {
        name: currentFile.name,
        type,
        src,
        documentId,
        description: description || currentFile.name
      };

      setUploadedFiles(prev => [...prev, newFile]);
      setDescription('');
      setCurrentFile(null);
    } catch (error) {
      console.error('Failed to process file:', error);
      alert('File upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const LazyFileCard = ({ file, mode }) => {
    const ref = useRef();


    const isApproved = approvedFiles.includes(file.documentId);
    const isSelected = isApproved || selectedFiles.includes(file.documentId);
    const hasApprovedFile = approvedFiles.length > 0;
    const isPublished = isFilePublished(file);
    const canSelect = !isApproved && !hasApprovedFile && !isPublished;

    return (
      <div
        ref={ref}
        className={`file-card-wrapper ${mode === 'edit' ? 'edit-mode' : ''}`}
        onClick={() => {
          if (onFileSelect && canSelect) {
            // For radio buttons, always select the file (single selection)
            onFileSelect(file.documentId, true);
          }
        }}
      >
        {/* Show radio button when selection is enabled and file is not published */}
        {enableSelectionRadio && !isPublished && (
          <input
            type="radio"
            name="file-selection"
            className="file-selection-radio"
            checked={isSelected}
            disabled={!canSelect}
            onChange={e => {
              e.stopPropagation();
              if (onFileSelect && canSelect) {
                // For radio buttons, we always select the file (no toggle)
                onFileSelect(file.documentId, true);
              }
            }}
          />
        )}

        <div className={`file-card ${isSelected ? 'selected' : ''}`}>
          {/* Status indicator for approved files */}
          {isApproved && (
            <div className="file-status-indicator">
              <div className="approved-badge">
                <Check size={12} />
                Approved
              </div>
            </div>
          )}

          {/* Published badge */}
          {isPublished && (
            <div className="file-status-indicator">
              <div className="published-badge">
                Published
              </div>
            </div>
          )}
          
          <div className="file-header">
            {file.type === 'image' && <ImageIcon size={20} />}
            {file.type === 'video' && <Clapperboard size={20} />}
            {file.type === 'audio' && <MusicIcon size={20} />}
            {file.type === 'pdf' && <FileText size={20} />}
            {!['image', 'video', 'audio', 'pdf'].includes(file.type) && <FileIcon size={20} />}
            <span className="file-name" title={file.name}>{file.name}</span>
            {/* Delete button - visible in view mode and edit mode, but not for approved files */}
            {!isApproved && (
              <button
                className="file-action-btn delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFile(file.documentId);
                }}
                title="Delete file"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <div className="file-icon" onClick={() => setPreviewFile(file)}>
            {file.type === 'image' && <img src={file.src} alt={file.name} className="image-preview" />}
            {file.type === 'video' && <video src={file.src} className="video-preview" controls />}
            {file.type === 'audio' && (
              <div className="audio-container">
                <MusicIcon size={60} />
                <audio src={file.src} className="audio-preview" controls />
              </div>
            )}
            {file.type === 'pdf' && (
              <div className="pdf-preview">
                <FileText size={60} />
                <span>PDF Document</span>
              </div>
            )}
            {!['image', 'video', 'audio', 'pdf'].includes(file.type) && (
              <div className="fallback-preview">
                <FileIcon size={60} />
                <span>Download File</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const mainContent = (
    <div className="files-uploads-container">
      {showUploadModal && (
        <div className="upload-modal">
          <div className="upload-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Upload File: {currentFile?.name}</h3>
            <p>File size: {(currentFile?.size / 1024 / 1024).toFixed(2)} MB</p>

            <div>
              <label>Description:</label>
              <textarea
                className="description-input"
                placeholder="Add a description for this file..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="upload-modal-actions">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setDescription('');
                }}
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                onClick={confirmUpload}
                disabled={isUploading}
                style={{ background: '#841111', color: 'white' }}
              >
                {isUploading ? <Loader2 className="animate-spin" size={16} /> : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="files-container">
        <div className="files-header">
          <h3>Files</h3>
          <label className="upload-button">
            {isUploading ? <Loader2 className="animate-spin" size={20} /> : 'Upload'}
            <input
              type="file"
              onChange={handleFileUpload}
              multiple
              accept="image/*,video/*,audio/*,.pdf"
              style={{ display: "none" }}
              disabled={isUploading}
            />
          </label>
        </div>

        <div className="files-grid">
          {[...files, ...uploadedFiles].map((file, index) => (
            <LazyFileCard key={index} file={file} mode={mode} />
          ))}
          {isUploading && <p>Loading...</p>}
        </div>
      </div>
    </div>
  );

  // Preview modal component using React Portal
  const PreviewModal = () => {
    if (!previewFile) return null;

    const modalContent = (
      <div className="popup" onClick={() => setPreviewFile(null)}>
        <X size={30} className="close-icon" onClick={() => setPreviewFile(null)} />
        <div className="popup-content" onClick={(e) => e.stopPropagation()}>

          {previewFile.type === 'image' && <img src={previewFile.src} alt={previewFile.name} />}
          {previewFile.type === 'video' && <video src={previewFile.src} controls autoPlay />}
          {previewFile.type === 'audio' && (
            <div className="audio-popup">
              <h3>{previewFile.name}</h3>
              <audio src={previewFile.src} controls autoPlay />
            </div>
          )}
          {previewFile.type === 'pdf' && (
            <div className="pdf-popup">
              <h3>{previewFile.name}</h3>
              <iframe src={previewFile.src} width="100%" height="500px" title={previewFile.name} />
            </div>
          )}
          {!['image', 'video', 'audio', 'pdf'].includes(previewFile.type) && (
            <div className="fallback-popup">
              <h3>{previewFile.name}</h3>
              <FileIcon size={100} />
              <p>This file type cannot be previewed</p>
            </div>
          )}

          <div className="file-description">
            <p>{previewFile.name || 'No description provided'}</p>
            {previewFile.status && (
              <div className="file-status-popup">
                <p className={`status-${previewFile.status.toLowerCase()}`}>
                  {previewFile.status}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );

    return createPortal(modalContent, document.body);
  };

  return (
    <>
      {mainContent}
      <PreviewModal />
    </>
  );
};

export default FilesUploads;