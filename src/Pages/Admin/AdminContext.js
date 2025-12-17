import React, { createContext, useContext, useState, useEffect } from 'react';

// Mock data
const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', organizationId: 'Org1', roles: [1], status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', organizationId: 'Org2', roles: [2], status: 'Active' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', organizationId: 'Org1', roles: [1, 2], status: 'Inactive' },
];

const mockRoles = [
  {
    id: 1,
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full access to all features',
    permissions: {
      Users: { Create: true, Read: true, Update: true, Delete: true },
      Roles: { Create: true, Read: true, Update: true, Delete: true },
      Events: { Create: true, Read: true, Update: true, Delete: true },
    },
  },
  {
    id: 2,
    name: 'user',
    displayName: 'User',
    description: 'Basic user access',
    permissions: {
      Users: { Create: false, Read: true, Update: false, Delete: false },
      Roles: { Create: false, Read: false, Update: false, Delete: false },
      Events: { Create: true, Read: true, Update: true, Delete: false },
    },
  },
];

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [users, setUsers] = useState(mockUsers);
  const [roles, setRoles] = useState(mockRoles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const login = (email, password) => {
    setLoading(true);
    setTimeout(() => {
      if (email === 'admin@example.com' && password === 'password') {
        setIsLoggedIn(true);
        setError(null);
      } else {
        setError('Invalid credentials');
      }
      setLoading(false);
    }, 1000);
  };

  const updateUserRoles = (userId, newRoles) => {
    setUsers(prev => prev.map(user =>
      user.id === parseInt(userId) ? { ...user, roles: newRoles } : user
    ));
  };

  const createRole = (roleData) => {
    const newRole = {
      ...roleData,
      id: Math.max(...roles.map(r => r.id)) + 1,
    };
    setRoles(prev => [...prev, newRole]);
  };

  const updateRole = (roleId, roleData) => {
    setRoles(prev => prev.map(role =>
      role.id === parseInt(roleId) ? { ...role, ...roleData } : role
    ));
  };

  const deleteRole = (roleId) => {
    setRoles(prev => prev.filter(role => role.id !== parseInt(roleId)));
  };

  return (
    <AdminContext.Provider value={{
      users,
      roles,
      loading,
      error,
      updateUserRoles,
      createRole,
      updateRole,
      deleteRole,
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
