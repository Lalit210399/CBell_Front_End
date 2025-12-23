# EmailSelector Component - Quick Integration Guide

## Quick Start

The `EmailSelector` component provides a complete solution for selecting email recipients with group support.

## Installation

Already available at: `src/CommonComponents/EmailSelector`

## Basic Usage

```jsx
import EmailSelector from '../../CommonComponents/EmailSelector';
import { useState } from 'react';

function MyEmailComposer() {
  const [recipients, setRecipients] = useState({});

  return (
    <EmailSelector 
      onRecipientsChange={setRecipients}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onRecipientsChange` | `function` | - | Callback when recipients change. Receives `{ groupIds, individualEmails, resolved }` |
| `selectedGroupIds` | `array` | `[]` | Initial group IDs |
| `individualEmails` | `array` | `[]` | Initial individual emails |
| `placeholder` | `string` | `"Select groups or..."` | Placeholder text |
| `disabled` | `boolean` | `false` | Disable all interactions |
| `showResolveButton` | `boolean` | `true` | Show preview/resolve button |
| `className` | `string` | `""` | Additional CSS class |

## Complete Example with Send

```jsx
import React, { useState } from 'react';
import EmailSelector from '../../CommonComponents/EmailSelector';
import { useEmailGroups } from '../../Context/EmailGroupsContext';

function EmailComposer() {
  const { sendEmail } = useEmailGroups();
  const [recipients, setRecipients] = useState({});
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!recipients.resolved?.uniqueEmails?.length) {
      alert('Please add recipients and preview them first');
      return;
    }

    setSending(true);
    try {
      await sendEmail({
        to: recipients.resolved.uniqueEmails,
        cc: [],
        bcc: [],
        subject: subject,
        message: message,
        attachments: []
      });
      
      alert('Email sent successfully!');
      // Reset form
      setRecipients({});
      setSubject('');
      setMessage('');
    } catch (error) {
      alert('Failed to send email: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="email-composer">
      <div className="form-group">
        <label>To:</label>
        <EmailSelector 
          onRecipientsChange={setRecipients}
          disabled={sending}
        />
      </div>

      <div className="form-group">
        <label>Subject:</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={sending}
        />
      </div>

      <div className="form-group">
        <label>Message:</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={sending}
        />
      </div>

      <button 
        onClick={handleSend}
        disabled={sending || !recipients.resolved?.uniqueEmails?.length}
      >
        {sending ? 'Sending...' : 'Send Email'}
      </button>

      {/* Show recipient info */}
      {recipients.resolved && (
        <div className="recipient-info">
          <p>📧 {recipients.resolved.uniqueEmails.length} recipients</p>
          {recipients.resolved.addedToCommonList?.length > 0 && (
            <p>➕ {recipients.resolved.addedToCommonList.length} new addresses</p>
          )}
        </div>
      )}
    </div>
  );
}

export default EmailComposer;
```

## With CC and BCC

```jsx
function EmailComposerWithCc() {
  const [toRecipients, setToRecipients] = useState({});
  const [ccRecipients, setCcRecipients] = useState({});
  const [bccRecipients, setBccRecipients] = useState({});

  const handleSend = async () => {
    await sendEmail({
      to: toRecipients.resolved?.uniqueEmails || [],
      cc: ccRecipients.resolved?.uniqueEmails || [],
      bcc: bccRecipients.resolved?.uniqueEmails || [],
      subject: subject,
      message: message
    });
  };

  return (
    <div>
      <div className="form-group">
        <label>To:</label>
        <EmailSelector onRecipientsChange={setToRecipients} />
      </div>

      <div className="form-group">
        <label>CC:</label>
        <EmailSelector 
          onRecipientsChange={setCcRecipients}
          showResolveButton={false}
        />
      </div>

      <div className="form-group">
        <label>BCC:</label>
        <EmailSelector 
          onRecipientsChange={setBccRecipients}
          showResolveButton={false}
        />
      </div>
      
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

## Features

### 1. Visual Distinction
- **Blue chips**: Email groups with member count
- **Purple chips**: Individual email addresses
- **Remove button**: X icon on each chip

### 2. Group Selection
- Click "Select Groups" to open dropdown
- Checkbox list of all available groups
- Shows member count for each group
- Auto-closes when clicking outside

### 3. Email Input
- Type email address and press Enter
- Validates email format automatically
- Shows error for invalid emails
- Prevents duplicate emails

### 4. Recipient Preview
- Click "Preview" button to resolve
- Shows deduplicated count
- Highlights new addresses being added to common list
- Green info box with details

### 5. Keyboard Support
- **Enter**: Add email
- **Backspace**: Remove last chip (when input empty)

## Styling

The component comes with complete CSS. To customize:

```css
/* Override in your component's CSS */
.email-selector {
  /* Your custom styles */
}

