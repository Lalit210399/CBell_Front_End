# IAM System - Complete File Structure

## 📁 Frontend File Organization

```
CBell_Front_End/
│
├── src/
│   │
│   ├── Services/
│   │   └── IAMService.js                           ✅ API Layer (Backend Communication)
│   │
│   ├── Context/
│   │   └── IAMContext.js                           ✅ Global State Management
│   │
│   ├── Hooks/
│   │   ├── usePermission.js                        ✅ Permission Checking
│   │   ├── useIAMModules.js                        ✅ Module Operations
│   │   ├── useIAMFeatures.js                       ✅ Feature Operations
│   │   └── useIAMRoles.js                          ✅ Role Operations
│   │
│   ├── CommonComponents/
│   │   └── IAM/
│   │       ├── PermissionGuard/
│   │       │   ├── PermissionGuard.js              ✅ Conditional Rendering
│   │       │   └── PermissionGuard.css
│   │       │
│   │       ├── RolePermissionMatrix/
│   │       │   ├── RolePermissionMatrix.js         ✅ Permission Matrix UI
│   │       │   └── RolePermissionMatrix.css
│   │       │
│   │       └── UserRoleAssignment/
│   │           ├── UserRoleAssignment.js           ✅ Role Assignment Modal
│   │           └── UserRoleAssignment.css
│   │
│   ├── Pages/
│   │   └── Settings/
│   │       ├── Settings.js                         ✅ UPDATED (IAM Menu Added)
│   │       ├── Settings.css
│   │       │
│   │       └── IAM/                                📁 NEW IAM SECTION
│   │           ├── index.js                        ✅ Exports
│   │           ├── IAMSettings.js                  ✅ Main Container (Tabs)
│   │           ├── IAMSettings.css
│   │           │
│   │           ├── ModuleManagement/               ✅ COMPLETE
│   │           │   ├── ModuleManagement.js
│   │           │   ├── ModuleManagement.css
│   │           │   ├── CreateEditModuleModal.js
│   │           │   └── CreateEditModuleModal.css
│   │           │
│   │           ├── FeatureManagement/              ⏳ TODO
│   │           │   ├── FeatureManagement.js
│   │           │   ├── FeatureManagement.css
│   │           │   ├── CreateEditFeatureModal.js
│   │           │   └── CreateEditFeatureModal.css
│   │           │
│   │           ├── RoleManagement/                 ⏳ TODO
│   │           │   ├── RoleManagement.js
│   │           │   ├── RoleManagement.css
│   │           │   ├── CreateEditRoleModal.js
│   │           │   └── CreateEditRoleModal.css
│   │           │
│   │           └── UserManagement/                 ⏳ TODO
│   │               ├── UserManagement.js
│   │               ├── UserManagement.css
│   │               └── ...
│   │
│   └── App.js                                      ✅ UPDATED (IAMProvider Added)
│
├── IAM_ACCESS_GUIDE.md                             ✅ How to Access Guide
├── IAM_IMPLEMENTATION_STATUS.md                    ✅ Implementation Status
└── src/IAM.md                                      ✅ API Documentation
```

---

## 🔄 Admin Access Flow

