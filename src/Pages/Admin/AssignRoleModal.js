import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { rolesApi } from '../../Services/api';
import './Modal.css';

const AssignRoleModal = ({ user, onClose, onSuccess }) => {
  const [roles, setRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingRoles, setFetchingRoles] = useState(true);

  useEffect(() => {
    fetchRoles();
    // Set currently assigned roles
    if (user.roles) {
      const roleIds = user.roles.map(r => r._id || r.id || r);
      setSelectedRoles(roleIds);
    }
  }, [user]);

  const fetchRoles = async () => {
    try {
      setFetchingRoles(true);
      const data = await rolesApi.getAll();
      setRoles(Array.isArray(data) ? data : data.roles || []);
    } catch (error) {
      toast.error('Failed to fetch roles');
    } finally {
      setFetchingRoles(false);
    }
  };

  const handleRoleToggle = (roleId) => {
    setSelectedRoles(prev => {
      if (prev.includes(roleId)) {
        return prev.filter(id => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await rolesApi.assignToUser(user._id || user.id, selectedRoles);
      toast.success('Roles assigned successfully');
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Failed to assign roles');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async (roleId) => {
    try {
      await rolesApi.removeFromUser(user._id || user.id, roleId);
      toast.success('Role removed successfully');
      setSelectedRoles(prev => prev.filter(id => id !== roleId));
    } catch (error) {
      toast.error(error.message || 'Failed to remove role');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Assign Roles to {user.firstName} {user.lastName}</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Current Roles */}
          <div className="section">
            <h4>Currently Assigned Roles</h4>
            <div className="current-roles">
              {user.roles?.length > 0 ? (
                user.roles.map((role, idx) => (
                  <div key={idx} className="role-tag">
                    <span>{role.displayName || role.name || role}</span>
                    <button
                      className="btn-remove-role"
                      onClick={() => handleRemoveRole(role._id || role.id)}
                    >
                      ×
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-muted">No roles assigned</p>
              )}
            </div>
          </div>

          {/* Available Roles */}
          <div className="section">
            <h4>Select Roles</h4>
            {fetchingRoles ? (
              <p>Loading roles...</p>
            ) : (
              <div className="roles-list">
                {roles.map(role => (
                  <label key={role._id || role.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role._id || role.id)}
                      onChange={() => handleRoleToggle(role._id || role.id)}
                    />
                    <span className="role-info">
                      <strong>{role.displayName || role.name}</strong>
                      {role.description && (
                        <small className="role-description">{role.description}</small>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn-primary" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Assigning...' : 'Assign Roles'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignRoleModal;
