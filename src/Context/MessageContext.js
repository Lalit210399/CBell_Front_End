import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import MessageStrip from '../CommonComponents/MessageStrip/MessageStrip';
import { registerMessageHandler } from '../Utils/MessageDispatcher';

const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [suppressErrors, setSuppressErrors] = useState(false);

  const addMessage = useCallback((message) => {
    const id = Date.now() + Math.random();
    const newMessage = {
      id,
      text: message.text,
      type: message.type || 'Information', // Use the existing MessageStrip type format
      duration: message.duration || 5000,
      onClose: message.onClose
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Auto-remove after duration
    if (newMessage.duration > 0) {
      setTimeout(() => {
        removeMessage(id);
      }, newMessage.duration);
    }
    
    return id;
  }, []);

  const removeMessage = useCallback((id) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  const clearAllMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const showError = useCallback((text, options = {}) => {
    // When auth expired is in progress, suppress non-critical error messages
    if (suppressErrors && !options.force) {
      return null;
    }

    return addMessage({
      text,
      type: 'Error', // Use proper case for existing MessageStrip
      duration: options.duration || 0, // Error messages don't auto-dismiss by default
      ...options
    });
  }, [addMessage]);

  const showWarning = useCallback((text, options = {}) => {
    return addMessage({
      text,
      type: 'Warning', // Use proper case for existing MessageStrip
      duration: options.duration || 5000,
      ...options
    });
  }, [addMessage]);

  const showSuccess = useCallback((text, options = {}) => {
    return addMessage({
      text,
      type: 'Success', // Use proper case for existing MessageStrip
      duration: options.duration || 3000,
      ...options
    });
  }, [addMessage]);

  const showInfo = useCallback((text, options = {}) => {
    return addMessage({
      text,
      type: 'Information', // Use proper case for existing MessageStrip
      duration: options.duration || 4000,
      ...options
    });
  }, [addMessage]);

  // Register this provider with the global message dispatcher
  useEffect(() => {
    const unregister = registerMessageHandler({
      showError,
      showWarning,
      showSuccess,
      showInfo
    });
    
    return unregister;
  }, [showError, showWarning, showSuccess, showInfo]);

  // Listen for global auth-expired events and suppress duplicate error messages
  useEffect(() => {
    const handleAuthExpired = (event) => {
      // Clear all existing messages (avoid stale error strips)
      clearAllMessages();

      // Briefly suppress new error messages that result from multiple failing API calls
      setSuppressErrors(true);

      // Show a single warning to inform the user (duration can be customized)
      addMessage({ text: 'Your session has expired. Please log in again to continue.', type: 'Warning', duration: 5000 });

      // Re-enable error messages after a short delay
      setTimeout(() => {
        setSuppressErrors(false);
      }, 3000);
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, [clearAllMessages, addMessage]);

  return (
    <MessageContext.Provider value={{
      addMessage,
      removeMessage,
      clearAllMessages,
      showError,
      showWarning,
      showSuccess,
      showInfo
    }}>
      {children}
      
      {/* Render all messages using existing MessageStrip component */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        maxWidth: '400px'
      }}>
        {messages.map((message) => (
          <div key={message.id} style={{ marginBottom: '10px' }}>
            <MessageStrip
              text={message.text}
              type={message.type}
              duration={message.duration}
              onClose={() => removeMessage(message.id)}
            />
          </div>
        ))}
      </div>
    </MessageContext.Provider>
  );
};

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};

// Backward compatibility - export useMessages as well
export const useMessages = useMessage;