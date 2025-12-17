import React from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../../CommonComponents/Table/Table';
import { useAdmin } from './AdminContext';
import './Admin.css';

const AdminRoles = () => {
  const { roles, deleteRole, loading, error } = useAdmin();
  const navigate = useNavigate();

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'displayName', label: 'Display Name' },
    { key: 'description', label: 'Description' },
  ];

  const handleEdit = (role) => {
    navigate(`/admin/roles/${role.id}/edit`);
  };

  const handleDelete = (role) => {
    if (window.confirm(`Are you sure you want to delete the role "${role.displayName}"?`)) {
      deleteRole(role.id);
    }
  };

  const handleCreate = () => {
    navigate('/admin/roles/create');
  };

  if (loading) return <div className="loading">Loading roles...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-roles">
      <h2>Roles Management</h2>
      <button className="create-button" onClick={handleCreate}>Create Role</button>
      <Table
        columns={columns}
        data={roles}
        noDataText="No roles found"
        loading={loading}
        onDuplicate={null}
        onArchive={null}
        onDelete={handleDelete}
        showActions={true}
        onAction={handleEdit}
        actionLabel="Edit"
      />
    </div>
  );
};

export default AdminRoles;
