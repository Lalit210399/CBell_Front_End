# Email Groups Integration

## Overview
Email groups from Settings are now integrated with the email publishing feature. Users can select pre-defined email groups when composing emails to quickly populate To, Cc, or Bcc fields.

## Features

### 1. **Email Groups Context**
- Location: `src/Context/EmailGroupsContext.js`
- Provides global state management for email groups
- Automatically syncs with localStorage for persistence
- Available throughout the application

### 2. **Group Selector Modal**
- Location: `src/CommonComponents/EmailSendModal/GroupSelector.js`
- Accessible via Users icon in EmailForm
- Features:
  - Checkbox selection of multiple groups
  - Real-time member count preview
  - Add selected groups to To, Cc, or Bcc fields
  - Automatic duplicate removal
  - Empty state guidance

### 3. **EmailForm Integration**
- Added Users icon button next to Cc/Bcc buttons
- Opens GroupSelector modal on click
- Auto-shows Cc/Bcc fields when groups are added
- Merges group members with existing emails
- Maintains comma-separated email format

## Usage

### Creating Email Groups
1. Navigate to **Settings** → **Email Groups**
2. Click **"Create New Group"**
3. Enter group name and add member emails
4. Click **"Create Group"**

### Using Groups in Email Publishing
1. Open any document and click **Publish** → **Email**
2. In the email form, click the **Users icon** (👥) next to Cc/Bcc
3. Select one or more email groups
4. Choose target field: **Add to To**, **Add to Cc**, or **Add to Bcc**
5. Group members are automatically populated

### Managing Email Groups
- **Edit**: Click on a group card → Add/remove members
- **Delete**: Open group detail panel → Click "Delete Group"
- **Search**: Use search bar to filter groups by name

## Technical Details

### Data Flow
```
EmailGroupsContext (localStorage)
    ↓
EmailGroupsManager (Settings)
    ↓
GroupSelector (EmailForm)
    ↓
Email Fields (To/Cc/Bcc)
```

### Storage Strategy
- **Current**: Context API + localStorage
- **Persistent**: Data survives page refreshes
- **Scope**: Per-user, per-browser
- **Future**: Backend API integration planned

### Email Deduplication
When adding groups to email fields:
```javascript
const emailsToAdd = currentValue 
  ? [...currentValue.split(','), ...emails] 
  : emails;
const uniqueEmails = [...new Set(emailsToAdd.map(e => e.trim()))].join(', ');
```

## Files Modified

### New Files
- `src/Context/EmailGroupsContext.js` - Context provider
- `src/CommonComponents/EmailSendModal/GroupSelector.js` - Modal component
- `src/CommonComponents/EmailSendModal/GroupSelector.css` - Modal styles
- `EMAIL_GROUPS_INTEGRATION.md` - This documentation

### Modified Files
- `src/App.js` - Added EmailGroupsProvider wrapper
- `src/Pages/Settings/EmailGroupsManager/EmailGroupsManager.js` - Use context instead of local state
- `src/CommonComponents/EmailSendModal/EmailForm.js` - Added group selector button and integration
- `src/CommonComponents/EmailSendModal/EmailForm.css` - Added group button styles

## API Surface

### EmailGroupsContext Hook
```javascript
const {
  emailGroups,        // Array of all email groups
  setEmailGroups,     // Replace all groups
  addGroup,           // Add new group
  updateGroup,        // Update existing group
  deleteGroup,        // Remove group
  getGroupById,       // Find group by ID
} = useEmailGroups();
```

### Group Object Structure
```javascript
{
  id: 1234567890,                    // Unix timestamp
  name: "Marketing Team",            // Group name
  members: ["user@example.com"],     // Array of email addresses
  createdAt: "2025-11-25T12:00:00Z"  // ISO timestamp
}
```

## Future Enhancements

### Planned Features
1. **Backend API Integration**
   - Sync groups across devices
   - Share groups between team members
   - Role-based group management

2. **Advanced Features**
   - Group templates
   - Import/export groups
   - Nested groups (groups within groups)
   - Group permissions

3. **UI Improvements**
   - Drag-and-drop email addition
   - Bulk import from CSV
   - Group preview before adding

## Migration Path

### From localStorage to Backend
When backend API is ready:

1. Update `EmailGroupsContext.js`:
```javascript
// Replace localStorage with API calls
useEffect(() => {
  fetchGroupsFromAPI().then(setEmailGroups);
}, []);

const addGroup = async (group) => {
  const newGroup = await createGroupAPI(group);
  setEmailGroups([...emailGroups, newGroup]);
};
```

2. No changes required in:
   - EmailGroupsManager
   - GroupSelector
   - EmailForm

The context abstraction allows seamless backend integration without touching UI components.

## Browser Compatibility
- Modern browsers with localStorage support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance
- Groups stored in memory (React state)
- localStorage synced on updates
- No performance impact on email form rendering
- Efficient deduplication algorithm

## Troubleshooting

### Groups Not Appearing
- Check browser localStorage: `localStorage.getItem('emailGroups')`
- Verify EmailGroupsProvider wraps the app
- Check browser console for errors

### Emails Not Populating
- Ensure group members are valid email addresses
- Check comma-separated format in input fields
- Verify handleSelectGroups function execution

### localStorage Full
- Each browser limits localStorage to ~5-10MB
- Email groups use minimal space (~1KB per 100 members)
- Clear old data if needed: `localStorage.clear()`

## Security Considerations
- Email addresses stored in browser localStorage
- No server-side validation yet
- Consider encryption for sensitive groups
- Implement backend auth when migrating to API

---

**Last Updated**: November 25, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
