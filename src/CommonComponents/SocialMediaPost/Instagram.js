import React, { useEffect, useState } from 'react';
import { FaInstagram, FaFacebook } from 'react-icons/fa';
import './instagram.css';

const SocialMediaUploader = ({
  igUserId,
  fbPageId,
  accessToken,
  open,
  onClose,
  defaultImageUrl = '',
  defaultCaption = '',
  fileDetail = null,
  onSuccess,
  platform: forcedPlatform = null, // 🔐 From FileShareModel
}) => {
  const fileName = fileDetail?.name || '';
  const documentId = fileDetail?.url ? fileDetail.url.split('/').pop() : defaultImageUrl || '';
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [platform, setPlatform] = useState(forcedPlatform || 'instagram');
  const defaultLink = 'https://cbell.ai/apis/document/view/';

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

      if (platform === 'instagram') {
        const mediaResponse = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: `${defaultLink}${imageUrl}`,
            caption,
            access_token: accessToken,
          }),
        });
        const mediaData = await mediaResponse.json();
        if (!mediaResponse.ok) throw new Error(mediaData.error?.message || 'Instagram media creation failed');

        const publishResponse = await fetch(
          `https://graph.facebook.com/v19.0/${igUserId}/media_publish`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              creation_id: mediaData.id,
              access_token: accessToken,
            }),
          }
        );
        const publishData = await publishResponse.json();
        if (!publishResponse.ok) throw new Error(publishData.error?.message || 'Instagram publish failed');

        setMessage('✅ Instagram post successful!');
        onSuccess?.('Instagram');
      } else {
        const response = await fetch(`https://graph.facebook.com/v19.0/${fbPageId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: `${defaultLink}${imageUrl}`,
            message: caption,
            access_token: accessToken,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'Facebook post failed');

        setMessage('✅ Facebook post successful!');
        onSuccess?.('Facebook');
      }
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
            <a
              href={`${defaultLink}${documentId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="file-link"
              title={fileName}
            >
              {fileName}
            </a>
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
