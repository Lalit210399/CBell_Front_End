import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { permissionsApi } from '../../Services/api';
import './PermissionsSetup.css';

const ModulesManagement = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const data = await permissionsApi.getModules();
      setModules(Array.isArray(data) ? data : data.modules || []);
    } catch (error) {
      toast.error('Failed to fetch modules');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await permissionsApi.createModule(formData);
      toast.success('Module created successfully');
      setFormData({ name: '', description: '' });
      setShowForm(false);
      fetchModules();
    } catch (error) {
      toast.error(error.message || 'Failed to create module');
    }
  };

  return (
    <div className="permissions-setup">
      <div className="page-header">
        <h2>Modules Management</h2>
        <button 
          className="btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Create Module'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>Create New Module</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Module Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., User Management"
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
            <button type="submit" className="btn-primary">Create Module</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-state">Loading modules...</div>
      ) : (
        <div className="cards-grid">
          {modules.length === 0 ? (
            <p className="no-data">No modules found</p>
          ) : (
            modules.map(module => (
              <div key={module._id || module.id} className="info-card">
                <h4>{module.name}</h4>
                <p>{module.description || 'No description'}</p>
                <div className="card-meta">
                  <span className="badge badge-info">
                    ID: {module._id || module.id}
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

export default ModulesManagement;
