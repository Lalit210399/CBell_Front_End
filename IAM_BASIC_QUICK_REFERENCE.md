# Basic IAM Implementation - Quick Reference

## 🎯 What Was Implemented

### ✅ New API Functions (Services/IAMService.js)
- `registerUser(userData)` - Register new users
- `getHierarchyUsers(organizationId)` - Fetch organization users

### ✅ Context Updates (Context/IAMContext.js)
- Added user management state
- `registerNewUser()` - Create user function
- `fetchHierarchyUsers()` - Fetch users function

### ✅ UI Components Created/Updated

#### 1. CreateUserModal
**Location:** `src/Pages/Settings/IAM/UserManagement/CreateUserModal.js`

New modal for user registration with:
- First Name, Last Name fields
- Email (validated)
- Password (min 8 chars)
- Organization Code
- Form validation & error handling

#### 2. UserManagement (Enhanced)
**Location:** `src/Pages/Settings/IAM/UserManagement/UserManagement.js`

Added:
- "Create User" button
- Real API integration
- Fetch users from hierarchy API
- Assign roles to users
- Search & filter functionality

#### 3. UserRoleAssignment (Updated)
**Location:** `src/CommonComponents/IAM/UserRoleAssignment/UserRoleAssignment.js`

Updated to support both `id` and `_id` fields for MongoDB compatibility

---

## 🚀 How to Use

### Create a User
```jsx
// In any component with IAM context
const { registerNewUser } = useIAM();

await registerNewUser({
  email: "user@example.com",
  password: "SecurePass123",
  firstName: "John",
  lastName: "Doe",
  organizationCode: "MSBEC"
});
```

### Fetch Users
```jsx
const { fetchHierarchyUsers } = useIAM();

await fetchHierarchyUsers(organizationId);
```

### Assign Roles
```jsx
const { assignRoles } = useIAM();

await assignRoles(userId, ["roleId1", "roleId2"]);
```

---

## 📁 Files Modified/Created

### New Files
- `src/Pages/Settings/IAM/UserManagement/CreateUserModal.js`
- `src/Pages/Settings/IAM/UserManagement/CreateUserModal.css`
- `IAM_BASIC_IMPLEMENTATION.md` (full documentation)
- `IAM_BASIC_QUICK_REFERENCE.md` (this file)

### Modified Files
- `src/Services/IAMService.js` - Added registerUser & getHierarchyUsers
- `src/Context/IAMContext.js` - Added user state & functions
- `src/Pages/Settings/IAM/UserManagement/UserManagement.js` - Full integration
- `src/Pages/Settings/IAM/UserManagement/UserManagement.css` - Updated styles
- `src/CommonComponents/IAM/UserRoleAssignment/UserRoleAssignment.js` - MongoDB support

---

## 🔌 API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/register` | POST | Register new user |
| `/auth/hierarchy-users/{orgId}` | GET | Get organization users |
| `/roles` | GET | Get all roles |
| `/roles/assign/{userId}` | POST | Assign roles to user |

---

## 🎨 UI Features

### User Management Page
- **Search Bar** - Filter by name, email, or username
- **Create User Button** - Opens registration modal
- **User Count** - Display total users
- **User Table** - Lists all users with their roles
- **Manage Roles Button** - Opens role assignment modal

### Create User Modal
- **Validation** - All fields required, email format, password length
- **Error Display** - Shows API errors
- **Loading States** - Disabled during submission

### Role Assignment Modal
- **Multi-Select** - Assign multiple roles
- **Search** - Filter available roles
- **Visual Feedback** - Checkmarks for selected roles

---

## ⚡ Quick Start

1. **Navigate to User Management:**
   Settings → IAM → User Management

2. **Create a New User:**
   - Click "Create User" button
   - Fill in all fields
   - Submit

3. **View Users:**
   - Users automatically load from API
   - Use search to filter

4. **Assign Roles:**
   - Click "Manage Roles" on any user
   - Select/deselect roles
   - Click "Save Changes"

---

## 🔒 Security Notes

- Passwords sent over HTTPS only
- Cookie-based authentication
- All API calls include credentials
- Client-side validation for UX (server validation required)

---

## 📝 Important Notes

1. **Organization ID Required:** User fetching needs `userInfo.organizationId`
2. **Field Compatibility:** Supports both `id` and `_id` for MongoDB
3. **Fallback Data:** Uses dummy data if API fails
4. **Role IDs:** Must match available roles in the system

---

## 🐛 Troubleshooting

**Users not loading?**
- Check `userInfo.organizationId` exists
- Verify API endpoint accessibility
- Check browser console for errors

**Role assignment fails?**
- Verify user ID format
- Check role IDs are valid
- Ensure API accepts array format

**Form validation issues?**
- Email must be valid format
- Password minimum 8 characters
- All fields required

---

## 📚 Documentation

For detailed documentation, see: **IAM_BASIC_IMPLEMENTATION.md**

---

**Version:** 1.0.0  
**Date:** December 22, 2025  
**Status:** ✅ Complete
