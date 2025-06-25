import React, { useEffect, useState } from 'react';
// import { Instagram, Facebook } from 'lucide-react'; // <-- Lucide icons
import { FaInstagram, FaFacebook } from 'react-icons/fa';
import './instagram.css';

const SocialMediaUploader = ({
  igUserId,
  fbPageId,
  accessToken,
  open,
  onClose,
  defaultImageUrl = '',
  defaultCaption = ''
}) => {
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const defaultLink = 'https://cbell.ai/apis/document/view/'; // Replace with your default link if needed

  useEffect(() => {
    if (open) {
      setImageUrl(defaultImageUrl || '');
      setCaption(defaultCaption || '');
      setMessage('');
    }
  }, [open, defaultImageUrl, defaultCaption]);

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

        setMessage(publishData.id ? '✅ Instagram post successful!' : '⚠️ Instagram post completed but no ID returned');
      } else {
        const response = await fetch(`https://graph.facebook.com/v19.0/${fbPageId}/photos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `${defaultLink}${imageUrl}`,  // Must be a public image URL
            message: caption,
            access_token: accessToken,    // This must be the PAGE access token, not a user token
          }),
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error?.message || 'Facebook post failed');

        setMessage(data.id
          ? `✅ Facebook post published! ID: ${data.id}`
          : '⚠️ Facebook post completed but no ID returned');
      }
    } catch (error) {
      setMessage(`❌ ${platform === 'instagram' ? 'Instagram' : 'Facebook'} error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setImageUrl('');
    setCaption('');
    setMessage('');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Social Media Uploader</h2>

        <div className="platform-selector icons">
          <button
            className={platform === 'instagram' ? 'active' : ''}
            onClick={() => setPlatform('instagram')}
            title="Instagram"
          >
            <FaInstagram size={28} />
          </button>
          <button
            className={platform === 'facebook' ? 'active' : ''}
            onClick={() => setPlatform('facebook')}
            title="Facebook"
          >
            <FaFacebook size={28} />
          </button>
        </div>

        <input
          type="text"
          placeholder="Image URL"
          value={`${defaultLink}${imageUrl}`}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <textarea
          className="caption-input"
          placeholder={platform === 'instagram' ? 'Caption' : 'Message (optional)'}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
        />
        <div className="modal-buttons">
          <button onClick={handleClose} className="cancel-btn">Cancel</button>
          <button onClick={handleUpload} disabled={loading}>
            {loading ? 'Posting...' : `Post to ${platform === 'instagram' ? 'Instagram' : 'Facebook'}`}
          </button>
        </div>
        {message && <p className="status-message">{message}</p>}
      </div>
    </div>
  );
};

export default SocialMediaUploader;
