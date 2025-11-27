// Global message dispatcher that works with the existing MessageContext
let messageHandlers = [];

// Register a message handler (called by MessageContext)
export const registerMessageHandler = (handler) => {
  messageHandlers.push(handler);
  return () => {
    messageHandlers = messageHandlers.filter(h => h !== handler);
  };
};

// Show a message globally (can be called from anywhere)
export const showGlobalMessage = (text, type = 'Information', duration = 5000) => {
  if (messageHandlers.length > 0) {
    // Use the registered handler from MessageContext
    const handler = messageHandlers[0];
    switch (type.toLowerCase()) {
      case 'error':
        handler.showError(text, { duration });
        break;
      case 'warning':
        handler.showWarning(text, { duration });
        break;
      case 'success':
        handler.showSuccess(text, { duration });
        break;
      case 'info':
      case 'information':
      default:
        handler.showInfo(text, { duration });
        break;
    }
  } else {
    // Fallback: show a simple alert if no handler is registered
    console.warn('No message handler registered. Message:', text);
  }
};
