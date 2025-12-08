# Admin Dashboard - Complete Setup Guide

## 🎯 Overview

A complete admin dashboard UI for managing users, roles, organizations, and permissions built with React and modern web technologies.

## 📦 Technology Stack

- **React 19** with JavaScript
- **React Router DOM** for navigation
- **Zustand** for state management
- **React Hook Form** for form validation
- **Sonner** for toast notifications
- **Fetch API** for HTTP requests
- **CSS** for styling

## 🚀 Quick Start

### Option 1: Run Admin Dashboard Separately

To run only the admin dashboard:

1. **Temporarily rename index.js files:**
   ```powershell
   # Backup current index.js
   Move-Item src\index.js src\index-main.js.backup
   
   # Use admin index
   Move-Item src\admin-index.js src\index.js
   ```

2. **Start the development server:**
   ```powershell
   npm start
   ```

3. **Access the admin dashboard:**
   - Open http://localhost:3000/login
   - Use your API credentials to log in

4. **To switch back to main app:**
   ```powershell
   Move-Item src\index.js src\admin-index.js
   Move-Item src\index-main.js.backup src\index.js
   ```

### Option 2: Integrate into Existing App

Add admin routes to your existing `App.js`:

```javascript
import AdminRoutes from './routes/adminRoutes';

// Add this route in your App.js Routes
<Route path="/admin/*" element={<AdminRoutes />} />
```

Then access admin at: http://localhost:3000/admin/login

## 🔧 Installation

Required dependencies (if not already installed):

```powershell
npm install zustand sonner react-hook-form
```

## 📁 Project Structure

```
src/
├── AdminApp.js                    # Admin app entry point
├── admin-index.js                 # Admin-only index file
├── stores/
│   └── authStore.js              # Zustand auth store
├── Services/
│   └── api.js                    # API utilities and endpoints
├── routes/
│   └── adminRoutes.js            # Admin routing configuration
├── Components/
│   └── Admin/
│       └── ProtectedRoute.js     # Route protection
├── Layouts/
│   ├── DashboardLayout.js        # Main dashboard layout
│   └── DashboardLayout.css
└── Pages/
    └── Admin/
        ├── Login.js              # Login page
        ├── DashboardHome.js      # Dashboard home
        ├── UsersManagement.js    # Users CRUD
        ├── RolesManagement.js    # Roles with permissions
        ├── OrganizationsManagement.js
        ├── ModulesManagement.js
        ├── FeaturesManagement.js
        ├── PermissionTypesManagement.js
        └── (modals and CSS files)
```

## 🔐 API Configuration

### Base URLs
Located in `src/Services/api.js`:
- **Authentication API:** http://localhost:5001/api
- **Content Creator API:** http://localhost:5002/api

### API Endpoints Used

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Create new user
- `GET /api/auth/me` - Get current user

#### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

#### Roles
- `GET /api/roles` - Get all roles
- `POST /api/roles` - Create role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role
- `POST /api/roles/assign/:userId` - Assign roles to user
- `DELETE /api/roles/remove/:userId/:roleId` - Remove role from user

#### Organizations
- `GET /api/organizations` - Get all organizations
- `POST /api/organizations` - Create organization
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization

#### Permissions
- `GET /api/modules` - Get all modules
- `POST /api/modules` - Create module
- `GET /api/features?moduleId={id}` - Get features by module
- `POST /api/features` - Create feature
- `GET /api/permission-types` - Get permission types
- `POST /api/permission-types` - Create permission type

## 📄 Pages & Features

### 1. Login Page (`/login`)
- Email and password authentication
- Form validation
- JWT token storage in localStorage
- Auto-redirect to dashboard on success
- Error message display

### 2. Dashboard Home (`/dashboard`)
- Overview cards for each management section
- Quick action buttons
- Protected by authentication

### 3. Users Management (`/dashboard/users`)
- **List View:**
  - Searchable table with pagination
  - Filter by organization
  - Display: Email, Name, Org, Parent Level, Roles, Status
- **Create User:**
  - Email, First Name, Last Name, Password, Organization
  - Form validation with React Hook Form
  - Success notification with parent level
- **Assign Roles:**
  - Multi-select role assignment
  - View currently assigned roles
  - Remove individual roles

### 4. Roles Management (`/dashboard/roles`)
- **List View:**
  - Role name, display name, description, permission count
  - Edit and view permissions actions
