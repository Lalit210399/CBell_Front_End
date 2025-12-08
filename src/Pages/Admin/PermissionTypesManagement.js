import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { permissionsApi } from '../../Services/api';
import './PermissionsSetup.css';

const PermissionTypesManagement = () => {
  const [permissionTypes, setPermissionTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchPermissionTypes();
  }, []);

  const fetchPermissionTypes = async () => {
    try {
      setLoading(true);
      const data = await permissionsApi.getPermissionTypes();
      setPermissionTypes(Array.isArray(data) ? data : data.permissionTypes || []);
    } catch (error) {
      toast.error('Failed to fetch permission types');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await permissionsApi.createPermissionType(formData);
      toast.success('Permission type created successfully');
      setFormData({ name: '', description: '' });
      setShowForm(false);
      fetchPermissionTypes();
    } catch (error) {
      toast.error(error.message || 'Failed to create permission type');
    }
  };

  return (
    <div className="permissions-setup">
      <div className="page-header">
        <h2>Permission Types Management</h2>
        <button 
          className="btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Create Permission Type'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>Create New Permission Type</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Permission Type Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Create, Read, Update, Delete, ViewAll"
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <button type="submit" className="btn-primary">Create Permission Type</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-state">Loading permission types...</div>
      ) : (
        <div className="cards-grid">
          {permissionTypes.length === 0 ? (
            <p className="no-data">No permission types found</p>
          ) : (
            permissionTypes.map(permType => (
              <div key={permType._id || permType.id} className="info-card">
                <h4>{permType.name}</h4>
                <p>{permType.description || 'No description'}</p>
                <div className="card-meta">
                  <span className="badge badge-info">
                    ID: {permType._id || permType.id}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PermissionTypesManagement;
