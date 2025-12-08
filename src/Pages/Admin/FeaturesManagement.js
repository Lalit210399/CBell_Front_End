import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { permissionsApi } from '../../Services/api';
import './PermissionsSetup.css';

const FeaturesManagement = () => {
  const [features, setFeatures] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    moduleId: '' 
  });

  useEffect(() => {
    fetchFeatures();
    fetchModules();
  }, []);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const data = await permissionsApi.getFeatures();
      setFeatures(Array.isArray(data) ? data : data.features || []);
    } catch (error) {
      toast.error('Failed to fetch features');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const data = await permissionsApi.getModules();
      setModules(Array.isArray(data) ? data : data.modules || []);
    } catch (error) {
      console.error('Failed to fetch modules', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await permissionsApi.createFeature(formData);
      toast.success('Feature created successfully');
      setFormData({ name: '', description: '', moduleId: '' });
      setShowForm(false);
      fetchFeatures();
    } catch (error) {
      toast.error(error.message || 'Failed to create feature');
    }
  };

  const getModuleName = (moduleId) => {
    const module = modules.find(m => (m._id || m.id) === moduleId);
    return module?.name || 'Unknown Module';
  };

  return (
    <div className="permissions-setup">
      <div className="page-header">
        <h2>Features Management</h2>
        <button 
          className="btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Create Feature'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>Create New Feature</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Module *</label>
              <select
                value={formData.moduleId}
                onChange={(e) => setFormData({ ...formData, moduleId: e.target.value })}
                required
              >
                <option value="">Select Module</option>
                {modules.map(module => (
                  <option key={module._id || module.id} value={module._id || module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Feature Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Create User"
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
            <button type="submit" className="btn-primary">Create Feature</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-state">Loading features...</div>
      ) : (
        <div className="cards-grid">
          {features.length === 0 ? (
            <p className="no-data">No features found</p>
          ) : (
            features.map(feature => (
              <div key={feature._id || feature.id} className="info-card">
                <div className="card-header">
                  <h4>{feature.name}</h4>
                  <span className="badge badge-primary">
                    {getModuleName(feature.moduleId)}
                  </span>
                </div>
                <p>{feature.description || 'No description'}</p>
                <div className="card-meta">
                  <span className="badge badge-info">
                    ID: {feature._id || feature.id}
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

export default FeaturesManagement;
