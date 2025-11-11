  // src/components/MessageList.jsx
  import React, { useEffect, useRef, memo, useCallback } from 'react';
  import MessageItem from './MessageItem';

const MessageList = ({ messages, currentUser, onReply, onReaction, onlineUserIds = [], onlineUserNames = [] }) => {
  const messagesEndRef = useRef(null);
  console.log("onlineUserIds in MessageList:", onlineUserIds);

    const scrollToBottom = useCallback(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
      scrollToBottom();
    }, [messages, scrollToBottom]);

  return (
    <div className="message-list">
      {messages.map(message => (
        <MessageItem
          key={message.threadId}
          message={message}
          currentUser={currentUser}
          onReply={onReply}
          onReaction={onReaction}
          isThread={true}
          onlineUserIds={onlineUserIds}
          onlineUserNames={onlineUserNames}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

  export default memo(MessageList);