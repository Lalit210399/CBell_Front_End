// src/components/ConversationModule.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import MessageList from './MessageList';
import NewMessageBox from './NewMessageBox';
import { useUser } from '../../Context/UserContext';
import { useSignalR } from '../../Context/SignalRContext';
import './Style.css';

const ConversationModule = ({ currentUser, users, taskId, eventId, isActive }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNewConversation, setIsNewConversation] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { isConnected, joinTaskChat, sendMessage, registerHandlers } = useSignalR();
  const { user } = useUser();

  const getInitialsFromUserName = (userName) => {
    if (!userName) return "??";
    
    const nameParts = userName.trim().split(/\s+/);
    if (nameParts.length >= 2) {
      const first = nameParts[0]?.[0] || "";
      const last = nameParts[nameParts.length - 1]?.[0] || "";
      return (first + last).toUpperCase();
    } else if (nameParts.length === 1) {
      // If only one name part, use first two characters
      const name = nameParts[0];
      return (name[0] + (name[1] || name[0])).toUpperCase();
    }
    
    return "??";
  };

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

      const { fetchWithRefresh } = await import('../../Context/RefereshToken');
      const response = await fetchWithRefresh(`/api/chat/task/${taskId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
      });

      const data = await handleResponse(response);

      if (!data?.success) {
        setMessages([]);
        return;
      }

      // Transform API response to our message structure
      const transformedMessages = data.data.threads.map(thread => ({
        threadId: thread.id,
        user: {
          id: thread.userId,
          name: thread.userName || thread.userId,
          avatar: getInitialsFromUserName(thread.userName || thread.userId)
        },
        conversationText: thread.conversationText,
        createdOn: thread.createdOn,
        replies: [],
        reactions: [],
        documentIds: thread.documentIds || []
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

      // Join the SignalR chat room for this task
      if (isConnected) {
        await joinTaskChat(taskId);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [taskId, isActive, isConnected, joinTaskChat]);

  useEffect(() => {
    // Initial fetch of messages
    fetchMessages();

    // Set up SignalR handlers
    const handleNewMessage = (message) => {
      setMessages(prev => [...prev, {
        threadId: message.threadId,
        user: {
          id: message.userId,
          name: message.userName,
          avatar: getInitialsFromUserName(message.userName)
        },
        conversationText: message.conversationText,
        createdOn: message.createdOn,
        replies: [],
        reactions: [],
        documentIds: message.documentIds || []
      }]);
    };

    const handleUserJoined = (user) => {
      console.log(`${user.userName} joined the chat`);
      // You could update a list of active users here if needed
    };

    const handleUserLeft = (user) => {
      console.log(`${user.userName} left the chat`);
      // You could update a list of active users here if needed
    };

    // Register handlers
    registerHandlers({
      onMessage: handleNewMessage,
      onUserJoined: handleUserJoined,
      onUserLeft: handleUserLeft
    });

    // Cleanup
    return () => {
      if (isConnected) {
        joinTaskChat(null); // Leave the current task chat
      }
    };
  }, [fetchMessages, isConnected, joinTaskChat, registerHandlers]);

  const handleSendMessage = useCallback(async (content, documentIds = []) => {
    if (!content.trim() && (!documentIds || documentIds.length === 0)) return;
    try {
      const payload = {
        OrganizationId: currentUser.organizationId,
        EventId: eventId,
        TaskId: taskId,
        UserId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        ConversationText: content,
        DocumentId: documentIds || []
      };
      // First, add the thread
      const { fetchWithRefresh } = await import('../../Context/RefereshToken');
      const response = await fetchWithRefresh('/apis/chat-thread/add-thread', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1",
        },
        body: JSON.stringify(payload)
      });
      const data = await handleResponse(response);

      // After thread is added, call /apis/Document-Details with conversationId
      if (data && data.conversationId) {
        try {
          // DocumentId should not be an array, so pick the first if array, or pass as is
          let docId = Array.isArray(documentIds) ? documentIds[0] : documentIds;
          const docDetailsPayload = {
            EventId: eventId,
            OrganizationId: currentUser.organizationId,
            DocumentId: docId,
            ConversationId: data.conversationId,
            TaskId: taskId
          };
          await fetchWithRefresh('/apis/Document-Details', {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "1",
            },
            body: JSON.stringify(docDetailsPayload)
          });
        } catch (err) {
          console.error('Failed to link document to conversation:', err);
        }
      }

      const newMessage = {
        threadId: data.threadId || uuidv4(),
        user: currentUser,
        conversationText: content,
        createdOn: new Date().toISOString(),
        replies: [],
        reactions: [],
        documentIds: documentIds || []
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