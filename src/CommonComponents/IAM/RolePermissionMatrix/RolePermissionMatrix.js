// CommonComponents/IAM/RolePermissionMatrix/RolePermissionMatrix.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import './RolePermissionMatrix.css';

/**
 * Component for managing role permissions in a matrix format
 * Groups permissions by Module → Feature → Permission Types
 */
const RolePermissionMatrix = ({
  modules,
  features,
  permissionTypes,
  initialPermissions = [],
  onChange,
  disabled = false,
}) => {
  const [expandedModules, setExpandedModules] = useState({});
  const [permissions, setPermissions] = useState({});

  // Initialize permissions from initialPermissions prop
  useEffect(() => {
    if (initialPermissions && initialPermissions.length > 0) {
      const permMap = {};
      initialPermissions.forEach(perm => {
        const key = `${perm.moduleId}-${perm.featureId}`;
        permMap[key] = perm.permissionValue || 0;
      });
      setPermissions(permMap);
    }
  }, [initialPermissions]);

  // Group features by module
  const featuresByModule = modules.reduce((acc, module) => {
    acc[module.id] = features.filter(f => f.moduleId === module.id);
    return acc;
  }, {});

  // Toggle module expansion
  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  // Check if a permission is granted
  const isPermissionGranted = (moduleId, featureId, permissionType) => {
    const key = `${moduleId}-${featureId}`;
    const permValue = permissions[key] || 0;
    return (permValue & (1 << permissionType.bitPosition)) !== 0;
  };

  // Toggle a single permission
  const togglePermission = (moduleId, featureId, permissionType) => {
    if (disabled) return;

    const key = `${moduleId}-${featureId}`;
    const currentValue = permissions[key] || 0;
    const newValue = currentValue ^ (1 << permissionType.bitPosition);

    const updatedPermissions = {
      ...permissions,
      [key]: newValue
    };

    setPermissions(updatedPermissions);

    // Convert to the format expected by the API
    const permissionsArray = Object.entries(updatedPermissions).map(([k, value]) => {
      const [modId, featId] = k.split('-');
      return {
        moduleId: modId,
        featureId: featId,
        permissionValue: value,
        permissionFlags: permissionTypes.map(pt => ({
          permissionTypeId: pt.id,
          isGranted: (value & (1 << pt.bitPosition)) !== 0
        }))
      };
    }).filter(p => p.permissionValue > 0); // Only include features with at least one permission

    onChange(permissionsArray);
  };

  // Select/Deselect all permissions for a feature
  const toggleAllFeaturePermissions = (moduleId, featureId) => {
    if (disabled) return;

    const key = `${moduleId}-${featureId}`;
    const currentValue = permissions[key] || 0;
    
    // Calculate max value (all permissions enabled)
    const maxValue = permissionTypes.reduce((acc, pt) => {
      return acc | (1 << pt.bitPosition);
    }, 0);

    // If already at max, clear all; otherwise, set all
    const newValue = currentValue === maxValue ? 0 : maxValue;

    const updatedPermissions = {
      ...permissions,
      [key]: newValue
    };

    setPermissions(updatedPermissions);

    // Convert and notify parent
    const permissionsArray = Object.entries(updatedPermissions).map(([k, value]) => {
      const [modId, featId] = k.split('-');
      return {
        moduleId: modId,
        featureId: featId,
        permissionValue: value,
        permissionFlags: permissionTypes.map(pt => ({
          permissionTypeId: pt.id,
          isGranted: (value & (1 << pt.bitPosition)) !== 0
        }))
      };
    }).filter(p => p.permissionValue > 0);

    onChange(permissionsArray);
  };

  if (!modules || modules.length === 0) {
    return (
      <div className="rpm-empty">
        <p>No modules available. Please create modules first.</p>
      </div>
    );
  }

  return (
    <div className={`role-permission-matrix ${disabled ? 'disabled' : ''}`}>
      <div className="rpm-header">
        <p className="rpm-instruction">
          Select permissions for each feature by clicking the checkboxes below.
        </p>
      </div>

      <div className="rpm-modules">
        {modules.map(module => {
          const moduleFeatures = featuresByModule[module.id] || [];
          const isExpanded = expandedModules[module.id];

          if (moduleFeatures.length === 0) {
            return null; // Don't show modules without features
          }

          return (
            <div key={module.id} className="rpm-module">
              <div 
                className="rpm-module-header" 
                onClick={() => toggleModule(module.id)}
              >
                {isExpanded ? (
                  <ChevronDown size={18} className="rpm-chevron" />
                ) : (
                  <ChevronRight size={18} className="rpm-chevron" />
                )}
                <h3 className="rpm-module-title">{module.displayName}</h3>
                {module.description && (
                  <span className="rpm-module-desc">{module.description}</span>
                )}
              </div>

              {isExpanded && (
                <div className="rpm-features">
                  {moduleFeatures.map(feature => {
                    const key = `${module.id}-${feature.id}`;
                    const currentValue = permissions[key] || 0;
                    const maxValue = permissionTypes.reduce((acc, pt) => acc | (1 << pt.bitPosition), 0);
                    const allSelected = currentValue === maxValue && currentValue > 0;
                    const someSelected = currentValue > 0 && currentValue < maxValue;

                    return (
                      <div key={feature.id} className="rpm-feature">
                        <div className="rpm-feature-header">
                          <div className="rpm-feature-info">
                            <h4 className="rpm-feature-title">{feature.displayName}</h4>
                            {feature.description && (
                              <span className="rpm-feature-desc">{feature.description}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            className={`rpm-select-all ${allSelected ? 'all-selected' : ''} ${someSelected ? 'some-selected' : ''}`}
                            onClick={() => toggleAllFeaturePermissions(module.id, feature.id)}
                            disabled={disabled}
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>

                        <div className="rpm-permissions">
                          {permissionTypes.map(permType => {
                            const isGranted = isPermissionGranted(module.id, feature.id, permType);

                            return (
                              <label
                                key={permType.id}
                                className={`rpm-permission ${isGranted ? 'granted' : ''} ${disabled ? 'disabled' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isGranted}
                                  onChange={() => togglePermission(module.id, feature.id, permType)}
                                  disabled={disabled}
                                />
                                <span className="rpm-permission-label">{permType.displayName}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

RolePermissionMatrix.propTypes = {
  modules: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    description: PropTypes.string,
  })).isRequired,
  features: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    moduleId: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    description: PropTypes.string,
  })).isRequired,
  permissionTypes: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    bitPosition: PropTypes.number.isRequired,
  })).isRequired,
  initialPermissions: PropTypes.arrayOf(PropTypes.shape({
    moduleId: PropTypes.string.isRequired,
    featureId: PropTypes.string.isRequired,
    permissionValue: PropTypes.number,
  })),
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default RolePermissionMatrix;
