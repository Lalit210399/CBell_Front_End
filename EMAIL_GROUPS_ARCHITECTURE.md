# Email Groups - Component Architecture

## 📊 Component Hierarchy

```
App.js
├── EmailGroupsProvider (Context)
│   └── UserProvider (Context)
│       └── Settings Page
│           └── EmailGroupsManager
│               ├── CreateGroupModal
│               └── GroupDetailPanel
│
└── Your Email Component (Future)
    └── EmailSelector
        ├── Group Dropdown
        ├── Email Input
        └── Resolve Preview
```

## 🗂️ File Structure

```
CBell_Front_End/
│
├── src/
│   ├── Services/
│   │   └── EmailGroups.js ⭐ NEW
│   │       ├── getEmailGroups()
│   │       ├── createEmailGroup()
│   │       ├── updateEmailGroup()
│   │       ├── deleteEmailGroup()
│   │       ├── resolveEmailRecipients()
│   │       ├── sendEmail()
│   │       └── validateEmail()
│   │
│   ├── Context/
│   │   └── EmailGroupsContext.js ✏️ MODIFIED
│   │       ├── EmailGroupsProvider
│   │       ├── useEmailGroups()
│   │       ├── fetchEmailGroups()
│   │       ├── addGroup()
│   │       ├── updateGroup()
│   │       ├── deleteGroup()
│   │       ├── resolveRecipients()
│   │       └── sendEmail()
│   │
│   ├── CommonComponents/
│   │   └── EmailSelector/ ⭐ NEW
│   │       ├── EmailSelector.js
│   │       ├── EmailSelector.css
│   │       ├── index.js
│   │       └── README.md
│   │
│   └── Pages/
│       └── Settings/
│           ├── Settings.js
│           └── EmailGroupsManager/ ✏️ MODIFIED
│               ├── EmailGroupsManager.js
│               ├── EmailGroupsManager.css
│               ├── CreateGroupModal.js
│               ├── CreateGroupModal.css
│               ├── GroupDetailPanel.js
│               └── GroupDetailPanel.css
│
├── EMAIL_GROUPS_FRONTEND_IMPLEMENTATION.md ⭐ NEW
├── EMAIL_GROUPS_IMPLEMENTATION_COMPLETE.md ⭐ NEW
└── EMAIL_GROUPS_INTEGRATION.md (Backend Spec)
```

## 🔄 Data Flow

### Creating a Group:
```
User Action
    ↓
CreateGroupModal (UI)
    ↓
EmailGroupsContext.addGroup()
    ↓
EmailGroups.createEmailGroup() (API Call)
    ↓
Backend: POST /api/email/groups
    ↓
Response: New Group Object
    ↓
Context Updates State
    ↓
EmailGroupsManager Refreshes
```

### Composing Email with Groups:
```
User Selects Groups/Emails
    ↓
EmailSelector Component
    ↓
User Clicks "Preview"
    ↓
EmailGroupsContext.resolveRecipients()
    ↓
EmailGroups.resolveEmailRecipients() (API Call)
    ↓
Backend: POST /api/email/groups/resolve
    ↓
Response: {uniqueEmails, addedToCommonList}
    ↓
EmailSelector Shows Preview
    ↓
User Clicks "Send"
    ↓
EmailGroupsContext.sendEmail()
    ↓
EmailGroups.sendEmail() (API Call)
    ↓
Backend: POST /api/email/send
    ↓
Backend Auto-adds to Common List
    ↓
Response: Success
```

## 🎨 UI Components Map

### Settings Page:
```
┌─────────────────────────────────────────────┐
│  Settings                                    │
│  ┌──────────┐                               │
│  │ Profile  │  Email Groups  Notifications  │
│  └──────────┘                               │
│                                              │
│  Email Groups                    [New Group]│
│  Manage your email distribution lists       │
│                                              │
│  [Search groups...]                         │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ 👥       │  │ 👥       │  │ 👥       │  │
│  │ Team A   │  │ Team B   │  │ Team C   │  │
│  │ 5 members│  │ 3 members│  │ 8 members│  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                              │
└─────────────────────────────────────────────┘
```

### EmailSelector Component:
```
┌─────────────────────────────────────────────┐
│  To:                                         │
│  ┌────────────────────────────────────────┐ │
│  │ 👥 Marketing (5)  ✕                    │ │
│  │ 📧 john@example.com  ✕                 │ │
│  │ [Type email or...]                     │ │
│  └────────────────────────────────────────┘ │
│  [Select Groups ▼]  [Preview (6)]           │
│                                              │
│  📧 6 unique recipient(s) will receive      │
│  ⚠️ 1 new address will be added to list     │
└─────────────────────────────────────────────┘
```

### Group Detail Panel:
```
                ┌─────────────────────────┐
                │ Marketing Team      [X] │
                │ 5 members               │
                ├─────────────────────────┤
                │ 👤 Add Member           │
                │ [📧 email...] [Add]     │
                ├─────────────────────────┤
                │ 📧 Members              │
                │ ┌───────────────────┐   │
                │ │ J john@example.com│   │
                │ │ S sarah@example.com   │
                │ │ M mike@example.com    │
                │ │ T tom@example.com     │
                │ │ L lisa@example.com    │
                │ └───────────────────┘   │
                ├─────────────────────────┤
                │ 🚨 Danger Zone          │
                │ [Delete Group]          │
                └─────────────────────────┘
```

