// src/components/ConversationModule.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import MessageList from './MessageList';
import NewMessageBox from './NewMessageBox';
import './Style.css';

const ConversationModule = ({ currentUser, users, taskId, eventId, isActive }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNewConversation, setIsNewConversation] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const handleResponse = async (response) => {
    if (response.status === 404) {
      setIsNewConversation(true);
      return null;
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch messages');
    }
    return data;
  };

  const fetchMessages = useCallback(async () => {
    if (!isActive || !taskId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/apis/chat-thread/get-task-chat/${taskId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1",
        },
      });

      const data = await handleResponse(response);

      if (!data) {
        setMessages([]);
        return;
      }

      // Transform API response to our message structure
      const transformedMessages = data.threadDetails.map(thread => ({
        threadId: thread.conversationId,
        user: {
          id: thread.userId,
          name: thread.userName || thread.userId,
          avatar: (thread.userName || thread.userId).slice(0, 2).toUpperCase()
        },
        conversationText: thread.conversationText,
        createdOn: thread.createdOn,
        replies: [],
        reactions: []
      }));

      setMessages(prev => {
        // Only update if there are actually new messages
        if (JSON.stringify(prev) !== JSON.stringify(transformedMessages)) {
          return transformedMessages;
        }
        return prev;
      });
      setIsNewConversation(false);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [taskId, isActive]);

  useEffect(() => {
    fetchMessages();
    
    // Set up polling for new messages
    const pollInterval = setInterval(fetchMessages, 5000) // Poll every 10 seconds
    
    return () => clearInterval(pollInterval);
  }, [fetchMessages]);

  const handleSendMessage = useCallback(async (content) => {
    if (!content.trim()) return;

    try {
      const payload = {
        OrganizationId: currentUser.organizationId,
        EventId: eventId,
        TaskId: taskId,
        UserId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        ConversationText: content,
        DocumentId: []
      };

      const response = await fetch('/apis/chat-thread/add-thread', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1",
        },
        body: JSON.stringify(payload)
      });

      const data = await handleResponse(response);

      const newMessage = {
        threadId: data.threadId || uuidv4(),
        user: currentUser,
        conversationText: content,
        createdOn: new Date().toISOString(),
        replies: [],
        reactions: []
      };

      setMessages(prev => [...prev, newMessage]);
      setIsNewConversation(false);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  }, [currentUser, taskId, eventId]);

  if (!isActive) return null;

  return (
    <div className="conversation-container">
      <div className="messages-container">
        {loading && messages.length === 0 ? (
          <div className="empty-state">Loading conversation...</div>
        ) : error ? (
          <div className="empty-state error">Error: {error}</div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            {isNewConversation ? (
              <>
                <h3>New Conversation</h3>
                <p>Start discussing this task by sending your first message</p>
              </>
            ) : (
              <>
                <h3>No Messages Yet</h3>
                <p>Be the first to start the conversation</p>
              </>
            )}
          </div>
        ) : (
          <>
            <MessageList
              messages={messages}
              currentUser={currentUser}
            />
            {loading && <div className="loading-new-messages">Loading new messages...</div>}
          </>
        )}
      </div>
      <div className="sticky-input">
        <NewMessageBox
          onSend={handleSendMessage}
          users={users}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
};

export default React.memo(ConversationModule);


  // const handleReply = useCallback(async (threadId, content) => {
  //   if (content.trim()) {
  //     try {
  //       const payload = {
  //         OrganizationId: '67e128b2bf6dd22d302d7974',
  //         EventId: '67e27354c5266a793e301477',
  //         TaskId: taskId,
  //         UserId: currentUser.id,
  //         ConversationText: content,
  //         DocumentId: [],
  //         ParentThreadId: threadId // Using threadId for replies
  //       };

  //       const response = await fetch('/apis/chat-thread/add-thread', {
  //         method: 'POST',
  //         headers: {
  //           "Content-Type": "application/json",
  //           "ngrok-skip-browser-warning": "1",
  //         },
  //         body: JSON.stringify(payload)
  //       });

  //       const data = await handleResponse(response);

  //       // Update local state
  //       setMessages(prev => prev.map(message => {
  //         if (message.threadId === threadId) {
  //           return {
  //             ...message,
  //             replies: [
  //               ...message.replies,
  //               {
  //                 threadId: data.threadId || uuidv4(),
  //                 user: currentUser,
  //                 conversationText: content,
  //                 createdOn: new Date().toISOString(),
  //                 reactions: []
  //               }
  //             ]
  //           };
  //         }
  //         return message;
  //       }));
  //     } catch (err) {
  //       console.error('Failed to send reply:', err);
  //     }
  //   }
  // }, [currentUser, taskId]);