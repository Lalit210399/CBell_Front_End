import React, { useState } from 'react';
import SocialMediaUploader from '../SocialMediaPost/Instagram';
import YouTubeUploader from '../SocialMediaPost/YouTubeUploader';
import { FaFacebook, FaInstagram, FaYoutube, FaEnvelope, FaTimes } from 'react-icons/fa';
import EmailForm from '../EmailSendModal/EmailForm'; 
import './FileShareModel.css';

const FileShareModel = ({ onClose, fileDetail, documentId, description, onPlatformPublish }) => {
  const [fileName] = useState(fileDetail?.name);
  const [showSocialUploader, setShowSocialUploader] = useState(false);
  const [showYouTubeUploader, setShowYouTubeUploader] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [platform, setPlatform] = useState(null);

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

  return (
    <>
      {showSocialUploader ? (
        <SocialMediaUploader
          open={showSocialUploader}
          onClose={() => setShowSocialUploader(false)}
          defaultCaption={description}
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
          onSuccess={handlePlatformSuccess}
          onPlatformPublish={onPlatformPublish}
        />
      ) : showEmailForm ? (
        <EmailForm 
          fileDetail={fileDetail}
          documentId={documentId}
          onClose={() => setShowEmailForm(false)}
          onEmailSent={(platform) => {
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
              <button onClick={() => handleShare('email')} className="icon-button" title="Email">
                <FaEnvelope className="icon" />
              </button>
              <button onClick={() => handleShare('facebook')} className="icon-button" title="Facebook">
                <FaFacebook className="icon" />
              </button>
              <button onClick={() => handleShare('instagram')} className="icon-button" title="Instagram">
                <FaInstagram className="icon" />
              </button>
              <button onClick={() => handleShare('youtube')} className="icon-button" title="YouTube">
                <FaYoutube className="icon" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FileShareModel;