import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { rolesApi, permissionsApi } from '../../Services/api';
import './Modal.css';
import './RolesManagement.css';

const CreateRoleModal = ({ role, editMode, onClose, onSuccess }) => {
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm();
  const [loading, setLoading] = useState(false);
  
  // Permissions state
  const [modules, setModules] = useState([]);
  const [features, setFeatures] = useState([]);
  const [permissionTypes, setPermissionTypes] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedFeature, setSelectedFeature] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [addedPermissions, setAddedPermissions] = useState([]);

  useEffect(() => {
    fetchModules();
    fetchPermissionTypes();

    if (editMode && role) {
      setValue('name', role.name);
      setValue('displayName', role.displayName);
      setValue('description', role.description);
      if (role.permissions) {
        setAddedPermissions(role.permissions);
      }
    }
  }, [role, editMode]);

  useEffect(() => {
    if (selectedModule) {
      fetchFeatures(selectedModule);
    }
  }, [selectedModule]);

  const fetchModules = async () => {
    try {
      const data = await permissionsApi.getModules();
      setModules(Array.isArray(data) ? data : data.modules || []);
    } catch (error) {
      toast.error('Failed to fetch modules');
    }
  };

  const fetchFeatures = async (moduleId) => {
    try {
      const data = await permissionsApi.getFeatures(moduleId);
      setFeatures(Array.isArray(data) ? data : data.features || []);
    } catch (error) {
      toast.error('Failed to fetch features');
    }
  };

  const fetchPermissionTypes = async () => {
    try {
      const data = await permissionsApi.getPermissionTypes();
      setPermissionTypes(Array.isArray(data) ? data : data.permissionTypes || []);
    } catch (error) {
      toast.error('Failed to fetch permission types');
    }
  };

  const handlePermissionToggle = (permissionTypeId) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionTypeId)) {
        return prev.filter(id => id !== permissionTypeId);
      } else {
        return [...prev, permissionTypeId];
      }
    });
  };

  const handleAddPermission = () => {
    if (!selectedModule || !selectedFeature || selectedPermissions.length === 0) {
      toast.error('Please select module, feature, and at least one permission');
      return;
    }

    const newPermission = {
      moduleId: selectedModule,
      featureId: selectedFeature,
      permissionFlags: selectedPermissions.map(permTypeId => ({
        permissionTypeId: permTypeId,
        isGranted: true
      }))
    };

    // Add module and feature names for display
    const module = modules.find(m => (m._id || m.id) === selectedModule);
    const feature = features.find(f => (f._id || f.id) === selectedFeature);
    
    newPermission.moduleName = module?.name;
    newPermission.featureName = feature?.name;
    newPermission.permissionTypeNames = selectedPermissions.map(id => {
      const pt = permissionTypes.find(p => (p._id || p.id) === id);
      return pt?.name;
    });

    setAddedPermissions([...addedPermissions, newPermission]);
    
    // Reset selections
    setSelectedModule('');
    setSelectedFeature('');
    setSelectedPermissions([]);
    setFeatures([]);
    
    toast.success('Permission added');
  };

  const handleRemovePermission = (index) => {
    setAddedPermissions(addedPermissions.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    if (addedPermissions.length === 0) {
      toast.error('Please add at least one permission');
      return;
    }

    setLoading(true);
    try {
      const roleData = {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        permissions: addedPermissions.map(p => ({
          moduleId: p.moduleId,
          featureId: p.featureId,
          permissionFlags: p.permissionFlags
        }))
      };

      if (editMode && role) {
        await rolesApi.update(role._id || role.id, roleData);
        toast.success('Role updated successfully');
      } else {
        await rolesApi.create(roleData);
        toast.success('Role created successfully');
      }

      reset();
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editMode ? 'Edit Role' : 'Create New Role'}</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
          {/* Basic Info */}
          <div className="form-section">
            <h4>Role Information</h4>
            
            <div className="form-group">
              <label>Role Name *</label>
              <input
                type="text"
                placeholder="e.g., HOD, Designer"
                {...register('name', { required: 'Role name is required' })}
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="field-error">{errors.name.message}</span>}
            </div>

            <div className="form-group">
              <label>Display Name *</label>
              <input
                type="text"
                placeholder="e.g., Head of Department"
                {...register('displayName', { required: 'Display name is required' })}
                className={errors.displayName ? 'error' : ''}
              />
              {errors.displayName && <span className="field-error">{errors.displayName.message}</span>}
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                rows="3"
                placeholder="Optional description"
                {...register('description')}
              />
            </div>
          </div>

          {/* Permissions Configuration */}
          <div className="form-section">
            <h4>Permissions Configuration</h4>

            <div className="permissions-builder">
              <div className="form-row">
                <div className="form-group">
                  <label>1. Select Module *</label>
                  <select
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                  >
                    <option value="">Choose a module</option>
                    {modules.map(module => (
                      <option key={module._id || module.id} value={module._id || module.id}>
                        {module.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>2. Select Feature *</label>
                  <select
                    value={selectedFeature}
                    onChange={(e) => setSelectedFeature(e.target.value)}
                    disabled={!selectedModule}
                  >
                    <option value="">Choose a feature</option>
                    {features.map(feature => (
                      <option key={feature._id || feature.id} value={feature._id || feature.id}>
                        {feature.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>3. Select Permissions *</label>
                <div className="permission-checkboxes">
                  {permissionTypes.map(permType => (
                    <label key={permType._id || permType.id} className="checkbox-inline">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permType._id || permType.id)}
                        onChange={() => handlePermissionToggle(permType._id || permType.id)}
                      />
                      <span>{permType.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleAddPermission}
              >
                + Add Permission
              </button>
            </div>

            {/* Added Permissions Display */}
            {addedPermissions.length > 0 && (
              <div className="added-permissions">
                <h5>Added Permissions ({addedPermissions.length})</h5>
                <div className="permissions-grid">
                  {addedPermissions.map((perm, index) => (
                    <div key={index} className="permission-card">
                      <div className="permission-card-header">
                        <div>
                          <strong>{perm.moduleName || 'Module'}</strong>
                          <span className="separator">→</span>
                          <span>{perm.featureName || 'Feature'}</span>
                        </div>
                        <button
                          type="button"
                          className="btn-remove"
                          onClick={() => handleRemovePermission(index)}
                        >
                          ×
                        </button>
                      </div>
                      <div className="permission-types">
                        {perm.permissionTypeNames?.map((name, idx) => (
                          <span key={idx} className="badge badge-primary">
                            {name}
                          </span>
                        )) || perm.permissionFlags?.map((flag, idx) => (
                          <span key={idx} className="badge badge-primary">
                            Permission {idx + 1}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : editMode ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoleModal;
