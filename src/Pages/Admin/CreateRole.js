import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from './AdminContext';
import './Admin.css';

const CreateRole = () => {
  const { createRole } = useAdmin();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: {
      Users: { Create: false, Read: false, Update: false, Delete: false },
      Roles: { Create: false, Read: false, Update: false, Delete: false },
      Events: { Create: false, Read: false, Update: false, Delete: false },
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (module, action) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [action]: !prev.permissions[module][action],
        },
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createRole(formData);
    navigate('/admin/roles');
  };

  const modules = ['Users', 'Roles', 'Events'];
  const actions = ['Create', 'Read', 'Update', 'Delete'];

  return (
    <div className="create-role">
      <h2>Create Role</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Display Name:</label>
          <input
            type="text"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Description:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </div>
        <div className="permissions-matrix">
          <h3>Permissions</h3>
          <table>
            <thead>
              <tr>
                <th>Module</th>
                {actions.map(action => <th key={action}>{action}</th>)}
              </tr>
            </thead>
            <tbody>
              {modules.map(module => (
                <tr key={module}>
                  <td>{module}</td>
                  {actions.map(action => (
                    <td key={action}>
                      <input
                        type="checkbox"
                        checked={formData.permissions[module][action]}
                        onChange={() => handlePermissionChange(module, action)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="actions">
          <button type="submit">Create</button>
          <button type="button" onClick={() => navigate('/admin/roles')}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default CreateRole;
