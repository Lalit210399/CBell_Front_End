// src/components/MessageItem.jsx
import React, { useState, useEffect } from 'react';
import { Reply, MoreHorizontal, Smile, SmilePlus } from 'lucide-react';
import Avatar from './Avatar';
import ReplyBox from './ReplyBox';
import Reactions from './Reactions';
import MessageStrip from '../MessageStrip/MessageStrip';

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
  }, [docId]);
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

const MessageItem = ({ message, currentUser, onReply, onReaction, isThread }) => {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [showDevMsg, setShowDevMsg] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const handleReply = (content) => {
    onReply(message.threadId, content);
    setShowReplyBox(false);
  };

  const handleReaction = (reaction) => {
    onReaction(message.threadId, null, reaction);
    setShowReactions(false);
  };

  const handleReplyClick = () => {
    setShowDevMsg(true);
    setTimeout(() => setShowDevMsg(false), 2000);
  };

  return (
    <div className={`message-item ${isThread ? 'thread-starter' : ''}`} style={{ position: 'relative' }}>
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
          {/* Render document links and previews if present */}
          {message.documentIds && message.documentIds.length > 0 && (
            <div style={{ margin: '8px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {message.documentIds.map((docId, idx) => (
                <DocumentPreview key={docId} docId={docId} idx={idx} total={message.documentIds.length} />
              ))}
            </div>
          )}
          <Reactions reactions={message.reactions || []} />
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