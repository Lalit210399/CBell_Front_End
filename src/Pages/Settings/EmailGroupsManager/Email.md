# Complete Email Groups & Email Sending Implementation Guide

**For Frontend Team | Backend API Reference**

This document provides the complete email workflow including group management, recipient resolution, and email sending. Use this for frontend implementation.

---

## Table of Contents
1. [API Endpoints](#api-endpoints)
2. [Authentication & Headers](#authentication--headers)
3. [Email Group Management](#email-group-management)
4. [Recipient Resolution](#recipient-resolution)
5. [Email Sending](#email-sending)
6. [Common Email List](#common-email-list)
7. [Complete Implementation Examples](#complete-implementation-examples)
8. [Error Handling](#error-handling)
9. [Frontend Flow Diagrams](#frontend-flow-diagrams)

---

## API Endpoints

All endpoints use the frontend proxy: `http://localhost:5000` proxies to `/apis` prefix.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/apis/email/groups` | List all email groups |
| POST | `/apis/email/groups` | Create new email group (Admin/Manager only) |
| GET | `/apis/email/groups/{id}` | Get single group details |
| PUT | `/apis/email/groups/{id}` | Update group (Admin/Manager only) |
| DELETE | `/apis/email/groups/{id}` | Delete group (Admin/Manager only) |
| POST | `/apis/email/groups/resolve` | Resolve groups + emails → unique list |
| GET | `/apis/email/common` | Get organization common email list |
| POST | `/apis/email/send` | Send email (multipart/form-data) |

---

## Authentication & Headers

### JWT Token
```js
const token = localStorage.getItem('authToken');
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

### Cookie-based (alternative)
- Backend also reads token from `LocalAccessToken` cookie
- If using cookies, ensure `credentials: 'include'` in fetch calls

### Example with both methods
```js
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};
```

---

## Email Group Management

### 1. List Email Groups

**Request:**
```bash
GET /apis/email/groups?organizationId=681460dcb8327b2e3417d8b1
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "Development Team",
    "members": [
      "alice@example.com",
      "bob@example.com"
    ],
    "createdBy": "68d94a5f90294bc72667b19c",
    "createdAt": "2025-12-13T10:30:00Z",
    "organizationId": "681460dcb8327b2e3417d8b1"
  }
]
```

**Frontend Code:**
```js
export const getEmailGroups = async (organizationId) => {
  const token = localStorage.getItem('authToken');
  const url = organizationId 
    ? `/apis/email/groups?organizationId=${organizationId}`
    : `/apis/email/groups`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) throw new Error(`Failed to fetch groups: ${response.status}`);
  return await response.json();
};
```

---

### 2. Create Email Group

**Requirements:**
- Only Admins & Managers can create groups
- Designer users will get `403 Forbidden`

**Request:**
```bash
POST /apis/email/groups
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Development Team",
  "members": [
    "alice@example.com",
    "bob@example.com"
  ],
  "organizationId": "681460dcb8327b2e3417d8b1"
}
```

**Response (201 Created):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Development Team",
  "members": [
    "alice@example.com",
    "bob@example.com"
  ],
  "createdBy": "68d94a5f90294bc72667b19c",
  "createdAt": "2025-12-13T10:30:00Z",
  "organizationId": "681460dcb8327b2e3417d8b1"
}
```

**Error Responses:**
- `400 Bad Request` — name missing or empty
- `403 Forbidden` — user is Designer

**Frontend Code:**
```js
export const createEmailGroup = async (groupData) => {
  const token = localStorage.getItem('authToken');
  
  // Normalize members
  const payload = {
    name: groupData.name.trim(),
    members: groupData.members.map(e => e.trim().toLowerCase()),
    organizationId: groupData.organizationId
  };

  const response = await fetch('/apis/email/groups', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return await response.json();
};

// React Component Example
const CreateGroupModal = ({ organizationId, onGroupCreated, onClose }) => {
  const [groupName, setGroupName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleAddEmail = () => {
    if (!emailInput.trim()) {
      setError('Email is required');
      return;
    }
    if (!validateEmail(emailInput)) {
      setError('Invalid email format');
      return;
    }
    const normalized = emailInput.trim().toLowerCase();
    if (members.includes(normalized)) {
      setError('Email already added');
      return;
    }
    setMembers([...members, normalized]);
    setEmailInput('');
    setError('');
  };

  const handleRemoveEmail = (email) => {
    setMembers(members.filter(e => e !== email));
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }
    if (members.length === 0) {
      setError('Add at least one member');
      return;
    }

    setLoading(true);
    try {
      const created = await createEmailGroup({
        name: groupName,
        members,
        organizationId
      });
      onGroupCreated(created);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <h2>Create New Group</h2>
      
      <input
        type="text"
        placeholder="Group name"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
      />

      <div className="add-members">
        <input
          type="email"
          placeholder="Enter email address"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
        />
        <button onClick={handleAddEmail}>Add</button>
      </div>

      <div className="members-list">
        {members.map(email => (
          <div key={email} className="member-chip">
            {email}
            <button onClick={() => handleRemoveEmail(email)}>×</button>
          </div>
        ))}
      </div>

      {error && <div className="error">{error}</div>}

      <div className="actions">
        <button onClick={onClose}>Cancel</button>
        <button onClick={handleCreate} disabled={loading}>
          {loading ? 'Creating...' : 'Create Group'}
        </button>
      </div>
    </div>
  );
};
```

---

### 3. Update Email Group

**Request:**
```bash
PUT /apis/email/groups/507f1f77bcf86cd799439011
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Development Team (Updated)",
  "members": [
    "alice@example.com",
    "bob@example.com",
    "charlie@example.com"
  ]
}
```

**Response (204 No Content)**

**Frontend Code:**
```js
export const updateEmailGroup = async (groupId, groupData) => {
  const token = localStorage.getItem('authToken');

  const payload = {
    name: groupData.name.trim(),
    members: groupData.members.map(e => e.trim().toLowerCase())
  };

  const response = await fetch(`/apis/email/groups/${groupId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Failed to update group: ${response.status}`);
  }
};
```

---

### 4. Delete Email Group

**Request:**
```bash
DELETE /apis/email/groups/507f1f77bcf86cd799439011
Authorization: Bearer <token>
```

**Response (204 No Content)**

**Frontend Code:**
```js
export const deleteEmailGroup = async (groupId) => {
  const token = localStorage.getItem('authToken');

  const response = await fetch(`/apis/email/groups/${groupId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Failed to delete group: ${response.status}`);
  }
};
```

---

## Recipient Resolution

### Resolve Groups + Individual Emails

**Purpose:** Get a deduplicated list of recipients from multiple groups and individual emails. Automatically adds new emails to common list.

**Request:**
```bash
POST /apis/email/groups/resolve
Authorization: Bearer <token>
Content-Type: application/json

{
  "groupIds": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012"
  ],
  "individualEmails": [
    "external@example.com"
  ],
  "organizationId": "681460dcb8327b2e3417d8b1"
}
```

**Response (200 OK):**
```json
{
  "uniqueEmails": [
    "alice@example.com",
    "bob@example.com",
    "charlie@example.com",
    "external@example.com"
  ],
  "addedToCommonList": [
    "external@example.com"
  ]
}
```

**Frontend Code:**
```js
export const resolveEmailRecipients = async (resolveData) => {
  const token = localStorage.getItem('authToken');

  const response = await fetch('/apis/email/groups/resolve', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(resolveData)
  });

  if (!response.ok) {
    throw new Error(`Failed to resolve recipients: ${response.status}`);
  }

  return await response.json();
};
```

---

## Email Sending

### Send Email with Multipart Form Data

**Important:** Use `multipart/form-data` for sending emails (not JSON).

**Request:**
```bash
POST /apis/email/send
Authorization: Bearer <token>
Content-Type: multipart/form-data

Fields:
  - To: alice@example.com (repeated for each recipient)
  - To: bob@example.com
  - Cc: cc@example.com (optional, repeated)
  - Bcc: bcc@example.com (optional, repeated)
  - Subject: "Meeting Tomorrow"
  - Message: "<h1>Hello</h1><p>Meeting at 2 PM</p>"
  - DocumentId: "507f1f77bcf86cd799439011" (optional)
  - TaskId: "507f1f77bcf86cd799439012" (optional)
  - Attachment: <file> (optional)
```

**Response (200 OK):**
```json
{
  "message": "Email sent Successfully."
}
```

**Frontend Code:**
```js
export const sendEmail = async (emailData) => {
  const token = localStorage.getItem('authToken');
  const formData = new FormData();

  // Add text fields
  formData.append('Subject', emailData.subject);
  formData.append('Message', emailData.message);

  // Add recipients (repeated fields for arrays)
  if (emailData.to && Array.isArray(emailData.to)) {
    emailData.to.forEach(email => formData.append('To', email));
  }

  if (emailData.cc && Array.isArray(emailData.cc)) {
    emailData.cc.forEach(email => formData.append('Cc', email));
  }

  if (emailData.bcc && Array.isArray(emailData.bcc)) {
    emailData.bcc.forEach(email => formData.append('Bcc', email));
  }

  // Add optional fields
  if (emailData.documentId) formData.append('DocumentId', emailData.documentId);
  if (emailData.taskId) formData.append('TaskId', emailData.taskId);

  // Add attachments (can be multiple files)
  if (emailData.attachments && Array.isArray(emailData.attachments)) {
    emailData.attachments.forEach(file => {
      formData.append('Attachment', file, file.name);
    });
  }

  const response = await fetch('/apis/email/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type for FormData — browser will set it with boundary
    },
    credentials: 'include',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Failed to send email: ${response.status}`);
  }

  return await response.json();
};

// React Component Example
const EmailComposer = ({ organizationId }) => {
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [additionalEmails, setAdditionalEmails] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [resolved, setResolved] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [groups, setGroups] = useState([]);

  // Load groups on mount
  useEffect(() => {
    getEmailGroups(organizationId).then(setGroups);
  }, [organizationId]);

  const handleAddEmail = () => {
    if (!emailInput.trim()) return;
    if (!validateEmail(emailInput)) {
      setError('Invalid email');
      return;
    }
    const normalized = emailInput.trim().toLowerCase();
    if (!additionalEmails.includes(normalized)) {
      setAdditionalEmails([...additionalEmails, normalized]);
    }
    setEmailInput('');
    setError('');
  };

  const handleResolve = async () => {
    setLoading(true);
    try {
      const result = await resolveEmailRecipients({
        groupIds: selectedGroupIds,
        individualEmails: additionalEmails,
        organizationId
      });
      setResolved(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      setError('Subject and message are required');
      return;
    }

    if (!resolved || resolved.uniqueEmails.length === 0) {
      setError('No recipients selected');
      return;
    }

    setLoading(true);
    try {
      await sendEmail({
        to: resolved.uniqueEmails,
        subject,
        message,
        attachments
      });

      // Clear form
      setSelectedGroupIds([]);
      setAdditionalEmails([]);
      setSubject('');
      setMessage('');
      setAttachments([]);
      setResolved(null);
      setError('');

      // Show success
      alert('Email sent successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="email-composer">
      <h2>Compose Email</h2>

      {/* Group Selection */}
      <div className="section">
        <h3>Select Groups</h3>
        {groups.map(group => (
          <label key={group.id}>
            <input
              type="checkbox"
              checked={selectedGroupIds.includes(group.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedGroupIds([...selectedGroupIds, group.id]);
                } else {
                  setSelectedGroupIds(selectedGroupIds.filter(id => id !== group.id));
                }
              }}
            />
            {group.name} ({group.members.length} members)
          </label>
        ))}
      </div>

      {/* Individual Emails */}
      <div className="section">
        <h3>Add Individual Emails</h3>
        <input
          type="email"
          placeholder="Enter email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
        />
        <button onClick={handleAddEmail}>Add</button>
        <div className="emails-list">
          {additionalEmails.map(email => (
            <span key={email} className="email-chip">
              {email}
              <button onClick={() => setAdditionalEmails(additionalEmails.filter(e => e !== email))}>×</button>
            </span>
          ))}
        </div>
      </div>

      {/* Preview/Resolve */}
      {!resolved && (
        <button onClick={handleResolve} disabled={selectedGroupIds.length === 0 && additionalEmails.length === 0}>
          Preview Recipients
        </button>
      )}

      {resolved && (
        <div className="section preview">
          <h3>Recipients ({resolved.uniqueEmails.length})</h3>
          <div className="recipients-list">
            {resolved.uniqueEmails.map(email => (
              <div key={email} className="recipient">
                {email}
                {resolved.addedToCommonList.includes(email) && <span className="badge">New</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email Content */}
      <div className="section">
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <textarea
          placeholder="Message (HTML supported)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={10}
        />
      </div>

      {/* Attachments */}
      <div className="section">
        <h3>Attachments</h3>
        <input
          type="file"
          multiple
          onChange={(e) => setAttachments(Array.from(e.target.files))}
        />
        {attachments.length > 0 && (
          <ul>
            {attachments.map(file => (
              <li key={file.name}>{file.name}</li>
            ))}
          </ul>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      <button onClick={handleSend} disabled={loading || !resolved}>
        {loading ? 'Sending...' : 'Send Email'}
      </button>
    </div>
  );
};
```

---

## Common Email List

### Get Organization Common Email List

**Purpose:** Retrieve all emails that have been added to the organization's common list (used for autocomplete/suggestions).

**Request:**
```bash
GET /apis/email/common?organizationId=681460dcb8327b2e3417d8b1
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  "alice@example.com",
  "bob@example.com",
  "charlie@example.com",
  "external@example.com"
]
```

**Frontend Code:**
```js
export const getCommonEmailList = async (organizationId) => {
  const token = localStorage.getItem('authToken');
  const url = organizationId 
    ? `/apis/email/common?organizationId=${organizationId}`
    : `/apis/email/common`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
    credentials: 'include'
  });

  if (!response.ok) return []; // Return empty array if not available
  return await response.json();
};

// Use for autocomplete
const EmailAutocomplete = ({ organizationId }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (input.length > 0) {
      getCommonEmailList(organizationId).then(emails => {
        const filtered = emails.filter(e => e.includes(input.toLowerCase()));
        setSuggestions(filtered);
      });
    } else {
      setSuggestions([]);
    }
  }, [input, organizationId]);

  return (
    <div>
      <input
        type="email"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type email..."
      />
      {suggestions.map(email => (
        <div
          key={email}
          onClick={() => {
            setInput(email);
            setSuggestions([]);
          }}
        >
          {email}
        </div>
      ))}
    </div>
  );
};
```

---

## Complete Implementation Examples

### Full Email Service Module

```js
// services/emailService.js

const BASE_URL = '/apis/email';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const normalizeEmail = (email) => email.trim().toLowerCase();

// Groups
export const getEmailGroups = async (organizationId) => {
  const url = organizationId
    ? `${BASE_URL}/groups?organizationId=${organizationId}`
    : `${BASE_URL}/groups`;

  const res = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
};

export const getEmailGroupById = async (groupId) => {
  const res = await fetch(`${BASE_URL}/groups/${groupId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
};

export const createEmailGroup = async (groupData) => {
  const res = await fetch(`${BASE_URL}/groups`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({
      name: groupData.name.trim(),
      members: groupData.members.map(normalizeEmail),
      organizationId: groupData.organizationId
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || `Failed: ${res.status}`);
  }
  return res.json();
};

export const updateEmailGroup = async (groupId, groupData) => {
  const res = await fetch(`${BASE_URL}/groups/${groupId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({
      name: groupData.name.trim(),
      members: groupData.members.map(normalizeEmail)
    })
  });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
};

export const deleteEmailGroup = async (groupId) => {
  const res = await fetch(`${BASE_URL}/groups/${groupId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
};

// Recipients
export const resolveEmailRecipients = async (groupIds, individualEmails, organizationId) => {
  const res = await fetch(`${BASE_URL}/groups/resolve`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({
      groupIds,
      individualEmails: individualEmails.map(normalizeEmail),
      organizationId
    })
  });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
};

// Email Sending
export const sendEmail = async (emailData) => {
  const form = new FormData();
  form.append('Subject', emailData.subject);
  form.append('Message', emailData.message);

  if (emailData.to) emailData.to.forEach(e => form.append('To', e));
  if (emailData.cc) emailData.cc.forEach(e => form.append('Cc', e));
  if (emailData.bcc) emailData.bcc.forEach(e => form.append('Bcc', e));

  if (emailData.documentId) form.append('DocumentId', emailData.documentId);
  if (emailData.taskId) form.append('TaskId', emailData.taskId);
  if (emailData.attachments) {
    emailData.attachments.forEach(f => form.append('Attachment', f, f.name));
  }

  const token = localStorage.getItem('authToken');
  const res = await fetch(`${BASE_URL}/send`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    credentials: 'include',
    body: form
  });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
};

// Common List
export const getCommonEmailList = async (organizationId) => {
  const url = organizationId
    ? `${BASE_URL}/common?organizationId=${organizationId}`
    : `${BASE_URL}/common`;

  const res = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  if (!res.ok) return [];
  return res.json();
};

// Utilities
export { validateEmail, normalizeEmail };
```

---

## Error Handling

### Standard HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Group created; use returned id |
| 204 | No Content | Action succeeded; no response body |
| 400 | Bad Request | Validation error; show error message |
| 401 | Unauthorized | Token missing/invalid; redirect to login |
| 403 | Forbidden | User not authorized (e.g., Designer creating group) |
| 404 | Not Found | Resource not found; check id/path |
| 500 | Server Error | Unexpected error; retry or contact support |

### Error Response Example

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Name": ["The Name field is required."]
  }
}
```

### Frontend Error Wrapper

```js
const handleApiError = async (response) => {
  if (response.ok) return await response.json();

  let errorMessage = `Request failed with status ${response.status}`;

  try {
    const errorData = await response.json();
    errorMessage = errorData.message || errorData.errors?.Name?.[0] || errorMessage;
  } catch {
    errorMessage = await response.text();
  }

  throw new Error(errorMessage);
};

// Usage
try {
  const result = await fetch(url, options);
  const data = await handleApiError(result);
} catch (err) {
  showError(err.message);
}
```

---

## Frontend Flow Diagrams

### Group Creation Flow

```
User Opens Modal
    ↓
Fill Group Name
    ↓
Enter Emails (validate each)
    ↓
Click "Create Group"
    ↓
POST /apis/email/groups
    ↓
Backend: Authorize (Admin/Manager only)
    ↓
Backend: Validate & Create
    ↓
Response: 201 with created group (has server Id)
    ↓
Frontend: Add to groups list
    ↓
Close modal + Show success
```

### Email Sending Flow

```
User Selects Groups + Emails
    ↓
Click "Preview Recipients"
    ↓
POST /apis/email/groups/resolve
    ↓
Get Back: uniqueEmails + addedToCommonList
    ↓
Show Preview Modal (highlight new emails)
    ↓
Fill Subject + Message
    ↓
(Optional) Attach files
    ↓
Click "Send Email"
    ↓
POST /apis/email/send (multipart/form-data)
    ↓
Backend: Send via SMTP
    ↓
Auto-add unknown emails to common list
    ↓
Response: 200 OK
    ↓
Clear form + Show success
```

### Permission Checks (Frontend)

```js
const isUserDesigner = (userRoles) => {
  return userRoles.some(r => r.name.toLowerCase() === 'designer');
};

const isUserAdminOrManager = (userRoles) => {
  return userRoles.some(r => 
    r.name.toLowerCase() === 'admin' || 
    r.name.toLowerCase() === 'manager'
  );
};

// Hide group management for designers
{isUserDesigner(currentUserRoles) ? (
  <p>Designers can view and use groups but cannot manage them.</p>
) : (
  <>
    <button onClick={handleCreateGroup}>+ New Group</button>
    <button onClick={handleEditGroup}>Edit</button>
    <button onClick={handleDeleteGroup}>Delete</button>
  </>
)}
```

---

## Validation Rules

### Email Validation
```js
// Simple regex (recommended for UX feedback)
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// More strict (RFC 5322 compliant)
const validateEmailStrict = (email) => {
  return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
};
```

### Group Validation
```js
const validateGroup = (groupName, members) => {
  const errors = [];

  if (!groupName || groupName.trim().length === 0) {
    errors.push('Group name is required');
  }

  if (members.length === 0) {
    errors.push('At least one member is required');
  }

  members.forEach((email, idx) => {
    if (!validateEmail(email)) {
      errors.push(`Invalid email at position ${idx + 1}: ${email}`);
    }
  });

  return errors;
};
```

---

## Testing Checklist

- [ ] Create email group with multiple members
- [ ] Update group name and members
- [ ] Delete email group
- [ ] List groups with organizationId filter
- [ ] Resolve recipients from multiple groups
- [ ] Resolve with additional individual emails
- [ ] Send email to resolved recipients
- [ ] Send email with attachments
- [ ] Get common email list
- [ ] Test as Designer (should get 403 on group create)
- [ ] Test token expiration handling
- [ ] Test invalid email format validation
- [ ] Test network error handling

---

## Common Pitfalls

| Issue | Solution |
|-------|----------|
| 404 on `/apis/api/email/groups` | Use `/apis/email/groups` (no `/api` after proxy) |
| 400 "Id field is required" | Don't send `id` on create; let backend generate it |
| FormData not sending files | Don't set `Content-Type` header for FormData |
| Token not sent | Ensure `localStorage.getItem('authToken')` works; check localStorage key name |
| 403 Forbidden on create | Check user role; Designer users cannot create groups |
| Multiple To/Cc/Bcc fields not working | Use `form.append()` multiple times, not as array |
| Emails not added to common list | Call `resolve` endpoint before send; send normalizes emails |

---

## Summary

This guide covers:
1. ✅ Group Management (CRUD)
2. ✅ Recipient Resolution with auto-add to common list
3. ✅ Email Sending with attachments
4. ✅ Common list for autocomplete
5. ✅ Role-based permissions
6. ✅ Error handling
7. ✅ React component examples
8. ✅ Validation & normalization

Use the service module provided in "Complete Implementation Examples" and adapt the React components to your design system.

**Ready to implement! 🚀**
