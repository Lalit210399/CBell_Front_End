# Email Groups - Testing Checklist

Use this checklist to verify that all features are working correctly.

## 🔧 Setup Verification

- [ ] Backend API is running and accessible
- [ ] Frontend is connected to backend
- [ ] User authentication is working
- [ ] Organization context is set correctly
- [ ] EmailGroupsProvider is wrapped around app
- [ ] No console errors on page load

---

## 📋 Settings Page Tests

### Navigation
- [ ] Can navigate to Settings page
- [ ] Can switch to "Email Groups" tab
- [ ] Page loads without errors
- [ ] No TypeScript/JavaScript errors in console

### View Groups
- [ ] Groups display in grid layout
- [ ] Each group card shows:
  - [ ] Group name
  - [ ] Member count
  - [ ] Users icon
  - [ ] Arrow indicator
- [ ] Empty state shows when no groups exist
- [ ] Loading spinner shows during fetch

### Search Functionality
- [ ] Search input is visible
- [ ] Typing filters groups in real-time
- [ ] Clear button (X) appears when typing
- [ ] Clear button removes search text
- [ ] "No groups found" shows for no matches
- [ ] Search is case-insensitive

### Create Group (Admin/Manager Only)
- [ ] "New Group" button is visible
- [ ] Clicking opens create modal
- [ ] Modal has:
  - [ ] Group name input
  - [ ] Email input field
  - [ ] Add button
  - [ ] Member list (empty initially)
- [ ] Can type group name
- [ ] Can enter email addresses
- [ ] Invalid email shows error
- [ ] Duplicate email shows error
- [ ] Pressing Enter adds email
- [ ] Added emails show as chips
- [ ] Can remove email chips
- [ ] "Create Group" button is disabled when:
  - [ ] No group name
  - [ ] No members
- [ ] Clicking "Create Group" with valid data:
  - [ ] Shows "Creating..." text
  - [ ] Creates group successfully
  - [ ] Closes modal
  - [ ] New group appears in grid
- [ ] Clicking Cancel closes modal without saving
- [ ] Clicking overlay closes modal
- [ ] Clicking X closes modal

### Group Detail Panel
- [ ] Clicking group card opens detail panel
- [ ] Panel slides in from right
- [ ] Panel shows:
  - [ ] Group name
  - [ ] Member count
  - [ ] Add Member section
  - [ ] Members list
  - [ ] Danger Zone
  - [ ] Close button (X)

#### Add Member (Admin/Manager Only)
- [ ] Email input is visible
- [ ] Can type email address
- [ ] Invalid email shows error
- [ ] Duplicate email shows error
- [ ] Pressing Enter adds member
- [ ] Clicking "Add" button adds member
- [ ] New member appears in list immediately
- [ ] Loading state during add operation

#### Members List
- [ ] All members are displayed
- [ ] Each member shows:
  - [ ] Avatar with first letter
  - [ ] Email address
  - [ ] Remove button (Admin/Manager only)
- [ ] Members are scrollable if many

#### Remove Member (Admin/Manager Only)
- [ ] Can click remove button
- [ ] Member is removed immediately
- [ ] Cannot remove last member (shows error)
- [ ] Loading state during removal

#### Delete Group (Admin/Manager Only)
- [ ] "Delete Group" button in Danger Zone
- [ ] Clicking shows confirmation
- [ ] Confirmation shows warning text
- [ ] Can click "Cancel" to abort
- [ ] Can click "Yes, Delete" to confirm
- [ ] Delete shows "Deleting..." text
- [ ] Group is removed from list
- [ ] Panel closes after deletion

### Permissions (Designer Role)
- [ ] "New Group" button is hidden
- [ ] Info banner shows: "You can view but not edit"
- [ ] Groups are viewable
- [ ] Detail panel shows but without:
  - [ ] Add Member section
  - [ ] Remove member buttons
  - [ ] Danger Zone / Delete button
- [ ] Permission info banner shows in panel

### Error Handling
- [ ] API errors show error banner
- [ ] Error banner has:
  - [ ] Alert icon
  - [ ] Error message
  - [ ] Close button (X)
