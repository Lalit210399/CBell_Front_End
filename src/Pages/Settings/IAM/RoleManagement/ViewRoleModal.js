// Pages/Settings/IAM/RoleManagement/ViewRoleModal.js
import React from 'react';
import PropTypes from 'prop-types';
import { X, Shield, Check, Lock } from 'lucide-react';
import './ViewRoleModal.css';

const ViewRoleModal = ({
  isOpen,
  onClose,
  role,
  modules = [],
  features = [],
  permissionTypes = [],
}) => {
  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Count permissions for a specific feature
  const countFeaturePermissions = (featureId) => {
    if (!role || !role.permissions) return 0;
    
    const featurePermissions = role.permissions.filter(
      p => p.featureId === featureId
    );
    
    let count = 0;
    featurePermissions.forEach(permission => {
      permissionTypes.forEach(pt => {
        if (permission.permissionValue & pt.value) {
          count++;
        }
      });
    });
    
    return count;
  };

  // Get permission names for a specific feature
  const getFeaturePermissionNames = (featureId) => {
    if (!role || !role.permissions) return [];
    
    const featurePermissions = role.permissions.filter(
      p => p.featureId === featureId
    );
    
    const names = [];
    featurePermissions.forEach(permission => {
      permissionTypes.forEach(pt => {
        if (permission.permissionValue & pt.value) {
          names.push(pt.displayName);
        }
      });
    });
    
    return names;
  };

  // Group features by module
  const getModuleFeatures = (moduleId) => {
    return features.filter(f => f.moduleId === moduleId);
  };

  if (!isOpen || !role) return null;

  return (
    <div className="vr-modal-backdrop" onClick={handleBackdropClick}>
      <div className="vr-modal">
        <div className="vr-header">
          <div className="vr-header-content">
            <Shield size={24} className="vr-icon" />
            <h2 className="vr-title">Role Details</h2>
          </div>
          <button className="vr-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="vr-body">
          {/* Basic Information */}
          <div className="vr-section">
            <h3 className="vr-section-title">Basic Information</h3>
            <div className="vr-info-grid">
              <div className="vr-info-item">
                <label className="vr-info-label">Display Name</label>
                <p className="vr-info-value">{role.displayName || 'N/A'}</p>
              </div>
              <div className="vr-info-item">
                <label className="vr-info-label">System Name</label>
                <p className="vr-info-value">{role.name || 'N/A'}</p>
              </div>
              <div className="vr-info-item full-width">
                <label className="vr-info-label">Description</label>
                <p className="vr-info-value">
                  {role.description || 'No description provided'}
                </p>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="vr-section">
            <h3 className="vr-section-title">Assigned Permissions</h3>
            
            {!role.permissions || role.permissions.length === 0 ? (
              <div className="vr-empty-state">
                <Lock size={48} className="vr-empty-icon" />
                <p className="vr-empty-text">No permissions assigned to this role</p>
              </div>
            ) : (
              <div className="vr-permissions-list">
                {modules.map(module => {
                  const moduleFeatures = getModuleFeatures(module.id);
                  const featuresWithPermissions = moduleFeatures.filter(
                    f => countFeaturePermissions(f.id) > 0
                  );

                  if (featuresWithPermissions.length === 0) return null;

                  return (
                    <div key={module.id} className="vr-module-group">
                      <div className="vr-module-header">
                        <h4 className="vr-module-name">{module.displayName}</h4>
                        <span className="vr-module-badge">
                          {featuresWithPermissions.length} {featuresWithPermissions.length === 1 ? 'Feature' : 'Features'}
                        </span>
                      </div>

                      <div className="vr-features-list">
                        {featuresWithPermissions.map(feature => {
                          const permissionNames = getFeaturePermissionNames(feature.id);
                          
                          return (
                            <div key={feature.id} className="vr-feature-item">
                              <div className="vr-feature-header">
                                <span className="vr-feature-name">{feature.displayName}</span>
                                <span className="vr-permission-count">
                                  {permissionNames.length} {permissionNames.length === 1 ? 'Permission' : 'Permissions'}
                                </span>
                              </div>
                              <div className="vr-permission-badges">
                                {permissionNames.map((permName, idx) => (
                                  <span key={idx} className="vr-permission-badge">
                                    <Check size={14} />
                                    {permName}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="vr-footer">
          <button className="vr-btn vr-btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

ViewRoleModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
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
};

export default ViewRoleModal;
