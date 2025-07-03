import React, { useState, useEffect, useRef } from 'react';
import { fetchWithRefresh } from '../../Context/RefereshToken';
import {
  Image as ImageIcon,
  Music as MusicIcon,
  Clapperboard,
  File as FileIcon,
  FileText,
  PlusCircle,
  Loader2,
  X,
  Trash2,
  Share2,
  Check,
} from 'lucide-react';
import InstagramMediaUploader from '../SocialMediaPost/Instagram';
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
  enableSelectionCheckbox = false, // ← NEW PROP
}) => {
  // const [links, setLinks] = useState([]); // commented out for now
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [description, setDescription] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [socialPlatform, setSocialPlatform] = useState('twitter');
  const [open, setOpen] = useState(false);
  const [approvedFiles, setApprovedFiles] = useState([]);

  //console.log('files in FilesUploads:', files);

  useEffect(() => {
    // Extract approved files from the files data
    const approved = files.filter(file => file.status === 'Approved');
    setApprovedFiles(approved.map(file => file.documentId));

    // If there are approved files, automatically select them
    if (approved.length > 0 && onFileSelect) {
      approved.forEach(file => {
        onFileSelect(file.documentId, true);
      });
    }
  }, [files]);

  useEffect(() => {
    return () => {
      [...files, ...uploadedFiles].forEach(file => {
        if (file.src && file.src.startsWith('blob:')) {
          URL.revokeObjectURL(file.src);
        }
      });
    };
  }, [files, uploadedFiles]);

  useEffect(() => {
    onDataChange?.({ uploadedFiles });
  }, [ uploadedFiles]);

  const getFileTypeFromMime = (mime) => {
    if (!mime) return 'file';
    if (mime.startsWith('image')) return 'image';
    if (mime.startsWith('video')) return 'video';
    if (mime.startsWith('audio')) return 'audio';
    if (mime === 'application/pdf') return 'pdf';
    return 'file';
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

    const response = await fetchWithRefresh('/apis/document/upload_document', {
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

    const response = await fetchWithRefresh('/apis/Document-Details', {
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
      const response = await fetchWithRefresh(`/apis/document/delete/${fileId}`, {
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
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef();

    const isApproved = approvedFiles.includes(file.documentId);
    const isSelected = isApproved || selectedFiles.includes(file.documentId);
    const hasApprovedFile = approvedFiles.length > 0;
    const canSelect = !isApproved && !hasApprovedFile;

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      if (ref.current) observer.observe(ref.current);
      return () => observer.disconnect();
    }, []);

    return (
      <div
        ref={ref}
        className={`file-card-wrapper ${mode === 'edit' ? 'edit-mode' : ''}`}
        onClick={() => {
          if (mode === 'edit' && onFileSelect && canSelect) {
            onFileSelect(file.documentId, !isSelected);
          }
        }}
      >
        {/* Only show checkbox if NOT approved, and (no approved files & edit mode) */}
        {enableSelectionCheckbox && (!isApproved && approvedFiles.length === 0 && mode === 'edit') && (
          <input
            type="checkbox"
            className="file-selection-radio"
            checked={isSelected}
            disabled={!canSelect}
            onChange={e => {
              e.stopPropagation();
              if (onFileSelect && canSelect) {
                onFileSelect(file.documentId, e.target.checked);
              }
            }}
          />
        )}


        <div className={`file-card ${isSelected ? 'selected' : ''}`}>
          {isVisible ? (
            <>
              <div className="file-header">
                {file.type === 'image' && <ImageIcon size={20} />}
                {file.type === 'video' && <Clapperboard size={20} />}
                {file.type === 'audio' && <MusicIcon size={20} />}
                {file.type === 'pdf' && <FileText size={20} />}
                {!['image', 'video', 'audio', 'pdf'].includes(file.type) && <FileIcon size={20} />}
                <span className="file-name" title={file.name}>{file.name}</span>
                {/* Delete button - always visible if not readOnly */}
                {!readOnly && (
                  <button
                    className="file-action-btn delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file.documentId);
                    }}
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
              {!readOnly && mode === 'edit' && (
                <div className="file-actions">
                  <button
                    className="file-action-btn social-upload-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDescription(file.description || file.name || '');
                      setDocumentId(file.documentId);
                      setOpen(true);
                    }}
                    disabled={isApproved}
                  >
                    <Share2 size={14} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="file-card-placeholder">Loading...</div>
          )}
        </div>
      </div>
    );
  };

  return (
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

      {/* <div className="links-container">
        <h3>Links</h3>
        <ul>
          {links.map((link, index) => (
            <li key={index}>
              <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
            </li>
          ))}
        </ul>
        <div className="add-link-icon" onClick={handleAddLink}>
          <PlusCircle size={30} />
        </div>
      </div> */}

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

        {/* {approvedFiles.length > 0 && (
          <div className="approval-notice">
            <Check size={16} /> 
          </div>
        )} */}

        <div className="files-grid">
          {[...files, ...uploadedFiles].map((file, index) => (
            <LazyFileCard key={index} file={file} mode={mode} />
          ))}
          {isUploading && <p>Loading...</p>}
        </div>
      </div>

      {previewFile && (
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
              {/* <h4>Description:</h4> */}
              <p>{previewFile.name || 'No description provided'}</p>
              {previewFile.status && (
                <div className="file-status-popup">
                  {/* <h4>Status:</h4> */}
                  <p className={`status-${previewFile.status.toLowerCase()}`}>
                    {previewFile.status}
                  </p>
                </div>
              )}
            </div>



            {/* {previewFile.publishedTo && previewFile.publishedTo.length > 0 && (
              <div className="published-info">
                <h4>Published To:</h4>
                <ul>
                  {previewFile.publishedTo.map((platform, i) => (
                    <li key={i}>
                      {platform.platform} by {platform.publishedByName} at {new Date(platform.publishedAt).toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>
            )} */}
          </div>
        </div>
      )}
      {/* <InstagramMediaUploader
        igUserId="17841474808473956"
        fbPageId="648945998310294"
        accessToken="ewqerqw"
        open={open}
        onClose={() => setOpen(false)}
        defaultImageUrl={documentId || ''}
        defaultCaption={description || ''}
      /> */}
    </div>
  );
};

export default FilesUploads;