- [ ] Can dismiss error banner
- [ ] Network errors are handled gracefully
- [ ] 403 Forbidden shows appropriate message

### Loading States
- [ ] Spinner shows when fetching groups
- [ ] Buttons show "Loading..." text
- [ ] Inputs are disabled during operations
- [ ] No double-submissions possible

---

## 📧 EmailSelector Component Tests

### Setup Test Page
Create a test component to verify EmailSelector:

```jsx
// TestEmailSelector.js
import EmailSelector from './CommonComponents/EmailSelector';
import { useState } from 'react';

function TestEmailSelector() {
  const [recipients, setRecipients] = useState({});
  
  return (
    <div style={{padding: '20px'}}>
      <h2>Test EmailSelector</h2>
      <EmailSelector onRecipientsChange={setRecipients} />
      <pre>{JSON.stringify(recipients, null, 2)}</pre>
    </div>
  );
}
```

### Component Rendering
- [ ] Component renders without errors
- [ ] Input container is visible
- [ ] Input has placeholder text
- [ ] "Select Groups" button is visible
- [ ] No console errors

### Group Selection
- [ ] Clicking "Select Groups" opens dropdown
- [ ] Dropdown shows all available groups
- [ ] Each group shows:
  - [ ] Checkbox
  - [ ] Group name
  - [ ] Member count
- [ ] Can check/uncheck groups
- [ ] Selected groups show as blue chips
- [ ] Chips show:
  - [ ] Users icon
  - [ ] Group name
  - [ ] Member count in parentheses
  - [ ] Remove button (X)
- [ ] Clicking outside closes dropdown
- [ ] Clicking group button toggles dropdown

### Email Input
- [ ] Can type in input field
- [ ] Pressing Enter adds email
- [ ] Valid email is added as purple chip
- [ ] Invalid email shows error message
- [ ] Error message is red with alert icon
- [ ] Duplicate email shows error
- [ ] Email is normalized (trimmed, lowercase)
- [ ] Added email shows as purple chip
- [ ] Chip shows:
  - [ ] Mail icon
  - [ ] Email address
  - [ ] Remove button (X)

### Remove Recipients
- [ ] Can click X on group chip
- [ ] Group is removed from selection
- [ ] Can click X on email chip
- [ ] Email is removed from list
- [ ] Pressing Backspace (empty input) removes last chip
- [ ] Chips animate out smoothly

### Preview/Resolve
- [ ] "Preview" button shows when recipients added
- [ ] Button shows count in parentheses
- [ ] Clicking "Preview" button:
  - [ ] Shows "Resolving..." text
  - [ ] Disables button temporarily
  - [ ] Makes API call
  - [ ] Shows resolved info box
- [ ] Resolved info box shows:
  - [ ] Green background
  - [ ] Mail icon
  - [ ] Unique recipient count
  - [ ] New addresses warning (if any)
- [ ] Count is accurate (deduplicated)
- [ ] New addresses highlighted correctly

### Disabled State
```jsx
<EmailSelector disabled={true} />
```
- [ ] All inputs are disabled
- [ ] Buttons are disabled
- [ ] Container shows disabled style
- [ ] Cannot interact with component

### Callback Data
- [ ] `onRecipientsChange` is called on every change
- [ ] Data includes:
  - [ ] `groupIds` array
  - [ ] `individualEmails` array
  - [ ] `resolved` object (after preview)
- [ ] `resolved.uniqueEmails` has deduplicated list
- [ ] `resolved.addedToCommonList` shows new emails

### Responsive Design
- [ ] Works on desktop (>1024px)
- [ ] Works on tablet (640px - 1024px)
- [ ] Works on mobile (<640px)
- [ ] Chips wrap properly
- [ ] Dropdown adapts to screen size
- [ ] Buttons stack on mobile
- [ ] No horizontal scroll

---

## 🔌 API Integration Tests

### GET /api/email/groups
- [ ] Request includes organizationId query param
- [ ] Returns array of groups
- [ ] Each group has:
  - [ ] `id`
  - [ ] `name`
  - [ ] `members` array
  - [ ] `createdBy`
  - [ ] `createdAt`
