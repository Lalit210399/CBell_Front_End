// Pages/Settings/IAM/FeatureManagement/FeatureManagement.js
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Grid, AlertCircle } from 'lucide-react';
import { useIAMFeatures } from '../../../../Hooks/useIAMFeatures';
import { useIAMModules } from '../../../../Hooks/useIAMModules';
import Table from '../../../../CommonComponents/Table/Table';
import ConfirmationModal from '../../../../CommonComponents/ConfirmationModal/ConfirmationModal';
import Dropdown from '../../../../CommonComponents/Dropdown/Dropdown';
import CreateEditFeatureModal from './CreateEditFeatureModal';
import './FeatureManagement.css';
import { modules as dummyModules, features as dummyFeatures } from '../dummyData';

const FeatureManagement = () => {
  const {
    features,
    loading,
    error,
    fetchFeatures,
    addFeature,
    updateFeature,
    deleteFeature,
  } = useIAMFeatures();

  const {
    modules,
    fetchModules,
  } = useIAMModules();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [deletingFeature, setDeletingFeature] = useState(null);
  const [localError, setLocalError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [localModules, setLocalModules] = useState(dummyModules);
  const [localFeatures, setLocalFeatures] = useState(dummyFeatures);

  const effectiveModules = (modules && modules.length > 0) ? modules : localModules;
  const effectiveFeatures = (features && features.length > 0) ? features : localFeatures;

  // Filter features based on search query and selected module
  const filteredFeatures = effectiveFeatures.filter((feature) => {
    const matchesSearch = 
      feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesModule = !selectedModule || feature.moduleId === selectedModule.value;

    return matchesSearch && matchesModule;
  });

  // Get module name by ID
  const getModuleName = (moduleId) => {
    const module = effectiveModules.find(m => m.id === moduleId);
    return module ? module.displayName : moduleId;
  };

  // Handle create feature
  const handleCreateFeature = async (featureData) => {
    try {
      setLocalError(null);
      setActionLoading(true);
      const newFeature = { id: `local-${Date.now()}`, moduleId: featureData.moduleId, name: featureData.name, displayName: featureData.displayName || featureData.name, description: featureData.description || '', isActive: true };
      setLocalFeatures(prev => [newFeature, ...prev]);
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Error creating feature (local):', err);
      setLocalError(err.message || 'Failed to create feature.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle update feature
  const handleUpdateFeature = async (featureData) => {
    try {
      setLocalError(null);
      setActionLoading(true);
      setLocalFeatures(prev => prev.map(f => f.id === editingFeature.id ? { ...f, ...featureData } : f));
      setEditingFeature(null);
    } catch (err) {
      console.error('Error updating feature (local):', err);
      setLocalError(err.message || 'Failed to update feature.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete feature
  const handleDeleteFeature = async () => {
    if (!deletingFeature) return;

    try {
      setLocalError(null);
      setActionLoading(true);
      setLocalFeatures(prev => prev.filter(f => f.id !== deletingFeature.id));
      setDeletingFeature(null);
    } catch (err) {
      console.error('Error deleting feature (local):', err);
      setLocalError(err.message || 'Failed to delete feature.');
    } finally {
      setActionLoading(false);
    }
  };

  // Module dropdown options
  const moduleOptions = effectiveModules.map(m => ({
    value: m.id,
    label: m.displayName
  }));

  // Table columns
  const columns = [
    { key: 'displayName', label: 'Display Name' },
    { key: 'name', label: 'System Name' },
    { key: 'module', label: 'Module' },
    { key: 'description', label: 'Description' },
    { key: 'isActive', label: 'Status' },
    { key: 'actions', label: 'Actions' },
  ];

  // Render custom cells
  const renderCell = (feature, column) => {
    switch (column.key) {
      case 'module':
        return <span className="fm-module-badge">{getModuleName(feature.moduleId)}</span>;
      case 'isActive':
        return (
          <span className={`fm-status ${feature.isActive ? 'active' : 'inactive'}`}>
            {feature.isActive ? 'Active' : 'Inactive'}
          </span>
        );
      case 'actions':
        return (
          <div className="fm-actions">
            <button
              className="fm-action-btn edit"
              onClick={() => setEditingFeature(feature)}
              title="Edit Feature"
            >
              <Edit2 size={16} />
            </button>
            <button
              className="fm-action-btn delete"
              onClick={() => setDeletingFeature(feature)}
              title="Delete Feature"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      case 'description':
        return <span className="fm-description">{feature.description || '—'}</span>;
      default:
        return feature[column.key];
    }
  };

  return (
    <div className="feature-management">
      <div className="fm-header">
        <div className="fm-header-content">
          <div className="fm-header-icon">
            <Grid size={28} />
          </div>
          <div>
            <h2 className="fm-title">Feature Management</h2>
            <p className="fm-subtitle">
              Manage features within modules for granular permission control
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {(localError || error) && (
        <div className="fm-error">
          <AlertCircle size={16} />
          <span>{localError || error}</span>
        </div>
      )}

      {/* Search and Actions */}
      <div className="fm-toolbar">
        <div className="fm-filters">
          <div className="fm-search">
            <Search size={18} className="fm-search-icon" />
            <input
              type="text"
              placeholder="Search features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="fm-search-input"
            />
          </div>
          <div className="fm-module-filter">
            <Dropdown
              options={moduleOptions}
              selectedOption={selectedModule}
              onSelect={setSelectedModule}
              placeholder="Filter by module"
              className="fm-dropdown"
            />
          </div>
          {selectedModule && (
            <button
              className="fm-clear-filter"
              onClick={() => setSelectedModule(null)}
              title="Clear filter"
            >
              Clear
            </button>
          )}
        </div>
        <button
          className="fm-create-btn"
          onClick={() => setIsCreateModalOpen(true)}
          disabled={modules.length === 0}
          title={modules.length === 0 ? 'Create modules first' : 'Create new feature'}
        >
          <Plus size={18} />
          <span>Create Feature</span>
        </button>
      </div>

      {effectiveModules.length === 0 && (
        <div className="fm-no-modules">
          <Grid size={48} />
          <h3>No Modules Available</h3>
          <p>Please create modules first before adding features.</p>
        </div>
      )}

      {/* Features Table */}
      {effectiveModules.length > 0 && (
        <div className="fm-table-container">
          <Table
            columns={columns}
            data={filteredFeatures}
            renderCell={renderCell}
            noDataText="No features found. Create your first feature to get started."
            loading={loading}
            showActions={false}
          />
        </div>
      )}

      {/* Create/Edit Feature Modal */}
      {(isCreateModalOpen || editingFeature) && (
        <CreateEditFeatureModal
          isOpen={isCreateModalOpen || !!editingFeature}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingFeature(null);
          }}
          onSave={editingFeature ? handleUpdateFeature : handleCreateFeature}
          feature={editingFeature}
          modules={effectiveModules}
          loading={actionLoading}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deletingFeature}
        onClose={() => setDeletingFeature(null)}
        onConfirm={handleDeleteFeature}
        title="Delete Feature"
        message={`Are you sure you want to delete the feature "${deletingFeature?.displayName}"?`}
        warningText="This action cannot be undone. All permissions associated with this feature will be affected."
        confirmText="Delete Feature"
        cancelText="Cancel"
        confirmButtonVariant="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default FeatureManagement;
