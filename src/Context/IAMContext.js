// Context/IAMContext.js
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as IAMService from '../Services/IAMService';

const IAMContext = createContext();

export const IAMProvider = ({ children }) => {
  // Modules State
  const [modules, setModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [modulesError, setModulesError] = useState(null);

  // Features State
  const [features, setFeatures] = useState([]);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [featuresError, setFeaturesError] = useState(null);

  // Permission Types State
  const [permissionTypes, setPermissionTypes] = useState([]);
  const [permissionTypesLoading, setPermissionTypesLoading] = useState(false);
  const [permissionTypesError, setPermissionTypesError] = useState(null);

  // Roles State
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState(null);

  // Current User Permissions State
  const [currentUserPermissions, setCurrentUserPermissions] = useState(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsError, setPermissionsError] = useState(null);

  // ==================== Modules ====================

  const fetchModules = useCallback(async () => {
    setModulesLoading(true);
    setModulesError(null);
    try {
      const data = await IAMService.getAllModules();
      setModules(data);
      return data;
    } catch (error) {
      setModulesError(error.message);
      throw error;
    } finally {
      setModulesLoading(false);
    }
  }, []);

  const addModule = useCallback(async (moduleData) => {
    try {
      const newModule = await IAMService.createModule(moduleData);
      setModules(prev => [...prev, newModule]);
      return newModule;
    } catch (error) {
      setModulesError(error.message);
      throw error;
    }
  }, []);

  const updateModule = useCallback(async (id, moduleData) => {
    try {
      const updatedModule = await IAMService.updateModule(id, moduleData);
      setModules(prev => prev.map(m => m.id === id ? updatedModule : m));
      return updatedModule;
    } catch (error) {
      setModulesError(error.message);
      throw error;
    }
  }, []);

  const removeModule = useCallback(async (id) => {
    try {
      await IAMService.deleteModule(id);
      setModules(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      setModulesError(error.message);
      throw error;
    }
  }, []);

  // ==================== Features ====================

  const fetchFeatures = useCallback(async (moduleId = null) => {
    setFeaturesLoading(true);
    setFeaturesError(null);
    try {
      const data = await IAMService.getAllFeatures(moduleId);
      setFeatures(data);
      return data;
    } catch (error) {
      setFeaturesError(error.message);
      throw error;
    } finally {
      setFeaturesLoading(false);
    }
  }, []);

  const addFeature = useCallback(async (featureData) => {
    try {
      const newFeature = await IAMService.createFeature(featureData);
      setFeatures(prev => [...prev, newFeature]);
      return newFeature;
    } catch (error) {
      setFeaturesError(error.message);
      throw error;
    }
  }, []);

  const updateFeature = useCallback(async (id, featureData) => {
    try {
      const updatedFeature = await IAMService.updateFeature(id, featureData);
      setFeatures(prev => prev.map(f => f.id === id ? updatedFeature : f));
      return updatedFeature;
    } catch (error) {
      setFeaturesError(error.message);
      throw error;
    }
  }, []);

  const removeFeature = useCallback(async (id) => {
    try {
      await IAMService.deleteFeature(id);
      setFeatures(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      setFeaturesError(error.message);
      throw error;
    }
  }, []);

  // ==================== Permission Types ====================

  const fetchPermissionTypes = useCallback(async () => {
    setPermissionTypesLoading(true);
    setPermissionTypesError(null);
    try {
      const data = await IAMService.getAllPermissionTypes();
      setPermissionTypes(data);
      return data;
    } catch (error) {
      setPermissionTypesError(error.message);
      throw error;
    } finally {
      setPermissionTypesLoading(false);
    }
  }, []);

  const addPermissionType = useCallback(async (permissionTypeData) => {
    try {
      const newPermissionType = await IAMService.createPermissionType(permissionTypeData);
      setPermissionTypes(prev => [...prev, newPermissionType]);
      return newPermissionType;
    } catch (error) {
      setPermissionTypesError(error.message);
      throw error;
    }
  }, []);

  const setupDefaults = useCallback(async () => {
    try {
      const defaults = await IAMService.setupDefaultPermissionTypes();
      setPermissionTypes(defaults);
      return defaults;
    } catch (error) {
      setPermissionTypesError(error.message);
      throw error;
    }
  }, []);

  // ==================== Roles ====================

  const fetchRoles = useCallback(async () => {
    setRolesLoading(true);
    setRolesError(null);
    try {
      const data = await IAMService.getAllRoles();
      setRoles(data);
      return data;
    } catch (error) {
      setRolesError(error.message);
      throw error;
    } finally {
      setRolesLoading(false);
    }
  }, []);

  const addRole = useCallback(async (roleData) => {
    try {
      const newRole = await IAMService.createRole(roleData);
      setRoles(prev => [...prev, newRole]);
      return newRole;
    } catch (error) {
      setRolesError(error.message);
      throw error;
    }
  }, []);

  const updateRole = useCallback(async (id, roleData) => {
    try {
      const updatedRole = await IAMService.updateRole(id, roleData);
      setRoles(prev => prev.map(r => r.id === id ? updatedRole : r));
      return updatedRole;
    } catch (error) {
      setRolesError(error.message);
      throw error;
    }
  }, []);

  const removeRole = useCallback(async (id) => {
    try {
      await IAMService.deleteRole(id);
      setRoles(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      setRolesError(error.message);
      throw error;
    }
  }, []);

  const assignRoles = useCallback(async (userId, roleIds) => {
    try {
      const result = await IAMService.assignRolesToUser(userId, roleIds);
      return result;
    } catch (error) {
      setRolesError(error.message);
      throw error;
    }
  }, []);

  // ==================== Current User Permissions ====================

  const fetchCurrentUserPermissions = useCallback(async () => {
    setPermissionsLoading(true);
    setPermissionsError(null);
    try {
      const data = await IAMService.getCurrentUserPermissions();
      setCurrentUserPermissions(data);
      // Store in localStorage for persistence
      localStorage.setItem('userPermissions', JSON.stringify(data));
      return data;
    } catch (error) {
      setPermissionsError(error.message);
      throw error;
    } finally {
      setPermissionsLoading(false);
    }
  }, []);

  // Load cached permissions on mount
  useEffect(() => {
    const cachedPermissions = localStorage.getItem('userPermissions');
    if (cachedPermissions) {
      try {
        setCurrentUserPermissions(JSON.parse(cachedPermissions));
      } catch (error) {
        console.error('Failed to parse cached permissions:', error);
      }
    }
  }, []);

  const value = {
    // Modules
    modules,
    modulesLoading,
    modulesError,
    fetchModules,
    addModule,
    updateModule,
    removeModule,

    // Features
    features,
    featuresLoading,
    featuresError,
    fetchFeatures,
    addFeature,
    updateFeature,
    removeFeature,

    // Permission Types
    permissionTypes,
    permissionTypesLoading,
    permissionTypesError,
    fetchPermissionTypes,
    addPermissionType,
    setupDefaults,

    // Roles
    roles,
    rolesLoading,
    rolesError,
    fetchRoles,
    addRole,
    updateRole,
    removeRole,
    assignRoles,

    // Current User Permissions
    currentUserPermissions,
    permissionsLoading,
    permissionsError,
    fetchCurrentUserPermissions,
  };

  return <IAMContext.Provider value={value}>{children}</IAMContext.Provider>;
};

export const useIAM = () => {
  const context = useContext(IAMContext);
  if (!context) {
    throw new Error('useIAM must be used within an IAMProvider');
  }
  return context;
};
