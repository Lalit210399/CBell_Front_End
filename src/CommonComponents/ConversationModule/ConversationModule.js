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

  // Debug: Log connection state changes
  useEffect(() => {
    console.debug('[ConversationModule] isConnected:', isConnected);
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
      console.error("[ConversationModule] Error fetching messages:", err);
      setError(err.message);
      setIsNewConversation(true);
    } finally {
      setLoading(false);
    }
  }, [taskId, eventId, isActive, isConnected, joinTaskChat, currentUser, user, getInitialsFromUserName]);

  // SignalR Message Handlers
  const handleMessageReceived = useCallback(
    (message) => {
      console.debug("[ConversationModule] Message received via SignalR:", message);

      if (message.taskId === taskId) {
        setMessages((prev) => {
          // Check if message already exists by server id to avoid duplicates
          const exists = prev.some((m) => m.threadId === message.conversationId);
          if (exists) return prev;

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
    [taskId, getInitialsFromUserName]
  );

  const handleUserJoined = useCallback(
    (data) => {
      if (data.taskId === taskId) {
        console.info(` [ConversationModule] User joined: ${data.userName}`);
        // You could show a notification here
      }
    },
    [taskId]
  );

  const handleUserLeft = useCallback(
    (data) => {
      if (data.taskId === taskId) {
        console.info(` [ConversationModule] User left: ${data.userName}`);
        // You could show a notification here
      }
    },
    [taskId]
  );

  const handleUserTyping = useCallback((typingInfo) => {
    // Typing state is managed by the SignalR context
    console.debug('[ConversationModule] Typing update:', typingInfo);
  }, []);

  const handleOnlineUsers = useCallback((data) => {
    console.debug('[ConversationModule] Online users updated:', data);
  }, []);

  // Setup SignalR handlers and join chat
  useEffect(() => {
    if (!isActive || !taskId) return;

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
            conversationText: content,
            createdOn: new Date().toISOString(),
            replies: [],
            reactions: [],
            documentIds: documentIds || [],
            isOptimistic: true, // Mark as optimistic
          };

          const normalizedContent = (content || "").trim();
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
        // You could show an error message to the user here
      }
    },
    [taskId, sendMessage, currentUser, handleTypingStop, getInitialsFromUserName]
  );

  // Get typing users for current task
  const currentTypingUsers = typingUsers[taskId] || [];

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
        <div className="connection-error">
          Connection error: {connectionError}
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
          disabled={false} // Always enabled for testing
          placeholder={"Type a message... (test mode)"}
          currentUser={currentUser}
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