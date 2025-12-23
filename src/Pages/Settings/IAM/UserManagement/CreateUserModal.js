// Pages/Settings/IAM/UserManagement/CreateUserModal.js
import React, { useState, useEffect, useContext } from 'react';
import { X, User, Mail, Lock, Building, Shield } from 'lucide-react';
import { useIAM } from '../../../../Context/IAMContext';
import { UserContext } from '../../../../Context/UserContext';
import './CreateUserModal.css';

const CreateUserModal = ({ isOpen, onClose, onCreateUser }) => {
  const { user } = useContext(UserContext);
  const { roles, fetchRoles } = useIAM();
  
  // Check if current user is admin
  const isAdmin = user?.roles?.some(role => 
    role.name === 'Admin' || role.displayName === 'Administrator'
  ) || false;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    organizationCode: '',
    roleId: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch roles when modal opens (only if admin)
  useEffect(() => {
    if (isOpen && isAdmin && (!roles || roles.length === 0)) {
      fetchRoles().catch(err => {
        console.error('Failed to fetch roles:', err);
      });
    }
  }, [isOpen, isAdmin, roles, fetchRoles]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.organizationCode.trim()) {
      newErrors.organizationCode = 'Organization code is required';
    }

    // Validate roleId for admin users
    if (isAdmin && !formData.roleId) {
      newErrors.roleId = 'Please select a role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Prepare payload
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        organizationCode: formData.organizationCode,
      };

      // Add roleId only if admin and roleId is selected
      if (isAdmin && formData.roleId) {
        payload.roleId = formData.roleId;
      }

      await onCreateUser(payload);
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        organizationCode: '',
        roleId: '',
      });
      
      onClose();
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to create user' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      organizationCode: '',
      roleId: '',
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="cum-modal-overlay" onClick={handleClose}>
      <div className="cum-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="cum-modal-header">
          <h2 className="cum-modal-title">
            <User size={20} />
            Create New User
          </h2>
          <button
            className="cum-modal-close"
            onClick={handleClose}
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="cum-form">
          {errors.submit && (
            <div className="cum-error-message">
              {errors.submit}
            </div>
          )}

          <div className="cum-form-row">
            <div className="cum-form-group">
              <label className="cum-label">
                <User size={16} />
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`cum-input ${errors.firstName ? 'cum-input-error' : ''}`}
                placeholder="Enter first name"
                disabled={loading}
              />
              {errors.firstName && (
                <span className="cum-field-error">{errors.firstName}</span>
              )}
            </div>

            <div className="cum-form-group">
              <label className="cum-label">
                <User size={16} />
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`cum-input ${errors.lastName ? 'cum-input-error' : ''}`}
                placeholder="Enter last name"
                disabled={loading}
              />
              {errors.lastName && (
                <span className="cum-field-error">{errors.lastName}</span>
              )}
            </div>
          </div>

          <div className="cum-form-group">
            <label className="cum-label">
              <Mail size={16} />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`cum-input ${errors.email ? 'cum-input-error' : ''}`}
              placeholder="Enter email address"
              disabled={loading}
            />
            {errors.email && (
              <span className="cum-field-error">{errors.email}</span>
            )}
          </div>

          <div className="cum-form-group">
            <label className="cum-label">
              <Lock size={16} />
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`cum-input ${errors.password ? 'cum-input-error' : ''}`}
              placeholder="Enter password (min 8 characters)"
              disabled={loading}
            />
            {errors.password && (
              <span className="cum-field-error">{errors.password}</span>
            )}
          </div>

          {/* Role Selection - Only visible for Admin users */}
          {isAdmin && (
            <div className="cum-form-group">
              <label className="cum-label">
                <Shield size={16} />
                Role
              </label>
              <select
                name="roleId"
                value={formData.roleId}
                onChange={handleChange}
                className={`cum-input ${errors.roleId ? 'cum-input-error' : ''}`}
                disabled={loading}
              >
                <option value="">Select a role</option>
                {roles && roles.map(role => (
                  <option key={role.id || role._id} value={role.id || role._id}>
                    {role.displayName || role.name}
                  </option>
                ))}
              </select>
              {errors.roleId && (
                <span className="cum-field-error">{errors.roleId}</span>
              )}
            </div>
          )}

          <div className="cum-form-group">
            <label className="cum-label">
              <Building size={16} />
              Organization Code
            </label>
            <input
              type="text"
              name="organizationCode"
              value={formData.organizationCode}
              onChange={handleChange}
              className={`cum-input ${errors.organizationCode ? 'cum-input-error' : ''}`}
              placeholder="Enter organization code"
              disabled={loading}
            />
            {errors.organizationCode && (
              <span className="cum-field-error">{errors.organizationCode}</span>
            )}
          </div>

          <div className="cum-modal-footer">
            <button
              type="button"
              className="cum-btn cum-btn-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cum-btn cum-btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
