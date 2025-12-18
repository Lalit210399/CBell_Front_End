import React, { createContext, useContext, useState, useEffect } from 'react';

// Mock data with Indian names and comprehensive details
const mockUsers = [
  {
    id: 1,
    firstName: 'Amit',
    lastName: 'Sharma',
    email: 'amit.sharma@aissms.edu.in',
    organizationName: 'All India Shri Shivaji Memorial Society',
    organizationCode: 'AISSMS',
    roles: [2], // Admin role id
    status: 'Active'
  },
  {
    id: 2,
    firstName: 'Priya',
    lastName: 'Patel',
    email: 'priya.patel@aissms.edu.in',
    organizationName: 'All India Shri Shivaji Memorial Society',
    organizationCode: 'AISSMS',
    roles: [5], // User role id
    status: 'Active'
  },
  {
    id: 3,
    firstName: 'Rajesh',
    lastName: 'Kumar',
    email: 'rajesh.kumar@aissms.edu.in',
    organizationName: 'All India Shri Shivaji Memorial Society',
    organizationCode: 'AISSMS',
    roles: [2], // Admin role id
    status: 'Active'
  },
  {
    id: 4,
    firstName: 'Sneha',
    lastName: 'Singh',
    email: 'sneha.singh@aissms.edu.in',
    organizationName: 'All India Shri Shivaji Memorial Society',
    organizationCode: 'AISSMS',
    roles: [5], // User role id
    status: 'Inactive'
  },
  {
    id: 5,
    firstName: 'Vikram',
    lastName: 'Verma',
    email: 'vikram.verma@aissms.edu.in',
    organizationName: 'All India Shri Shivaji Memorial Society',
    organizationCode: 'AISSMS',
    roles: [2], // Admin role id
    status: 'Active'
  },
];

const mockRoles = [
  {
    id: 1,
    name: 'super_admin',
    displayName: 'Super Administrator',
    description: 'Complete system access with all permissions',
    permissions: {
      Users: { Create: true, Read: true, Update: true, Delete: true },
      Roles: { Create: true, Read: true, Update: true, Delete: true },
      Events: { Create: true, Read: true, Update: true, Delete: true },
    },
    users: 1,
    created: '2023-01-01',
  },
  {
    id: 2,
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full administrative access except system settings',
    permissions: {
      Users: { Create: true, Read: true, Update: true, Delete: true },
      Roles: { Create: true, Read: true, Update: true, Delete: true },
      Events: { Create: true, Read: true, Update: true, Delete: true },
    },
    users: 3,
    created: '2023-01-15',
  },
  {
    id: 3,
    name: 'manager',
    displayName: 'Manager',
    description: 'Management access for users and events',
    permissions: {
      Users: { Create: false, Read: true, Update: true, Delete: false },
      Roles: { Create: false, Read: true, Update: false, Delete: false },
      Events: { Create: true, Read: true, Update: true, Delete: true },
    },
    users: 0,
    created: '2023-02-01',
  },
  {
    id: 4,
    name: 'moderator',
    displayName: 'Moderator',
    description: 'Content moderation and user management',
    permissions: {
      Users: { Create: false, Read: true, Update: true, Delete: false },
      Roles: { Create: false, Read: true, Update: false, Delete: false },
      Events: { Create: false, Read: true, Update: true, Delete: false },
    },
    users: 0,
    created: '2023-02-15',
  },
  {
    id: 5,
    name: 'user',
    displayName: 'User',
    description: 'Basic user access with limited permissions',
    permissions: {
      Users: { Create: false, Read: false, Update: false, Delete: false },
      Roles: { Create: false, Read: false, Update: false, Delete: false },
      Events: { Create: false, Read: true, Update: false, Delete: false },
    },
    users: 2,
    created: '2023-03-01',
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

  const createUser = (userData) => {
    const newUser = {
      ...userData,
      id: Math.max(...users.map(u => u.id)) + 1,
      status: 'Active',
    };
    setUsers(prev => [...prev, newUser]);
  };

  return (
    <AdminContext.Provider value={{
      users,
      roles,
      loading,
      error,
      isLoggedIn,
      login,
      updateUserRoles,
      createRole,
      updateRole,
      deleteRole,
      createUser,
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