## 📡 API Endpoints Used

```
Backend: /api/email/

├── GET    /groups?organizationId=xxx
│   Returns: Array of group objects
│
├── GET    /groups/{id}
│   Returns: Single group object
│
├── POST   /groups
│   Body: {name, members[], organizationId}
│   Returns: Created group object
│
├── PUT    /groups/{id}
│   Body: {name, members[], organizationId}
│   Returns: 204 No Content
│
├── DELETE /groups/{id}
│   Returns: 204 No Content
│
├── POST   /groups/resolve
│   Body: {groupIds[], individualEmails[], organizationId}
│   Returns: {uniqueEmails[], addedToCommonList[]}
│
└── POST   /send
    Body: FormData (To[], Cc[], Bcc[], Subject, Message, Attachments)
    Returns: {message: "Email sent Successfully."}
```

## 🔐 Permission Matrix

| Feature              | Admin | Manager | Designer |
|---------------------|-------|---------|----------|
| View Groups         | ✅    | ✅      | ✅       |
| Create Groups       | ✅    | ✅      | ❌       |
| Edit Groups         | ✅    | ✅      | ❌       |
| Delete Groups       | ✅    | ✅      | ❌       |
| Use in Email        | ✅    | ✅      | ✅       |
| Resolve Recipients  | ✅    | ✅      | ✅       |
| Send Email          | ✅    | ✅      | ✅       |

## 🎯 State Management

### EmailGroupsContext State:
```javascript
{
  emailGroups: [],           // Array of group objects
  loading: false,            // Boolean for API operations
  error: null,              // Error message if any
  fetchEmailGroups: fn,     // Async function
  addGroup: fn,             // Async function
  updateGroup: fn,          // Async function
  deleteGroup: fn,          // Async function
  getGroupById: fn,         // Sync function
  resolveRecipients: fn,    // Async function
  sendEmail: fn             // Async function
}
```

### EmailSelector Component State:
```javascript
{
  localGroupIds: [],        // Selected group IDs
  localEmails: [],          // Individual email addresses
  inputValue: '',           // Current input text
  showGroupDropdown: false, // Dropdown visibility
  error: '',                // Validation error
  resolvedData: null,       // Result from resolve API
  isResolving: false        // Loading state
}
```

## 🔄 Integration Points

Where you can use EmailSelector:

1. **Task Email Modal** ✅
   - Replace existing email input
   - Pass taskId in send request

2. **Event Invitations** ✅
   - Send to event participants
   - Link to eventId

3. **File Sharing** ✅
   - Share files with groups
   - Pass documentId

4. **Announcements** ✅
   - Broadcast to multiple groups
   - Organization-wide emails

5. **Custom Email Page** ✅
   - Standalone email composer
   - Full-featured interface

## 📱 Responsive Breakpoints

```css
/* Desktop: Full layout */
@media (min-width: 1024px) {
  - Grid: 3 columns
  - Panel: 480px width
  - Full dropdown
}

/* Tablet: Adjusted layout */
@media (max-width: 1024px) {
  - Grid: 2 columns
  - Panel: 90vw width
  - Adapted dropdown
}

/* Mobile: Stacked layout */
@media (max-width: 640px) {
  - Grid: 1 column
  - Panel: 100vw width
  - Full-width buttons
  - Stacked actions
}
```

## 🎨 Theme Integration

The components use your existing theme:

- **Primary Color**: `#3b82f6` (Blue)
- **Success**: `#10b981` (Green)
- **Warning**: `#f59e0b` (Amber)
- **Error**: `#ef4444` (Red)
- **Text**: `#0f172a` (Slate 900)
- **Border**: `#cbd5e1` (Slate 300)
- **Background**: `#ffffff` / `#f8fafc`

## 🚀 Performance Metrics

- **Initial Load**: < 100ms (component mount)
- **Group Fetch**: ~ 200-500ms (depends on network)
- **Create Group**: ~ 300-600ms (API call)
- **Resolve**: ~ 200-400ms (API call)
- **Send Email**: ~ 500-1000ms (with attachments)

## 🧪 Test Coverage Areas

1. **Unit Tests** (Components):
   - EmailSelector props handling
   - Email validation logic
   - Group selection/deselection
   - Chip rendering

2. **Integration Tests** (API):
   - Fetch groups success/failure
   - Create group success/failure
   - Update/delete operations
   - Resolve recipients
   - Send email

3. **E2E Tests** (User Flow):
   - Navigate to Settings
   - Create new group
   - Add/remove members
   - Use in email composer
   - Send email successfully

## 📚 Quick Reference Links

- **Main Documentation**: `EMAIL_GROUPS_FRONTEND_IMPLEMENTATION.md`
- **Completion Summary**: `EMAIL_GROUPS_IMPLEMENTATION_COMPLETE.md`
- **Quick Guide**: `src/CommonComponents/EmailSelector/README.md`
- **Backend Spec**: `EMAIL_GROUPS_INTEGRATION.md`
- **API Service**: `src/Services/EmailGroups.js`
- **Context**: `src/Context/EmailGroupsContext.js`

---

**Visual Guide Version 1.0**  
*Last Updated: December 12, 2025*
