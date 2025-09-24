import React, { useEffect, useState } from 'react';
import { FaInstagram, FaFacebook } from 'react-icons/fa';
import { useUser } from '../../Context/UserContext';
import './instagram.css';

const SocialMediaUploader = ({
  open,
  onClose,
  defaultImageUrl = '',
  defaultCaption = '',
  fileDetail = null,
  onSuccess,
  platform: forcedPlatform = null, // 🔐 From FileShareModel
}) => {
  const { user, selectedOrganizationId } = useUser();
  const fileName = fileDetail?.name || '';
  const documentId = fileDetail?.url ? fileDetail.url.split('/').pop() : defaultImageUrl || '';
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [platform, setPlatform] = useState(forcedPlatform || 'instagram');
  
  // Get organization ID the same way as Events.js
  const organizationId = selectedOrganizationId || user?.organizationId;

  useEffect(() => {
    if (open) {
      setImageUrl(documentId);
      setCaption('');
      setMessage('');
      if (forcedPlatform) setPlatform(forcedPlatform);
    }
  }, [open, documentId, forcedPlatform]);

  if (!open) return null;

  const handleUpload = async () => {
    try {
      setLoading(true);
      setMessage('');

      if (!organizationId) {
        throw new Error('Organization ID is required');
      }

      if (!documentId) {
        throw new Error('Document ID is required');
      }

      const requestBody = {
        organizationId,
        documentId,
        caption: caption.trim()
      };

      let apiEndpoint;
      if (platform === 'instagram') {
        apiEndpoint = '/socialmedia/post/instagram';
      } else {
        apiEndpoint = '/socialmedia/post/facebook';
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || `${platform} post failed`);
      }

      setMessage(`✅ ${platform} post successful!`);
      onSuccess?.(platform);
    } catch (error) {
      setMessage(`❌ ${platform} error: ${error.message}`);
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
