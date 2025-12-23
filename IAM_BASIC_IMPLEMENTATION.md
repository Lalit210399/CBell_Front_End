# Basic IAM Implementation Guide

## Overview

This document describes the basic IAM (Identity and Access Management) functionality implemented using the following APIs:

- **Register User**: `POST /auth/register`
- **Get Users**: `GET /auth/hierarchy-users/{organizationId}`
- **Get Roles**: `GET /roles`
- **Assign Roles**: `POST /roles/assign/{userId}`

## Architecture

### Service Layer (`Services/IAMService.js`)

Added the following API functions:

#### `registerUser(userData)`
Registers a new user in the system.

**Parameters:**
```javascript
{
  email: "user@example.com",
  password: "SecurePass123",
  firstName: "John",
  lastName: "Doe",
  organizationCode: "MSBEC"
}
```

**Returns:** Created user object

#### `getHierarchyUsers(organizationId)`
Fetches all users in an organization hierarchy.

**Parameters:**
- `organizationId` (string): The organization ID

**Returns:** Array of user objects

#### `getAllRoles()`
Fetches all available roles (already existed).

**Returns:** Array of role objects

#### `assignRolesToUser(userId, roleIds)`
Assigns roles to a specific user (already existed).

**Parameters:**
- `userId` (string): The user ID
- `roleIds` (array): Array of role IDs to assign

**Returns:** Assignment result

---

### Context Layer (`Context/IAMContext.js`)

Enhanced the IAM Context with basic user management:

#### New State
- `users`: Array of users
- `usersLoading`: Loading state for user operations
- `usersError`: Error state for user operations

#### New Functions

**`registerNewUser(userData)`**
- Registers a new user
- Updates the users state
- Returns the created user

**`fetchHierarchyUsers(organizationId)`**
- Fetches users by organization
- Updates the users state
- Returns the user array

---

## UI Components

### 1. CreateUserModal

**Location:** `src/Pages/Settings/IAM/UserManagement/CreateUserModal.js`

A modal form for creating new users with the following fields:
- First Name (required)
- Last Name (required)
- Email (required, validated)
- Password (required, min 8 characters)
- Organization Code (required)

**Features:**
- Form validation
- Error handling
- Loading states
- Responsive design

**Usage:**
```jsx
<CreateUserModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onCreateUser={handleCreateUser}
/>
```

---

### 2. Updated UserManagement Component

**Location:** `src/Pages/Settings/IAM/UserManagement/UserManagement.js`

Enhanced with:
- Create User button
- Real API integration
- User list from hierarchy API
- Role assignment functionality

**Features:**
- Search users by name, email, or username
- Display total user count
- Create new users
- Assign roles to users
- View user roles

---

### 3. UserRoleAssignment Component

**Location:** `src/CommonComponents/IAM/UserRoleAssignment/UserRoleAssignment.js`

Updated to support both MongoDB `_id` and standard `id` fields.

**Features:**
- Display available roles
- Search roles
- Multi-select interface
- Real-time role assignment

---

## Usage Guide

### Step 1: Set Up Context Provider

Ensure `IAMProvider` wraps your application:

```jsx
import { IAMProvider } from './Context/IAMContext';

function App() {
  return (
    <IAMProvider>
      {/* Your app components */}
    </IAMProvider>
  );
}
```

### Step 2: Use IAM Hook

Access IAM functionality in any component:

```jsx
import { useIAM } from '../../Context/IAMContext';

function MyComponent() {
  const {
    users,
    usersLoading,
    registerNewUser,
    fetchHierarchyUsers,
    roles,
    fetchRoles,
    assignRoles
  } = useIAM();

  // Use the functions...
}
```

### Step 3: Create a User

```jsx
const handleCreateUser = async (userData) => {
  try {
    const newUser = await registerNewUser({
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      organizationCode: userData.organizationCode
    });
    console.log('User created:', newUser);
  } catch (error) {
    console.error('Failed to create user:', error);
  }
};
```

