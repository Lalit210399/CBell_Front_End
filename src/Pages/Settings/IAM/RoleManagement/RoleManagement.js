// Pages/Settings/IAM/RoleManagement/RoleManagement.js
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Shield, AlertCircle, Eye } from 'lucide-react';
import { useIAMRoles } from '../../../../Hooks/useIAMRoles';
import { useIAMModules } from '../../../../Hooks/useIAMModules';
import { useIAMFeatures } from '../../../../Hooks/useIAMFeatures';
import { useIAM } from '../../../../Context/IAMContext';
import Table from '../../../../CommonComponents/Table/Table';
import ConfirmationModal from '../../../../CommonComponents/ConfirmationModal/ConfirmationModal';
import CreateEditRoleModal from './CreateEditRoleModal';
import ViewRoleModal from './ViewRoleModal';
import './RoleManagement.css';
import { modules as dummyModules, features as dummyFeatures, roles as dummyRoles, permissionTypes as dummyPermissionTypes } from '../dummyData';

const RoleManagement = () => {
  // Keep hooks available but provide local fallbacks so component can run without API
  const {
    roles,
    loading,
    error,
    fetchRoles,
    addRole,
    updateRole,
    deleteRole,
  } = useIAMRoles();

  const { modules, fetchModules } = useIAMModules();
  const { features, fetchFeatures } = useIAMFeatures();
  const { permissionTypes, fetchPermissionTypes } = useIAM();

  // Local fallback data for offline / dummy mode (use shared dummyData)
  const [localRoles, setLocalRoles] = useState(dummyRoles);
  const [localModules, setLocalModules] = useState(dummyModules);
  const [localFeatures, setLocalFeatures] = useState(dummyFeatures);
  const [localPermissionTypes, setLocalPermissionTypes] = useState(dummyPermissionTypes);

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [viewingRole, setViewingRole] = useState(null);
  const [deletingRole, setDeletingRole] = useState(null);
  const [localError, setLocalError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // (dummy data provided from shared dummyData.js)

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [rolesData, modulesData, featuresData, permTypesData] = await Promise.all([
          fetchRoles().catch(err => { 
            console.error('Failed to fetch roles:', err); 
            return []; 
          }),
          fetchModules().catch(err => { 
            console.error('Failed to fetch modules:', err); 
            return []; 
          }),
          fetchFeatures().catch(err => { 
            console.error('Failed to fetch features:', err); 
            return []; 
          }),
          fetchPermissionTypes().catch(err => { 
            console.error('Failed to fetch permission types:', err); 
            return []; 
          })
        ]);
        
        // console.log('IAM Data loaded:', {
        //   roles: rolesData?.length || 0,
        //   modules: modulesData?.length || 0,
        //   features: featuresData?.length || 0,
        //   permissionTypes: permTypesData?.length || 0
        // });
      } catch (err) {
        console.error('Error loading IAM data:', err);
      }
    };
    
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Use effective data (hook-provided if available, otherwise local dummy data)
  const effectiveRoles = (roles && roles.length > 0) ? roles : localRoles;
  const effectiveModules = (modules && modules.length > 0) ? modules : localModules;
  const effectiveFeatures = (features && features.length > 0) ? features : localFeatures;
  const effectivePermissionTypes = (permissionTypes && permissionTypes.length > 0) ? permissionTypes : localPermissionTypes;

  // Debug: Log effective data
  useEffect(() => {
    // console.log('Role Management Data:', {
    //   rolesFromAPI: roles,
    //   rolesCount: roles?.length,
    //   effectiveRolesCount: effectiveRoles.length,
    //   modulesCount: effectiveModules.length,
    //   featuresCount: effectiveFeatures.length,
    //   permissionTypesCount: effectivePermissionTypes.length,
    //   loading,
    //   error
    // });
  }, [roles, effectiveRoles, effectiveModules, effectiveFeatures, effectivePermissionTypes, loading, error]);

  // Filter roles based on search query
  const filteredRoles = effectiveRoles.filter((role) =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Count permissions for a role
  const countPermissions = (role) => {
    if (!role.permissions || role.permissions.length === 0) return 0;
    
    return role.permissions.reduce((count, perm) => {
      // Count the number of set bits in permissionValue
      let value = perm.permissionValue || 0;
      let bits = 0;
      while (value > 0) {
        bits += value & 1;
        value >>= 1;
      }
      return count + bits;
    }, 0);
  };

  // Handle create role
  const handleCreateRole = async (roleData) => {
    try {
      setLocalError(null);
      setActionLoading(true);
      // Local-only create
      const newRole = {
        id: `local-${Date.now()}`,
        name: roleData.name || `role-${Date.now()}`,
        displayName: roleData.displayName || roleData.name,
        description: roleData.description || '',
        permissions: roleData.permissions || [],
        isActive: roleData.isActive !== undefined ? roleData.isActive : true,
      };
      setLocalRoles(prev => [newRole, ...prev]);
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Error creating role (local):', err);
      setLocalError(err.message || 'Failed to create role.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle update role
  const handleUpdateRole = async (roleData) => {
    try {
      setLocalError(null);
      setActionLoading(true);
      setLocalRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, ...roleData } : r));
      setEditingRole(null);
    } catch (err) {
      console.error('Error updating role (local):', err);
      setLocalError(err.message || 'Failed to update role.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete role
  const handleDeleteRole = async () => {
    if (!deletingRole) return;

    try {
      setLocalError(null);
      setActionLoading(true);
      setLocalRoles(prev => prev.filter(r => r.id !== deletingRole.id));
      setDeletingRole(null);
    } catch (err) {
      console.error('Error deleting role (local):', err);
      setLocalError(err.message || 'Failed to delete role.');
    } finally {
      setActionLoading(false);
    }
  };

  // Table columns
  const columns = [
    { key: 'displayName', label: 'Display Name' },
    { key: 'name', label: 'System Name' },
    { key: 'description', label: 'Description' },
    { key: 'permissions', label: 'Permissions' },
    { key: 'isActive', label: 'Status' },
    // { key: 'actions', label: 'Actions' },
  ];

  // Render custom cells
  const renderCell = (columnKey, role) => {
    switch (columnKey) {
      case 'permissions':
        const permCount = countPermissions(role);
        return (
          <span className="rm-permission-count">
            {permCount} {permCount === 1 ? 'permission' : 'permissions'}
          </span>
        );
      case 'isActive':
        return (
          <span className={`rm-status ${role.isActive ? 'active' : 'inactive'}`}>
            {role.isActive ? 'Active' : 'Inactive'}
          </span>
        );
      case 'actions':
        return (
          <div className="rm-actions">
            <button
              className="rm-action-btn view"
              onClick={() => setViewingRole(role)}
              title="View Permissions"
            >
              <Eye size={16} />
            </button>
            <button
              className="rm-action-btn edit"
              onClick={() => setEditingRole(role)}
              title="Edit Role"
            >
              <Edit2 size={16} />
            </button>
            <button
              className="rm-action-btn delete"
              onClick={() => setDeletingRole(role)}
              title="Delete Role"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      case 'description':
        return <span className="rm-description">{role.description || '—'}</span>;
      default:
        return role[columnKey];
    }
  };

  const hasRequiredData = effectiveModules.length > 0 && effectiveFeatures.length > 0 && effectivePermissionTypes.length > 0;

  return (
    <div className="role-management">
      <div className="rm-header">
        <div className="rm-header-content">
          <div className="rm-header-icon">
            <Shield size={28} />
          </div>
          <div>
            <h2 className="rm-title">Role Management</h2>
            <p className="rm-subtitle">
              Create and manage roles with granular permission control
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {(localError || error) && (
        <div className="rm-error">
          <AlertCircle size={16} />
          <span>{localError || error}</span>
        </div>
      )}

      {/* Search and Actions */}
      <div className="rm-toolbar">
        <div className="rm-search">
          <Search size={18} className="rm-search-icon" />
          <input
            type="text"
            placeholder="Search roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rm-search-input"
          />
        </div>
        {/* <button
          className="rm-create-btn"
          onClick={() => setIsCreateModalOpen(true)}
          disabled={!hasRequiredData}
          title={!hasRequiredData ? 'Create modules and features first' : 'Create new role'}
        >
          <Plus size={18} />
          <span>Create Role</span>
        </button> */}
      </div>

      {!hasRequiredData && (
        <div className="rm-warning" style={{ padding: '12px 20px', background: '#fff3cd', color: '#856404', borderRadius: '4px', margin: '16px 0', border: '1px solid #ffeaa7' }}>
          <AlertCircle size={16} style={{ display: 'inline', marginRight: '8px' }} />
          <span>Warning: Modules ({effectiveModules.length}), Features ({effectiveFeatures.length}), or Permission Types ({effectivePermissionTypes.length}) data is missing. Role management may not work correctly.</span>
        </div>
      )}

      {/* Roles Table - Always show if we have roles */}
      <div className="rm-table-container">
        <Table
          columns={columns}
          data={filteredRoles}
          renderCell={renderCell}
          noDataText="No roles found. Create your first role to get started."
          loading={loading}
          showActions={false}
        />
      </div>

      {/* Create/Edit Role Modal */}
      {(isCreateModalOpen || editingRole) && hasRequiredData && (
        <CreateEditRoleModal
          isOpen={isCreateModalOpen || !!editingRole}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingRole(null);
          }}
          onSave={editingRole ? handleUpdateRole : handleCreateRole}
          role={editingRole}
          modules={effectiveModules}
          features={effectiveFeatures}
          permissionTypes={effectivePermissionTypes}
          loading={actionLoading}
        />
      )}

      {/* View Role Modal */}
      {viewingRole && (
        <ViewRoleModal
          isOpen={!!viewingRole}
          onClose={() => setViewingRole(null)}
          role={viewingRole}
          modules={effectiveModules}
          features={effectiveFeatures}
          permissionTypes={effectivePermissionTypes}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deletingRole}
        onClose={() => setDeletingRole(null)}
        onConfirm={handleDeleteRole}
        title="Delete Role"
        message={`Are you sure you want to delete the role "${deletingRole?.displayName}"?`}
        warningText="This action cannot be undone. Users with this role will lose their permissions."
        confirmText="Delete Role"
        cancelText="Cancel"
        confirmButtonVariant="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default RoleManagement;
