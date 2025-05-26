// src/components/NewMessageBox.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Send } from 'lucide-react';
import Avatar from './Avatar';

const NewMessageBox = ({ onSend, currentUser }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage('');
      // Reset textarea height after send
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
        <div className="editor-actions">
          <button className="action-button">
            <Paperclip />
          </button>
          <button 
            className="send-button" 
            onClick={handleSend}
            disabled={!message.trim()}
          >
            <Send />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewMessageBox;