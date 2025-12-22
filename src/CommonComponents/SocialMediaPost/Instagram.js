import React, { useEffect, useState } from 'react';
import { FaInstagram, FaFacebook } from 'react-icons/fa';
import './instagram.css';

const SocialMediaUploader = ({
  open,
  onClose,
  defaultImageUrl = '',
  defaultCaption = '',
  fileDetail = null,
  onSuccess,
  onPlatformPublish, // 🔐 API call function from parent (Publish.js)
  platform: forcedPlatform = null, // 🔐 From FileShareModel
  documentId: propDocumentId = null, // 🔐 documentId passed from parent
}) => {
  const fileName = fileDetail?.name || '';
  // Use documentId from props first, then from fileDetail, then try to extract from URL
  const documentId = propDocumentId || fileDetail?.documentId || (fileDetail?.url ? fileDetail.url.split('/').pop() : defaultImageUrl || '');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [platform, setPlatform] = useState(forcedPlatform || 'instagram');
  

  useEffect(() => {
    if (open) {
      // Use file description as default caption if available, otherwise use defaultCaption
      const fileDescription = fileDetail?.document?.description || fileDetail?.description || '';
      setCaption(fileDescription || defaultCaption || '');
      setMessage('');
      if (forcedPlatform) setPlatform(forcedPlatform);
    }
  }, [open, defaultCaption, forcedPlatform, fileDetail]);

  if (!open) return null;

  const handleUpload = async () => {
    try {
      setLoading(true);
      setMessage('');

      if (!documentId) {
        throw new Error('Document ID is required');
      }

      if (!onPlatformPublish) {
        throw new Error('Platform publish function not available');
      }

      // Use the parent's API call function (from Publish.js)
      await onPlatformPublish(documentId, platform, {
        caption: caption.trim()
      });

      setMessage(`✅ ${platform} post successful!`);
      onSuccess?.(platform);
    } catch (error) {
      // Show user-friendly error message
      const errorMessage = (error.message.includes('No social media account added') || 
                           error.message.includes('Social media config not found') ||
                           error.message.includes('social media account not configured') ||
                           error.message.includes('Social media account not configured') ||
                           error.message.includes('Social med')) 
        ? 'No social media account added. Please contact your administrator to add social media accounts for your organization.'
        : error.message;
      setMessage(`❌ ${platform} error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Social Media Uploader</h2>

        <div className="platform-selector icons">
          {/* Show only Instagram if platform is locked to Instagram */}
          {(!forcedPlatform || forcedPlatform === 'instagram') && (
            <button
              className={platform === 'instagram' ? 'active' : ''}
              onClick={() => !forcedPlatform && setPlatform('instagram')}
              disabled={!!forcedPlatform}
              title="Instagram"
            >
              <FaInstagram size={28} />
            </button>
          )}

          {/* Show only Facebook if platform is locked to Facebook */}
          {(!forcedPlatform || forcedPlatform === 'facebook') && (
            <button
              className={platform === 'facebook' ? 'active' : ''}
              onClick={() => !forcedPlatform && setPlatform('facebook')}
              disabled={!!forcedPlatform}
              title="Facebook"
            >
              <FaFacebook size={28} />
            </button>
          )}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          {fileName ? (
            <div className="file-info">
              <span className="file-name" title={fileName}>
                File: {fileName}
              </span>
            </div>
          ) : (
            <input type="text" placeholder="File Name" value="" readOnly />
          )}
        </div>

        <textarea
          className="caption-input"
          placeholder="Caption / Message"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        <div className="modal-buttons">
          <button onClick={onClose} className="cancel-btn">Cancel</button>
          <button onClick={handleUpload} disabled={loading}>
            {loading ? 'Posting...' : `Post to ${platform}`}
          </button>
        </div>

        {message && <p className="status-message">{message}</p>}
      </div>
    </div>
  );
};

export default SocialMediaUploader;
