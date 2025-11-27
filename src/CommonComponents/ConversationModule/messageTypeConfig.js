// Message Type Configuration
// This file defines the visual styling for different message types in the chat system.
// When adding new message types, only this file needs to be updated.

/**
 * Message Type Constants
 * @type {Object.<string, number>}
 */
export const MESSAGE_TYPES = {
  NORMAL_CHAT: 1,
  SYSTEM_NOTIFICATION: 2,
  // Add new message types here as needed:
  // WARNING: 3,
  // ERROR: 4,
  // SUCCESS: 5,
};

/**
 * Message Type Configuration
 * Maps message type IDs to their visual styling properties
 * 
 * @typedef {Object} MessageTypeStyle
 * @property {string} label - Human-readable label for the message type
 * @property {string} className - CSS class name to apply to the message bubble
 * @property {string} backgroundColor - Background color for the message bubble
 * @property {string} textColor - Text color for the message content
 * @property {string} borderColor - Border color for the message bubble (optional)
 * @property {boolean} showIcon - Whether to show an icon for this message type
 * @property {string} icon - Icon to display (emoji or icon class)
 */
export const MESSAGE_TYPE_CONFIG = {
  [MESSAGE_TYPES.NORMAL_CHAT]: {
    label: 'Normal Chat',
    className: 'message-type-normal',
    backgroundColor: null, // Use default bubble colors from CSS
    textColor: null, // Use default text color
    borderColor: null,
    showIcon: false,
    icon: null,
  },
  [MESSAGE_TYPES.SYSTEM_NOTIFICATION]: {
    label: 'System Notification',
    className: 'message-type-system',
    backgroundColor: '#FFF4E5', // Light amber/warning background
    textColor: '#663C00', // Dark amber text
    borderColor: '#FFB020', // Amber border
    showIcon: true,
    icon: '⚠️', // Warning emoji
  },
  // Add new message type configurations here:
  // [MESSAGE_TYPES.WARNING]: {
  //   label: 'Warning',
  //   className: 'message-type-warning',
  //   backgroundColor: '#FEF3C7',
  //   textColor: '#92400E',
  //   borderColor: '#F59E0B',
  //   showIcon: true,
  //   icon: '⚠️',
  // },
  // [MESSAGE_TYPES.ERROR]: {
  //   label: 'Error',
  //   className: 'message-type-error',
  //   backgroundColor: '#FEE2E2',
  //   textColor: '#991B1B',
  //   borderColor: '#EF4444',
  //   showIcon: true,
  //   icon: '❌',
  // },
  // [MESSAGE_TYPES.SUCCESS]: {
  //   label: 'Success',
  //   className: 'message-type-success',
  //   backgroundColor: '#D1FAE5',
  //   textColor: '#065F46',
  //   borderColor: '#10B981',
  //   showIcon: true,
  //   icon: '✅',
  // },
};

/**
 * Get the style configuration for a given message type
 * @param {number} messageType - The message type ID
 * @returns {MessageTypeStyle} The style configuration for the message type
 */
export const getMessageTypeConfig = (messageType) => {
  // Default to NORMAL_CHAT if messageType is not provided or not found
  const type = messageType || MESSAGE_TYPES.NORMAL_CHAT;
  return MESSAGE_TYPE_CONFIG[type] || MESSAGE_TYPE_CONFIG[MESSAGE_TYPES.NORMAL_CHAT];
};

/**
 * Check if a message type is a system message (non-user chat)
 * @param {number} messageType - The message type ID
 * @returns {boolean} True if the message is a system message
 */
export const isSystemMessage = (messageType) => {
  return messageType === MESSAGE_TYPES.SYSTEM_NOTIFICATION;
};

export default MESSAGE_TYPE_CONFIG;
