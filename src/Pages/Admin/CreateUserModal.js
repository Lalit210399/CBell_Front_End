import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { authApi } from '../../Services/api';
import './Modal.css';

const CreateUserModal = ({ onClose, onSuccess, organizations }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await authApi.register(data);
      toast.success(`User created successfully! Parent Level: ${response.parentLevel || response.user?.parentLevel || 'N/A'}`);
      reset();
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create New User</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="field-error">{errors.email.message}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                {...register('firstName', { required: 'First name is required' })}
                className={errors.firstName ? 'error' : ''}
              />
              {errors.firstName && <span className="field-error">{errors.firstName.message}</span>}
            </div>

            <div className="form-group">
              <label>Last Name *</label>
              <input
                type="text"
                {...register('lastName', { required: 'Last name is required' })}
                className={errors.lastName ? 'error' : ''}
              />
              {errors.lastName && <span className="field-error">{errors.lastName.message}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters'
                }
              })}
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="field-error">{errors.password.message}</span>}
          </div>

          <div className="form-group">
            <label>Organization Code *</label>
            <select
              {...register('organizationCode', { required: 'Organization is required' })}
              className={errors.organizationCode ? 'error' : ''}
            >
              <option value="">Select Organization</option>
              {organizations.map(org => (
                <option key={org._id || org.id} value={org.code}>
                  {org.name} ({org.code})
                </option>
              ))}
            </select>
            {errors.organizationCode && <span className="field-error">{errors.organizationCode.message}</span>}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
