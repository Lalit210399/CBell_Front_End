# 🚀 Admin Dashboard - Quick Reference Card

## ⚡ Quick Start (3 Steps)

```powershell
# 1. Run setup script
.\setup-admin.ps1

# 2. Wait for server to start

# 3. Open browser
# http://localhost:3000/login
```

## 🔑 Login Credentials
Use your API credentials:
- Email: your-admin@example.com
- Password: your-password

## 📍 Main URLs

| Page | URL |
|------|-----|
| Login | `/login` |
| Dashboard Home | `/dashboard` |
| Users Management | `/dashboard/users` |
| Roles Management | `/dashboard/roles` |
| Organizations | `/dashboard/organizations` |
| Modules | `/dashboard/permissions/modules` |
| Features | `/dashboard/permissions/features` |
| Permission Types | `/dashboard/permissions/types` |

## 🔌 API Endpoints (Backend Required)

```
Authentication API: http://localhost:5001/api
Content Creator API: http://localhost:5002/api
```

**Make sure these backend services are running!**

## 📦 Dependencies

Already have React Router? Just install:
```powershell
npm install zustand sonner react-hook-form
```

## 🎯 Common Tasks

### Create a New User
1. Dashboard → Users Management
2. Click "Create User"
3. Fill form → Submit
4. ✅ Done!

### Create a Role with Permissions
1. Dashboard → Roles Management
2. Click "Create Role"
3. Enter role details
4. **Build Permissions:**
   - Select Module
   - Select Feature
   - Check Permission Types
   - Click "Add Permission"
5. Repeat step 4 for more permissions
6. Click "Create Role"
7. ✅ Done!

### Assign Roles to User
1. Dashboard → Users Management
2. Find user → Click "Assign Role"
3. Check desired roles
4. Click "Assign Roles"
5. ✅ Done!

### Create Organization
1. Dashboard → Organizations
2. Click "Create Organization"
3. Enter Name, Code, Description
4. ✅ Done!

### Create Module/Feature/Permission Type
1. Dashboard → Permissions Setup
2. Choose: Modules / Features / Permission Types
3. Click create button
4. Fill form → Submit
5. ✅ Done!

## 🎨 Features at a Glance

✅ **Login System** - JWT authentication  
✅ **Users CRUD** - Create, list, search, assign roles  
✅ **Roles CRUD** - Create with granular permissions  
✅ **Organizations CRUD** - Manage org hierarchy  
✅ **Permissions Builder** - Module → Feature → Type  
✅ **Protected Routes** - Auth guard on all pages  
✅ **Responsive UI** - Works on all devices  
✅ **Toast Notifications** - Visual feedback  
✅ **Form Validation** - React Hook Form  
✅ **Search & Filter** - Users table  
✅ **Pagination** - Large data sets  

## 🔄 Switch Between Apps

### To Admin Dashboard:
```powershell
.\setup-admin.ps1
```

### Back to Main App:
```powershell
.\restore-main-app.ps1
```

## 🎨 Tech Stack

- React 19
- JavaScript
- React Router DOM
- Zustand (State)
- React Hook Form
- Sonner (Toasts)
- Fetch API
- Pure CSS

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/AdminApp.js` | Admin app root |
| `src/Services/api.js` | All API calls |
| `src/stores/authStore.js` | Auth state |
| `src/routes/adminRoutes.js` | Routing |
| `src/Layouts/DashboardLayout.js` | Main layout |

## 🐛 Troubleshooting

### Can't login?
- ✅ Backend running on port 5001?
- ✅ CORS enabled on backend?
- ✅ Check browser console for errors

### API errors?
- ✅ Check `src/Services/api.js` for correct URLs
- ✅ Verify backend endpoints match
- ✅ Check network tab in DevTools

### Styles broken?
- ✅ Clear browser cache
- ✅ Hard refresh (Ctrl + F5)
- ✅ Check CSS files imported correctly

## 💡 Pro Tips

1. **Open DevTools** - Network tab shows all API calls
2. **Check Console** - See any JavaScript errors
3. **Use Search** - Users page has search functionality
4. **Permissions Builder** - Can add multiple permissions before creating role
5. **Toast Notifications** - Green = success, Red = error
6. **Logout** - Top right corner, always accessible

## 📚 Full Documentation

See `ADMIN_DASHBOARD_README.md` for complete guide.

## 🎯 Create Role API Payload Format

```json
{
  "name": "HOD",
  "displayName": "Head of Department",
  "description": "Full access role",
  "permissions": [
    {
      "moduleId": "module_id_here",
      "featureId": "feature_id_here",
      "permissionFlags": [
        { "permissionTypeId": "type_id", "isGranted": true }
      ]
    }
  ]
}
```

---

## 🎉 You're All Set!

The admin dashboard is ready to use. Start by:
1. Running the setup script
2. Logging in
3. Creating your first module
4. Creating features under that module
5. Creating permission types
6. Creating roles with permissions
7. Creating users and assigning roles

**Happy Managing! 🚀**

---

**Need Help?**  
Check `ADMIN_DASHBOARD_README.md` for detailed documentation.