.es-chip {
  /* Custom chip styles */
}
```

## Integration with Existing Forms

### Option 1: Replace existing email inputs
```jsx
// Before
<input type="email" name="to" />

// After
<EmailSelector onRecipientsChange={handleToChange} />
```

### Option 2: Use alongside existing inputs
```jsx
<div className="recipients">
  <EmailSelector onRecipientsChange={setRecipients} />
  
  {/* Your existing form fields */}
  <input type="text" name="subject" />
  <textarea name="message" />
</div>
```

## Advanced: Manual Resolution

```jsx
import { useEmailGroups } from '../../Context/EmailGroupsContext';

function ManualResolve() {
  const { resolveRecipients } = useEmailGroups();
  const { user, selectedOrganizationId } = useUser();

  const handleManualResolve = async () => {
    const orgId = selectedOrganizationId || user?.organizationId;
    
    const result = await resolveRecipients(
      ['group-id-1', 'group-id-2'],
      ['john@example.com', 'jane@example.com'],
      orgId
    );

    console.log('Unique emails:', result.uniqueEmails);
    console.log('New emails:', result.addedToCommonList);
  };

  return <button onClick={handleManualResolve}>Resolve</button>;
}
```

## Error Handling

The component handles errors automatically and displays them:
- Invalid email format
- Duplicate emails
- API errors during resolution

You can also listen for errors via the resolved data:

```jsx
const handleRecipientsChange = (data) => {
  if (data.error) {
    console.error('Error:', data.error);
  }
};
```

## Best Practices

1. **Always resolve before sending**: Use the "Preview" button to deduplicate
2. **Show recipient count**: Display resolved count to user
3. **Handle empty state**: Check `resolved.uniqueEmails.length` before sending
4. **Loading states**: Disable component during send operations
5. **Reset after send**: Clear recipients after successful send

## Common Patterns

### Pattern 1: Modal Email Composer
```jsx
function EmailModal({ isOpen, onClose }) {
  const [recipients, setRecipients] = useState({});

  if (!isOpen) return null;

  return (
    <div className="modal">
      <EmailSelector onRecipientsChange={setRecipients} />
      {/* Rest of form */}
    </div>
  );
}
```

### Pattern 2: Task/Event Email
```jsx
function TaskEmailButton({ taskId }) {
  const [showComposer, setShowComposer] = useState(false);

  const handleSend = async (emailData) => {
    await sendEmail({
      ...emailData,
      taskId: taskId // Link to task
    });
  };

  return (
    <>
      <button onClick={() => setShowComposer(true)}>
        Send Email
      </button>
      
      {showComposer && (
        <EmailComposerModal
          taskId={taskId}
          onSend={handleSend}
          onClose={() => setShowComposer(false)}
        />
      )}
    </>
  );
}
```

### Pattern 3: Pre-selected Recipients
```jsx
function EmailWithDefaults() {
  return (
    <EmailSelector
      selectedGroupIds={['group-123']}
      individualEmails={['preset@example.com']}
      onRecipientsChange={handleChange}
    />
  );
}
```

## Mobile Considerations

The component is fully responsive:
- Chips wrap on small screens
- Dropdown adapts to screen width
- Touch-friendly tap targets
- Smooth scrolling for long lists

## Browser Support

Works in all modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- Efficient re-renders using React hooks
- Debounced API calls (can be added)
- Lazy loading of groups
- Minimal DOM updates

## Troubleshooting

**Groups not showing:**
- Ensure EmailGroupsContext is wrapped around your app
- Check user has access to organization
- Verify groups exist in backend

**Resolve button not working:**
- Check console for API errors
- Ensure at least one recipient is selected
- Verify organizationId is set

**Chips not removable:**
- Check `disabled` prop is not set to `true`
- Verify component is not in loading state

---

Need help? Check `EMAIL_GROUPS_FRONTEND_IMPLEMENTATION.md` for detailed docs.