- **Create/Edit Role:**
  - Basic info: Name, Display Name, Description
  - **Permissions Builder:**
    - Step 1: Select Module
    - Step 2: Select Feature (filtered by module)
    - Step 3: Select Permission Types (checkboxes)
    - Add multiple module-feature-permission combinations
    - Visual cards showing added permissions
- **View Permissions:**
  - Read-only view of role permissions

### 5. Organizations Management (`/dashboard/organizations`)
- Create, edit, delete organizations
- Organization code, name, description
- Active/inactive status toggle

### 6. Permissions Setup

#### Modules (`/dashboard/permissions/modules`)
- Create and view modules
- Module name and description

#### Features (`/dashboard/permissions/features`)
- Create features linked to modules
- Feature name and description

#### Permission Types (`/dashboard/permissions/types`)
- Create permission types (Create, Read, Update, Delete, ViewAll, etc.)
- Type name and description

## 🎨 UI Components

### Layout Components
- **DashboardLayout:** Sidebar + top navbar
- **Sidebar:** Collapsible navigation menu
- **Top Navbar:** User info and logout button

### Modals
- CreateUserModal
- AssignRoleModal
- CreateRoleModal (with permissions builder)
- ViewPermissionsModal
- CreateOrganizationModal

### Common Elements
- Tables with pagination
- Search and filter bars
- Form inputs with validation
- Badge components for status/tags
- Action buttons
- Loading states

## 🔒 Authentication & Authorization

### Token Management
- JWT stored in localStorage
- Auto-added to request headers
- Auto-redirect to login on 401 errors

### Protected Routes
All dashboard routes require valid authentication token.

## 🎯 Create Role API Payload Example

```json
{
  "name": "HOD",
  "displayName": "Head of Department",
  "description": "Department head with full access",
  "permissions": [
    {
      "moduleId": "675566f4a018920dfb8e8d27",
      "featureId": "675566f4a018920dfb8e8d29",
      "permissionFlags": [
        { 
          "permissionTypeId": "67570b5c8cdc4e6c13685d00", 
          "isGranted": true 
        },
        { 
          "permissionTypeId": "67570b5c8cdc4e6c13685d01", 
          "isGranted": true 
        }
      ]
    }
  ]
}
```

## 📱 Responsive Design

All pages are fully responsive:
- Desktop: Full sidebar + multi-column layouts
- Tablet: Optimized grid layouts
- Mobile: Single column, collapsible sidebar

## 🎨 Styling

- Custom CSS with modern gradients
- Consistent color scheme:
  - Primary: Purple gradient (#667eea to #764ba2)
  - Success: Green (#48bb78)
  - Danger: Red (#f56565)
  - Info: Blue (#0891b2)
- Hover effects and transitions
- Card-based layouts
- Shadow and depth effects

## 🔧 Customization

### Change API URLs
Edit `src/Services/api.js`:
```javascript
const API_BASE_URLS = {
  auth: 'http://your-api-url:5001/api',
  contentCreator: 'http://your-api-url:5002/api'
};
```

### Modify Colors
Update CSS files in `src/Pages/Admin/` directory.

### Add New Pages
1. Create component in `src/Pages/Admin/`
2. Add route in `src/routes/adminRoutes.js`
3. Add menu item in `src/Layouts/DashboardLayout.js`

## 🐛 Troubleshooting

### "Network Error" or "Failed to fetch"
- Ensure API servers are running on correct ports
- Check CORS configuration on backend
- Verify API base URLs in `api.js`

### "Unauthorized" errors
- Check if JWT token is valid
- Verify token is being sent in headers
- Check backend authentication middleware

### Styles not loading
- Clear browser cache
- Check CSS file imports
- Verify CSS files are in correct directories

## 📝 Development Tips

1. **State Management:** Auth state is managed with Zustand
2. **Forms:** All forms use React Hook Form for validation
3. **Notifications:** Use `toast` from Sonner for user feedback
4. **API Calls:** Use utility functions from `api.js`
5. **Error Handling:** All API calls have try-catch blocks

## 🚀 Production Deployment

Before deploying:

1. Update API URLs to production endpoints
2. Enable httpOnly cookies for token storage (recommended)
3. Add environment variables for sensitive data
4. Enable SSL/TLS
5. Configure CORS properly
6. Add rate limiting on backend

## 📞 Support

For issues or questions:
- Check API endpoint documentation
- Verify network requests in browser DevTools
- Check console for JavaScript errors
- Review backend logs for API errors

---

**Built with ❤️ using React and modern web technologies**
