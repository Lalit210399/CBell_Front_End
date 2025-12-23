// CommonComponents/IAM/UserRoleAssignment/UserRoleAssignment.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Check, UserPlus } from 'lucide-react';
import './UserRoleAssignment.css';

/**
 * Component for assigning roles to a user
 * Displays current roles and allows adding/removing roles
 */
const UserRoleAssignment = ({
  user,
  availableRoles,
  currentRoleIds = [],
  onAssignRoles,
  onClose,
  loading = false,
}) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize with current role (single selection)
  useEffect(() => {
    setSelectedRole(currentRoleIds && currentRoleIds.length > 0 ? currentRoleIds[0] : null);
  }, [currentRoleIds]);

  // Filter roles based on search query
  const filteredRoles = availableRoles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Select role (radio button behavior)
  const selectRole = (roleId) => {
    setSelectedRole(roleId);
  };

  // Check if role is selected
  const isRoleSelected = (roleId) => {
    return selectedRole === roleId;
  };

  // Handle save
  const handleSave = async () => {
    // Support both id and _id fields
    const userId = user.id || user._id;
    // Send as array for API compatibility
    await onAssignRoles(userId, selectedRole ? [selectedRole] : []);
  };

  // Check if there are changes
  const hasChanges = () => {
    const currentRole = currentRoleIds && currentRoleIds.length > 0 ? currentRoleIds[0] : null;
    return selectedRole !== currentRole;
  };

  return (
    <div className="user-role-assignment">
      <div className="ura-header">
        <div className="ura-header-content">
          <UserPlus size={24} className="ura-icon" />
          <div className="ura-user-info">
            <h2 className="ura-title">Assign Roles</h2>
            <p className="ura-subtitle">
              {user.firstName} {user.lastName} ({user.email})
            </p>
          </div>
        </div>
        <button className="ura-close-btn" onClick={onClose} disabled={loading}>
          <X size={20} />
        </button>
      </div>

      <div className="ura-search">
        <input
          type="text"
          placeholder="Search roles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ura-search-input"
          disabled={loading}
        />
      </div>

      <div className="ura-roles-list">
        {filteredRoles.length === 0 ? (
          <div className="ura-empty">
            <p>No roles found</p>
          </div>
        ) : (
          filteredRoles.map(role => {
            const roleId = role.id || role._id;
            const selected = isRoleSelected(roleId);

            return (
              <div
                key={roleId}
                className={`ura-role-item ${selected ? 'selected' : ''} ${loading ? 'disabled' : ''}`}
                onClick={() => !loading && selectRole(roleId)}
              >
                <div className="ura-role-info">
                  <div className="ura-role-name">{role.displayName}</div>
                  {role.description && (
                    <div className="ura-role-desc">{role.description}</div>
                  )}
                </div>
                <div className={`ura-radio ${selected ? 'checked' : ''}`}>
                  {selected && <div className="ura-radio-dot" />}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="ura-footer">
        <div className="ura-footer-info">
          <span className="ura-selected-count">
            {selectedRole ? '1 role' : '0 roles'} selected
          </span>
        </div>
        <div className="ura-footer-actions">
          <button
            className="btn_secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn_primary"
            onClick={handleSave}
            disabled={loading || !hasChanges()}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

UserRoleAssignment.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
  }).isRequired,
  availableRoles: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    description: PropTypes.string,
  })).isRequired,
  currentRoleIds: PropTypes.arrayOf(PropTypes.string),
  onAssignRoles: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default UserRoleAssignment;