### Step 4: Fetch Users

```jsx
useEffect(() => {
  const loadUsers = async () => {
    try {
      const users = await fetchHierarchyUsers(organizationId);
      console.log('Users loaded:', users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };
  
  if (organizationId) {
    loadUsers();
  }
}, [organizationId]);
```

### Step 5: Assign Roles

```jsx
const handleAssignRoles = async (userId, roleIds) => {
  try {
    await assignRoles(userId, roleIds);
    console.log('Roles assigned successfully');
  } catch (error) {
    console.error('Failed to assign roles:', error);
  }
};
```

---

## API Integration Details

### Base URL
All API calls use the base URL: `/apis`

### Authentication
All requests include `credentials: 'include'` for cookie-based authentication.

### Error Handling
Each service function:
1. Catches errors from the API
2. Logs them to console
3. Throws the error for the caller to handle

Example:
```javascript
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Operation failed');
  }
  return await response.json();
} catch (error) {
  console.error('Error:', error);
  throw error;
}
```

---

## Data Flow

```
Component
   ↓
IAMContext Hook (useIAM)
   ↓
IAMContext Functions
   ↓
IAMService API Calls
   ↓
Backend API
```

---

## Field Mapping

### User Object
```javascript
{
  id: "string",           // or _id for MongoDB
  firstName: "string",
  lastName: "string",
  email: "string",
  userName: "string",
  organizationId: "string",
  roles: [
    {
      roleId: "string"
    }
  ]
}
```

### Role Object
```javascript
{
  id: "string",           // or _id for MongoDB
  name: "string",
  displayName: "string",
  description: "string"
}
```

---

## Future Enhancements

The current implementation is intentionally basic. Future phases could include:

1. **Permission Management**
   - Feature-level permissions
   - Module-based access control
   - Permission type management

2. **User Management**
   - Edit user details
   - Delete users
   - User status management (active/inactive)

3. **Role Management**
   - Create/edit roles
   - Delete roles
   - Role hierarchy

4. **Advanced Features**
   - Bulk role assignment
   - Role templates
   - Audit logging
   - User groups

---

## Testing

### Manual Testing Steps

1. **Create User**
   - Navigate to User Management
   - Click "Create User"
   - Fill in all required fields
   - Submit and verify user appears in list

2. **View Users**
   - Verify users load from API
   - Test search functionality
   - Check user count display

3. **Assign Roles**
   - Click "Manage Roles" on a user
   - Select/deselect roles
   - Save and verify assignment

---

## Troubleshooting

### Users Not Loading
- Check if `organizationId` is available in `userInfo`
- Verify API endpoint is accessible
- Check browser console for errors

### Role Assignment Fails
- Verify user ID format (MongoDB `_id` vs standard `id`)
- Check if role IDs are valid
- Ensure API endpoint accepts array format

### Form Validation Issues
- Email must be valid format
- Password must be at least 8 characters
- All fields are required

---

## Component Styling

All components use BEM-like CSS class naming:
- `cum-*` for CreateUserModal
- `um-*` for UserManagement
- `ura-*` for UserRoleAssignment

Custom CSS variables used:
- `--theme-primary`: Main brand color
- `--theme-soft`: Secondary brand color

---

## Dependencies

- React 16.8+ (for hooks)
- lucide-react (for icons)
- react-is (for component validation)

---

## Security Considerations

1. **Password Handling**
   - Passwords are sent over HTTPS
   - Never logged or stored in client state
   - Should meet backend complexity requirements

2. **Authentication**
   - Cookie-based authentication
   - Credentials included in all requests

3. **Validation**
   - Client-side validation for UX
   - Server-side validation is required

---

## Support

For issues or questions:
1. Check browser console for errors
2. Verify API endpoints are accessible
3. Ensure proper authentication
4. Review this documentation

---

**Last Updated:** December 22, 2025
**Version:** 1.0.0 (Phase 1 - Basic IAM)
