// Pages/Settings/IAM/ModuleManagement/CreateEditModuleModal.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Package } from 'lucide-react';
import './CreateEditModuleModal.css';

const CreateEditModuleModal = ({
  isOpen,
  onClose,
  onSave,
  module = null,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
  });

  const [errors, setErrors] = useState({});

  // Initialize form with module data if editing
  useEffect(() => {
    if (module) {
      setFormData({
        name: module.name || '',
        displayName: module.displayName || '',
        description: module.description || '',
      });
    } else {
      setFormData({
        name: '',
        displayName: '',
        description: '',
      });
    }
    setErrors({});
  }, [module, isOpen]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
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
    <div className="cem-modal-backdrop" onClick={handleBackdropClick}>
      <div className="cem-modal">
        <div className="cem-header">
          <div className="cem-header-content">
            <Package size={24} className="cem-icon" />
            <h2 className="cem-title">
              {module ? 'Edit Module' : 'Create New Module'}
            </h2>
          </div>
          <button
            className="cem-close-btn"
            onClick={onClose}
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="cem-form">
          <div className="cem-form-group">
            <label htmlFor="displayName" className="cem-label">
              Display Name <span className="cem-required">*</span>
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className={`cem-input ${errors.displayName ? 'error' : ''}`}
              placeholder="e.g., Administration"
              disabled={loading}
            />
            {errors.displayName && (
              <span className="cem-error-text">{errors.displayName}</span>
            )}
          </div>

          <div className="cem-form-group">
            <label htmlFor="name" className="cem-label">
              System Name <span className="cem-required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`cem-input ${errors.name ? 'error' : ''}`}
              placeholder="e.g., Administration"
              disabled={loading || !!module} // Disable when editing
            />
            {errors.name && (
              <span className="cem-error-text">{errors.name}</span>
            )}
            <span className="cem-help-text">
              Used for internal system references. Cannot be changed after creation.
            </span>
          </div>

          <div className="cem-form-group">
            <label htmlFor="description" className="cem-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="cem-textarea"
              placeholder="Brief description of this module..."
              rows="4"
              disabled={loading}
            />
          </div>

          <div className="cem-footer">
            <button
              type="button"
              className="cem-btn cem-btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cem-btn cem-btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : module ? 'Update Module' : 'Create Module'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

CreateEditModuleModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  module: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    displayName: PropTypes.string,
    description: PropTypes.string,
  }),
  loading: PropTypes.bool,
};

export default CreateEditModuleModal;
