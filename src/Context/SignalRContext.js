import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const [isConnected, setIsConnected] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [connectionError, setConnectionError] = useState(null);
  const { user } = useUser();

  // Initialize SignalR connection
  const initializeConnection = useCallback(async () => {
    console.log('SignalR: Starting connection...');
    
    if (!user) {
      console.log('SignalR: Waiting for user context...');
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
      }
      
      console.log('SignalR: Connection attempt result:', connected);
      setIsConnected(connected);
      setConnectionError(connected ? null : 'Connection failed');
    } catch (error) {
      console.error('SignalR: Connection attempt failed:', error);
      setIsConnected(false);
      setConnectionError(error.message);
    }
  }, [user]);

  // Clean up connection on unmount
  useEffect(() => {
    console.log('SignalR: Provider mounted');
    
    return () => {
      console.log('SignalR: Provider unmounting, cleaning up connection');
      signalRService.stopConnection().catch(() => {
        console.log('SignalR: Cleanup completed');
      });
      setIsConnected(false);
    };
  }, []);

  // Connect when user is available
  useEffect(() => {
    if (user && !isConnected) {
      console.log('SignalR: User detected, initiating connection...');
      initializeConnection();
    } else if (!user && isConnected) {
      console.log('SignalR: User logged out, disconnecting...');
      signalRService.stopConnection();
      setIsConnected(false);
      setOnlineUsers([]);
      setTypingUsers({});
    }
  }, [user, isConnected, initializeConnection]);

  // Enhanced join task chat
  const joinTaskChat = useCallback(async (taskId, organizationId, eventId) => {
    if (!isConnected || !taskId) {
      console.error('Cannot join task chat: Not connected or missing taskId');
      return false;
    }

    // Leave current task chat if any
    if (currentTaskId && currentTaskId !== taskId) {
      try {
        await signalRService.leaveTaskChat(currentTaskId);
      } catch (error) {
        console.error('Error leaving previous task chat:', error);
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
      console.error('Error joining task chat:', error);
      setConnectionError(error.message);
      return false;
    }
  }, [isConnected, currentTaskId]);

  // Enhanced send message
  const sendMessage = useCallback(async (taskId, message, documentIds = []) => {
    if (!isConnected) {
      console.error('Cannot send message: Not connected to SignalR');
      return false;
    }

    if (!message || message.trim() === '') {
      console.error('Cannot send empty message');
      return false;
    }

    try {
      const success = await signalRService.sendMessage(taskId, message.trim(), documentIds);
      return success;
    } catch (error) {
      console.error('Error sending message:', error);
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
      console.error('Cannot leave task chat: Not connected to SignalR');
      return false;
    }

    try {
      await signalRService.leaveTaskChat(taskId);
      if (currentTaskId === taskId) {
        setCurrentTaskId(null);
      }
      return true;
    } catch (error) {
      console.error('Error leaving task chat:', error);
      return false;
    }
  }, [isConnected, currentTaskId]);

  // Enhanced register handlers
  const registerHandlers = useCallback((handlers) => {
    if (!isConnected) {
      console.warn('Cannot register handlers: No SignalR connection');
      return;
    }
    signalRService.registerMessageHandlers(handlers);
  }, [isConnected]);

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