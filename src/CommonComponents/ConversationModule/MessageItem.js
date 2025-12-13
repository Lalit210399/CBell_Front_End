// src/components/MessageItem.jsx
import React, { useState } from 'react';
import Avatar from './Avatar';
import ReplyBox from './ReplyBox';
import Reactions from './Reactions';
import { getMessageTypeConfig, isSystemMessage } from './messageTypeConfig';

const DocumentPreview = ({ docId, idx, total }) => {
  const url = `/apis/document/view/${docId}`;
  const [contentType, setContentType] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch(url, { method: 'HEAD' })
      .then(res => {
        if (!isMounted) return;
        setContentType(res.headers.get('Content-Type'));
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setContentType(null);
        setLoading(false);
      });
    return () => { isMounted = false; };
  }, [url]);
  // File type icons
  let fileIcon = '📎';
  let preview = null;
  if (loading) {
    preview = <span style={{ color: '#aaa', marginRight: 8 }}>Detecting type...</span>;
  } else if (contentType) {
    if (contentType.startsWith('image/')) {
      preview = (
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block' }}>
          <img
            src={url}
            alt={`attachment-${idx + 1}`}
            style={{
              maxWidth: 180,
              maxHeight: 120,
              borderRadius: 6,
              marginBottom: 4,
              display: 'block',
              border: '1px solid #eee',
              background: '#fafafa',
              objectFit: 'contain',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s',
            }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        </a>
      );
    } else if (contentType.startsWith('video/')) {
      preview = (
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block' }}>
          <video
            src={url}
            controls
            style={{
              maxWidth: 220,
              maxHeight: 140,
              borderRadius: 6,
              marginBottom: 4,
              display: 'block',
              border: '1px solid #eee',
              background: '#fafafa',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s',
            }}
          >
            Your browser does not support the video tag.
          </video>
        </a>
      );
    } else if (contentType.startsWith('audio/')) {
      preview = (
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block' }}>
          <audio
            src={url}
            controls
            style={{
              width: 180,
              marginBottom: 4,
              display: 'block',
              cursor: 'pointer',
            }}
          >
            Your browser does not support the audio element.
          </audio>
        </a>
      );
    } else if (contentType === 'application/pdf') {
      fileIcon = '📄';
    } else if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || contentType === 'application/msword') {
      fileIcon = '📝';
    } else if (contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || contentType === 'application/vnd.ms-excel') {
      fileIcon = '📊';
    } else if (contentType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || contentType === 'application/vnd.ms-powerpoint') {
      fileIcon = '📈';
    }
  }
  return (
    <div style={{ marginBottom: 4 }}>
      {preview}
      {(!preview && fileIcon) && (
        <span style={{ fontSize: 24, marginRight: 8 }}>{fileIcon}</span>
      )}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'inline-block', marginRight: 8 }}
      >
        View Attachment {total > 1 ? idx + 1 : ''}
      </a>
    </div>
  );
};

const MessageItem = ({ message, currentUser, onReply, onReaction, isThread, onlineUserIds = [], onlineUserNames = [] }) => {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const handleReply = (content) => {
    onReply(message.threadId, content);
    setShowReplyBox(false);
  };

  // Get message type configuration
  const messageTypeConfig = getMessageTypeConfig(message.messageType);
  const isSystemMsg = isSystemMessage(message.messageType);

  // determine online status: check by id first, fallback to name
  const userId = message.user?.id ? String(message.user.id) : null;
  const userName = message.user?.name ? String(message.user.name) : null;
  const isOnline = (userId && onlineUserIds.includes(userId)) || (userName && onlineUserNames.includes(userName));

  // is this message sent by the current user? used to align bubble to right
  const isOwnMessage = currentUser && message.user && (String(currentUser.id) === String(message.user.id));

  // Clean document IDs: flatten nested arrays and remove falsy/empty IDs
  const cleanedDocumentIds = Array.isArray(message.documentIds)
    ? message.documentIds.flat(Infinity).filter((id) => {
        // remove null/undefined/empty arrays/empty strings
        if (id === null || id === undefined) return false;
        if (Array.isArray(id)) return id.length > 0;
        if (typeof id === 'string' && id.trim() === '') return false;
        return true;
      }).map(id => String(id))
    : [];

  return (
    <div className={`message-item ${isThread ? 'thread-starter' : ''} ${isOwnMessage ? 'own' : 'other'} ${isSystemMsg ? 'system-message' : ''}`} style={{ position: 'relative' }}>
      
      <div className="message-content">
        <Avatar user={message.user} isOnline={isOnline} />
        <div className="message-body">
          <div 
            className={`message-bubble ${isOwnMessage ? 'bubble-own' : 'bubble-other'} ${messageTypeConfig.className}`}
            style={{
              ...(messageTypeConfig.backgroundColor && { backgroundColor: messageTypeConfig.backgroundColor }),
              ...(messageTypeConfig.borderColor && { borderColor: messageTypeConfig.borderColor }),
            }}
          >
            <div className="message-header">
              {messageTypeConfig.showIcon && messageTypeConfig.icon && (
                <span className="message-type-icon" aria-label={messageTypeConfig.label}>
                  {messageTypeConfig.icon}
                </span>
              )}
              <span className="username">{message.user.name}</span>
              <span className="timestamp">
                {new Date(message.createdOn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div 
              className="message-text"
              style={{
                ...(messageTypeConfig.textColor && { color: messageTypeConfig.textColor }),
              }}
            >
              {message.conversationText}
            </div>
            {/* Render document links and previews if present */}
          {cleanedDocumentIds && cleanedDocumentIds.length > 0 && (
            <div style={{ margin: '8px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cleanedDocumentIds.map((docId, idx) => (
                <DocumentPreview key={docId + '-' + idx} docId={docId} idx={idx} total={cleanedDocumentIds.length} />
              ))}
            </div>
          )}
          <Reactions reactions={message.reactions || []} />
          </div>
          {/* <div className="message-actions">
            <button 
              className="action-button" 
              onClick={handleReplyClick}
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
          </div> */}
        </div>
      </div>

      {/* ReplyBox and replies rendering remain unchanged */}
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