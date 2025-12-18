import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from './AdminContext';
import './CreateUser.css';
import './Admin.css';

const CreateUser = () => {
  const { createUser } = useAdmin();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    organizationName: '',
    organizationCode: '',
    status: 'Active',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createUser(formData);
    navigate('/admin/users');
  };

  return (
    <div className="create-user">
      <h2>Create User</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>First Name:</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Last Name:</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Organization Name:</label>
          <input
            type="text"
            name="organizationName"
            value={formData.organizationName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Organization Code:</label>
          <input
            type="text"
            name="organizationCode"
            value={formData.organizationCode}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Status:</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div className="actions">
          <button type="submit">Create</button>
          <button type="button" onClick={() => navigate('/admin/users')}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default CreateUser;
