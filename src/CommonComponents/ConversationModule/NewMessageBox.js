import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Send } from 'lucide-react';
import Avatar from './Avatar';

const PaperclipButton = ({ onAttach }) => {
  const [showPopup, setShowPopup] = useState(false);
  const photoInputRef = useRef(null);
  const docInputRef = useRef(null);

  const handlePaperclipClick = () => setShowPopup(!showPopup);

  const handlePhotoClick = () => {
    setShowPopup(false);
    photoInputRef.current.click();
  };

  const handleDocClick = () => {
    setShowPopup(false);
    docInputRef.current.click();
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onAttach(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleDocChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onAttach(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button className="action-button" type="button" onClick={handlePaperclipClick}>
        <Paperclip />
      </button>
      {showPopup && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          background: "#fff",
          border: "1px solid #ccc",
          zIndex: 10,
          padding: "8px"
        }}>
          <button type="button" onClick={handlePhotoClick}>Photos</button>
          <button type="button" onClick={handleDocClick}>Document</button>
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        ref={photoInputRef}
        onChange={handlePhotoChange}
      />
      <input
        type="file"
        accept=".xml,.html,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        style={{ display: "none" }}
        ref={docInputRef}
        onChange={handleDocChange}
      />
    </div>
  );
};

const NewMessageBox = ({ onSend, currentUser }) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const textareaRef = useRef(null);

  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSend({ message, attachments });
      setMessage('');
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
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

  const handleAttach = (files) => {
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="sticky-message-box">
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
        {/* Attachment preview */}
        {attachments.length > 0 && (
          <div className="attachment-preview" style={{ marginTop: 8 }}>
            {attachments.map((file, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                {file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    style={{ width: 40, height: 40, objectFit: 'cover', marginRight: 8, borderRadius: 4 }}
                  />
                ) : (
                  <span style={{ marginRight: 8 }}>📄</span>
                )}
                <span style={{ fontSize: 14 }}>{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  style={{ marginLeft: 8, cursor: 'pointer', background: 'none', border: 'none', color: 'red' }}
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="editor-actions">
          <PaperclipButton onAttach={handleAttach} />
          <button 
            className="send-button" 
            onClick={handleSend}
            disabled={!message.trim() && attachments.length === 0}
          >
            <Send />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewMessageBox; 