- [ ] Empty array returned when no groups
- [ ] 401 if not authenticated
- [ ] 403 if no permission

### POST /api/email/groups (Create)
- [ ] Request includes:
  - [ ] `name`
  - [ ] `members` array
  - [ ] `organizationId`
- [ ] Returns 201 with created group
- [ ] Group has generated `id`
- [ ] 400 if validation fails
- [ ] 403 if Designer role

### PUT /api/email/groups/{id} (Update)
- [ ] Request includes:
  - [ ] `name`
  - [ ] `members` array
  - [ ] `organizationId`
- [ ] Returns 204 No Content
- [ ] 404 if group not found
- [ ] 403 if no permission

### DELETE /api/email/groups/{id}
- [ ] Returns 204 No Content
- [ ] Group is actually deleted
- [ ] 404 if group not found
- [ ] 403 if no permission

### POST /api/email/groups/resolve
- [ ] Request includes:
  - [ ] `groupIds` array
  - [ ] `individualEmails` array
  - [ ] `organizationId`
- [ ] Returns:
  - [ ] `uniqueEmails` array (deduplicated)
  - [ ] `addedToCommonList` array
- [ ] Deduplication works correctly
- [ ] New emails are identified
- [ ] 400 if validation fails

### POST /api/email/send
- [ ] Accepts multipart/form-data
- [ ] Can send with:
  - [ ] `To` array
  - [ ] `Cc` array (optional)
  - [ ] `Bcc` array (optional)
  - [ ] `Subject`
  - [ ] `Message`
  - [ ] `Attachment` (optional)
  - [ ] `DocumentId` (optional)
  - [ ] `TaskId` (optional)
- [ ] Returns 200 with success message
- [ ] Emails are actually sent (check inbox)
- [ ] New addresses added to common list
- [ ] 400 if validation fails

---

## 🔐 Authentication & Authorization Tests

### Token Authentication
- [ ] Token from localStorage is used
- [ ] Authorization header is set correctly
- [ ] Expired token returns 401
- [ ] Refreshed token works

### Cookie Authentication
- [ ] Cookie is sent with requests
- [ ] `credentials: 'include'` is set
- [ ] Cookie auth works if no token

### Role-Based Access
**As Admin:**
- [ ] Can view groups
- [ ] Can create groups
- [ ] Can edit groups
- [ ] Can delete groups
- [ ] No permission errors

**As Manager:**
- [ ] Can view groups
- [ ] Can create groups
- [ ] Can edit groups
- [ ] Can delete groups
- [ ] No permission errors

**As Designer:**
- [ ] Can view groups
- [ ] Cannot create groups (403)
- [ ] Cannot edit groups (403)
- [ ] Cannot delete groups (403)
- [ ] UI shows read-only state

### Organization Scoping
- [ ] Only groups for current org are shown
- [ ] Cannot access other org's groups
- [ ] Switching orgs loads correct groups
- [ ] OrganizationId is sent with requests

---

## 🎨 UI/UX Tests

### Visual Design
- [ ] Colors match theme
- [ ] Fonts are consistent
- [ ] Icons are clear
- [ ] Spacing is appropriate
- [ ] Borders and shadows look good

### Animations
- [ ] Modal slides in smoothly
- [ ] Panel slides from right
- [ ] Dropdown fades in
- [ ] Chips appear/disappear smoothly
- [ ] Loading spinners rotate
- [ ] No janky animations

### Interactions
- [ ] Hover states work
- [ ] Focus states are visible
- [ ] Click feedback is immediate
- [ ] Buttons are clearly clickable
- [ ] Forms are intuitive

### Accessibility
- [ ] Can tab through inputs
- [ ] Enter key works for submission
- [ ] Escape key closes modals (if implemented)
- [ ] Screen reader friendly (if implemented)
- [ ] Color contrast is sufficient

### Error States
- [ ] Errors are clearly visible
- [ ] Error messages are helpful
- [ ] Can recover from errors
- [ ] Errors don't break the UI

