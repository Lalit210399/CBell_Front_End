// src/components/MessageItem.jsx
import React, { useState } from 'react';
import { Reply, MoreHorizontal, Smile, SmilePlus } from 'lucide-react';
import Avatar from './Avatar';
import ReplyBox from './ReplyBox';
import Reactions from './Reactions';

const MessageItem = ({ message, currentUser, onReply, onReaction, isThread }) => {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const handleReply = (content) => {
    onReply(message.threadId, content);
    setShowReplyBox(false);
  };

  const handleReaction = (reaction) => {
    onReaction(message.threadId, null, reaction);
    setShowReactions(false);
  };

  return (
    <div className={`message-item ${isThread ? 'thread-starter' : ''}`}>
      <div className="message-content">
        <Avatar user={message.user} />
        <div className="message-body">
          <div className="message-header">
            <span className="username">{message.user.name}</span>
            <span className="timestamp">
              {new Date(message.createdOn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="message-text">{message.conversationText}</div>
          <Reactions reactions={message.reactions || []} />
          <div className="message-actions">
            <button 
              className="action-button" 
              onClick={() => setShowReplyBox(!showReplyBox)}
            >
              <Reply /> Reply
            </button>
            <div className="reaction-picker-container">
              <button 
                className="action-button" 
                onClick={() => setShowReactions(!showReactions)}
              >
                {showReactions ? <Smile /> : <SmilePlus />}
              </button>
              {showReactions && (
                <div className="reaction-picker">
                  {['👍', '👎', '❤️', '😂', '😮', '😢'].map((emoji) => (
                    <button 
                      key={emoji} 
                      className="emoji-button"
                      onClick={() => handleReaction(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="action-button">
              <MoreHorizontal />
            </button>
          </div>
        </div>
      </div>

      {showReplyBox && (
        <ReplyBox 
          onSend={handleReply} 
          currentUser={currentUser}
          autoFocus
        />
      )}

      {message.replies && message.replies.length > 0 && (
        <div className="replies-container">
          {message.replies.map(reply => (
            <MessageItem
              key={reply.threadId}
              message={reply}
              currentUser={currentUser}
              onReply={onReply}
              onReaction={onReaction}
              isThread={false}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageItem;