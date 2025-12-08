# Admin Dashboard - Architecture Overview

## 📊 Component Hierarchy

```
AdminApp (Root)
│
├── Router
│   └── AdminRoutes
│       ├── /login → Login Page
│       │
│       └── /dashboard → DashboardLayout (Protected)
│           ├── Sidebar Navigation
│           ├── Top Navbar
│           │
│           └── Page Content (Outlet)
│               ├── / → DashboardHome
│               ├── /users → UsersManagement
│               │   ├── CreateUserModal
│               │   └── AssignRoleModal
│               ├── /roles → RolesManagement
│               │   ├── CreateRoleModal
│               │   └── ViewPermissionsModal
│               ├── /organizations → OrganizationsManagement
│               │   └── CreateOrganizationModal
│               └── /permissions/
│                   ├── modules → ModulesManagement
│                   ├── features → FeaturesManagement
│                   └── types → PermissionTypesManagement
│
└── Toaster (Notifications)
```

## 🔄 Data Flow

```
User Action
    ↓
Component Event Handler
    ↓
API Service Function (api.js)
    ↓
Fetch Request + JWT Token
    ↓
Backend API Endpoint
    ↓
Response Data
    ↓
Component State Update
    ↓
UI Re-render + Toast Notification
```

## 🔐 Authentication Flow

```
Login Page
    ↓
Submit Credentials
    ↓
POST /api/auth/login
    ↓
Receive JWT Token
    ↓
Store in localStorage (authStore)
    ↓
Redirect to /dashboard
    ↓
ProtectedRoute checks token
    ↓
If valid → Show Dashboard
If invalid → Redirect to Login
```

## 📦 State Management

### Zustand Store (authStore.js)
```javascript
{
  user: { ...userData },
  token: "jwt_token_string",
  isAuthenticated: true/false,
  loading: false,
  error: null,
  
  // Actions
  login(credentials),
  logout(),
  setUser(user),
  clearError()
}
```

### Component Local State
Each management page maintains:
- List data (users, roles, orgs, etc.)
- Loading states
- Modal visibility
- Form data
- Search/filter values

## 🎯 Permissions Builder Logic

```
CreateRoleModal
    │
    ├── Fetch Modules → GET /api/modules
    │   └── Display in dropdown
    │
    ├── User selects Module
    │   └── Fetch Features → GET /api/features?moduleId={id}
    │       └── Display in dropdown
    │
    ├── User selects Feature
    │   └── Display Permission Types (pre-fetched)
    │       └── Checkboxes for each type
    │
    ├── User checks permissions
    │   └── Click "Add Permission"
    │       └── Create permission object:
    │           {
    │             moduleId: "...",
    │             featureId: "...",
    │             permissionFlags: [
    │               { permissionTypeId: "...", isGranted: true }
    │             ]
    │           }
    │       └── Add to addedPermissions array
    │       └── Display as card
    │
    └── Submit Form
        └── POST /api/roles with all permissions
```

## 🗺️ Routing Structure

```
/
├── /login (Public)
│
└── /dashboard (Protected)
    ├── / (Dashboard Home)
    ├── /users (Users Management)
    ├── /roles (Roles Management)
    ├── /organizations (Organizations)
    └── /permissions
        ├── /modules (Modules Setup)
        ├── /features (Features Setup)
        └── /types (Permission Types Setup)
```

## 🎨 Styling Architecture

```
Global Styles
├── AdminApp.css (Reset, global rules)
│
Layout Styles
├── DashboardLayout.css (Sidebar, navbar, main content)
│
Page-Specific Styles
├── Login.css
├── DashboardHome.css
├── UsersManagement.css
├── RolesManagement.css
├── OrganizationsManagement.css
└── PermissionsSetup.css
│
Shared Component Styles
└── Modal.css (All modals)
```

## 📡 API Service Organization

```javascript
// api.js structure

// Config
API_BASE_URLS = { auth, contentCreator }

// Token Management
getToken()
setToken(token)
removeToken()

// Generic Fetch
fetchApi(url, options) → Auto-adds token, handles 401

// Endpoint Groups
authApi = { login, register, getCurrentUser }
usersApi = { getAll, getById, update, delete }
rolesApi = { getAll, getById, create, update, delete, assignToUser, removeFromUser }
organizationsApi = { getAll, getById, create, update, delete }
permissionsApi = { getModules, getFeatures, getPermissionTypes, create... }
```

## 🔄 Modal Workflow Pattern

```
Parent Component
    │
    ├── State: showModal = false
    ├── State: selectedItem = null
    │
    ├── Button onClick → setShowModal(true)
    │
    └── Render Modal Component
        ├── Props: onClose, onSuccess, data
        │
        ├── Form with React Hook Form
        │   ├── Validation rules
        │   └── onSubmit handler
        │
        ├── API call (create/update)
        │   ├── Success → onSuccess()
        │   └── Error → Show toast
        │
        └── onSuccess callback
            ├── Close modal
            ├── Refresh parent data
            └── Show success toast
```

## 🎯 User Management Flow Example

```
UsersManagement Component
    │
    ├── useEffect → fetchUsers()
    │   └── GET /api/users → Set users state
    │
    ├── Search input onChange
    │   └── Filter users array
    │
    ├── "Create User" button click
    │   └── Show CreateUserModal
    │       ├── Form submission
    │       ├── POST /api/auth/register
    │       ├── Success → Close modal
    │       └── Refresh users list
    │
    ├── "Assign Role" button click
    │   └── Show AssignRoleModal
    │       ├── Fetch all roles
    │       ├── Display with checkboxes
    │       ├── Submit selected roles
    │       ├── POST /api/roles/assign/{userId}
    │       └── Refresh users list
    │
    └── Pagination controls
        └── Slice users array for current page
```

## 🔒 Security Measures

```
1. JWT Token Storage
   └── localStorage (can upgrade to httpOnly cookies)

2. Protected Routes
   └── ProtectedRoute component checks authentication

3. API Request Headers
   └── Authorization: Bearer {token}

4. Auto-logout on 401
   └── fetchApi() handles unauthorized responses

5. Form Validation
   └── Client-side with React Hook Form
   └── Server-side validation expected on backend
```

## 📱 Responsive Design Strategy

```
Desktop (> 768px)
├── Sidebar: 260px wide
├── Multi-column grids
└── Full tables

Tablet (768px)
├── Sidebar: Collapsible
├── 2-column grids
└── Horizontal scroll tables

Mobile (< 768px)
├── Sidebar: Fixed overlay
├── Single column
└── Stacked cards instead of tables
```

## 🎨 Color System

```
Primary Colors:
├── Purple: #667eea (Buttons, links)
├── Dark Purple: #764ba2 (Gradients)

Status Colors:
├── Success: #48bb78 (Active, success)
├── Danger: #f56565 (Error, delete)
├── Info: #0891b2 (Badges, info)
├── Warning: #ed8936 (Pending states)

Neutral Colors:
├── Dark: #2d3748 (Text)
├── Medium: #718096 (Secondary text)
├── Light: #cbd5e0 (Borders)
├── Lighter: #e2e8f0 (Backgrounds)
├── Lightest: #f7fafc (Cards, hover)
```

## 🚀 Performance Optimizations

1. **Lazy Loading**: Can implement React.lazy for routes
2. **Pagination**: Users table doesn't load all data at once
3. **Debounced Search**: Can add debounce to search inputs
4. **Memoization**: Can use React.memo for list items
5. **Optimistic Updates**: Can implement for better UX

## 🧩 Extensibility Points

### Add New Page
```
1. Create component in src/Pages/Admin/NewPage.js
2. Add route in src/routes/adminRoutes.js
3. Add menu item in src/Layouts/DashboardLayout.js
4. Add API functions in src/Services/api.js (if needed)
```

### Add New API Endpoint
```
1. Open src/Services/api.js
2. Add to appropriate API object:
   newEndpoint: (params) => 
     fetchApi(`${API_BASE_URLS.auth}/new-endpoint`, {
       method: 'POST',
       body: JSON.stringify(params)
     })
3. Use in component: await apiObject.newEndpoint(data)
```

### Add New Modal
```
1. Create Modal component with props: onClose, onSuccess, data
2. Use Modal.css for consistent styling
3. Implement form with React Hook Form
4. Call API endpoint on submit
5. Call onSuccess() callback
6. Parent component manages modal visibility
```

## 📊 Data Models

### User Object
```javascript
{
  _id: "...",
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  organizationCode: "ORG001",
  parentLevel: 3,
  roles: [{ name: "Admin", displayName: "Administrator" }],
  isActive: true
}
```

### Role Object
```javascript
{
  _id: "...",
  name: "HOD",
  displayName: "Head of Department",
  description: "Full access role",
  permissions: [
    {
      moduleId: "...",
      featureId: "...",
      permissionFlags: [
        { permissionTypeId: "...", isGranted: true }
      ]
    }
  ]
}
```

### Organization Object
```javascript
{
  _id: "...",
  name: "Acme Corporation",
  code: "ACME_CORP",
  description: "Main organization",
  isActive: true
}
```

## 🔍 Testing Strategy (Not Implemented)

Recommended testing approach:
```
1. Unit Tests
   ├── API service functions
   ├── Auth store actions
   └── Utility functions

2. Integration Tests
   ├── Login flow
   ├── CRUD operations
   └── Permission assignment

3. E2E Tests
   ├── Complete user journey
   ├── Role creation with permissions
   └── User management workflow
```

---

**This architecture provides a solid foundation for scalable admin dashboard development!**
