# Quick Reference: Message Types in Chat

## Message Type Constants

```javascript
import { MESSAGE_TYPES } from './messageTypeConfig';

MESSAGE_TYPES.NORMAL_CHAT         // 1 - Regular user messages
MESSAGE_TYPES.SYSTEM_NOTIFICATION // 2 - System notifications (warnings)
```

## Sending Messages with Different Types

### Regular Chat Message (Default)
```javascript
// Both are equivalent - defaults to type 1
handleSendMessage("Hello team!");
handleSendMessage("Hello team!", [], 1);
```

### System Notification (Warning Style)
```javascript
// Use type 2 for system notifications
handleSendMessage("Task reverted to Active. Reason: Changes needed", [], 2);
```

### With File Attachments
```javascript
// Normal message with files
handleSendMessage("Check these files", [docId1, docId2], 1);

// System notification with files
handleSendMessage("System: Files uploaded", [docId1], 2);
```

## Visual Appearance

| Type | Background | Border | Icon | Use Case |
|------|------------|--------|------|----------|
| 1 - Normal | Default (white/green) | Default | None | User chat messages |
| 2 - System | Amber (#FFF4E5) | Amber (#FFB020) | ⚠️ | System notifications, task status changes |

## Current Usage in Application

- **Task Revert Messages**: When a task is reverted to Active status, the revert reason is sent as messageType 2
- **All Other Messages**: Regular chat uses messageType 1 (default)

## How to Add New Message Types

1. Open `src/CommonComponents/ConversationModule/messageTypeConfig.js`
2. Add constant to `MESSAGE_TYPES` object
3. Add configuration to `MESSAGE_TYPE_CONFIG` object
4. Optionally add custom CSS to `Style.css`

Example:
```javascript
// In messageTypeConfig.js
export const MESSAGE_TYPES = {
  NORMAL_CHAT: 1,
  SYSTEM_NOTIFICATION: 2,
  SUCCESS: 3, // NEW
};

export const MESSAGE_TYPE_CONFIG = {
  // ... existing configs ...
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

## API Payload

The backend receives:
```json
{
  "taskId": "...",
  "message": "...",
  "documentIds": [...],
  "messageType": 1
}
```

The backend sends back (via SignalR):
```json
{
  "conversationId": "...",
  "userId": "...",
  "userName": "...",
  "message": "...",
  "sentAt": "...",
  "messageType": 1,
  "documentIds": [...]
}
```

## Full Documentation

See `MESSAGE_TYPE_IMPLEMENTATION.md` for complete implementation details and architecture.
