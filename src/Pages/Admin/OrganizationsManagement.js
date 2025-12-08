import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { organizationsApi } from '../../Services/api';
import CreateOrganizationModal from './CreateOrganizationModal';
import './OrganizationsManagement.css';

const OrganizationsManagement = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const data = await organizationsApi.getAll();
      setOrganizations(Array.isArray(data) ? data : data.organizations || []);
    } catch (error) {
      toast.error('Failed to fetch organizations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedOrg(null);
    setEditMode(false);
    setShowCreateModal(true);
  };

  const handleEdit = (org) => {
    setSelectedOrg(org);
    setEditMode(true);
    setShowCreateModal(true);
  };

  const handleOrgSaved = () => {
    setShowCreateModal(false);
    setSelectedOrg(null);
    setEditMode(false);
    fetchOrganizations();
  };

  const handleDelete = async (orgId) => {
    if (!window.confirm('Are you sure you want to delete this organization?')) {
      return;
    }

    try {
      await organizationsApi.delete(orgId);
      toast.success('Organization deleted successfully');
      fetchOrganizations();
    } catch (error) {
      toast.error(error.message || 'Failed to delete organization');
    }
  };

  return (
    <div className="organizations-management">
      <div className="page-header">
        <h2>Organizations Management</h2>
        <button className="btn-primary" onClick={handleCreate}>
          + Create Organization
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading organizations...</div>
      ) : (
        <div className="table-container">
          <table className="orgs-table">
            <thead>
              <tr>
                <th>Organization Name</th>
                <th>Code</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {organizations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-data">No organizations found</td>
                </tr>
              ) : (
                organizations.map(org => (
                  <tr key={org._id || org.id}>
                    <td>
                      <span className="org-name">{org.name}</span>
                    </td>
                    <td>
                      <span className="badge badge-primary">{org.code}</span>
                    </td>
                    <td>
                      <span className="org-description">
                        {org.description || 'No description'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${org.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {org.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-action btn-edit"
                          onClick={() => handleEdit(org)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDelete(org._id || org.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <CreateOrganizationModal
          organization={selectedOrg}
          editMode={editMode}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedOrg(null);
            setEditMode(false);
          }}
          onSuccess={handleOrgSaved}
        />
      )}
    </div>
  );
};

export default OrganizationsManagement;
