import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../../CommonComponents/Table/Table';
import { useAdmin } from './AdminContext';
import './Admin.css';

const AdminRoles = () => {
  const { roles, deleteRole, loading, error } = useAdmin();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRoles = useMemo(() => {
    return roles.filter(role =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(role.permissions).toLowerCase().includes(searchTerm.toLowerCase())
    ).map(role => ({
      ...role,
      permissions: formatPermissions(role.permissions)
    }));
  }, [roles, searchTerm]);

  const formatPermissions = (permissions) => {
    const modules = ['Users', 'Roles', 'Events'];
    const actions = ['Create', 'Read', 'Update', 'Delete'];

    const permissionStrings = [];
    modules.forEach(module => {
      const modulePerms = [];
      actions.forEach(action => {
        if (permissions[module] && permissions[module][action]) {
          modulePerms.push(action);
        }
      });
      if (modulePerms.length > 0) {
        permissionStrings.push(`${module}: ${modulePerms.join(', ')}`);
      }
    });

    return permissionStrings.join(' | ');
  };

  const columns = [
    { key: 'name', label: 'Role' },
    { key: 'permissions', label: 'Permissions' },
    { key: 'users', label: 'Users' },
    { key: 'created', label: 'Created' },
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
      <h2>Roles</h2>
      <p>Define roles and manage permissions.</p>
      <div className="search-bar">
        <button className="create-button" onClick={handleCreate}>Add Role</button>
        <input
          type="text"
          placeholder="Search roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <Table
        columns={columns}
        data={filteredRoles}
        noDataText="No roles found"
        loading={loading}
        onDuplicate={null}
        onArchive={null}
        onDelete={handleDelete}
        showActions={true}
        onEdit={handleEdit}
        onRowClick={handleEdit}
      />
    </div>
  );
};

export default AdminRoles;
