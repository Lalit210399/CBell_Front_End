// src/components/ConversationModule.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import MessageList from "./MessageList";
import NewMessageBox from "./NewMessageBox";
import { useUser } from "../../Context/UserContext";
import { useSignalR } from "../../Context/SignalRContext";
import "./Style.css";

const ConversationModule = ({
  currentUser,
  users,
  taskId,
  eventId,
  isActive,
}) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNewConversation, setIsNewConversation] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const {
    isConnected,
    connectionError,
    joinTaskChat,
    sendMessage,
    registerHandlers,
    onlineUsers,
    typingUsers,
    startTyping,
    stopTyping,
  } = useSignalR();
  const { user } = useUser();

  const typingTimeoutRef = useRef(null);
  const lastTypingTimeRef = useRef(0);
  const messagesEndRef = useRef(null);

  const getInitialsFromUserName = (userName) => {
    if (!userName) return "??";

    const nameParts = userName.trim().split(/\s+/);
    if (nameParts.length >= 2) {
      const first = nameParts[0]?.[0] || "";
      const last = nameParts[nameParts.length - 1]?.[0] || "";
      return (first + last).toUpperCase();
    } else if (nameParts.length === 1) {
      const name = nameParts[0];
      return (name[0] + (name[1] || name[0])).toUpperCase();
    }

    return "??";
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleResponse = async (response) => {
    if (response.status === 404) {
      setIsNewConversation(true);
      return null;
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch messages");
    }
    return data;
  };

  const fetchMessages = useCallback(async () => {
    if (!isActive || !taskId) return;

    try {
      setLoading(true);
      setError(null);

      const { fetchWithRefresh } = await import("../../Context/RefereshToken");

      // Updated API endpoint to match your backend
      const response = await fetchWithRefresh(
        `/apis/chat-thread/get-task-chat/${taskId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          // withCredentials is handled by fetchWithRefresh
        }
      );

      const data = await response.json();

      if (!data || !data.threadDetails) {
        setMessages([]);
        setIsNewConversation(true);
        return;
      }

      // Transform API response to our message structure
      const transformedMessages = data.threadDetails.map((thread) => ({
        threadId: thread.conversationId,
        user: {
          id: thread.userId,
          name: thread.userName || thread.userId,
          avatar: getInitialsFromUserName(thread.userName || thread.userId),
        },
        conversationText: thread.conversationText,
        createdOn: thread.createdOn,
        replies: [],
        reactions: [],
        documentIds: thread.documentId ? [thread.documentId] : [],
      }));

      setMessages(transformedMessages);
      setIsNewConversation(false);
      setLastUpdated(new Date().toISOString());

      // Join the SignalR chat room for this task
      if (isConnected && taskId) {
        const organizationId =
          currentUser?.organizationId || user?.organizationId;
        await joinTaskChat(taskId, organizationId, eventId);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError(err.message);
      setIsNewConversation(true);
    } finally {
      setLoading(false);
    }
  }, [taskId, eventId, isActive, isConnected, joinTaskChat, currentUser, user]);

  // SignalR Message Handlers
  const handleMessageReceived = useCallback(
    (message) => {
      console.log("Message received via SignalR:", message);

      if (message.taskId === taskId) {
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(
            (m) => m.threadId === message.conversationId
          );
          if (exists) return prev;

          return [
            ...prev,
            {
              threadId: message.conversationId,
              user: {
                id: message.userId,
                name: message.userName,
                avatar: getInitialsFromUserName(message.userName),
              },
              conversationText: message.message,
              createdOn: message.sentAt,
              replies: [],
              reactions: [],
              documentIds: message.documentIds || [],
            },
          ];
        });
      }
    },
    [taskId]
  );

  const handleUserJoined = useCallback(
    (data) => {
      if (data.taskId === taskId) {
        console.log(`User joined: ${data.userName}`);
        // You could show a notification here
      }
    },
    [taskId]
  );

  const handleUserLeft = useCallback(
    (data) => {
      if (data.taskId === taskId) {
        console.log(`User left: ${data.userName}`);
        // You could show a notification here
      }
    },
    [taskId]
  );

  const handleUserTyping = useCallback((typingInfo) => {
    // Typing state is managed by the SignalR context
    console.log("Typing update:", typingInfo);
  }, []);

  const handleOnlineUsers = useCallback((data) => {
    console.log("Online users updated:", data);
  }, []);

  // Setup SignalR handlers and join chat
  useEffect(() => {
    if (!isActive || !taskId) return;

    // Register SignalR handlers
    registerHandlers({
      onMessageReceived: handleMessageReceived,
      onUserJoined: handleUserJoined,
      onUserLeft: handleUserLeft,
      onUserTyping: handleUserTyping,
      onOnlineUsers: handleOnlineUsers,
    });

    // Fetch messages and join chat
    fetchMessages();

    // Cleanup function
    return () => {
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [
    isActive,
    taskId,
    registerHandlers,
    handleMessageReceived,
    handleUserJoined,
    handleUserLeft,
    handleUserTyping,
    handleOnlineUsers,
    fetchMessages,
  ]);

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    if (!isConnected || !taskId) return;

    const now = Date.now();
    if (now - lastTypingTimeRef.current > 2000) {
      startTyping(taskId);
      lastTypingTimeRef.current = now;
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(taskId);
    }, 3000);
  }, [isConnected, taskId, startTyping, stopTyping]);

  const handleTypingStop = useCallback(() => {
    if (!isConnected || !taskId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    stopTyping(taskId);
  }, [isConnected, taskId, stopTyping]);

  const handleSendMessage = useCallback(
    async (content, documentIds = []) => {
      if (
        (!content || content.trim() === "") &&
        (!documentIds || documentIds.length === 0)
      ) {
        return;
      }

      try {
        // Use SignalR to send real-time message
        const success = await sendMessage(taskId, content, documentIds);

        if (success) {
          // Optimistically add message to UI
          const optimisticMessage = {
            threadId: uuidv4(), // Temporary ID until we get real one
            user: {
              id: currentUser.id,
              name: `${currentUser.firstName} ${currentUser.lastName}`,
              avatar: getInitialsFromUserName(
                `${currentUser.firstName} ${currentUser.lastName}`
              ),
            },
            conversationText: content,
            createdOn: new Date().toISOString(),
            replies: [],
            reactions: [],
            documentIds: documentIds || [],
            isOptimistic: true, // Mark as optimistic
          };

          setMessages((prev) => [...prev, optimisticMessage]);
          setIsNewConversation(false);

          // Stop typing when message is sent
          handleTypingStop();
        }
      } catch (err) {
        console.error("Failed to send message:", err);
        // You could show an error message to the user here
      }
    },
    [taskId, sendMessage, currentUser, handleTypingStop]
  );

  // Get typing users for current task
  const currentTypingUsers = typingUsers[taskId] || [];

  if (!isActive) return null;

  return (
    <div className="conversation-container">
      {/* Connection Status */}
      {connectionError && (
        <div className="connection-error">
          Connection error: {connectionError}
        </div>
      )}

      {/* Online Users */}
      <div className="online-users-bar">
        <span>{onlineUsers.length} users online</span>
        {currentTypingUsers.length > 0 && (
          <span className="typing-indicator">
            {currentTypingUsers.length === 1
              ? "1 user is typing..."
              : `${currentTypingUsers.length} users are typing...`}
          </span>
        )}
      </div>

      <div className="messages-container">
        {loading && messages.length === 0 ? (
          <div className="empty-state">Loading conversation...</div>
        ) : error ? (
          <div className="empty-state error">
            <h3>Error Loading Messages</h3>
            <p>{error}</p>
            <button onClick={fetchMessages} className="retry-button">
              Retry
            </button>
          </div>
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
            <MessageList messages={messages} currentUser={currentUser} />
            {loading && (
              <div className="loading-new-messages">
                Loading new messages...
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="sticky-input">
        <NewMessageBox
          onSend={handleSendMessage}
          onTypingStart={() => handleTypingStart()}
          onTypingStop={() => handleTypingStop()}
          disabled={!isConnected}
          placeholder={
            isConnected ? "Type a message..." : "Connecting to chat..."
          }
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
