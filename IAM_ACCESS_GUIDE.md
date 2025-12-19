# IAM System - Location & Admin Access Guide

## 📂 Where Everything is Located in Frontend

### **1. Core Infrastructure** (Backend Communication)

```
src/
├── Services/
│   └── IAMService.js                    ✅ All API calls to backend
│
├── Context/
│   └── IAMContext.js                    ✅ Global state management
│
└── Hooks/
    ├── usePermission.js                 ✅ Permission checking hook
    ├── useIAMModules.js                 ✅ Module operations hook
    ├── useIAMFeatures.js                ✅ Feature operations hook
    └── useIAMRoles.js                   ✅ Role operations hook
```

### **2. Reusable Components**

```
src/CommonComponents/IAM/
├── PermissionGuard/
│   ├── PermissionGuard.js               ✅ Show/hide content by permission
│   └── PermissionGuard.css
│
├── RolePermissionMatrix/
│   ├── RolePermissionMatrix.js          ✅ Permission selection UI
│   └── RolePermissionMatrix.css
│
└── UserRoleAssignment/
    ├── UserRoleAssignment.js            ✅ Assign roles to users
    └── UserRoleAssignment.css
```

### **3. Admin Pages** (Settings Section)

```
src/Pages/Settings/
├── Settings.js                          ✅ UPDATED - Added IAM menu
├── Settings.css
│
└── IAM/                                 📁 NEW - IAM Management Section
    ├── IAMSettings.js                   ✅ Main IAM container with tabs
    ├── IAMSettings.css
    ├── index.js
    │
    ├── ModuleManagement/                📁 Manage Modules
    │   ├── ModuleManagement.js          ✅ Module CRUD page
    │   ├── ModuleManagement.css
    │   ├── CreateEditModuleModal.js     ✅ Create/Edit modal
    │   └── CreateEditModuleModal.css
    │
    ├── FeatureManagement/               📁 TODO - Manage Features
    │   ├── FeatureManagement.js         ⏳ Coming next
    │   └── ...
    │
    ├── RoleManagement/                  📁 TODO - Manage Roles
    │   ├── RoleManagement.js            ⏳ Coming next
    │   └── ...
    │
    └── UserManagement/                  📁 TODO - Assign User Roles
        ├── UserManagement.js            ⏳ Coming next
        └── ...
```

### **4. App Integration**

```
src/
└── App.js                               ✅ UPDATED - Wrapped with IAMProvider
```

---

## 🔐 How Admin Accesses IAM System

### **Step-by-Step Admin Access Flow:**

#### **1. Admin Login**
```
User logs in with admin credentials
↓
Backend validates and returns user with roles
↓
User.roles includes: "Admin" or "SuperAdmin"
```

#### **2. Navigation to Settings**
```
Admin clicks Settings from sidebar/navbar
↓
Settings page loads at /settings
```

#### **3. IAM Menu Appears (ONLY for Admins)**
```javascript
// In Settings.js - Line ~18
const isAdmin = user?.roles?.some(role => 
  role.name === "Admin" || 
  role.name === "SuperAdmin" || 
  role.displayName === "Administrator" ||
  role.displayName === "Super Administrator"
);

// IAM menu item is conditionally shown - Line ~33
...(isAdmin ? [{ id: 'iam', label: 'Access Control', icon: Shield }] : [])
```

**What Admin Sees:**
```
Settings Sidebar:
├── 👤 Profile
├── 📧 Email Groups
└── 🛡️ Access Control     ← ONLY VISIBLE TO ADMINS
```

#### **4. Access Control Section**

When admin clicks "Access Control", they see:

```
┌─────────────────────────────────────────────┐
│  📦 Modules  |  🔲 Features  |  🛡️ Roles  |  👥 Users  │
├─────────────────────────────────────────────┤
│                                             │
│  [Module Management Page Content]          │
│  - List all modules                         │
│  - Create new module                        │
│  - Edit existing modules                    │
│  - Delete modules                           │
│                                             │
└─────────────────────────────────────────────┘
```

**Tabbed Navigation:**
- **Modules Tab**: Manage system modules (Administration, TaskManagement, etc.)
- **Features Tab**: Manage features within modules (Users, Roles, Tasks, etc.)
- **Roles Tab**: Create/edit roles and assign permissions using permission matrix
- **Users Tab**: Assign roles to users

---

## 🎯 Current Implementation Status

### ✅ **Working Now:**

1. **Settings Page Integration**
   - IAM menu item appears for admins
   - Non-admins don't see it
   - Clicking opens IAMSettings component

2. **Module Management (Complete)**
   - View all modules in table
   - Search/filter modules
   - Create new module
   - Edit existing module
   - Delete module with confirmation
   - All styled to match your theme