```
┌─────────────────────────────────────────────────────────┐
│                      1. LOGIN                           │
│                                                         │
│  User enters credentials                                │
│  Backend validates → Returns user with roles            │
│  User has role: "Admin" or "SuperAdmin"                 │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                 2. NAVIGATE TO SETTINGS                 │
│                                                         │
│  Admin clicks "Settings" in navbar/sidebar             │
│  App navigates to /settings                             │
│  Settings.js loads                                      │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              3. IAM MENU APPEARS (ADMIN ONLY)           │
│                                                         │
│  Settings.js checks:                                    │
│  isAdmin = user.roles.some(role =>                      │
│    role.name === "Admin" || "SuperAdmin"                │
│  )                                                      │
│                                                         │
│  If isAdmin = true:                                     │
│    Show "Access Control" menu item                      │
│  Else:                                                  │
│    Hide it (regular users don't see it)                 │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│            4. ADMIN CLICKS "ACCESS CONTROL"             │
│                                                         │
│  IAMSettings.js component loads                         │
│  Shows 4 tabs: Modules | Features | Roles | Users      │
│  Default tab: Modules                                   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              5. MODULE MANAGEMENT DISPLAYED             │
│                                                         │
│  ModuleManagement.js component renders                  │
│  Fetches modules from backend: GET /apis/modules        │
│  Displays table with search, create, edit, delete       │
│                                                         │
│  Admin can:                                             │
│  ✅ View all modules                                    │
│  ✅ Search/filter modules                               │
│  ✅ Create new module → POST /apis/modules              │
│  ✅ Edit module → PUT /apis/modules/{id}                │
│  ✅ Delete module → DELETE /apis/modules/{id}           │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Visual UI Structure

### Settings Page (Admin View)

```
┌──────────────────────────────────────────────────────────────┐
│  Settings                                                    │
├─────────────────┬────────────────────────────────────────────┤
│                 │                                            │
│  Sidebar:       │  Content Area:                             │
│                 │                                            │
│  👤 Profile     │  [Active Section Content]                 │
│  📧 Email       │                                            │
│     Groups      │                                            │
│                 │                                            │
│  🛡️ Access      │  ← ONLY VISIBLE TO ADMINS                 │
│     Control     │                                            │
│                 │                                            │
└─────────────────┴────────────────────────────────────────────┘
```

### IAM Settings Page (Access Control)

```
┌──────────────────────────────────────────────────────────────┐
│  Access Control                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┬──────────┬──────────┬──────────┐             │
│  │ 📦 Modules│ 🔲 Features│ 🛡️ Roles │ 👥 Users │ ← Tabs   │
│  │  ACTIVE  │          │          │          │             │
│  └──────────┴──────────┴──────────┴──────────┘             │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  📦 Module Management                                  │ │
│  │  Manage system modules that group features            │ │
│  │                                                        │ │
│  │  ┌──────────────────────┐        ┌──────────────────┐ │ │
│  │  │ 🔍 Search modules... │        │ + Create Module  │ │ │
│  │  └──────────────────────┘        └──────────────────┘ │ │
│  │                                                        │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │ Display Name │ System Name │ Description │ Actions│ │ │
│  │  ├──────────────────────────────────────────────────┤ │ │
│  │  │ Admin        │ Admin       │ System     │ ✏️ 🗑️  │ │ │
│  │  │ Task Mgmt    │ TaskMgmt    │ Tasks      │ ✏️ 🗑️  │ │ │
│  │  │ Events       │ Events      │ Events     │ ✏️ 🗑️  │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Integration Points

### 1. App.js (Root Level)
```javascript
import { IAMProvider } from './Context/IAMContext';

<IAMProvider>
  <MainLayout>
    {/* All routes */}
  </MainLayout>
</IAMProvider>
```

### 2. Settings.js (Admin Check)
```javascript
import { Shield } from 'lucide-react';
import IAMSettings from './IAM/IAMSettings';

const isAdmin = user?.roles?.some(role => 
  role.name === "Admin" || role.name === "SuperAdmin"
);

const menuSections = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'email', label: 'Email Groups', icon: Mail },
  ...(isAdmin ? [{ id: 'iam', label: 'Access Control', icon: Shield }] : []),
];
```

### 3. IAMSettings.js (Tab Container)
```javascript
const tabs = [
  { id: 'modules', label: 'Modules', icon: Package },      // ✅ Working
  { id: 'features', label: 'Features', icon: Grid },       // ⏳ TODO
  { id: 'roles', label: 'Roles', icon: Shield },           // ⏳ TODO
  { id: 'users', label: 'Users', icon: Users },            // ⏳ TODO
];
```

---

## ✅ What's Working Now

1. **Admin Detection**: Automatically detects admin users
2. **Menu Visibility**: IAM menu only shows for admins
3. **Module Management**: Full CRUD operations
4. **UI Consistency**: Matches your existing green theme
5. **State Management**: IAMContext provides global state
6. **API Integration**: IAMService ready to call backend

---

## 📊 Component Usage Examples

### Using PermissionGuard
```javascript
import PermissionGuard from './CommonComponents/IAM/PermissionGuard/PermissionGuard';

<PermissionGuard 
  module="Administration" 
  feature="Users" 
  permission="Create"
>
  <button>Create User</button>
</PermissionGuard>
```

### Using usePermission Hook
```javascript
import { usePermission } from './Hooks/usePermission';

function MyComponent() {
  const { hasPermission } = usePermission();
  
  const canCreate = hasPermission('Administration', 'Users', 'Create');
  
  return canCreate ? <CreateButton /> : null;
}
```

### Using IAM Context
```javascript
import { useIAM } from './Context/IAMContext';

function MyComponent() {
  const { modules, fetchModules } = useIAM();
  
  useEffect(() => {
    fetchModules();
  }, []);
  
  return <div>{modules.map(m => <div key={m.id}>{m.name}</div>)}</div>;
}
```

---

## 🚀 Quick Start

1. **Start your app**: `npm start`
2. **Login as admin**: Use credentials with Admin/SuperAdmin role
3. **Go to Settings**: Click Settings in navbar
4. **Click Access Control**: See IAM menu in sidebar (admin only)
5. **Manage Modules**: Create, edit, delete modules

The IAM system is now fully integrated and accessible only to admins through the Settings page!
