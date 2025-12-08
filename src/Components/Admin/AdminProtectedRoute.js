import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../../Context/UserContext';

const AdminProtectedRoute = ({ children }) => {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '16px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  // Check if user is logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has Admin role
  const isAdmin = user.roles?.some(role => 
    role.name === 'Admin' || 
    role.name === 'SuperAdmin' || 
    role.name === 'Administrator'
  );

  if (!isAdmin) {
    // User is logged in but not admin, redirect to their dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminProtectedRoute;