3. **Infrastructure Ready**
   - IAMProvider wrapping entire app
   - All API services ready
   - All hooks available
   - All reusable components built

### ⏳ **Coming Next:**

1. **Feature Management Page**
2. **Role Management Page** (with permission matrix)
3. **User Management Page** (with role assignment)

---

## 🚀 How to Use Right Now

### **For Testing Module Management:**

1. **Start your app:**
   ```bash
   npm start
   ```

2. **Login as Admin**
   - Use credentials with Admin/SuperAdmin role

3. **Navigate to Settings**
   - Click Settings link in your navbar/sidebar

4. **Click "Access Control"**
   - This appears in the left sidebar (only for admins)

5. **Use Module Management**
   - View modules (fetches from `/apis/modules`)
   - Create module (POST to `/apis/modules`)
   - Edit module (PUT to `/apis/modules/{id}`)
   - Delete module (DELETE to `/apis/modules/{id}`)

---

## 📋 Code Example: How Admin Check Works

### **In Settings.js:**

```javascript
import { Shield } from 'lucide-react';
import IAMSettings from './IAM/IAMSettings';

const Settings = () => {
  const { user } = useUser();
  
  // ✅ Check if user has admin role
  const isAdmin = user?.roles?.some(role => 
    role.name === "Admin" || 
    role.name === "SuperAdmin" || 
    role.displayName === "Administrator" ||
    role.displayName === "Super Administrator"
  );

  const menuSections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'email', label: 'Email Groups', icon: Mail },
    
    // ✅ Conditionally add IAM menu ONLY for admins
    ...(isAdmin ? [
      { id: 'iam', label: 'Access Control', icon: Shield }
    ] : []),
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSettings />;
      case 'email':
        return <EmailGroupsManager />;
      case 'iam':
        return <IAMSettings />;  // ✅ IAM Management UI
      default:
        return null;
    }
  };
  
  // ... rest of component
};
```

---

## 🎨 UI Preview

### **Settings Page (Admin View):**

```
┌─────────────────────────────────────────────────────────────┐
│  Settings                                                   │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│ 👤 Profile   │  [Profile Settings Content]                 │
│              │                                              │
│ 📧 Email     │                                              │
│   Groups     │                                              │
│              │                                              │
│ 🛡️ Access    │  ← ADMIN ONLY MENU ITEM                     │
│   Control    │                                              │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

### **Access Control Page:**

```
┌─────────────────────────────────────────────────────────────┐
│  Access Control                                             │
├─────────────────────────────────────────────────────────────┤
│  📦 Modules | 🔲 Features | 🛡️ Roles | 👥 Users            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📦 Module Management                                       │
│  Manage system modules that group related features         │
│                                                             │
│  🔍 [Search modules...]              [+ Create Module]     │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Display Name │ System Name  │ Description │ Actions   │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ Admin        │ Administration│ System     │ ✏️ 🗑️    │ │
│  │ Task Mgmt    │ TaskManagement│ Tasks      │ ✏️ 🗑️    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 Backend Requirements

Your backend should have these endpoints ready:

```
GET    /apis/modules                  - List all modules
POST   /apis/modules                  - Create module
GET    /apis/modules/{id}             - Get module details
PUT    /apis/modules/{id}             - Update module
DELETE /apis/modules/{id}             - Delete module

GET    /apis/features                 - List all features
GET    /apis/features?moduleId={id}   - List features by module
POST   /apis/features                 - Create feature
PUT    /apis/features/{id}            - Update feature
DELETE /apis/features/{id}            - Delete feature

GET    /apis/permission-types         - List permission types
POST   /apis/permission-types/setup-defaults - Setup defaults

GET    /apis/roles                    - List all roles
POST   /apis/roles                    - Create role
PUT    /apis/roles/{id}               - Update role
DELETE /apis/roles/{id}               - Delete role
POST   /apis/roles/assign/{userId}    - Assign roles to user

GET    /apis/auth/permissions         - Get current user permissions
GET    /apis/auth/users?organizationId={id} - Get users
```

---

## ✅ Summary

**Location:** `Settings Page → Access Control (Admin Only)`

**Path:** `/settings` → Click "Access Control" in sidebar

**Visibility:** Only users with these roles see the IAM menu:
- `Admin`
- `SuperAdmin`
- `Administrator`
- `Super Administrator`

**Features Available Now:**
- ✅ Module Management (full CRUD)

**Coming Soon:**
- ⏳ Feature Management
- ⏳ Role Management
- ⏳ User Management

The IAM system is now integrated into your Settings page and ready to use!
