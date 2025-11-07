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
  const { user } = useUser();

  // Initialize SignalR connection
  const initializeConnection = useCallback(async () => {
    console.log('SignalR: Starting connection...');
    
    if (!user) {
      console.log('SignalR: Waiting for user context...');
      return;
    }

    // const token = localStorage.getItem('token');
    // if (!token) {
    //   console.log('SignalR: No authentication token found');
    //   return;
    // }

    try {
      console.log('SignalR: Attempting connection with token...');
      const connected = await signalRService.startConnection();
      
      if (!connected) {
        console.log('SignalR: Connection failed, checking authentication...');
        // Check if token is still valid
        const { fetchWithRefresh } = await import('../Context/RefereshToken');
        try {
          await fetchWithRefresh('/apis/auth/validate', {
            method: 'GET',
            headers: {
            //   'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          console.log('SignalR: Token is valid but connection failed');
        } catch (authError) {
          console.log('SignalR: Authentication validation failed:', authError);
        }
      }
      
      console.log('SignalR: Connection attempt result:', connected);
      setIsConnected(connected);
    } catch (error) {
      console.error('SignalR: Connection attempt failed:', error);
      setIsConnected(false);
    }
  }, [user]);

  // Clean up connection on unmount
  useEffect(() => {
    console.log('SignalR: Provider mounted');
    
    // Return cleanup function
    return () => {
      console.log('SignalR: Provider unmounting, cleaning up connection');
      // Always try to stop the connection on unmount
      signalRService.stopConnection().catch(() => {
        // Ignore any errors during cleanup
        console.log('SignalR: Cleanup completed');
      });
      setIsConnected(false);
    };
  }, []); // Remove isConnected dependency to avoid cleanup issues

  // Connect when user is available
  useEffect(() => {
    if (user && !isConnected) {
      console.log('SignalR: User detected, initiating connection...');
      initializeConnection();
    } else if (!user && isConnected) {
      console.log('SignalR: User logged out, disconnecting...');
      signalRService.stopConnection();
      setIsConnected(false);
    }
  }, [user, isConnected, initializeConnection]);

  // Log connection status changes
  useEffect(() => {
    console.log('SignalR Connection Status:', isConnected ? 'Connected' : 'Disconnected');
  }, [isConnected]);

  // Join/Leave task chat room
  const joinTaskChat = useCallback(async (taskId) => {
    if (!isConnected || !taskId) return;

    // Leave current task chat if any
    if (currentTaskId && currentTaskId !== taskId) {
      await signalRService.leaveTaskChat(currentTaskId);
    }

    // Join new task chat
    await signalRService.joinTaskChat(taskId);
    setCurrentTaskId(taskId);
  }, [isConnected, currentTaskId]);

  // Send a message
  const sendMessage = useCallback(async (message) => {
    if (!isConnected) return;
    await signalRService.sendMessage(message);
  }, [isConnected]);

  // Register message handlers
  const registerHandlers = useCallback(({ onMessage, onUserJoined, onUserLeft }) => {
    if (!isConnected) return;

    signalRService.removeHandlers();
    
    if (onMessage) {
      signalRService.onReceiveMessage(onMessage);
    }
    if (onUserJoined) {
      signalRService.onUserJoined(onUserJoined);
    }
    if (onUserLeft) {
      signalRService.onUserLeft(onUserLeft);
    }
  }, [isConnected]);

  const value = {
    isConnected,
    joinTaskChat,
    sendMessage,
    registerHandlers,
    currentTaskId
  };

  return (
    <SignalRContext.Provider value={value}>
      {children}
    </SignalRContext.Provider>
  );
};
