# Message Type Implementation Guide

## Overview
This document describes the implementation of message type support in the chat module. The system now supports different message types with distinct visual styling, making it easy to differentiate between normal chat messages and system notifications.

## Architecture

### 1. Configuration File (`messageTypeConfig.js`)
Located in: `src/CommonComponents/ConversationModule/messageTypeConfig.js`

This is the **single source of truth** for all message type configurations. When new message types are needed, only this file needs to be updated.

#### Message Types
- `MESSAGE_TYPES.NORMAL_CHAT` (1) - Regular user chat messages
- `MESSAGE_TYPES.SYSTEM_NOTIFICATION` (2) - System notifications (e.g., task status changes, revert reasons)

#### Configuration Structure
Each message type includes:
- `label` - Human-readable name
- `className` - CSS class to apply
- `backgroundColor` - Custom background color
- `textColor` - Custom text color
- `borderColor` - Custom border color
- `showIcon` - Whether to display an icon
- `icon` - Icon/emoji to display

### 2. Component Updates

#### MessageItem.js
- Imports `getMessageTypeConfig()` and `isSystemMessage()` from config
- Reads `message.messageType` from the message object
- Applies corresponding CSS class and inline styles
- Displays icon if configured for that message type
- Adds `system-message` class for system messages

#### ConversationModule.js
- Updated `handleSendMessage()` to accept optional `messageType` parameter (defaults to 1)
- Transforms API messages to include `messageType` field
- Handles both optimistic UI updates and server messages with messageType

### 3. SignalR Integration

#### signalR-service.js
- Updated `sendMessage()` method to accept `messageType` parameter
- Sends messageType to server via SignalR hub

#### SignalRContext.js
- Updated context's `sendMessage()` to accept and pass through `messageType`

### 4. CSS Styling

#### Style.css
Added message type specific styles:
- `.message-type-normal` - Inherits default bubble styles
- `.message-type-system` - Amber/warning background with distinctive border
- `.message-type-icon` - Styles for message type icons
- `.system-message` - Layout adjustments for system messages

## Usage Examples

### Sending a Normal Chat Message
```javascript
// Default behavior - messageType defaults to 1 (normal chat)
await handleSendMessage("Hello, team!", []);
```

### Sending a System Notification
```javascript
// Explicitly set messageType to 2 for system notifications
await handleSendMessage("Task reverted to Active. Reason: Changes needed", [], 2);
```

### Sending with File Attachments
```javascript
// Include document IDs and message type
await handleSendMessage("Please review attached files", [docId1, docId2], 1);
```

## API Payload Structure

When sending a message, the payload includes:
```json
{
  "taskId": "123",
  "userId": "user123",
  "userName": "John Doe",
  "conversationText": "Message text",
  "messageType": 1,
  "documentId": [],
  "organizationId": "org123",
  "eventId": "event123"
}
```

## Adding New Message Types

To add a new message type (e.g., WARNING, ERROR, SUCCESS):

### Step 1: Update `messageTypeConfig.js`
```javascript
export const MESSAGE_TYPES = {
  NORMAL_CHAT: 1,
  SYSTEM_NOTIFICATION: 2,
  WARNING: 3,  // Add new type
  ERROR: 4,    // Add new type
  SUCCESS: 5,  // Add new type
};

export const MESSAGE_TYPE_CONFIG = {
  // ... existing configs ...
  [MESSAGE_TYPES.WARNING]: {
    label: 'Warning',
    className: 'message-type-warning',
    backgroundColor: '#FEF3C7',
    textColor: '#92400E',
    borderColor: '#F59E0B',
    showIcon: true,
    icon: '⚠️',
  },
  [MESSAGE_TYPES.ERROR]: {
    label: 'Error',
    className: 'message-type-error',
    backgroundColor: '#FEE2E2',
    textColor: '#991B1B',
    borderColor: '#EF4444',
    showIcon: true,
    icon: '❌',
  },
  [MESSAGE_TYPES.SUCCESS]: {
    label: 'Success',
    className: 'message-type-success',
    backgroundColor: '#D1FAE5',
    textColor: '#065F46',
    borderColor: '#10B981',
    showIcon: true,
    icon: '✅',
  },
};
```

### Step 2: Add CSS Styles (Optional)
If you need additional custom styling beyond the config:

```css
/* In Style.css */
.message-type-warning {
  border: 2px solid #F59E0B !important;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
}

.message-type-error {
  border: 2px solid #EF4444 !important;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.15);
}

.message-type-success {
  border: 2px solid #10B981 !important;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
}
```

### Step 3: Use the New Type
```javascript
import { MESSAGE_TYPES } from './messageTypeConfig';

// Send an error notification
await handleSendMessage("Failed to upload file", [], MESSAGE_TYPES.ERROR);

// Send a success notification
await handleSendMessage("Task completed successfully!", [], MESSAGE_TYPES.SUCCESS);
```

## Visual Examples

### Normal Chat Message (Type 1)
- Uses default bubble styling (white or green background)
- No icon
- Standard text color

### System Notification (Type 2)
- Amber/warning background (#FFF4E5)
- Amber border (#FFB020)
- Warning emoji icon (⚠️)
- Dark amber text (#663C00)
- Centered layout with full width

## Current Implementation Status

### ✅ Completed
- [x] Created `messageTypeConfig.js` configuration file
- [x] Updated `MessageItem.js` to apply messageType styles
- [x] Added CSS classes for message types
- [x] Updated `ConversationModule.js` to handle messageType
- [x] Updated SignalR service to support messageType parameter
- [x] Updated `TaskDetailPage.js` to send messageType 2 when reverting tasks

### 🔄 Integration Points
- Task revert messages automatically use messageType 2 (system notification)
- All existing chat messages default to messageType 1 (normal chat)
- API responses are transformed to include messageType field

## Benefits

1. **Future-Proof**: Adding new message types only requires updating the config file
2. **Consistent UI**: All message type styling is centralized
3. **Type Safety**: Clear constants prevent magic numbers
4. **Easy Maintenance**: Visual changes can be made without touching component logic
5. **Backward Compatible**: Defaults to normal chat if messageType is not provided

## Files Modified

1. `src/CommonComponents/ConversationModule/messageTypeConfig.js` (NEW)
2. `src/CommonComponents/ConversationModule/MessageItem.js`
3. `src/CommonComponents/ConversationModule/ConversationModule.js`
4. `src/CommonComponents/ConversationModule/Style.css`
5. `src/Services/signalR-service.js`
6. `src/Context/SignalRContext.js`
7. `src/Pages/Task/TaskDetailPage.js`

## Testing Recommendations

1. **Test Normal Messages**: Send regular chat messages and verify they appear with default styling
2. **Test System Notifications**: Revert a task and verify the revert reason appears with warning styling
3. **Test with Attachments**: Send messages with files using both message types
4. **Test Message History**: Reload the page and verify messageType is preserved from API
5. **Test New Types**: Add a new message type following the guide and verify styling works

## Troubleshooting

### Messages Not Showing Correct Style
- Verify `messageType` is being passed correctly through the call chain
- Check browser console for any errors
- Ensure CSS classes are properly defined in Style.css

### Icons Not Appearing
- Check `showIcon` is set to `true` in config
- Verify `icon` property has a valid value
- Check CSS for `.message-type-icon` class

### Default Style Applied Instead of Custom
- Ensure messageType value matches a key in `MESSAGE_TYPE_CONFIG`
- Check that inline styles are not being overridden by more specific CSS rules
- Verify the config is being imported correctly in MessageItem.js
