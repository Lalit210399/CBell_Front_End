import React, { useState, useEffect, useRef } from 'react';
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
  Share2
} from 'lucide-react';
import './FilesandUploads.css';

const FilesUploads = ({
  files = [],
  onDataChange,
  taskId,
  eventId,
  organizationId,
  readOnly = false
}) => {
  const [links, setLinks] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [description, setDescription] = useState('');
  const [socialPlatform, setSocialPlatform] = useState('twitter'); // Default platform

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
    onDataChange?.({ links, uploadedFiles });
  }, [links, uploadedFiles]);

  const getFileTypeFromMime = (mime) => {
    if (!mime) return 'file';
    if (mime.startsWith('image')) return 'image';
    if (mime.startsWith('video')) return 'video';
    if (mime.startsWith('audio')) return 'audio';
    if (mime === 'application/pdf') return 'pdf';
    return 'file';
  };

  const handleAddLink = () => {
    const newLink = prompt("Enter the new link URL:");
    if (newLink) {
      const updatedLinks = [...links, newLink];
      setLinks(updatedLinks);
      onDataChange?.({ links: updatedLinks, uploadedFiles });
    }
  };

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
      const response = await fetch(`apis/document/delete/${fileId}`, {
        method: 'DELETE',
        headers: { 'ngrok-skip-browser-warning': '1' }
      });
      
      if (!response.ok) throw new Error('Failed to delete file');
      
      // Remove from state
      setUploadedFiles(prev => prev.filter(f => f.documentId !== fileId));
      // setFiles(prev => prev.filter(f => f.documentId !== fileId));
      
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

  const handleUploadToSocial = async (file) => {
    if (!file) return;
    
    try {
      // In a real implementation, you would:
      // 1. Authenticate with the social media platform
      // 2. Upload the file using their API
      // 3. Handle the response
      
      // This is a mock implementation
      console.log(`Uploading ${file.name} to ${socialPlatform}`);
      alert(`This would upload "${file.name}" to ${socialPlatform}. In a real app, this would use the platform's API.`);
      
      // Example of what a real implementation might look like:
      /*
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', file.description || '');
      
      const response = await fetch(`/api/social/${socialPlatform}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${socialMediaToken}`
        }
      });
      
      if (!response.ok) throw new Error('Social media upload failed');
      const result = await response.json();
      alert(`Successfully uploaded to ${socialPlatform}!`);
      */
    } catch (error) {
      console.error('Social media upload error:', error);
      alert('Failed to upload to social media. Please try again.');
    }
  };

  const LazyFileCard = ({ file }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef();

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
      <div ref={ref} className="file-card">
        {isVisible ? (
          <>
            <div className="file-header">
              {file.type === 'image' && <ImageIcon size={20} />}
              {file.type === 'video' && <Clapperboard size={20} />}
              {file.type === 'audio' && <MusicIcon size={20} />}
              {file.type === 'pdf' && <FileText size={20} />}
              {!['image', 'video', 'audio', 'pdf'].includes(file.type) && <FileIcon size={20} />}
              <span className="file-name" title={file.name}>{file.name}</span>
              <button 
                  className="file-action-btn delete-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFile(file.documentId);
                  }}
                >
                  <Trash2 size={14} />
                </button>
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
            {!readOnly && (
              <div className="file-actions">
                <button 
                  className="file-action-btn social-upload-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUploadToSocial(file);
                  }}
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
    );
  };

  return (
    <div className="files-uploads-container">
      {/* Upload Modal */}
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

      {/* Links Section */}
      <div className="links-container">
        <h3>Links</h3>
        <ul>
          {links.map((link, index) => (
            <li key={index}>
              <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
            </li>
          ))}
        </ul>
        {!readOnly && (
          <div className="add-link-icon" onClick={handleAddLink}>
            <PlusCircle size={30} />
          </div>
        )}
      </div>

      {/* Files Section */}
      <div className="files-container">
        <div className="files-header">
          <h3>Files</h3>
          {!readOnly && (
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
          )}
        </div>

        <div className="files-grid">
          {[...files, ...uploadedFiles].map((file, index) => (
            <LazyFileCard key={index} file={file} />
          ))}
          {isUploading && <p>Loading...</p>}
        </div>
      </div>

      {/* File Preview Popup */}
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
            
            <div className="file-description" style={{ marginTop: '20px' }}>
              <h4>Description:</h4>
              <p>{previewFile.description || 'No description provided'}</p>
            </div>
            
            {/* {!readOnly && (
              <div className="popup-actions">
                <button 
                  className="popup-action-btn delete-btn"
                  onClick={() => {
                    handleDeleteFile(previewFile.documentId);
                    setPreviewFile(null);
                  }}
                >
                  <Trash2 size={16} /> Delete
                </button>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select 
                    value={socialPlatform}
                    onChange={(e) => setSocialPlatform(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px' }}
                  >
                    <option value="twitter">Twitter</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                  </select>
                  
                  <button 
                    className="popup-action-btn social-upload-btn"
                    onClick={() => handleUploadToSocial(previewFile)}
                  >
                    <Share2 size={16} /> Upload to {socialPlatform.charAt(0).toUpperCase() + socialPlatform.slice(1)}
                  </button>
                </div>
              </div>
            )} */}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilesUploads;