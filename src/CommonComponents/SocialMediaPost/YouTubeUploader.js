import React, { useEffect, useState } from 'react';
import { FaYoutube, FaTimes } from 'react-icons/fa';
import './youtube.css';

const YouTubeUploader = ({
  open,
  onClose,
  fileDetail = null,
  onSuccess,
  onPlatformPublish
}) => {
  const fileName = fileDetail?.name || '';
  const documentId = fileDetail?.url ? fileDetail.url.split('/').pop() : '';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [privacyStatus, setPrivacyStatus] = useState('public');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (open) {
      setTitle(fileName.replace(/\.[^/.]+$/, "") || ''); // Remove file extension for title
      setDescription('');
      setTags('');
      setPrivacyStatus('public');
      setMessage('');
    }
  }, [open, fileName]);

  if (!open) return null;

  const handleUpload = async () => {
    try {
      setLoading(true);
      setMessage('');

      if (!title.trim()) {
        throw new Error('Title is required');
      }

      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const publishData = {
        title: title.trim(),
        description: description.trim(),
        tags: tagsArray,
        privacyStatus
      };

      if (onPlatformPublish) {
        await onPlatformPublish(documentId, 'youtube', publishData);
        setMessage('✅ YouTube upload successful!');
        onSuccess?.('youtube');
      } else {
        throw new Error('Publish function not available');
      }
    } catch (error) {
      setMessage(`❌ YouTube error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>YouTube Upload</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="platform-header">
          <FaYoutube size={32} color="#FF0000" />
          <span>YouTube</span>
        </div>

        <div className="file-info">
          <span className="file-name" title={fileName}>
            Video: {fileName}
          </span>
        </div>

        <div className="form-group">
          <label htmlFor="youtube-title">Title *</label>
          <input
            id="youtube-title"
            type="text"
            placeholder="Enter video title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
        </div>

        <div className="form-group">
          <label htmlFor="youtube-description">Description</label>
          <textarea
            id="youtube-description"
            className="caption-input"
            placeholder="Enter video description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
            maxLength={5000}
          />
        </div>

        <div className="form-group">
          <label htmlFor="youtube-tags">Tags (comma separated)</label>
          <input
            id="youtube-tags"
            type="text"
            placeholder="tag1, tag2, tag3"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        <div className="form-group">
          {/* <label className="privacy-label">Privacy Settings</label> */}
          <div className="privacy-toggle-container">
            <span className={`privacy-label-text ${privacyStatus === 'private' ? 'active' : ''}`}>
              {privacyStatus === 'public' ? 'Public' : 'Private'}
            </span>
            <button
              type="button"
              className={`privacy-toggle-btn ${privacyStatus === 'private' ? 'active' : ''}`}
              onClick={() => setPrivacyStatus(privacyStatus === 'public' ? 'private' : 'public')}
            >
              <div className="toggle-slider"></div>
            </button>
          </div>
        </div>

        <div className="modal-buttons">
          <button onClick={onClose} className="cancel-btn">Cancel</button>
          <button onClick={handleUpload} disabled={loading || !title.trim()}>
            {loading ? 'Uploading...' : 'Upload to YouTube'}
          </button>
        </div>

        {message && <p className="status-message">{message}</p>}
      </div>
    </div>
  );
};

export default YouTubeUploader;