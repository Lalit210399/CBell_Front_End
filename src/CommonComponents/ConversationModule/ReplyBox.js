// src/components/ReplyBox.jsx
import React, { useState } from 'react';
import { Send } from 'lucide-react';


const ReplyBox = ({ onSend, autoFocus = false }) => {
  const [reply, setReply] = useState('');

  const handleSend = () => {
    if (reply.trim()) {
      onSend(reply);
      setReply('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="reply-box">
      <input
        type="text"
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write a reply..."
        autoFocus={autoFocus}
      />
      <button 
        className="send-button" 
        onClick={handleSend}
        disabled={!reply.trim()}
      >
        <Send />
      </button>
    </div>
  );
};

export default ReplyBox;