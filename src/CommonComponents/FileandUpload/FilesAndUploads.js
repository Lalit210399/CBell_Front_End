import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { useUser } from '../../Context/UserContext';
import './FilesandUploads.css';

const FilesUploads = ({
  files = [],
  onDataChange,
  taskId,
  eventId,
  organizationId,
  userId,
  readOnly = false,
  mode,
  selectedFiles = [],
  onFileSelect,
  enableSelectionRadio = false, // ← NEW PROP for radio button selection
  showFileRequirementWarning = false, // ← NEW PROP for showing file requirement warning
}) => {
  const { user } = useUser();
  
  // Use userId from props, or fallback to user.userId from context
  const effectiveUserId = userId || user?.userId;
  
  // const [links, setLinks] = useState([]); // commented out for now
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [description, setDescription] = useState('');
  
  // Memoize the description change handler to prevent unnecessary re-renders
  const handleDescriptionChange = useCallback((e) => {
    setDescription(e.target.value);
  }, []);
  const [approvedFiles, setApprovedFiles] = useState([]);
  const [hasApprovedOrPublishedFile, setHasApprovedOrPublishedFile] = useState(false);
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

    // Check if any file is approved or published
    const hasApprovedOrPublished = files.some(file => 
      file.status === 'Approved' || file.status === 'Published' || 
      (file.publishedTo && file.publishedTo.length > 0 && file.publishedTo.some(p => p.isPublished === true))
    );
    setHasApprovedOrPublishedFile(hasApprovedOrPublished);

    // If there are approved files, automatically select them
    if (approved.length > 0 && onFileSelect) {
      approved.forEach(file => {
        onFileSelect(file.documentId, true);
      });
    }
  }, [files]); // Removed onFileSelect from dependencies to prevent unnecessary re-renders
  // eslint-disable-next-line react-hooks/exhaustive-deps

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
    // Only call onDataChange when uploadedFiles actually changes, not when onDataChange changes
    if (uploadedFiles.length > 0) {
      onDataChange?.({ uploadedFiles });
    }
  }, [uploadedFiles]); // Removed onDataChange from dependencies
  // eslint-disable-next-line react-hooks/exhaustive-deps

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
    formData.append('file', file);
    formData.append('description', description || file.name);
    formData.append('status', 'Pending');
    formData.append('UserId', effectiveUserId);

    const response = await fetch('/apis/document/upload_document', {
      method: 'POST',
      body: formData,
      headers: { 'ngrok-skip-browser-warning': '1' }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`File upload failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data.documentId;
  };

  const linkDocumentToTask = async (documentId) => {
    const payload = {
      documentId,
      organizationId,
      eventId,
      taskId,
      conversationId: null, // Set to null if not available
      UserId: effectiveUserId,
    };

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

  // Get uploader info from file data or use mock data for testing
  const getUploaderInfo = (file) => {
    // Check if file has new userInfo structure from backend
    if (file.userInfo) {
      const { fullName, roles } = file.userInfo;
      const roleName = roles && roles.length > 0 ? roles[0].displayName : 'Team Member';
      const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase();
      
      return {
        name: fullName,
        designation: roleName,
        avatar: initials
      };
    }
    
    // Fallback to old structure if available
    if (file.uploadedBy || file.uploaderName) {
      const name = file.uploaderName || file.uploadedBy;
      const designation = file.uploaderDesignation || file.uploaderRole || 'Team Member';
      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
      
      return {
        name,
        designation,
        avatar: initials
      };
    }
    
    // Mock data for testing when backend data is not available
    const mockUsers = [
      { name: "Rohan Kulkarni", designation: "Creative Director", avatar: "RK" },
      { name: "Amit Deshmukh", designation: "Graphic Designer", avatar: "AD" },
      { name: "Neha Chavan", designation: "Content Manager", avatar: "NC" },
      { name: "Sagar More", designation: "Video Editor", avatar: "SM" }
    ];
    
    // Use file index to cycle through mock users
    const userIndex = (file.documentId || file.name || '').length % mockUsers.length;
    return mockUsers[userIndex];
  };

  const formatExactDateTime = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getLatestPublicationInfo = (file) => {
    if (!file.publishedTo || file.publishedTo.length === 0) return null;
    
    // Get the most recent publication
    const latestPublication = file.publishedTo
      .filter(p => p.isPublished)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))[0];
    
    return latestPublication;
  };

  const formatUploadDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      const diffMinutes = Math.ceil(diffTime / (1000 * 60));
      
      // Handle same day
      if (diffDays === 0) {
        if (diffHours === 0) {
          return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
        }
        return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
      }
      
      // Handle yesterday
      if (diffDays === 1) return 'Yesterday';
      
      // Handle this week
      if (diffDays < 7) return `${diffDays} days ago`;
      
      // Handle this month
      if (diffDays < 30) {
        const weeks = Math.ceil(diffDays / 7);
        return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
      }
      
      // Handle older dates - show actual date
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Helper function to get upload date from file data
  const getUploadDate = (file) => {
    return file.uploadDate || file.createdAt || file.uploadedAt;
  };

  // Helper function to determine if file is a work submission (by designer)
  const isWorkSubmission = (file) => {
    // Debug: Log the file being checked
    console.log('🔍 Checking file for work submission:', {
      fileName: file.name,
      fileUserInfo: file.userInfo,
      currentUser: user,
      currentUserRoles: user?.roles
    });
    
    // Check file's userInfo to determine if the uploader is a designer
    if (file.userInfo && file.userInfo.roles) {
      const isFileUserDesigner = file.userInfo.roles.some(role => 
        role.name?.toLowerCase().includes('designer') || 
        role.displayName?.toLowerCase().includes('designer') ||
        role.name?.toLowerCase().includes('creative') ||
        role.displayName?.toLowerCase().includes('creative')
      );
      
      console.log('File user designer check:', { isFileUserDesigner, fileUserRoles: file.userInfo.roles });
      
      if (isFileUserDesigner) {
        console.log('✅ File is work submission (file user is designer)');
        return true;
      }
    }
    
    console.log('❌ File is NOT a work submission');
    return false;
  };

  // Helper function to determine if file is a reference file (by admin/manager)
  const isReferenceFile = (file) => {
    console.log('🔍 Checking file for reference:', {
      fileName: file.name,
      fileUserInfo: file.userInfo
    });
    
    // Check file's userInfo to determine if the uploader is admin/manager
    if (file.userInfo && file.userInfo.roles) {
      const isFileUserAdminManager = file.userInfo.roles.some(role => 
        role.name?.toLowerCase().includes('admin') || 
        role.displayName?.toLowerCase().includes('admin') ||
        role.name?.toLowerCase().includes('manager') ||
        role.displayName?.toLowerCase().includes('manager') ||
        role.name?.toLowerCase().includes('lead') ||
        role.displayName?.toLowerCase().includes('lead')
      );
      
      console.log('File user admin/manager check:', { isFileUserAdminManager, fileUserRoles: file.userInfo.roles });
      
      if (isFileUserAdminManager) {
        console.log('✅ File is reference (file user is admin/manager)');
        return true;
      }
    }
    
    console.log('❌ File is NOT a reference');
    return false;
  };

  // Helper function to get file category
  const getFileCategory = (file) => {
    if (isWorkSubmission(file)) return 'work-submission';
    if (isReferenceFile(file)) return 'reference';
    return 'other';
  };

  const LazyFileCard = ({ file, mode }) => {
    const ref = useRef();
    const uploaderInfo = getUploaderInfo(file);
    const latestPublication = getLatestPublicationInfo(file);

    const isApproved = approvedFiles.includes(file.documentId);
    const isSelected = isApproved || selectedFiles.includes(file.documentId);
    const hasApprovedFile = approvedFiles.length > 0;
    const isPublished = isFilePublished(file);
    const canSelect = !isApproved && !hasApprovedFile && !isPublished;
    
    // Determine file category and type
    const fileCategory = getFileCategory(file);
    const isWorkSubmissionFile = isWorkSubmission(file);
    const isReferenceFileType = isReferenceFile(file);


    return (
      <div
        ref={ref}
        className={`file-card-wrapper ${mode === 'edit' ? 'edit-mode' : ''}`}
        onClick={() => {
          if (onFileSelect && canSelect && isWorkSubmissionFile) {
            // For radio buttons, always select the file (single selection)
            // Only allow selection for work submission files
            onFileSelect(file.documentId, true);
          }
        }}
      >
        {/* Show radio button when selection is enabled, file is not published, and it's a work submission */}
        {enableSelectionRadio && !isPublished && isWorkSubmissionFile && (
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

          {/* File type indicator */}
          {isWorkSubmissionFile && (
            <div className="file-type-indicator work-submission">
              <span className="indicator-icon">🎨</span>
              <span className="indicator-text">Work Submission</span>
            </div>
          )}
          
          {isReferenceFileType && (
            <div className="file-type-indicator reference-file">
              <span className="indicator-icon">📋</span>
              <span className="indicator-text">Reference</span>
            </div>
          )}

          {/* Compact status indicator in bottom right */}
          {!latestPublication && file.status && (
            <div className="file-status-compact">
              {file.status === 'Approved' && 'Ready to publish'}
              {file.status === 'Pending' && 'Awaiting approval'}
            </div>
          )}
          
          {/* File preview section */}
          <div className="file-preview-section" onClick={() => setPreviewFile(file)}>
            <div className="file-icon">
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

          {/* File details section */}
          <div className="file-details-section">
            {/* File header with icon and name */}
            <div className="file-header">
              <div className="file-type-icon">
                {file.type === 'image' && <ImageIcon size={16} />}
                {file.type === 'video' && <Clapperboard size={16} />}
                {file.type === 'audio' && <MusicIcon size={16} />}
                {file.type === 'pdf' && <FileText size={16} />}
                {!['image', 'video', 'audio', 'pdf'].includes(file.type) && <FileIcon size={16} />}
              </div>
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

            {/* File description/caption */}
            {file.description && (
              <div className="file-description">
                <p className="file-caption" title={file.description}>
                  {file.description}
                </p>
              </div>
            )}

            {/* Uploader information */}
            <div className="uploader-info">
              <div className="uploader-avatar">
                <span className="avatar-text">{uploaderInfo.avatar}</span>
              </div>
              <div className="uploader-details">
                <div className="uploader-name">{uploaderInfo.name}</div>
                <div className="uploader-designation">{uploaderInfo.designation}</div>
                
                {/* Time and status information */}
                <div className="time-status-container">
                  <div 
                    className="upload-time"
                    title={
                      latestPublication 
                        ? `Published on ${latestPublication.platform} at ${formatExactDateTime(latestPublication.publishedAt)}`
                        : `Uploaded at ${formatExactDateTime(getUploadDate(file))}`
                    }
                  >
                    {latestPublication 
                      ? `Published ${formatUploadDate(latestPublication.publishedAt)}`
                      : `Uploaded ${formatUploadDate(getUploadDate(file))}`
                    }
                  </div>
                  
                  {/* Show exact time separately for uploaded files */}
                  {!latestPublication && getUploadDate(file) && (
                    <div className="upload-exact-time">
                      {new Date(getUploadDate(file)).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
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
                onChange={handleDescriptionChange}
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
          {showFileRequirementWarning && [...files, ...uploadedFiles].length === 0 && (
            <div className="file-requirement-warning">
              <span className="warning-text">⚠️ Files required for approval submission</span>
            </div>
          )}
          {[...files, ...uploadedFiles].length > 0 && !hasApprovedOrPublishedFile && (
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

        {[...files, ...uploadedFiles].length === 0 && !isUploading ? (
          <div className="empty-files-state">
            <div className="empty-files-illustration">
              <FileIcon size={64} className="empty-icon" />
              <div className="empty-files-content">
                <h4>No files uploaded yet</h4>
                <p>Upload documents, images, videos, or other files to get started</p>
                <div className="empty-files-features">
                  <div className="feature-item">
                    <ImageIcon size={16} />
                    <span>Images & Videos</span>
                  </div>
                  <div className="feature-item">
                    <FileText size={16} />
                    <span>PDF Documents</span>
                  </div>
                  <div className="feature-item">
                    <MusicIcon size={16} />
                    <span>Audio Files</span>
                  </div>
                </div>
                {!hasApprovedOrPublishedFile && (
                  <div className="empty-upload-section">
                    <label className="empty-upload-button">
                      {isUploading ? <Loader2 className="animate-spin" size={20} /> : 'Upload Files'}
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
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="files-sections">
            {/* Work Submissions Section - ALWAYS ON TOP */}
            {(() => {
              const workFiles = [...files, ...uploadedFiles]
                .filter(file => isWorkSubmission(file))
                .sort((a, b) => new Date(b.uploadDate || b.createdAt || 0) - new Date(a.uploadDate || a.createdAt || 0));
              
              return workFiles.length > 0 && (
                <div className="file-section work-submissions-section">
                  <div className="section-header">
                    <h3 className="section-title">
                      <span className="section-icon">🎨</span>
                      Work Submissions
                    </h3>
                    <p className="section-description">Designer submissions ready for approval</p>
                  </div>
                  <div className="files-grid work-submissions-grid">
                    {workFiles.map((file, index) => (
                      <LazyFileCard key={`work-${index}`} file={file} mode={mode} />
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Reference Files Section - ALWAYS ON BOTTOM */}
            {(() => {
              const referenceFiles = [...files, ...uploadedFiles]
                .filter(file => isReferenceFile(file))
                .sort((a, b) => new Date(b.uploadDate || b.createdAt || 0) - new Date(a.uploadDate || a.createdAt || 0));
              
              return referenceFiles.length > 0 && (
                <div className="file-section reference-files-section">
                  <div className="section-header">
                    <h3 className="section-title">
                      <span className="section-icon">📋</span>
                      Reference Files
                    </h3>
                    <p className="section-description">Reference materials and guidelines</p>
                  </div>
                  <div className="files-grid reference-files-grid">
                    {referenceFiles.map((file, index) => (
                      <LazyFileCard key={`ref-${index}`} file={file} mode={mode} />
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Other Files Section */}
            {(() => {
              const otherFiles = [...files, ...uploadedFiles]
                .filter(file => !isWorkSubmission(file) && !isReferenceFile(file))
                .sort((a, b) => new Date(b.uploadDate || b.createdAt || 0) - new Date(a.uploadDate || a.createdAt || 0));
              
              return otherFiles.length > 0 && (
                <div className="file-section other-files-section">
                  <div className="section-header">
                    <h3 className="section-title">
                      <span className="section-icon">📁</span>
                      Other Files
                    </h3>
                    <p className="section-description">Additional files and documents</p>
                  </div>
                  <div className="files-grid other-files-grid">
                    {otherFiles.map((file, index) => (
                      <LazyFileCard key={`other-${index}`} file={file} mode={mode} />
                    ))}
                  </div>
                </div>
              );
            })()}

            {isUploading && <p>Loading...</p>}
          </div>
        )}
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