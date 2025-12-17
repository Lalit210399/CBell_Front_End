import React, { createContext, useContext, useState, useEffect } from 'react';

// Mock data for testing
const mockUsers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    roles: ['Admin'],
    status: 'Active'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    roles: ['User'],
    status: 'Active'
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    roles: ['Manager'],
    status: 'Inactive'
  }
];

const mockRoles = [
  {
    id: 1,
    name: 'Admin',
    description: 'Full system access',
    permissions: ['read', 'write', 'delete', 'manage_users', 'manage_roles']
  },
  {
    id: 2,
    name: 'Manager',
    description: 'Management access',
    permissions: ['read', 'write', 'manage_users']
  },
  {
    id: 3,
    name: 'User',
    description: 'Basic user access',
    permissions: ['read']
  }
];

const IAMContext = createContext();

export const IAMProvider = ({ children }) => {
  const [users, setUsers] = useState(mockUsers);
  const [roles, setRoles] = useState(mockRoles);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Demo credentials check
    if (email === 'admin@example.com' && password === 'password') {
      const user = {
        id: 0,
        name: 'Admin User',
        email: 'admin@example.com',
        roles: ['Admin']
      };
      setCurrentUser(user);
      setLoading(false);
      return true;
    } else {
      setError('Invalid credentials');
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setError(null);
  };

  const createRole = async (roleData) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const newRole = {
      id: roles.length + 1,
      ...roleData
    };
    setRoles([...roles, newRole]);
    setLoading(false);
    return newRole;
  };

  const updateRole = async (roleId, roleData) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    setRoles(roles.map(role =>
      role.id === roleId ? { ...role, ...roleData } : role
    ));
    setLoading(false);
  };

  const deleteRole = async (roleId) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    setRoles(roles.filter(role => role.id !== roleId));
    setLoading(false);
  };

  const assignRoleToUser = async (userId, roleName) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    setUsers(users.map(user =>
      user.id === userId
        ? { ...user, roles: [...user.roles, roleName] }
        : user
    ));
    setLoading(false);
  };

  const removeRoleFromUser = async (userId, roleName) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    setUsers(users.map(user =>
      user.id === userId
        ? { ...user, roles: user.roles.filter(role => role !== roleName) }
        : user
    ));
    setLoading(false);
  };

  const value = {
    users,
    roles,
    currentUser,
    loading,
    error,
    login,
    logout,
    createRole,
    updateRole,
    deleteRole,
    assignRoleToUser,
    removeRoleFromUser
  };

  return (
    <IAMContext.Provider value={value}>
      {children}
    </IAMContext.Provider>
  );
};

export const useIAM = () => {
  const context = useContext(IAMContext);
  if (!context) {
    throw new Error('useIAM must be used within an IAMProvider');
  }
  return context;
};

export default IAMContext;
