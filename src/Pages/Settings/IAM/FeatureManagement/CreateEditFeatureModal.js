// Pages/Settings/IAM/FeatureManagement/CreateEditFeatureModal.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Grid } from 'lucide-react';
import Dropdown from '../../../../CommonComponents/Dropdown/Dropdown';
import './CreateEditFeatureModal.css';

const CreateEditFeatureModal = ({
  isOpen,
  onClose,
  onSave,
  feature = null,
  modules = [],
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    moduleId: '',
  });

  const [errors, setErrors] = useState({});
  const [selectedModule, setSelectedModule] = useState(null);

  // Initialize form with feature data if editing
  useEffect(() => {
    if (feature) {
      setFormData({
        name: feature.name || '',
        displayName: feature.displayName || '',
        description: feature.description || '',
        moduleId: feature.moduleId || '',
      });
      
      // Set selected module
      const module = modules.find(m => m.id === feature.moduleId);
      if (module) {
        setSelectedModule({ value: module.id, label: module.displayName });
      }
    } else {
      setFormData({
        name: '',
        displayName: '',
        description: '',
        moduleId: '',
      });
      setSelectedModule(null);
    }
    setErrors({});
  }, [feature, modules, isOpen]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle module selection
  const handleModuleSelect = (module) => {
    setSelectedModule(module);
    setFormData(prev => ({ ...prev, moduleId: module.value }));
    if (errors.moduleId) {
      setErrors(prev => ({ ...prev, moduleId: '' }));
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

    if (!formData.moduleId) {
      newErrors.moduleId = 'Module is required';
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

  // Module dropdown options
  const moduleOptions = modules.map(m => ({
    value: m.id,
    label: m.displayName
  }));

  if (!isOpen) return null;

  return (
    <div className="cef-modal-backdrop" onClick={handleBackdropClick}>
      <div className="cef-modal">
        <div className="cef-header">
          <div className="cef-header-content">
            <Grid size={24} className="cef-icon" />
            <h2 className="cef-title">
              {feature ? 'Edit Feature' : 'Create New Feature'}
            </h2>
          </div>
          <button
            className="cef-close-btn"
            onClick={onClose}
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="cef-form">
          <div className="cef-form-group">
            <label htmlFor="moduleId" className="cef-label">
              Module <span className="cef-required">*</span>
            </label>
            <Dropdown
              options={moduleOptions}
              selectedOption={selectedModule}
              onSelect={handleModuleSelect}
              placeholder="Select a module"
              disabled={loading || !!feature}
              className={errors.moduleId ? 'error' : ''}
            />
            {errors.moduleId && (
              <span className="cef-error-text">{errors.moduleId}</span>
            )}
            {feature && (
              <span className="cef-help-text">
                Module cannot be changed after creation.
              </span>
            )}
          </div>

          <div className="cef-form-group">
            <label htmlFor="displayName" className="cef-label">
              Display Name <span className="cef-required">*</span>
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className={`cef-input ${errors.displayName ? 'error' : ''}`}
              placeholder="e.g., User Management"
              disabled={loading}
            />
            {errors.displayName && (
              <span className="cef-error-text">{errors.displayName}</span>
            )}
          </div>

          <div className="cef-form-group">
            <label htmlFor="name" className="cef-label">
              System Name <span className="cef-required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`cef-input ${errors.name ? 'error' : ''}`}
              placeholder="e.g., Users"
              disabled={loading || !!feature}
            />
            {errors.name && (
              <span className="cef-error-text">{errors.name}</span>
            )}
            <span className="cef-help-text">
              Used for internal system references. Cannot be changed after creation.
            </span>
          </div>

          <div className="cef-form-group">
            <label htmlFor="description" className="cef-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="cef-textarea"
              placeholder="Brief description of this feature..."
              rows="4"
              disabled={loading}
            />
          </div>

          <div className="cef-footer">
            <button
              type="button"
              className="cef-btn cef-btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cef-btn cef-btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : feature ? 'Update Feature' : 'Create Feature'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

CreateEditFeatureModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  feature: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    displayName: PropTypes.string,
    description: PropTypes.string,
    moduleId: PropTypes.string,
  }),
  modules: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
  })).isRequired,
  loading: PropTypes.bool,
};

export default CreateEditFeatureModal;
