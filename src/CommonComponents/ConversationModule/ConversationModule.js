// src/components/ConversationModule.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { AlertTriangle } from "lucide-react";
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

  // Validation error state
  const [validationError, setValidationError] = useState("");

  // Determine if this is a task chat or event chat
  const isEventChat = !taskId && !!eventId;
  const chatId = taskId || eventId; // Use whichever is available

  const {
    isConnected,
    connectionError,
    joinTaskChat,
    joinEventChat,
    sendMessage,
    registerHandlers,
    onlineUsers,
    typingUsers,
    startTyping,
    stopTyping,
    startTypingEvent,
    stopTypingEvent,
  } = useSignalR();

  // Debug: Log connection state changes
  useEffect(() => {
    //console.debug('[ConversationModule] isConnected:', isConnected);
    if (window.signalRDebug === undefined) window.signalRDebug = {};
    window.signalRDebug.isConnected = isConnected;
    window.signalRDebug.connectionError = connectionError;
  }, [isConnected, connectionError]);
  const { user } = useUser();

  const typingTimeoutRef = useRef(null);
  const lastTypingTimeRef = useRef(0);
  const messagesEndRef = useRef(null);

  const getInitialsFromUserName = useCallback((userName) => {
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
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear validation errors after 5 seconds
  useEffect(() => {
    if (validationError) {
      const timer = setTimeout(() => {
        setValidationError("");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [validationError]);

  const fetchMessages = useCallback(async () => {
    if (!isActive || !chatId) return;

    try {
      setLoading(true);
      setError(null);

      const { fetchWithRefresh } = await import("../../Context/RefereshToken");

      // Use appropriate API endpoint based on chat type
      const apiEndpoint = isEventChat
        ? `/apis/chat-thread/get-event-chat/${eventId}`
        : `/apis/chat-thread/get-task-chat/${taskId}`;

      const response = await fetchWithRefresh(
        apiEndpoint,
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
        messageType: thread.messageType || 1, // Default to normal chat if not provided
        replies: [],
        reactions: [],
        documentIds: thread.documentId ? [thread.documentId] : [],
      }));

      setMessages(transformedMessages);
      setIsNewConversation(false);

      // Join the appropriate chat room
      if (isConnected && chatId) {
        const organizationId = currentUser?.organizationId || user?.organizationId;
        if (isEventChat) {
          await joinEventChat(eventId, organizationId);
        } else {
          await joinTaskChat(taskId, organizationId, eventId);
        }
      }
    } catch (err) {
      console.error("[ConversationModule] Error fetching messages:", err);
      setError(err.message);
      setIsNewConversation(true);
    } finally {
      setLoading(false);
    }
  }, [taskId, eventId, isActive, isConnected, joinTaskChat, joinEventChat, currentUser, user, getInitialsFromUserName, isEventChat, chatId]);

  // SignalR Message Handlers
  const handleMessageReceived = useCallback(
    (message) => {
      console.log("[ConversationModule] Message received via SignalR:", message, "current taskId:", taskId, "current eventId:", eventId, "message.taskId:", message.taskId, "message.eventId:", message.eventId);

      // Check if message is for current chat (either task or event)
      // For event chats, check both eventId and taskId (backend might be inconsistent)
      const isMessageForCurrentChat = isEventChat
        ? (message.eventId === eventId || message.taskId === eventId)
        : (message.taskId === taskId);

      if (isMessageForCurrentChat) {
        console.log("[ConversationModule] Message is for current chat, updating messages");
        setMessages((prev) => {
          // Check if message already exists by server id to avoid duplicates
          const exists = prev.some((m) => m.threadId === message.conversationId);
          if (exists) {
            console.log("[ConversationModule] Message already exists, skipping");
            return prev;
          }

          console.log("[ConversationModule] Adding new message to state");
          // Try to find an optimistic message we previously inserted so we can replace it
          const normalizedIncomingText = (message.message || "").trim();
          const serverTime = message.sentAt ? new Date(message.sentAt).getTime() : null;

          const optimisticIndex = prev.findIndex((m) => {
            if (!m.isOptimistic) return false;
            // Same user
            if (String(m.user?.id) !== String(message.userId)) return false;
            // Same text
            if ((m.conversationText || "").trim() !== normalizedIncomingText) return false;
            // If both have timestamps, ensure they are within 30s
            if (m.createdOn && serverTime) {
              const localTime = new Date(m.createdOn).getTime();
              if (Math.abs(localTime - serverTime) > 30000) return false;
            }
            return true;
          });

          const newMessage = {
            threadId: message.conversationId,
            user: {
              id: message.userId,
              name: message.userName,
              avatar: getInitialsFromUserName(message.userName),
            },
            conversationText: message.message,
            createdOn: message.sentAt,
            messageType: message.messageType || 1, // Default to normal chat if not provided
            replies: [],
            reactions: [],
            documentIds: message.documentIds || [],
          };

          if (optimisticIndex !== -1) {
            // Replace the optimistic message with the authoritative server message
            const copy = [...prev];
            copy[optimisticIndex] = {
              ...copy[optimisticIndex],
              ...newMessage,
              isOptimistic: false,
            };
            return copy;
          }

          // No optimistic match - append normally
          return [...prev, newMessage];
        });
      }
    },
    [taskId, eventId, isEventChat, getInitialsFromUserName]
  );

  const handleUserJoined = useCallback(
    (data) => {
      // Check if user joined current chat (task or event)
      // For event chats, check both eventId and taskId (backend might be inconsistent)
      const isUserJoinedCurrentChat = isEventChat
        ? (data.eventId === eventId || data.taskId === eventId)
        : (data.taskId === taskId);

      if (isUserJoinedCurrentChat) {
        //console.info(` [ConversationModule] User joined: ${data.userName}`);
        // You could show a notification here
      }
    },
    [taskId, eventId, isEventChat]
  );

  const handleUserLeft = useCallback(
    (data) => {
      // Check if user left current chat (task or event)
      // For event chats, check both eventId and taskId (backend might be inconsistent)
      const isUserLeftCurrentChat = isEventChat
        ? (data.eventId === eventId || data.taskId === eventId)
        : (data.taskId === taskId);

      if (isUserLeftCurrentChat) {
        //console.info(` [ConversationModule] User left: ${data.userName}`);
        // You could show a notification here
      }
    },
    [taskId, eventId, isEventChat]
  );

  const handleUserTyping = useCallback((typingInfo) => {
    // Typing state is managed by the SignalR context
    //console.debug('[ConversationModule] Typing update:', typingInfo);
  }, []);

  const handleOnlineUsers = useCallback((data) => {
    //console.debug('[ConversationModule] Online users updated:', data);
  }, []);

  // Setup SignalR handlers and join chat
  useEffect(() => {
    if (!isActive || !chatId) return;

    // Register SignalR handlers and capture unsubscribe
    const unregister = registerHandlers({
      onMessageReceived: handleMessageReceived,
      onUserJoined: handleUserJoined,
      onUserLeft: handleUserLeft,
      onUserTyping: handleUserTyping,
      onOnlineUsers: handleOnlineUsers,
    }) || (() => {});

    // Fetch messages and join chat
    fetchMessages();

    // Cleanup function
    return () => {
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Unregister handlers we added
      try { unregister(); } catch (e) { /* ignore */ }
    };
  }, [
    isActive,
    chatId,
    registerHandlers,
    handleMessageReceived,
    handleUserJoined,
    handleUserLeft,
    handleUserTyping,
    handleOnlineUsers,
    fetchMessages,
  ]);

  // Rejoin chat when connection is restored
  useEffect(() => {
    if (!isActive || !chatId || !isConnected) return;

    // Add a small delay to ensure connection is fully established
    const rejoinTimeout = setTimeout(async () => {
      try {
        // Double-check connection is still active
        if (!isConnected) return;

        const organizationId = currentUser?.organizationId || user?.organizationId;
        let success;
        if (isEventChat) {
          success = await joinEventChat(eventId, organizationId);
        } else {
          success = await joinTaskChat(taskId, organizationId, eventId);
        }

        if (success) {
          console.log('[ConversationModule] Successfully rejoined chat after reconnection');
          // Optionally fetch latest messages to catch any missed during disconnection
          // await fetchMessages();
        } else {
          console.error('[ConversationModule] Failed to rejoin chat after reconnection');
        }
      } catch (error) {
        console.error('[ConversationModule] Failed to rejoin chat on reconnection:', error);
      }
    }, 1500); // Increased delay to 1.5 seconds

    return () => clearTimeout(rejoinTimeout);
  }, [isConnected, isActive, chatId, isEventChat, eventId, taskId, joinTaskChat, joinEventChat, currentUser, user]);

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    if (!isConnected || !chatId) return;

    const now = Date.now();
    if (now - lastTypingTimeRef.current > 2000) {
      if (isEventChat) {
        startTypingEvent(eventId);
      } else {
        startTyping(taskId);
      }
      lastTypingTimeRef.current = now;
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isEventChat) {
        stopTypingEvent(eventId);
      } else {
        stopTyping(taskId);
      }
    }, 3000);
  }, [isConnected, chatId, isEventChat, eventId, taskId, startTyping, stopTyping, startTypingEvent, stopTypingEvent]);

  const handleTypingStop = useCallback(() => {
    if (!isConnected || !chatId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isEventChat) {
      stopTypingEvent(eventId);
    } else {
      stopTyping(taskId);
    }
  }, [isConnected, chatId, isEventChat, eventId, taskId, stopTyping, stopTypingEvent]);

  const handleSendMessage = useCallback(
    async (content, documentIds = [], messageType = 1) => {
      // Clear any previous validation errors
      setValidationError("");

      // Client-side validation
      const trimmedContent = (content || "").trim();

      if (!trimmedContent && (!documentIds || documentIds.length === 0)) {
        setValidationError("Message cannot be empty");
        return;
      }

      if (trimmedContent.length > 2000) {
        setValidationError("Message is too long (maximum 2000 characters)");
        return;
      }

      try {
        // Get required parameters for SignalR
        const organizationId = currentUser?.organizationId || user?.organizationId;
        const userId = currentUser?.id || user?.id;
        const userName = `${currentUser?.firstName || user?.firstName || ''} ${currentUser?.lastName || user?.lastName || ''}`.trim() || currentUser?.userName || user?.userName;

        // Use SignalR to send real-time message - pass empty string for taskId in event chats
        const messageTaskId = isEventChat ? "" : taskId;
        const success = await sendMessage(messageTaskId, trimmedContent, documentIds, messageType, organizationId, eventId, userId, userName);
        console.log("[ConversationModule] Send message result:", success);

        if (success) {
          // Optimistically add message to UI, but avoid adding if a server message
          // for the same text/user already exists (race where server broadcast
          // arrives before sendMessage resolves).
          const optimisticMessage = {
            threadId: uuidv4(), // Temporary ID until we get real one
            user: {
              id: currentUser.id,
              name: `${currentUser.firstName} ${currentUser.lastName}`,
              avatar: getInitialsFromUserName(
                `${currentUser.firstName} ${currentUser.lastName}`
              ),
            },
            conversationText: trimmedContent,
            createdOn: new Date().toISOString(),
            messageType: messageType, // Include messageType in optimistic message
            replies: [],
            reactions: [],
            documentIds: documentIds || [],
            isOptimistic: true, // Mark as optimistic
          };

          const normalizedContent = trimmedContent;
          const now = Date.now();

          setMessages((prev) => {
            // If there's already a message from this user with same text
            // and a timestamp within 60s, assume server already added it.
            const exists = prev.some((m) => {
              try {
                if (String(m.user?.id) !== String(currentUser.id)) return false;
                if ((m.conversationText || "").trim() !== normalizedContent) return false;
                if (!m.createdOn) return true; // conservatively assume match
                const mTime = new Date(m.createdOn).getTime();
                return Math.abs(now - mTime) <= 60000; // 60s window
              } catch (e) {
                return false;
              }
            });

            if (exists) {
              // Don't add optimistic duplicate
              return prev;
            }

            setIsNewConversation(false);
            return [...prev, optimisticMessage];
          });

          // Stop typing when message is sent
          handleTypingStop();
        }
      } catch (err) {
        console.error("[ConversationModule] Failed to send message:", err);

        // Handle specific error types
        const errorMessage = err?.message || err?.toString() || "Failed to send message";

        if (errorMessage.toLowerCase().includes("empty") ||
            errorMessage.toLowerCase().includes("validation")) {
          // Validation error
          setValidationError(errorMessage);
        } else {
          // Generic error
          setValidationError("Failed to send message. Please try again.");
        }
      }
    },
    [taskId, eventId, isEventChat, sendMessage, currentUser, user, handleTypingStop, getInitialsFromUserName]
  );

  // Get typing users for current chat (task or event)
  const currentTypingUsers = typingUsers[chatId] || [];

  // Normalize online users for internal use (ids + names)
  const normalizedOnlineUsers = (onlineUsers || []).map((u) => {
    const id = u?.UserId || u?.userId || u?.id || u?.User?.UserId || u?.User?.userId || null;
    const name = u?.UserName || u?.userName || u?.name || u?.User?.UserName || u?.User?.name || u?.user?.name || 'Unknown';
    return { id, name, initials: getInitialsFromUserName(name) };
  }).filter(u => u.id || u.name);

  const onlineUserIds = normalizedOnlineUsers.map(u => String(u.id));
  const onlineUserNames = normalizedOnlineUsers.map(u => String(u.name));

  if (!isActive) return null;

  return (
    <div className="conversation-container">
      {/* Connection Status */}
      {connectionError && (
        <div className="connection-error-banner">
          <AlertTriangle className="connection-error-icon" />
          <div className="connection-error-content">
            <div className="connection-error-title">Connection Issue</div>
            <div className="connection-error-message">
              {connectionError.includes('Rate limit') 
                ? 'You\'re sending messages too quickly. Please wait a moment before trying again.'
                : connectionError.includes('Reconnecting')
                ? 'Reconnecting to chat... Please wait.'
                : connectionError.includes('Connection closed')
                ? 'Chat connection lost. Attempting to reconnect...'
                : `Connection error: ${connectionError}`
              }
            </div>
          </div>
        </div>
      )}

      {/* Typing indicator bar (online avatars moved to avatar components) */}
      <div className="online-users-bar">
        <div className="online-stats">
          {currentTypingUsers.length > 0 && (
            <div className="typing-indicator">
              <span className="typing-names">
                {currentTypingUsers.length === 1
                  ? `${currentTypingUsers[0]} is typing...`
                  : `${currentTypingUsers.slice(0,3).join(', ')}${currentTypingUsers.length > 3 ? ',...' : ''} are typing...`}
              </span>
              <span className="typing-dots" aria-hidden="true">
                <b>.</b><b>.</b><b>.</b>
              </span>
            </div>
          )}
        </div>
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
            <MessageList messages={messages} currentUser={currentUser} onlineUserIds={onlineUserIds} onlineUserNames={onlineUserNames} />
            {loading && (
              <div className="loading-new-messages">
                Loading new messages...
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* <div className="sticky-input"> */}
        <NewMessageBox
          onSend={handleSendMessage}
          onTypingStart={() => handleTypingStart()}
          onTypingStop={() => handleTypingStop()}
          placeholder={"Type a message..."}
          currentUser={currentUser}
          validationError={validationError}
        />
      {/* </div> */}
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