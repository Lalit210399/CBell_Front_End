import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { rolesApi } from '../../Services/api';
import CreateRoleModal from './CreateRoleModal';
import ViewPermissionsModal from './ViewPermissionsModal';
import './RolesManagement.css';

const RolesManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await rolesApi.getAll();
      setRoles(Array.isArray(data) ? data : data.roles || []);
    } catch (error) {
      toast.error('Failed to fetch roles');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = () => {
    setSelectedRole(null);
    setEditMode(false);
    setShowCreateModal(true);
  };

  const handleEditRole = (role) => {
    setSelectedRole(role);
    setEditMode(true);
    setShowCreateModal(true);
  };

  const handleViewPermissions = (role) => {
    setSelectedRole(role);
    setShowViewModal(true);
  };

  const handleRoleSaved = () => {
    setShowCreateModal(false);
    setSelectedRole(null);
    setEditMode(false);
    fetchRoles();
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role?')) {
      return;
    }

    try {
      await rolesApi.delete(roleId);
      toast.success('Role deleted successfully');
      fetchRoles();
    } catch (error) {
      toast.error(error.message || 'Failed to delete role');
    }
  };

  return (
    <div className="roles-management">
      <div className="page-header">
        <h2>Roles Management</h2>
        <button className="btn-primary" onClick={handleCreateRole}>
          + Create Role
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading roles...</div>
      ) : (
        <div className="table-container">
          <table className="roles-table">
            <thead>
              <tr>
                <th>Role Name</th>
                <th>Display Name</th>
                <th>Description</th>
                <th>Permissions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-data">No roles found</td>
                </tr>
              ) : (
                roles.map(role => (
                  <tr key={role._id || role.id}>
                    <td>
                      <span className="role-name">{role.name}</span>
                    </td>
                    <td>{role.displayName}</td>
                    <td>
                      <span className="role-description">
                        {role.description || 'No description'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-info">
                        {role.permissions?.length || 0} permissions
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-action btn-edit"
                          onClick={() => handleEditRole(role)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-action btn-view"
                          onClick={() => handleViewPermissions(role)}
                        >
                          View Permissions
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDeleteRole(role._id || role.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <CreateRoleModal
          role={selectedRole}
          editMode={editMode}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedRole(null);
            setEditMode(false);
          }}
          onSuccess={handleRoleSaved}
        />
      )}

      {showViewModal && selectedRole && (
        <ViewPermissionsModal
          role={selectedRole}
          onClose={() => {
            setShowViewModal(false);
            setSelectedRole(null);
          }}
        />
      )}
    </div>
  );
};

export default RolesManagement;
