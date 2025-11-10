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
        console.debug('[SignalRContext] Forced sync: isConnected =', isNowConnected, 'actual state:', state);
      }
    }
  }, []);

  // Initialize SignalR connection
  const initializeConnection = useCallback(async () => {
    console.info('[SignalRContext] Starting connection...');
    if (!user) {
      console.debug('[SignalRContext] Waiting for user context...');
      return;
    }
    try {
      const connected = await signalRService.startConnection();
      if (connected) {
        // Register default message handlers
        signalRService.registerMessageHandlers({
          onOnlineUsers: (data) => {
            if (data && data.Users) {
              setOnlineUsers(data.Users);
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
            setIsConnected(true);
            setConnectionError(null);
          });
          signalRService.connection.onclose((error) => {
            setIsConnected(false);
            setConnectionError(error ? (error.message || 'Connection closed') : 'Connection closed');
          });
          signalRService.connection.onreconnecting(() => {
            setIsConnected(false);
            setConnectionError('Reconnecting...');
          });
        }
      }
      console.info('[SignalRContext] Connection attempt result:', connected);
      setIsConnected(connected);
      setConnectionError(connected ? null : 'Connection failed');
    } catch (error) {
      console.error('[SignalRContext] Connection attempt failed:', error);
      setIsConnected(false);
      setConnectionError(error.message);
    }
  }, [user]);

  // Clean up connection on unmount
  useEffect(() => {
    console.info('[SignalRContext] Provider mounted');

    return () => {
      console.info('[SignalRContext] Provider unmounting, cleaning up connection');
      signalRService.stopConnection().catch(() => {
        console.info('[SignalRContext] Cleanup completed');
      });
      setIsConnected(false);
    };
  }, []);

  // Connect when user is available
  useEffect(() => {
    if (user && !isConnected) {
      console.info('[SignalRContext] User detected, initiating connection...');
      initializeConnection();
    } else if (!user && isConnected) {
      console.info('[SignalRContext] User logged out, disconnecting...');
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
      console.error('[SignalRContext] Cannot join task chat: Not connected or missing taskId');
      return false;
    }

    // Leave current task chat if any
    if (currentTaskId && currentTaskId !== taskId) {
      try {
        await signalRService.leaveTaskChat(currentTaskId);
      } catch (error) {
        console.error('[SignalRContext] Error leaving previous task chat:', error);
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
      console.error('[SignalRContext] Error joining task chat:', error);
      setConnectionError(error.message);
      return false;
    }
  }, [isConnected, currentTaskId]);

  // Enhanced send message
  const sendMessage = useCallback(async (taskId, message, documentIds = []) => {
    if (!isConnected) {
      console.error('[SignalRContext] Cannot send message: Not connected to SignalR');
      return false;
    }

    if (!message || message.trim() === '') {
      console.error('[SignalRContext] Cannot send empty message');
      return false;
    }

    try {
      const success = await signalRService.sendMessage(taskId, message.trim(), documentIds);
      return success;
    } catch (error) {
      console.error('[SignalRContext] Error sending message:', error);
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
      console.error('[SignalRContext] Cannot leave task chat: Not connected to SignalR');
      return false;
    }

    try {
      await signalRService.leaveTaskChat(taskId);
      if (currentTaskId === taskId) {
        setCurrentTaskId(null);
      }
      return true;
    } catch (error) {
      console.error('[SignalRContext] Error leaving task chat:', error);
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
      console.error('Cannot get online users: Not connected to SignalR');
      return [];
    }
    try {
      await signalRService.getOnlineUsers(taskId);
      return onlineUsers;
    } catch (error) {
      console.error('Error getting online users:', error);
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