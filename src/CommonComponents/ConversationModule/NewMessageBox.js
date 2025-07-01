// src/components/NewMessageBox.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Send } from 'lucide-react';
import Avatar from './Avatar';
import MessageStrip from '../MessageStrip/MessageStrip';

const FilePreviewBox = ({ file, uploading, onRemove }) => {
  if (!file) return null;
  const type = file.type;
  let preview = null;
  let icon = '📎';
  if (type.startsWith('image/')) {
    preview = <img src={URL.createObjectURL(file)} alt={file.name} style={{ maxWidth: 80, maxHeight: 60, borderRadius: 4, border: '1px solid #eee', objectFit: 'contain', marginRight: 8 }} />;
  } else if (type.startsWith('video/')) {
    preview = <video src={URL.createObjectURL(file)} style={{ maxWidth: 80, maxHeight: 60, borderRadius: 4, border: '1px solid #eee', marginRight: 8 }} controls />;
  } else if (type.startsWith('audio/')) {
    preview = <audio src={URL.createObjectURL(file)} style={{ width: 80, marginRight: 8 }} controls />;
  } else if (type === 'application/pdf') {
    icon = '📄';
  } else if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || type === 'application/msword') {
    icon = '📝';
  } else if (type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || type === 'application/vnd.ms-excel') {
    icon = '📊';
  } else if (type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || type === 'application/vnd.ms-powerpoint') {
    icon = '📈';
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fafafa', border: '1px solid #eee', borderRadius: 6, padding: '4px 8px', marginTop: 8, maxWidth: 220 }}>
      {preview || <span style={{ fontSize: 20 }}>{icon}</span>}
      <span style={{ fontSize: 13, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
      {uploading ? <span style={{ color: '#aaa', fontSize: 12 }}>Uploading...</span> : <button onClick={onRemove} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13 }}>Remove</button>}
    </div>
  );
};

const NewMessageBox = ({ onSend, currentUser }) => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedDocId, setUploadedDocId] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', file.name);
      const response = await fetch('/apis/document/upload_document', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('File upload failed');
      const data = await response.json();
      setUploadedDocId(data.documentId);
    } catch (err) {
      alert('File upload failed');
      setSelectedFile(null);
      setUploadedDocId(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadedDocId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = () => {
    if (message.trim() || uploadedDocId) {
      onSend(message, uploadedDocId ? [uploadedDocId] : []);
      setMessage('');
      setSelectedFile(null);
      setUploadedDocId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // Reset textarea height after send
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // Show message strip for under development feature
  const [showDevMsg, setShowDevMsg] = useState(false);
  const handlePaperclipClick = (e) => {
    e.preventDefault();
    setShowDevMsg(true);
    setTimeout(() => setShowDevMsg(false), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  return (
    <div className="sticky-message-box">
      {showDevMsg && (
        <div style={{ position: 'absolute', top: -40, left: 0, right: 0, zIndex: 10 }}>
          <MessageStrip
            text="This feature is under development."
            type="Information"
            showIcon={true}
            showCloseButton={false}
            duration={2000}
          />
        </div>
      )}
      <Avatar user={currentUser} />
      <div className="message-input-wrapper">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a new message"
          rows="1"
        />
        {selectedFile && (
          <FilePreviewBox file={selectedFile} uploading={uploading} onRemove={handleRemoveFile} />
        )}
        <div className="editor-actions">
          <input
            type="file"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={uploading}
          />
          <button className="action-button" onClick={() => fileInputRef.current && fileInputRef.current.click()} disabled={uploading}>
            <Paperclip />
          </button>
          <button 
            className="send-button" 
            onClick={handleSend}
            disabled={(!message.trim() && !uploadedDocId) || uploading}
          >
            <Send />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewMessageBox;