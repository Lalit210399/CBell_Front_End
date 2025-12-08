import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../Components/Admin/ProtectedRoute';
import DashboardLayout from '../Layouts/DashboardLayout';
import Login from '../Pages/Admin/Login';
import DashboardHome from '../Pages/Admin/DashboardHome';
import UsersManagement from '../Pages/Admin/UsersManagement';
import RolesManagement from '../Pages/Admin/RolesManagement';
import OrganizationsManagement from '../Pages/Admin/OrganizationsManagement';
import ModulesManagement from '../Pages/Admin/ModulesManagement';
import FeaturesManagement from '../Pages/Admin/FeaturesManagement';
import PermissionTypesManagement from '../Pages/Admin/PermissionTypesManagement';

const AdminRoutes = () => {
  return (
    <Routes>
      {/* Login Route */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard Home */}
        <Route index element={<DashboardHome />} />
        
        {/* Users Management */}
        <Route path="users" element={<UsersManagement />} />
        
        {/* Roles Management */}
        <Route path="roles" element={<RolesManagement />} />
        
        {/* Organizations Management */}
        <Route path="organizations" element={<OrganizationsManagement />} />
        
        {/* Permissions Setup */}
        <Route path="permissions">
          <Route path="modules" element={<ModulesManagement />} />
          <Route path="features" element={<FeaturesManagement />} />
          <Route path="types" element={<PermissionTypesManagement />} />
          <Route index element={<Navigate to="modules" replace />} />
        </Route>
      </Route>
      
      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AdminRoutes;
