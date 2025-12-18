import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../../CommonComponents/Table/Table';
import { useAdmin } from './AdminContext';
import './Admin.css';

const AdminUsers = () => {
  const { users, roles, loading, error } = useAdmin();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'organizationName', label: 'Organization' },
    { key: 'organizationCode', label: 'Org Code' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
  ];

  const handleAssignRoles = (user) => {
    navigate(`/admin/users/${user.id}/roles`);
  };

  const handleAddUser = () => {
    navigate('/admin/users/create');
  };

  const renderCell = (key, item) => {
    if (key === 'name') {
      return `${item.firstName} ${item.lastName}`;
    }
    if (key === 'status') {
      return <span className={item.status === 'Active' ? 'status-active' : 'status-inactive'}>{item.status}</span>;
    }
    if (key === 'role') {
      // Get role names from roles array
      const userRoles = item.roles.map(roleId => {
        const role = roles.find(r => r.id === roleId);
        return role ? role.displayName : 'Unknown';
      });
      return userRoles.join(', ');
    }
    return item[key];
  };

  if (loading) return <div className="loading">Loading users...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-users">
      <h2>Users</h2>
      <p>Manage user accounts and permissions.</p>
      <div className="search-bar">
        <button className="create-button" onClick={handleAddUser}>Add User</button>
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <Table
        columns={columns}
        data={filteredUsers}
        renderCell={renderCell}
        noDataText="No users found"
        loading={loading}
        onRowClick={handleAssignRoles}
        showActions={true}
        actionLabel="Assign Roles"
        onAction={handleAssignRoles}
      />
    </div>
  );
};

export default AdminUsers;
