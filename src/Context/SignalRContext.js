import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import signalRService from '../Services/signalR-service';
import { useUser } from './UserContext';

const SignalRContext = createContext();

export const useSignalR = () => {
  const context = useContext(SignalRContext);
  if (!context) {
    throw new Error('useSignalR must be used within a SignalRProvider');
  }
  return context;
};

export const SignalRProvider = ({ children }) => {
  // --- All state declarations at the top ---
  const [isConnected, setIsConnected] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [connectionError, setConnectionError] = useState(null);
  const { user } = useUser();

  // Use a ref to avoid closure issues with isConnected
  const isConnectedRef = useRef(isConnected);
  useEffect(() => { isConnectedRef.current = isConnected; }, [isConnected]);

  // Helper to sync isConnected state with actual SignalR connection state
  const syncConnectionState = useCallback(() => {
    if (signalRService.connection) {
      const state = signalRService.connection.state;
      const isNowConnected = state === 1 || state === 'Connected' || signalRService.isConnected();
      if (isNowConnected !== isConnectedRef.current) {
        setIsConnected(isNowConnected);
        if (isNowConnected) {
          setConnectionError(null);
        }
        //console.debug('[SignalRContext] Forced sync: isConnected =', isNowConnected, 'actual state:', state);
      }
    }
  }, []);

  // Initialize SignalR connection
const initializeConnection = useCallback(async () => {
  //console.info('[SignalRContext] Starting connection...');
  if (!user) return;
  
  // 🧩 Prevent duplicate initialization
  if (signalRService.isConnected() || signalRService.connection?.state === "Connecting") {
    //console.debug('[SignalRContext] SignalR already connected or connecting, skipping init.');
    return;
  }

  try {
    const connected = await signalRService.startConnection();
      if (connected) {
        // Register default message handlers
        signalRService.registerMessageHandlers({
          // When server sends full online users list
          onOnlineUsers: (data) => {
            if (data && data.Users) {
              setOnlineUsers(data.Users);
            }
          },

          // When a single user joins the task/chat
          onUserJoined: (data) => {
            try {
              // If server sends complete Users array in this payload
              if (data && data.Users) {
                setOnlineUsers(data.Users);
                return;
              }

              // Normalize user object from possible shapes
              const userObj = data?.User || {
                UserId: data?.userId || data?.UserId,
                UserName: data?.userName || data?.UserName || data?.userName || data?.user?.name,
              };

              if (!userObj || !userObj.UserId) return;

              setOnlineUsers(prev => {
                // avoid duplicates
                const exists = (prev || []).some(u => (u.UserId || u.userId) === (userObj.UserId || userObj.userId));
                if (exists) return prev;
                return [...(prev || []), userObj];
              });
            } catch (e) {
              //console.error('[SignalRContext] Error handling onUserJoined payload', e, data);
            }
          },

          // When a single user leaves the task/chat
          onUserLeft: (data) => {
            try {
              // If server sends complete Users array in this payload
              if (data && data.Users) {
                setOnlineUsers(data.Users);
                return;
              }

              const userId = data?.userId || data?.UserId || data?.User?.UserId || data?.User?.userId;
              if (!userId) return;

              setOnlineUsers(prev => (prev || []).filter(u => (u.UserId || u.userId) !== userId));
            } catch (e) {
              //console.error('[SignalRContext] Error handling onUserLeft payload', e, data);
            }
          },

          onUserTyping: (typingInfo) => {
            const { TaskId, UserId, IsTyping } = typingInfo;
            setTypingUsers(prev => {
              const newTypingUsers = { ...prev };
              if (!newTypingUsers[TaskId]) {
                newTypingUsers[TaskId] = [];
              }
              if (IsTyping) {
                if (!newTypingUsers[TaskId].includes(UserId)) {
                  newTypingUsers[TaskId] = [...newTypingUsers[TaskId], UserId];
                }
              } else {
                newTypingUsers[TaskId] = newTypingUsers[TaskId].filter(id => id !== UserId);
              }
              return newTypingUsers;
            });
          },
          onError: (error) => {
            setConnectionError(error);
          }
        });

        // --- Add listeners for connection state changes ---
        if (signalRService.connection) {
          // attach lifecycle handlers
          signalRService.connection.onreconnected(() => {
            console.log('[SignalRContext] Connection reconnected, updating state');
            setIsConnected(true);
            setConnectionError(null);
          });
          signalRService.connection.onclose((error) => {
            console.log('[SignalRContext] Connection closed:', error?.message);
            setIsConnected(false);
            setConnectionError(error ? (error.message || 'Connection closed') : 'Connection closed');
          });
          signalRService.connection.onreconnecting(() => {
            console.log('[SignalRContext] Connection reconnecting...');
            setIsConnected(false);
            setConnectionError('Reconnecting...');
          });
        }
      }
      //console.info('[SignalRContext] Connection attempt result:', connected);
      setIsConnected(connected);
      setConnectionError(connected ? null : 'Connection failed');
    } catch (error) {
      //console.error('[SignalRContext] Connection attempt failed:', error);
      setIsConnected(false);
      setConnectionError(error.message);
    }
  }, [user]);

  // Clean up connection on unmount
  useEffect(() => {
    //console.info('[SignalRContext] Provider mounted');

    return () => {
      //console.info('[SignalRContext] Provider unmounting, cleaning up connection');
      signalRService.stopConnection().catch(() => {
        //console.info('[SignalRContext] Cleanup completed');
      });
      setIsConnected(false);
    };
  }, []);

  // Connect when user is available
  useEffect(() => {
    if (user && !isConnected) {
      //console.info('[SignalRContext] User detected, initiating connection...');
      initializeConnection();
    } else if (!user && isConnected) {
      //console.info('[SignalRContext] User logged out, disconnecting...');
      signalRService.stopConnection();
      setIsConnected(false);
      setOnlineUsers([]);
      setTypingUsers({});
    }
    // Always try to sync state with actual connection
    syncConnectionState();
  }, [user, isConnected, initializeConnection, syncConnectionState]);

  // Also poll the connection state every 2 seconds as a fallback
  useEffect(() => {
    const interval = setInterval(() => {
      syncConnectionState();
    }, 2000);
    return () => clearInterval(interval);
  }, [syncConnectionState]);

  // Enhanced join task chat
  const joinTaskChat = useCallback(async (taskId, organizationId, eventId) => {
    if (!isConnected || !taskId) {
      //console.error('[SignalRContext] Cannot join task chat: Not connected or missing taskId');
      return false;
    }

    // Leave current task chat if any
    if (currentTaskId && currentTaskId !== taskId) {
      try {
        await signalRService.leaveTaskChat(currentTaskId);
      } catch (error) {
        //console.error('[SignalRContext] Error leaving previous task chat:', error);
      }
    }

    try {
      const success = await signalRService.joinTaskChat(taskId, organizationId, eventId);
      if (success) {
        setCurrentTaskId(taskId);
        // Get online users for the task
        await signalRService.getOnlineUsers(taskId);
      }
      return success;
    } catch (error) {
      //console.error('[SignalRContext] Error joining task chat:', error);
      setConnectionError(error.message);
      return false;
    }
  }, [isConnected, currentTaskId]);

  // Enhanced send message
  const sendMessage = useCallback(async (taskId, message, documentIds = [], messageType = 1, organizationId, eventId, userId, userName) => {
    if (!isConnected) {
      //console.error('[SignalRContext] Cannot send message: Not connected to SignalR');
      return false;
    }

    if (!message || message.trim() === '') {
      //console.error('[SignalRContext] Cannot send empty message');
      return false;
    }

    try {
      const success = await signalRService.sendMessage(taskId, message.trim(), documentIds, messageType, organizationId, eventId, userId, userName);
      return success;
    } catch (error) {
      //console.error('[SignalRContext] ❌ Error sending message:', error);
      setConnectionError(error.message);
      return false;
    }
  }, [isConnected]);

  // Typing indicators
  const startTyping = useCallback((taskId) => {
    if (!isConnected) return;
    signalRService.startTyping(taskId);
  }, [isConnected]);

  const stopTyping = useCallback((taskId) => {
    if (!isConnected) return;
    signalRService.stopTyping(taskId);
  }, [isConnected]);

  // Leave task chat method
  const leaveTaskChat = useCallback(async (taskId) => {
    if (!isConnected) {
      //console.error('[SignalRContext] Cannot leave task chat: Not connected to SignalR');
      return false;
    }

    try {
      await signalRService.leaveTaskChat(taskId);
      if (currentTaskId === taskId) {
        setCurrentTaskId(null);
      }
      return true;
    } catch (error) {
      //console.error('[SignalRContext] Error leaving task chat:', error);
      return false;
    }
  }, [isConnected, currentTaskId]);

  // Enhanced register handlers
  const registerHandlers = useCallback((handlers) => {
    // Always register handlers locally; signalRService will use them when a connection exists
    // registerMessageHandlers now returns an unsubscribe function. Return it so callers can cleanup.
    return signalRService.registerMessageHandlers(handlers);
  }, []);

  // Get online users
  const getOnlineUsers = useCallback(async (taskId) => {
    if (!isConnected) {
      //console.error('Cannot get online users: Not connected to SignalR');
      return [];
    }
    try {
      await signalRService.getOnlineUsers(taskId);
      return onlineUsers;
    } catch (error) {
      //console.error('Error getting online users:', error);
      return [];
    }
  }, [isConnected, onlineUsers]);

  const value = {
    // Connection state
    isConnected,
    connectionError,
    currentTaskId,
    
    // Data
    onlineUsers,
    typingUsers,
    
    // Methods
    joinTaskChat,
    sendMessage,
    startTyping,
    stopTyping,
    leaveTaskChat, // Fixed: Now defined as a function
    registerHandlers,
    getOnlineUsers,
    
    // Utility
    reconnect: initializeConnection
  };

  return (
    <SignalRContext.Provider value={value}>
      {children}
    </SignalRContext.Provider>
  );
};