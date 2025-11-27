import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import SocialMediaUploader from '../SocialMediaPost/Instagram';
import YouTubeUploader from '../SocialMediaPost/YouTubeUploader';
import { FaFacebook, FaInstagram, FaYoutube, FaEnvelope, FaTimes } from 'react-icons/fa';
import EmailForm from '../EmailSendModal/EmailForm'; 
import './FileShareModel.css';

// Helper function to check if file type is supported by platform
const isFileTypeSupported = (fileType, platform) => {
  if (!fileType) return true; // If no file type info, allow all platforms
  
  const lowerFileType = fileType.toLowerCase();
  //console.log('Checking file type support:', lowerFileType, 'for platform:', platform);
  
  // Check if file is audio or document
  const isAudioOrDoc = lowerFileType.startsWith('audio/') || 
                      lowerFileType.startsWith('application/pdf') ||
                      lowerFileType.startsWith('application/msword') ||
                      lowerFileType.startsWith('application/vnd.openxmlformats-officedocument') ||
                      lowerFileType.startsWith('text/');

  // If it's audio or document, only allow email sharing
  if (isAudioOrDoc) {
    return platform.toLowerCase() === 'email';
  }
  
  switch (platform.toLowerCase()) {
    case 'youtube':
      // YouTube only supports video files
      return lowerFileType.startsWith('video/');
    case 'instagram':
      // Instagram supports image and video files
      return lowerFileType.startsWith('image/') || lowerFileType.startsWith('video/');
    case 'facebook':
      // Facebook supports image and video files
      return lowerFileType.startsWith('image/') || lowerFileType.startsWith('video/');
    case 'email':
      // Email supports all file types
      return true;
    default:
      return true;
  }
};

const FileShareModel = ({ onClose, fileDetail, documentId, description, onPlatformPublish, taskId }) => {
  
  const [fileName] = useState(fileDetail?.name);
  const [showSocialUploader, setShowSocialUploader] = useState(false);
  const [showYouTubeUploader, setShowYouTubeUploader] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [platform, setPlatform] = useState(null);

  // Get file type for easier access
  const fileType = fileDetail?.document?.contentType || fileDetail?.document?.type || fileDetail?.type;

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.classList.contains('share-popup-overlay')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handlePlatformSuccess = (platform) => {
    setShowSocialUploader(false);
    setShowYouTubeUploader(false);
    setShowEmailForm(false);
    onClose();
  };

  const handleShare = (selectedPlatform) => {
    if (selectedPlatform === 'instagram' || selectedPlatform === 'facebook') {
      setPlatform(selectedPlatform);
      setShowSocialUploader(true);
      return;
    }
    if (selectedPlatform === 'youtube') {
      setPlatform(selectedPlatform);
      setShowYouTubeUploader(true);
      return;
    }
    if (selectedPlatform === 'email') {
      setShowEmailForm(true);
      return;
    }
  };

  const handleSocialMediaClick = (platform) => {
    handleShare(platform);
  };

  const modalContent = (
    <>
      {showSocialUploader ? (
        <SocialMediaUploader
          open={showSocialUploader}
          onClose={() => setShowSocialUploader(false)}
          defaultCaption={fileDetail?.document?.description || fileDetail?.description || description}
          fileDetail={fileDetail}
          platform={platform}
          onSuccess={handlePlatformSuccess}
          onPlatformPublish={onPlatformPublish}
        />
      ) : showYouTubeUploader ? (
        <YouTubeUploader
          open={showYouTubeUploader}
          onClose={() => setShowYouTubeUploader(false)}
          fileDetail={fileDetail}
          taskId={taskId}
          onSuccess={handlePlatformSuccess}
          onPlatformPublish={onPlatformPublish}
        />
      ) : showEmailForm ? (
        <EmailForm 
          fileDetail={fileDetail}
          documentId={documentId}
          taskId={taskId}
          onClose={() => setShowEmailForm(false)}
          onEmailSent={(platform) => {
            // Call onPlatformPublish to record the email publish
            if (onPlatformPublish) onPlatformPublish(documentId, platform || 'email');
            setShowEmailForm(false);
            onClose();
          }}
        />
      ) : (
        <div className="share-popup-overlay">
          <div className="share-popup">
            <button className="close-button" onClick={onClose}>
              <FaTimes />
            </button>
            <h2>Share File</h2>
            <div className="file-input-container"> 
              {fileName && <span className="file_name">{fileName}</span>}
            </div>
            <div className="social-icons">
              {/* Email - Always shown since it supports all file types */}
              <button onClick={() => handleShare('email')} className="icon-button" title="Email">
                <FaEnvelope className="icon" />
              </button>
              
              {/* Facebook - Only show for supported file types */}
              {isFileTypeSupported(fileType, 'facebook') && (
                <button onClick={() => handleSocialMediaClick('facebook')} className="icon-button" title="Facebook">
                  <FaFacebook className="icon" />
                </button>
              )}
              
              {/* Instagram - Only show for supported file types */}
              {isFileTypeSupported(fileType, 'instagram') && (
                <button onClick={() => handleSocialMediaClick('instagram')} className="icon-button" title="Instagram">
                  <FaInstagram className="icon" />
                </button>
              )}
              
              {/* YouTube - Only show for supported file types */}
              {isFileTypeSupported(fileType, 'youtube') && (
                <button onClick={() => handleSocialMediaClick('youtube')} className="icon-button" title="YouTube">
                  <FaYoutube className="icon" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Use React Portal to render modal at document body level
  return createPortal(modalContent, document.body);
};

export default FileShareModel;