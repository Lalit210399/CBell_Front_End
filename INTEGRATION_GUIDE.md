# Admin Dashboard - Integration Guide

## ✅ What Was Done

The admin dashboard has been **integrated into your existing application**. No need to run it separately!

## 🎯 How It Works

### 1. **Access Control**
- Only users with `Admin`, `SuperAdmin`, or `Administrator` role can access the admin panel
- Regular users will be redirected to their dashboard if they try to access admin routes

### 2. **Routes Added**
All admin routes are under `/admin`:
- `/admin` - Admin Dashboard Home
- `/admin/users` - Users Management
- `/admin/roles` - Roles Management
- `/admin/organizations` - Organizations Management
- `/admin/permissions/modules` - Modules Setup
- `/admin/permissions/features` - Features Setup
- `/admin/permissions/types` - Permission Types Setup

### 3. **Sidebar Integration**
- Admin users will see a ⚙️ **Settings icon** at the bottom of the sidebar
- Clicking it navigates to the admin panel
- Non-admin users won't see this icon

### 4. **Authentication**
- Uses your **existing authentication system**
- Uses cookies (not localStorage)
- Works with your existing proxy setup (`/apis/auth`)

## 🚀 How to Use

### For Admin Users:

1. **Login** to your application normally at `/login`
2. Look for the **⚙️ Settings icon** in the left sidebar
3. Click it to open the admin panel
4. Manage users, roles, organizations, and permissions

### Creating Your First Admin User:

If you don't have an admin user yet, you'll need to:

1. **Create a user** through your existing signup/registration
2. **Assign Admin role** directly in the database:
   ```javascript
   // Update user's roles array to include Admin role
   {
     roles: [{ name: 'Admin', displayName: 'Administrator' }]
   }
   ```

## 📦 Required Dependencies

Install these if you haven't already:

```powershell
npm install sonner
```

(zustand and react-hook-form should already be in your project)

## 🔧 Files Modified

1. **src/App.js** - Added admin routes
2. **src/CommonComponents/Sidebar/Sidebar.js** - Added admin menu item
3. **src/Services/api.js** - Updated to use your proxy setup

## 🎨 New Files Created

### Components
- `src/Components/Admin/AdminProtectedRoute.js` - Admin-only route guard

### Layouts
- `src/Layouts/DashboardLayout.js` - Admin dashboard layout
- `src/Layouts/DashboardLayout.css`

### Pages
```
src/Pages/Admin/
├── DashboardHome.js
├── UsersManagement.js
├── RolesManagement.js
├── OrganizationsManagement.js
├── ModulesManagement.js
├── FeaturesManagement.js
├── PermissionTypesManagement.js
├── CreateUserModal.js
├── AssignRoleModal.js
├── CreateRoleModal.js
├── ViewPermissionsModal.js
├── CreateOrganizationModal.js
└── (CSS files)
```

### Services
- `src/Services/api.js` - Admin API utilities

## 🔌 Backend Requirements

Your backend needs these endpoints:

### Users
- `GET /apis/auth/users` - Get all users
- `POST /apis/auth/register` - Create user
- `PUT /apis/auth/users/:id` - Update user
- `DELETE /apis/auth/users/:id` - Delete user

### Roles
- `GET /apis/auth/roles` - Get all roles
- `POST /apis/auth/roles` - Create role
- `PUT /apis/auth/roles/:id` - Update role
- `DELETE /apis/auth/roles/:id` - Delete role
- `POST /apis/auth/roles/assign/:userId` - Assign roles
- `DELETE /apis/auth/roles/remove/:userId/:roleId` - Remove role

### Organizations
- `GET /apis/auth/organizations` - Get all organizations
- `POST /apis/auth/organizations` - Create organization
- `PUT /apis/auth/organizations/:id` - Update organization
- `DELETE /apis/auth/organizations/:id` - Delete organization

### Permissions
- `GET /apis/auth/modules` - Get all modules
- `POST /apis/auth/modules` - Create module
- `GET /apis/auth/features?moduleId={id}` - Get features
- `POST /apis/auth/features` - Create feature
- `GET /apis/auth/permission-types` - Get permission types
- `POST /apis/auth/permission-types` - Create permission type

## 🎯 Quick Test

1. **Start your app**: `npm start`
2. **Login** with an admin account
3. **Look for** the ⚙️ icon in the sidebar
4. **Click it** to access the admin panel
5. **Try creating** a module or organization

## 🔒 Security Notes

- Admin routes are **double-protected**:
  1. Regular `ProtectedRoute` checks authentication
  2. `AdminProtectedRoute` checks for admin role
- Non-admin users are redirected to `/dashboard`
- Unauthenticated users are redirected to `/login`

## 🎨 Customization

### Change Admin Role Names

Edit `src/Components/Admin/AdminProtectedRoute.js`:

```javascript
const isAdmin = user.roles?.some(role => 
  role.name === 'YourAdminRoleName' || 
  role.name === 'AnotherAdminRole'
);
```

### Change Sidebar Icon

Edit `src/CommonComponents/Sidebar/Sidebar.js`:

```javascript
import { YourIcon } from "lucide-react";

// In the menu
<YourIcon size={20} />
```

### Add More Admin Routes

1. Create new page component in `src/Pages/Admin/`
2. Add route in `src/App.js`:
   ```javascript
   <Route path="new-page" element={<NewPage />} />
   ```
3. Add menu item in `src/Layouts/DashboardLayout.js`

## 📱 Mobile Support

The admin panel is fully responsive and works on:
- Desktop (optimized)
- Tablet (optimized)
- Mobile (stacked layout)

## ✅ Next Steps

1. **Install dependencies** if needed: `npm install sonner`
2. **Start your app**: `npm start`
3. **Login as admin**
4. **Access admin panel** via sidebar icon
5. **Create modules, features, permission types**
6. **Create roles** with permissions
7. **Create users** and assign roles

---

**That's it! The admin dashboard is now fully integrated into your app! 🎉**

No separate running, no switching between apps - just login and use!
