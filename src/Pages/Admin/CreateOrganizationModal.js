import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { organizationsApi } from '../../Services/api';
import './Modal.css';

const CreateOrganizationModal = ({ organization, editMode, onClose, onSuccess }) => {
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm();
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (editMode && organization) {
      setValue('name', organization.name);
      setValue('code', organization.code);
      setValue('description', organization.description);
      setValue('isActive', organization.isActive !== false);
    }
  }, [organization, editMode]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (editMode && organization) {
        await organizationsApi.update(organization._id || organization.id, data);
        toast.success('Organization updated successfully');
      } else {
        await organizationsApi.create(data);
        toast.success('Organization created successfully');
      }
      reset();
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Failed to save organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editMode ? 'Edit Organization' : 'Create New Organization'}</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
          <div className="form-group">
            <label>Organization Name *</label>
            <input
              type="text"
              {...register('name', { required: 'Organization name is required' })}
              className={errors.name ? 'error' : ''}
              placeholder="e.g., Acme Corporation"
            />
            {errors.name && <span className="field-error">{errors.name.message}</span>}
          </div>

          <div className="form-group">
            <label>Organization Code *</label>
            <input
              type="text"
              {...register('code', { 
                required: 'Organization code is required',
                pattern: {
                  value: /^[A-Z0-9_-]+$/,
                  message: 'Code must be uppercase letters, numbers, hyphens, or underscores'
                }
              })}
              className={errors.code ? 'error' : ''}
              placeholder="e.g., ACME_CORP"
              disabled={editMode}
            />
            {errors.code && <span className="field-error">{errors.code.message}</span>}
            {editMode && <small className="field-hint">Code cannot be changed</small>}
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              rows="4"
              {...register('description')}
              placeholder="Optional description"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                {...register('isActive')}
                defaultChecked={true}
              />
              <span>Active</span>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : editMode ? 'Update Organization' : 'Create Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrganizationModal;
