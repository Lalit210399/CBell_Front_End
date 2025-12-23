// Pages/Settings/IAM/RoleManagement/CreateEditRoleModal.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Shield } from 'lucide-react';
import RolePermissionMatrix from '../../../../CommonComponents/IAM/RolePermissionMatrix/RolePermissionMatrix';
import './CreateEditRoleModal.css';

const CreateEditRoleModal = ({
  isOpen,
  onClose,
  onSave,
  role = null,
  modules = [],
  features = [],
  permissionTypes = [],
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: [],
  });

  const [errors, setErrors] = useState({});

  // Initialize form with role data if editing
  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || '',
        displayName: role.displayName || '',
        description: role.description || '',
        permissions: role.permissions || [],
      });
    } else {
      setFormData({
        name: '',
        displayName: '',
        description: '',
        permissions: [],
      });
    }
    setErrors({});
  }, [role, isOpen]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle permission matrix change
  const handlePermissionsChange = (permissions) => {
    setFormData(prev => ({ ...prev, permissions }));
    if (errors.permissions) {
      setErrors(prev => ({ ...prev, permissions: '' }));
    }
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'System name is required';
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(formData.name)) {
      newErrors.name = 'System name must start with a letter and contain only letters, numbers, and underscores';
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    if (!formData.permissions || formData.permissions.length === 0) {
      newErrors.permissions = 'Please assign at least one permission';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    onSave(formData);
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cer-modal-backdrop" onClick={handleBackdropClick}>
      <div className="cer-modal">
        <div className="cer-header">
          <div className="cer-header-content">
            <Shield size={24} className="cer-icon" />
            <h2 className="cer-title">
              {role ? 'Edit Role' : 'Create New Role'}
            </h2>
          </div>
          <button
            className="cer-close-btn"
            onClick={onClose}
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="cer-form">
          <div className="cer-basic-info">
            <div className="cer-form-group">
              <label htmlFor="displayName" className="cer-label">
                Display Name <span className="cer-required">*</span>
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className={`cer-input ${errors.displayName ? 'error' : ''}`}
                placeholder="e.g., Administrator"
                disabled={loading}
              />
              {errors.displayName && (
                <span className="cer-error-text">{errors.displayName}</span>
              )}
            </div>

            <div className="cer-form-group">
              <label htmlFor="name" className="cer-label">
                System Name <span className="cer-required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`cer-input ${errors.name ? 'error' : ''}`}
                placeholder="e.g., Admin"
                disabled={loading || !!role}
              />
              {errors.name && (
                <span className="cer-error-text">{errors.name}</span>
              )}
              <span className="cer-help-text">
                Used for internal system references. Cannot be changed after creation.
              </span>
            </div>

            <div className="cer-form-group">
              <label htmlFor="description" className="cer-label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="cer-textarea"
                placeholder="Brief description of this role..."
                rows="3"
                disabled={loading}
              />
            </div>
          </div>

          <div className="cer-permissions-section">
            <div className="cer-section-header">
              <h3 className="cer-section-title">Permissions</h3>
              <p className="cer-section-subtitle">
                Select the permissions this role should have
              </p>
            </div>

            {errors.permissions && (
              <div className="cer-error-banner">
                {errors.permissions}
              </div>
            )}

            <RolePermissionMatrix
              modules={modules}
              features={features}
              permissionTypes={permissionTypes}
              initialPermissions={formData.permissions}
              onChange={handlePermissionsChange}
              disabled={loading}
            />
          </div>

          <div className="cer-footer">
            <button
              type="button"
              className="cer-btn cer-btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cer-btn cer-btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

CreateEditRoleModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  role: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    displayName: PropTypes.string,
    description: PropTypes.string,
    permissions: PropTypes.array,
  }),
  modules: PropTypes.array.isRequired,
  features: PropTypes.array.isRequired,
  permissionTypes: PropTypes.array.isRequired,
  loading: PropTypes.bool,
};

export default CreateEditRoleModal;