### Loading States
- [ ] Users know something is happening
- [ ] Can't double-click during loading
- [ ] Loading doesn't block entire UI
- [ ] Timeouts are handled

---

## 🐛 Edge Cases & Error Scenarios

### Network Errors
- [ ] No internet connection is handled
- [ ] Timeout errors show message
- [ ] 500 server errors are caught
- [ ] Can retry after error

### Data Edge Cases
- [ ] Empty groups (no members) handled
- [ ] Very long group names handled
- [ ] Very long email addresses handled
- [ ] 100+ members in group works
- [ ] Special characters in emails work
- [ ] Unicode characters handled

### User Errors
- [ ] Invalid email format caught
- [ ] Duplicate emails prevented
- [ ] Empty fields validated
- [ ] Whitespace-only input rejected

### State Management
- [ ] Multiple rapid clicks handled
- [ ] State updates are consistent
- [ ] No race conditions
- [ ] Stale data is refreshed

---

## 📱 Mobile Responsiveness

### iPhone (375px)
- [ ] Layout adapts correctly
- [ ] Buttons are tappable
- [ ] Text is readable
- [ ] Modals fit screen
- [ ] No horizontal scroll

### iPad (768px)
- [ ] Grid shows 2 columns
- [ ] Panel width is appropriate
- [ ] Touch targets are large enough

### Android (360px+)
- [ ] Works across devices
- [ ] Keyboard doesn't break layout
- [ ] Inputs are accessible

---

## 🚀 Performance Tests

### Initial Load
- [ ] Page loads in < 2 seconds
- [ ] No layout shift
- [ ] Images load progressively

### Interaction Speed
- [ ] Clicks respond instantly
- [ ] Typing has no lag
- [ ] Animations are smooth (60fps)

### Large Data Sets
- [ ] 50+ groups render quickly
- [ ] 100+ members in group works
- [ ] Search filters fast
- [ ] Scrolling is smooth

### Memory
- [ ] No memory leaks
- [ ] Component unmounts cleanly
- [ ] No lingering event listeners

---

## ✅ Final Verification

### Documentation
- [ ] README files are accurate
- [ ] Examples work as shown
- [ ] Code comments are helpful
- [ ] API docs match implementation

### Code Quality
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] No console.log statements (except intentional)
- [ ] Formatting is consistent

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Production Readiness
- [ ] All features work end-to-end
- [ ] No blocking bugs
- [ ] Error handling is robust
- [ ] Performance is acceptable
- [ ] Security is adequate

---

## 🎓 User Acceptance Tests

Have actual users test:
- [ ] Can they understand how to create a group?
- [ ] Can they find and use groups in email?
- [ ] Is the preview feature intuitive?
- [ ] Are error messages clear?
- [ ] Would they use this feature regularly?

---

## 📊 Test Results Summary

| Category | Passed | Failed | Blocked | Notes |
|----------|--------|--------|---------|-------|
| Setup | 0/6 | 0 | 0 | |
| Settings Page | 0/X | 0 | 0 | |
| EmailSelector | 0/X | 0 | 0 | |
| API Integration | 0/X | 0 | 0 | |
| Auth & Permissions | 0/X | 0 | 0 | |
| UI/UX | 0/X | 0 | 0 | |
| Edge Cases | 0/X | 0 | 0 | |
| Mobile | 0/X | 0 | 0 | |
| Performance | 0/X | 0 | 0 | |
| Final Verification | 0/X | 0 | 0 | |

**Total Progress**: 0% complete

---

## 📝 Bug Report Template

When you find issues, document them:

```
**Bug**: [Short description]

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected**: 
**Actual**: 
**Browser**: 
**Role**: 
**Organization**: 

**Screenshots**: 
**Console Errors**: 
**Priority**: High/Medium/Low
```

---

## ✨ Enhancement Ideas

After testing, consider these improvements:
- [ ] Autocomplete for common emails
- [ ] Import members via CSV
- [ ] Export group to CSV
- [ ] Rename groups inline
- [ ] Bulk delete groups
- [ ] Group templates
- [ ] Email scheduling
- [ ] Send history tracking

---

**Start testing and check off items as you verify them!**

Good luck! 🚀
