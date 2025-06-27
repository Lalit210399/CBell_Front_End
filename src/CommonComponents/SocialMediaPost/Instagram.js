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
  fileDetail = null, // <-- Accept fileDetail
  onSuccess, // <-- NEW
}) => {
  // Log all props for debugging
  console.log('SocialMediaUploader props:', {
    igUserId,
    fbPageId,
    accessToken,
    open,
    onClose,
    defaultImageUrl,
    defaultCaption,
    fileDetail,
    onSuccess
  });

  // Use fileDetail if available, otherwise fallback to default props
  const fileName = fileDetail?.name || '';
  const documentId = fileDetail?.url ? fileDetail.url.split('/').pop() : (defaultImageUrl || '');

  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const defaultLink = 'https://cbell.ai/apis/document/view/';

  // Helper to extract filename from URL or path
  const getFileName = (url) => {
    if (!url) return '';
    try {
      // Remove trailing slash if any
      const cleanUrl = url.replace(/\/$/, '');
      // If it's a full URL, get the pathname
      if (cleanUrl.startsWith('http')) {
        return new URL(cleanUrl).pathname.split('/').pop();
      }
      // Otherwise, just get the last segment
      return cleanUrl.split('/').pop();
    } catch {
      return url;
    }
  };

  useEffect(() => {
    if (open) {
      setImageUrl(documentId);
      setCaption(''); // Always empty caption on open
      setMessage('');
    }
  }, [open, documentId]);

  if (!open) return null;

  const handleUpload = async () => {
    try {
      setLoading(true);
      setMessage('');

      if (platform === 'instagram') {
        const mediaResponse = await fetch(
          `https://graph.facebook.com/v19.0/${igUserId}/media`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_url: `${defaultLink}${imageUrl}`,
              caption,
              access_token: accessToken
            }),
          }
        );
        const mediaData = await mediaResponse.json();
        if (!mediaResponse.ok) throw new Error(mediaData.error?.message || 'Instagram media creation failed');

        const publishResponse = await fetch(
          `https://graph.facebook.com/v19.0/${igUserId}/media_publish`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              creation_id: mediaData.id,
              access_token: accessToken
            }),
          }
        );
        const publishData = await publishResponse.json();
        if (!publishResponse.ok) throw new Error(publishData.error?.message || 'Instagram publish failed');

        setMessage('✅ Instagram post successful!');
        onSuccess?.('Instagram'); // <-- 🔥 Call success callback

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
        onSuccess?.('Facebook'); // <-- 🔥 Call success callback
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
          <button className={platform === 'instagram' ? 'active' : ''} onClick={() => setPlatform('instagram')}>
            <FaInstagram size={28} />
          </button>
          <button className={platform === 'facebook' ? 'active' : ''} onClick={() => setPlatform('facebook')}>
            <FaFacebook size={28} />
          </button>
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
