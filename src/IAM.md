# IAM Frontend Implementation Guide

## Overview
This document provides all the necessary API endpoints, data models, and implementation details for building the Identity and Access Management (IAM) system in ReactJS.

---

## Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [Data Models](#data-models)
3. [IAM Core Entities](#iam-core-entities)
4. [Permission System](#permission-system)
5. [API Endpoints](#api-endpoints)
6. [Frontend Implementation Strategy](#frontend-implementation-strategy)
7. [UI Components Needed](#ui-components-needed)

---

## Authentication APIs

### Base URL
```
http://your-api-gateway/api/auth
```

### Already Implemented (Login, Register, Forgot Password)
✅ **POST** `/api/auth/register` - User registration  
✅ **POST** `/api/auth/login` - User login  
✅ **POST** `/api/auth/request-reset-otp` - Request password reset OTP  
✅ **POST** `/api/auth/verify-reset-otp` - Verify OTP  
✅ **POST** `/api/auth/reset-password` - Reset password  
✅ **POST** `/api/auth/logout` - User logout  
✅ **POST** `/api/auth/refresh-token` - Refresh access token  

### New IAM Endpoints to Implement
**GET** `/api/auth/permissions` - Get current user's permissions  
**GET** `/api/auth/users?organizationId={orgId}` - Get all users in organization  

---

## Data Models

### 1. User Model
```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationCode: string;
  organizationId: string;
  parentLevel: number; // 1=Institute, 2=College, 3=Department
  mfa: number;
  userStatus: number;
  createdOn: Date;
  updatedOn: Date;
  roleIds: string[]; // Array of role IDs
  roles: UserRole[]; // Enhanced role data with names
}

interface UserRole {
  id: string;
  name: string;
  displayName: string;
}
```

### 2. Role Model
```typescript
interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: RolePermission[];
  isActive: boolean;
}

interface RolePermission {
  moduleId: string;
  featureId: string;
  permissionValue: number; // Bitwise flags
}
```

### 3. Module Model
```typescript
interface Module {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
}
```

### 4. Feature Model
```typescript
interface Feature {
  id: string;
  moduleId: string;
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
}
```

### 5. Permission Type Model
```typescript
interface PermissionType {
  id: string;
  name: string; // e.g., "Create", "Read", "Update", "Delete"
  displayName: string;
  bitPosition: number; // 0, 1, 2, 3, etc.
  isActive: boolean;
}
```

---

## IAM Core Entities

### Hierarchy
```
Module (e.g., "Task Management", "User Management")
  └── Feature (e.g., "Tasks", "Users", "Roles")
       └── Permission Types (e.g., "Create", "Read", "Update", "Delete")
```

### Example
```
Module: "Administration"
  └── Feature: "Users"
       ├── Read (bit 0)
       ├── Create (bit 1)
       ├── Update (bit 2)
       └── Delete (bit 3)
```

---

## Permission System

### Bitwise Permission System
Permissions are stored as bitwise flags in a single integer per module-feature combination.

#### Permission Types (Default)
```typescript
const DEFAULT_PERMISSION_TYPES = [
  { name: "Read", displayName: "Read", bitPosition: 0 },      // 2^0 = 1
  { name: "Create", displayName: "Create", bitPosition: 1 },  // 2^1 = 2
  { name: "Update", displayName: "Update", bitPosition: 2 },  // 2^2 = 4
  { name: "Delete", displayName: "Delete", bitPosition: 3 },  // 2^3 = 8
  { name: "Assign", displayName: "Assign", bitPosition: 4 },  // 2^4 = 16
];
```

#### Calculating Permission Value
```typescript
// Example: User has Read (1) + Update (4) = 5
const permissionValue = 5;

// Check if user has Read permission
const hasRead = (permissionValue & (1 << 0)) !== 0; // true

// Check if user has Create permission
const hasCreate = (permissionValue & (1 << 1)) !== 0; // false

// Check if user has Update permission
const hasUpdate = (permissionValue & (1 << 2)) !== 0; // true
```

#### Helper Functions
```typescript
// Check if a specific permission is granted
function hasPermission(
  permissionValue: number, 
  bitPosition: number
): boolean {
  return (permissionValue & (1 << bitPosition)) !== 0;
}

// Calculate permission value from selected permissions
function calculatePermissionValue(
  selectedPermissions: { bitPosition: number; isGranted: boolean }[]
): number {
  let value = 0;
  selectedPermissions.forEach(perm => {
    if (perm.isGranted) {
      value |= (1 << perm.bitPosition);
    }
  });
  return value;
}

// Get all granted permissions from a permission value
function getGrantedPermissions(
  permissionValue: number,
  permissionTypes: PermissionType[]
): PermissionType[] {
  return permissionTypes.filter(pt => 
    (permissionValue & (1 << pt.bitPosition)) !== 0
  );
}
```

---

## API Endpoints

### Module Management
Base URL: `/api/modules`

#### Get All Modules
```http
GET /api/modules
```
**Response:**
```json
[
  {
    "id": "module123",
    "name": "Administration",
    "displayName": "Administration",
    "description": "System administration module",
    "isActive": true
  }
]
```

#### Create Module
```http
POST /api/modules
Content-Type: application/json

{
  "name": "Administration",
  "displayName": "Administration",
  "description": "System administration module"
}
```

#### Get Module by ID
```http
GET /api/modules/{id}
```

#### Update Module
```http
PUT /api/modules/{id}
Content-Type: application/json

{
  "name": "Administration",
  "displayName": "Administration",
  "description": "Updated description"
}
```

#### Delete Module
```http
DELETE /api/modules/{id}
```

---

### Feature Management
Base URL: `/api/features`

#### Get All Features (Optional: Filter by Module)
```http
GET /api/features?moduleId={moduleId}
```
**Response:**
```json
[
  {
    "id": "feature123",
    "moduleId": "module123",
    "name": "Users",
    "displayName": "Users",
    "description": "User management feature",
    "isActive": true
  }
]
```

#### Create Feature
```http
POST /api/features
Content-Type: application/json

{
  "moduleId": "module123",
  "name": "Users",
  "displayName": "Users",
  "description": "User management feature"
}
```

#### Get Feature by ID
```http
GET /api/features/{id}
```

#### Update Feature
```http
PUT /api/features/{id}
Content-Type: application/json

{
  "moduleId": "module123",
  "name": "Users",
  "displayName": "Users",
  "description": "Updated description"
}
```

#### Delete Feature
```http
DELETE /api/features/{id}
```

---

### Permission Types Management
Base URL: `/api/permission-types`

#### Get All Permission Types
```http
GET /api/permission-types
```
**Response:**
```json
[
  {
    "id": "perm123",
    "name": "Read",
    "displayName": "Read",
    "bitPosition": 0,
    "isActive": true
  },
  {
    "id": "perm124",
    "name": "Create",
    "displayName": "Create",
    "bitPosition": 1,
    "isActive": true
  }
]
```

#### Create Permission Type
```http
POST /api/permission-types
Content-Type: application/json

{
  "name": "Read",
  "displayName": "Read",
  "bitPosition": 0
}
```

#### Setup Default Permission Types
```http
POST /api/permission-types/setup-defaults
```

---

### Role Management
Base URL: `/api/roles`

#### Get All Roles
```http
GET /api/roles
```
**Response:**
```json
[
  {
    "id": "role123",
    "name": "Admin",
    "displayName": "Administrator",
    "description": "Full system access",
    "permissions": [
      {
        "moduleId": "module123",
        "featureId": "feature123",
        "permissionValue": 15  // Binary: 1111 (all permissions)
      }
    ],
    "isActive": true
  }
]
```

#### Create Role
```http
POST /api/roles
Content-Type: application/json

{
  "name": "Editor",
  "displayName": "Content Editor",
  "description": "Can create and edit content",
  "permissions": [
    {
      "moduleId": "module123",
      "featureId": "feature123",
      "permissionFlags": [
        {
          "permissionTypeId": "perm123",  // Read
          "isGranted": true
        },
        {
          "permissionTypeId": "perm124",  // Create
          "isGranted": true
        },
        {
          "permissionTypeId": "perm125",  // Update
          "isGranted": true
        },
        {
          "permissionTypeId": "perm126",  // Delete
          "isGranted": false
        }
      ]
    }
  ]
}
```

#### Get Role by ID
```http
GET /api/roles/{id}
```

#### Update Role
```http
PUT /api/roles/{id}
Content-Type: application/json

{
  "name": "Editor",
  "displayName": "Content Editor",
  "description": "Updated description",
  "permissions": [...]
}
```

#### Delete Role (Soft Delete)
```http
DELETE /api/roles/{id}
```

#### Assign Roles to User
```http
POST /api/roles/assign/{userId}
Content-Type: application/json

["role123", "role456"]
```

#### Get User's Roles
```http
GET /api/roles/user-roles/{userId}
```
**Response:**
```json
{
  "userId": "user123",
  "roleIds": ["role123", "role456"],
  "roles": [
    {
      "id": "role123",
      "name": "Admin",
      "displayName": "Administrator"
    }
  ],
  "isConsistent": true
}
```

#### Add Permissions to Existing Role
```http
POST /api/roles/{roleId}/permissions
Content-Type: application/json

[
  {
    "moduleId": "module123",
    "featureId": "feature123",
    "permissionFlags": [
      {
        "permissionTypeId": "perm123",
        "isGranted": true
      }
    ]
  }
]
```

---

### User Permissions
Base URL: `/api/auth`

#### Get Current User's Permissions
```http
GET /api/auth/permissions
```
**Response:**
```json
{
  "userId": "user123",
  "email": "user@example.com",
  "roles": [
    {
      "id": "role123",
      "name": "Admin",
      "displayName": "Administrator",
      "description": "Full system access"
    }
  ],
  "permissions": {
    "Administration": {
      "Users": ["Read", "Create", "Update", "Delete"],
      "Roles": ["Read", "Create", "Update"]
    },
    "TaskManagement": {
      "Tasks": ["Read", "Create", "Update", "Assign"]
    }
  }
}
```

---

## Frontend Implementation Strategy

### 1. State Management

#### Redux/Zustand Store Structure
```typescript
interface IAMState {
  // Modules
  modules: Module[];
  selectedModule: Module | null;
  
  // Features
  features: Feature[];
  selectedFeature: Feature | null;
  
  // Permission Types
  permissionTypes: PermissionType[];
  
  // Roles
  roles: Role[];
  selectedRole: Role | null;
  
  // Users
  users: User[];
  selectedUser: User | null;
  
  // Current User Permissions
  currentUserPermissions: {
    [moduleName: string]: {
      [featureName: string]: string[]; // Array of permission names
    };
  };
  
  // Loading states
  loading: {
    modules: boolean;
    features: boolean;
    permissionTypes: boolean;
    roles: boolean;
    users: boolean;
  };
}
```

### 2. Permission Check Hook

```typescript
// usePermission.ts
import { useSelector } from 'react-redux';

export function usePermission() {
  const permissions = useSelector(state => state.iam.currentUserPermissions);
  
  const hasPermission = (
    moduleName: string, 
    featureName: string, 
    permissionName: string
  ): boolean => {
    return permissions[moduleName]?.[featureName]?.includes(permissionName) || false;
  };
  
  const hasAnyPermission = (
    moduleName: string,
    featureName: string,
    permissionNames: string[]
  ): boolean => {
    const userPermissions = permissions[moduleName]?.[featureName] || [];
    return permissionNames.some(p => userPermissions.includes(p));
  };
  
  const hasAllPermissions = (
    moduleName: string,
    featureName: string,
    permissionNames: string[]
  ): boolean => {
    const userPermissions = permissions[moduleName]?.[featureName] || [];
    return permissionNames.every(p => userPermissions.includes(p));
  };
  
  return { hasPermission, hasAnyPermission, hasAllPermissions };
}
```

### 3. Protected Route Component

```typescript
// ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { usePermission } from './usePermission';

interface ProtectedRouteProps {
  children: React.ReactNode;
  module: string;
  feature: string;
  permission: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  module,
  feature,
  permission,
  fallback
}: ProtectedRouteProps) {
  const { hasPermission } = usePermission();
  
  if (!hasPermission(module, feature, permission)) {
    return fallback ? <>{fallback}</> : <Navigate to="/unauthorized" />;
  }
  
  return <>{children}</>;
}
```

### 4. Permission-Based Component

```typescript
// PermissionGuard.tsx
import { usePermission } from './usePermission';

interface PermissionGuardProps {
  module: string;
  feature: string;
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  module,
  feature,
  permission,
  children,
  fallback = null
}: PermissionGuardProps) {
  const { hasPermission } = usePermission();
  
  if (!hasPermission(module, feature, permission)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// Usage:
// <PermissionGuard module="Administration" feature="Users" permission="Create">
//   <Button>Create User</Button>
// </PermissionGuard>
```

---

## UI Components Needed

### 1. Module Management Page
**Features:**
- List all modules in a table/grid
- Create new module (modal/drawer)
- Edit module (inline or modal)
- Delete module (with confirmation)
- Search and filter modules

**Required Permissions:**
- Read: View modules
- Create: Create new modules
- Update: Edit modules
- Delete: Delete modules

---

### 2. Feature Management Page
**Features:**
- List all features grouped by module
- Create new feature (select parent module)
- Edit feature
- Delete feature
- Filter by module

**Required Permissions:**
- Read: View features
- Create: Create new features
- Update: Edit features
- Delete: Delete features

---

### 3. Role Management Page
**Features:**
- List all roles with permission counts
- Create new role
- Edit role
- Delete role
- View role details (shows all permissions)

**Required Permissions:**
- Read: View roles
- Create: Create new roles
- Update: Edit roles
- Delete: Delete roles

---

### 4. Role Permission Matrix Component
**Complex component for managing role permissions:**

```
Module: Administration
  ├── Feature: Users
  │    ├── [x] Read
  │    ├── [x] Create
  │    ├── [x] Update
  │    └── [ ] Delete
  └── Feature: Roles
       ├── [x] Read
       └── [x] Create

Module: Task Management
  └── Feature: Tasks
       ├── [x] Read
       ├── [x] Create
       ├── [x] Update
       └── [x] Assign
```

**Implementation:**
1. Group by modules (accordion/expandable sections)
2. Each module shows its features
3. Each feature shows checkboxes for permission types
4. Store selected permissions and calculate permissionValue on save

**Sample Code:**
```typescript
interface PermissionSelection {
  moduleId: string;
  featureId: string;
  permissions: {
    permissionTypeId: string;
    isGranted: boolean;
  }[];
}

function RolePermissionMatrix({ 
  modules, 
  features, 
  permissionTypes,
  onPermissionsChange 
}) {
  const [selections, setSelections] = useState<PermissionSelection[]>([]);
  
  const handlePermissionToggle = (
    moduleId: string,
    featureId: string,
    permissionTypeId: string,
    isGranted: boolean
  ) => {
    // Update selections
    // ...
  };
  
  const buildPermissionDto = () => {
    return selections.map(sel => ({
      moduleId: sel.moduleId,
      featureId: sel.featureId,
      permissionFlags: sel.permissions
    }));
  };
  
  return (
    // Render matrix
  );
}
```

---

### 5. User Management Page
**Features:**
- List all users
- View user details
- Assign/unassign roles to users
- Filter by organization/role

**Required Permissions:**
- Read: View users
- Update: Assign roles to users

---

### 6. User Role Assignment Component
**Features:**
- Multi-select dropdown or transfer list
- Show current roles
- Add/remove roles
- Save changes

**API Call:**
```typescript
async function assignRolesToUser(userId: string, roleIds: string[]) {
  const response = await fetch(`/api/roles/assign/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(roleIds)
  });
  return response.json();
}
```

---

### 7. Current User Permissions Display
**Features:**
- Show in user profile/settings
- Display as a tree or matrix
- Read-only view

---

## Sample Workflow

### Creating a New Role with Permissions

1. **Fetch Required Data:**
```typescript
// Get all modules
const modules = await fetch('/api/modules').then(r => r.json());

// Get all features
const features = await fetch('/api/features').then(r => r.json());

// Get all permission types
const permissionTypes = await fetch('/api/permission-types').then(r => r.json());
```

2. **User Selects Permissions in UI:**
```typescript
// Example: Admin role with full access to Users feature
const selectedPermissions = [
  {
    moduleId: "module123",  // Administration
    featureId: "feature456", // Users
    permissionFlags: [
      { permissionTypeId: "perm1", isGranted: true },  // Read
      { permissionTypeId: "perm2", isGranted: true },  // Create
      { permissionTypeId: "perm3", isGranted: true },  // Update
      { permissionTypeId: "perm4", isGranted: true },  // Delete
    ]
  }
];
```

3. **Create Role:**
```typescript
const newRole = {
  name: "Administrator",
  displayName: "Administrator",
  description: "Full system access",
  permissions: selectedPermissions
};

const response = await fetch('/api/roles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newRole)
});
```

4. **Backend Calculates Permission Value:**
- Backend receives `permissionFlags`
- Calculates `permissionValue` using bitwise operations
- Stores role with calculated values

---

## Testing Checklist

### Module Management
- [ ] Create module
- [ ] List all modules
- [ ] Update module
- [ ] Delete module
- [ ] Search/filter modules

### Feature Management
- [ ] Create feature
- [ ] List all features
- [ ] Filter features by module
- [ ] Update feature
- [ ] Delete feature

### Permission Types
- [ ] Setup default permission types
- [ ] List permission types
- [ ] Create custom permission type
- [ ] Ensure unique bit positions

### Role Management
- [ ] Create role with permissions
- [ ] List all roles
- [ ] Update role
- [ ] Delete role
- [ ] Add permissions to existing role

### User-Role Assignment
- [ ] Assign single role to user
- [ ] Assign multiple roles to user
- [ ] Remove role from user
- [ ] View user's roles

### Permission Checking
- [ ] Get current user permissions
- [ ] Check permission in UI
- [ ] Hide/show components based on permissions
- [ ] Protect routes based on permissions

---

## Error Handling

### Common Error Responses
```typescript
// Module/Feature not found
{
  "message": "Module with ID module123 not found"
}

// Permission type not found
{
  "message": "Permission type with ID perm123 not found"
}

// Duplicate names
{
  "message": "A module with name 'Administration' already exists"
}

// Duplicate bit positions
{
  "message": "A permission type with bit position 2 already exists"
}

// Unauthorized
{
  "message": "Unauthorized"
}
```

---

## Best Practices

1. **Cache Permission Types:**
   - Permission types rarely change
   - Fetch once and cache in local storage or state

2. **Lazy Load Features:**
   - Only fetch features when module is selected
   - Reduces initial load time

3. **Debounce Search:**
   - When implementing search/filter
   - Prevent excessive API calls

4. **Optimistic Updates:**
   - Update UI immediately
   - Rollback on error

5. **Permission Check Caching:**
   - Cache permission check results
   - Re-fetch when user roles change

6. **Validation:**
   - Validate unique names on frontend
   - Validate bit positions (0-31 typically)
   - Check required fields before submit

---

## Additional Notes

### Authentication Flow
- Login → Receive access token with permissions embedded
- Store token in httpOnly cookie (already implemented)
- On app load, call `/api/auth/permissions` to get full permission structure
- Store in Redux/Zustand state
- Use throughout app for permission checks

### Permission Calculation
- Backend handles all bitwise operations
- Frontend only needs to send `permissionFlags` array
- Backend calculates and stores `permissionValue`
- Frontend receives human-readable permission names

### Hierarchy System
- Users have `parentLevel` (1=Institute, 2=College, 3=Department)
- Can be used for additional access control
- Not directly related to roles/permissions but available for filtering

---

## Quick Start Guide

### 1. Setup Default Permission Types
```http
POST /api/permission-types/setup-defaults
```

### 2. Create Modules
```typescript
const modules = [
  { name: "Administration", displayName: "Administration", description: "System admin" },
  { name: "TaskManagement", displayName: "Task Management", description: "Task features" },
];

for (const module of modules) {
  await fetch('/api/modules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(module)
  });
}
```

### 3. Create Features for Each Module
```typescript
const features = [
  { moduleId: "mod1", name: "Users", displayName: "Users", description: "User management" },
  { moduleId: "mod1", name: "Roles", displayName: "Roles", description: "Role management" },
  { moduleId: "mod2", name: "Tasks", displayName: "Tasks", description: "Task management" },
];

for (const feature of features) {
  await fetch('/api/features', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feature)
  });
}
```

### 4. Create Roles with Permissions
See "Creating a New Role with Permissions" section above.

### 5. Assign Roles to Users
```typescript
await fetch('/api/roles/assign/user123', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(['role123', 'role456'])
});
```

---

## Summary

This IAM system provides:
- **Granular Permission Control:** Module → Feature → Permission Type hierarchy
- **Bitwise Efficiency:** Fast permission checking using bitwise operations
- **Flexible Role Management:** Multiple roles per user
- **Scalable Architecture:** Easy to add new modules, features, and permission types
- **Frontend-Friendly:** Human-readable permission names in API responses

The frontend team should:
1. Build CRUD interfaces for Modules, Features, and Roles
2. Implement the Permission Matrix component for role management
3. Create user-role assignment interface
4. Use permission hooks/guards throughout the app
5. Test thoroughly with different role combinations

Good luck with the implementation! 🚀
