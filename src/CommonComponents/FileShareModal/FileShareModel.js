import React, { useState } from 'react';
import InstagramMediaUploader from '../SocialMediaPost/Instagram';
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin, FaEnvelope, FaTimes } from 'react-icons/fa';
import EmailForm from '../EmailSendModal/EmailForm'; 
import './FileShareModel.css';

const FileShareModel = ({ onClose, fileDetail, documentId, description, onPlatformPublish }) => {
  const [fileName, setFileName] = useState(fileDetail?.name);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showInstagramUploader, setShowInstagramUploader] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [platform, setPlatform] = useState(null);

  //console.log('FileShareModel fileDetail:', fileDetail);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const handlePlatformSuccess = (platform) => {
    onPlatformPublish?.(documentId, platform); // Pass to parent (Publish)
    setShowInstagramUploader(false);
    setShowEmailForm(false);
  };

  const handleShare = (platform) => {
    if (platform === 'instagram' || platform === 'facebook') {
      setPlatform(platform);
      setShowInstagramUploader(true);
      return;
    }
    if (platform === 'email') {
      setShowEmailForm(true);
      return;
    }
    switch (platform) {
      case 'twitter':
        alert(`Sharing ${fileName} on Twitter`);
        break;
      case 'linkedin':
        alert(`Sharing ${fileName} on LinkedIn`);
        break;
      default:
        break;
    }
  };

  return (
    <>
      {showInstagramUploader ? (
        <InstagramMediaUploader
          igUserId="17841474808473956"
          fbPageId="648945998310294"
          accessToken="EAAJ0QEHHOUIBO4LTEiPZC8dgcUsE4mZAaZCKL3srNEhTxH0ZAoaiIWovoHrZBO5NpkyHBkWvkP6lOaDDfZB2XBKonXZC3ypIUmKxBvoLj04ZCsmXpTZB29p3nnCauIuy2d7YOrXYnsAcV4wUykDzGyOMo4AawdHJ05s8g2xKeHwIqFnvdVQLWi9aXZBHzWCz4UXEhv"
          open={showInstagramUploader}
          onClose={() => setShowInstagramUploader(false)}
          defaultImageUrl={documentId}
          defaultCaption={description}
          fileDetail={fileDetail}
          platform={platform}
          onSuccess={handlePlatformSuccess}
        />
      ) : showEmailForm ? (
        <EmailForm 
          fileDetail={fileDetail}
          documentId={documentId}
          onClose={() => setShowEmailForm(false)}
          onEmailSent={(platform) => {
            if (onPlatformPublish) onPlatformPublish(documentId, platform || 'email');
            setShowEmailForm(false);
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
              {/* <button onClick={() => handleShare('twitter')} className="icon-button" title="Twitter">
                <FaTwitter className="icon" />
              </button>
              <button onClick={() => handleShare('linkedin')} className="icon-button" title="LinkedIn">
                <FaLinkedin className="icon" />
              </button> */}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FileShareModel;