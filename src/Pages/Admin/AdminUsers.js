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
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'organizationId', label: 'Organization' },
    { key: 'status', label: 'Status' },
  ];

  const handleAssignRoles = (user) => {
    navigate(`/admin/users/${user.id}/roles`);
  };

  const renderCell = (key, item) => {
    if (key === 'status') {
      return <span className={item.status === 'Active' ? 'status-active' : 'status-inactive'}>{item.status}</span>;
    }
    return item[key];
  };

  if (loading) return <div className="loading">Loading users...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-users">
      <h2>Users Management</h2>
      <div className="search-bar">
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
