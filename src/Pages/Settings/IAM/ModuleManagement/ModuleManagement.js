// Pages/Settings/IAM/ModuleManagement/ModuleManagement.js
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Package, AlertCircle } from 'lucide-react';
import { useIAMModules } from '../../../../Hooks/useIAMModules';
import Table from '../../../../CommonComponents/Table/Table';
import ConfirmationModal from '../../../../CommonComponents/ConfirmationModal/ConfirmationModal';
import CreateEditModuleModal from './CreateEditModuleModal';
import './ModuleManagement.css';
import { modules as dummyModules } from '../dummyData';

const ModuleManagement = () => {
  const {
    modules,
    loading,
    error,
    fetchModules,
    addModule,
    updateModule,
    deleteModule,
  } = useIAMModules();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [deletingModule, setDeletingModule] = useState(null);
  const [localError, setLocalError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [localModules, setLocalModules] = useState(dummyModules);

  // Filter modules based on search query
  const effectiveModules = (modules && modules.length > 0) ? modules : localModules;

  const filteredModules = effectiveModules.filter((module) =>
    module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle create module
  const handleCreateModule = async (moduleData) => {
    try {
      setLocalError(null);
      setActionLoading(true);
      const newModule = { id: `local-${Date.now()}`, name: moduleData.name, displayName: moduleData.displayName || moduleData.name, description: moduleData.description || '', isActive: true };
      setLocalModules(prev => [newModule, ...prev]);
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Error creating module (local):', err);
      setLocalError(err.message || 'Failed to create module.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle update module
  const handleUpdateModule = async (moduleData) => {
    try {
      setLocalError(null);
      setActionLoading(true);
      setLocalModules(prev => prev.map(m => m.id === editingModule.id ? { ...m, ...moduleData } : m));
      setEditingModule(null);
    } catch (err) {
      console.error('Error updating module (local):', err);
      setLocalError(err.message || 'Failed to update module.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete module
  const handleDeleteModule = async () => {
    if (!deletingModule) return;

    try {
      setLocalError(null);
      setActionLoading(true);
      setLocalModules(prev => prev.filter(m => m.id !== deletingModule.id));
      setDeletingModule(null);
    } catch (err) {
      console.error('Error deleting module (local):', err);
      setLocalError(err.message || 'Failed to delete module.');
    } finally {
      setActionLoading(false);
    }
  };

  // Table columns
  const columns = [
    { key: 'displayName', label: 'Display Name' },
    { key: 'name', label: 'System Name' },
    { key: 'description', label: 'Description' },
    { key: 'isActive', label: 'Status' },
    { key: 'actions', label: 'Actions' },
  ];

  // Render custom cells
  const renderCell = (module, column) => {
    switch (column.key) {
      case 'isActive':
        return (
          <span className={`mm-status ${module.isActive ? 'active' : 'inactive'}`}>
            {module.isActive ? 'Active' : 'Inactive'}
          </span>
        );
      case 'actions':
        return (
          <div className="mm-actions">
            <button
              className="mm-action-btn edit"
              onClick={() => setEditingModule(module)}
              title="Edit Module"
            >
              <Edit2 size={16} />
            </button>
            <button
              className="mm-action-btn delete"
              onClick={() => setDeletingModule(module)}
              title="Delete Module"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      case 'description':
        return <span className="mm-description">{module.description || '—'}</span>;
      default:
        return module[column.key];
    }
  };

  return (
    <div className="module-management">
      <div className="mm-header">
        <div className="mm-header-content">
          <div className="mm-header-icon">
            <Package size={28} />
          </div>
          <div>
            <h2 className="mm-title">Module Management</h2>
            <p className="mm-subtitle">
              Manage system modules that group related features and permissions
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {(localError || error) && (
        <div className="mm-error">
          <AlertCircle size={16} />
          <span>{localError || error}</span>
        </div>
      )}

      {/* Search and Actions */}
      <div className="mm-toolbar">
        <div className="mm-search">
          <Search size={18} className="mm-search-icon" />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mm-search-input"
          />
        </div>
        <button
          className="mm-create-btn"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={18} />
          <span>Create Module</span>
        </button>
      </div>

      {/* Modules Table */}
      <div className="mm-table-container">
        <Table
          columns={columns}
          data={filteredModules}
          renderCell={renderCell}
          noDataText="No modules found. Create your first module to get started."
          loading={loading}
          showActions={false}
        />
      </div>

      {/* Create/Edit Module Modal */}
      {(isCreateModalOpen || editingModule) && (
        <CreateEditModuleModal
          isOpen={isCreateModalOpen || !!editingModule}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingModule(null);
          }}
          onSave={editingModule ? handleUpdateModule : handleCreateModule}
          module={editingModule}
          loading={actionLoading}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deletingModule}
        onClose={() => setDeletingModule(null)}
        onConfirm={handleDeleteModule}
        title="Delete Module"
        message={`Are you sure you want to delete the module "${deletingModule?.displayName}"?`}
        warningText="This action cannot be undone. All features associated with this module will also be affected."
        confirmText="Delete Module"
        cancelText="Cancel"
        confirmButtonVariant="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default ModuleManagement;
