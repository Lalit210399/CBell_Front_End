// Hooks/usePermission.js
import { useMemo } from 'react';
import { useUser } from '../Context/UserContext';

/**
 * Custom hook for checking user permissions
 * @returns {Object} Permission checking functions
 */
export const usePermission = () => {
  const { permissions } = useUser();

  // Check if user has a specific permission
  const hasPermission = useMemo(() => {
    return (moduleName, featureName, permissionName) => {
      if (!permissions) return false;
      
      return (
        permissions[moduleName]?.[featureName]?.includes(permissionName) || false
      );
    };
  }, [permissions]);

  // Check if user has ANY of the specified permissions
  const hasAnyPermission = useMemo(() => {
    return (moduleName, featureName, permissionNames) => {
      if (!permissions || !Array.isArray(permissionNames)) return false;
      
      const userPermissions = permissions[moduleName]?.[featureName] || [];
      return permissionNames.some(p => userPermissions.includes(p));
    };
  }, [permissions]);

  // Check if user has ALL of the specified permissions
  const hasAllPermissions = useMemo(() => {
    return (moduleName, featureName, permissionNames) => {
      if (!permissions || !Array.isArray(permissionNames)) return false;
      
      const userPermissions = permissions[moduleName]?.[featureName] || [];
      return permissionNames.every(p => userPermissions.includes(p));
    };
  }, [permissions]);

  // Check if user has a specific role
  const hasRole = useMemo(() => {
    return (roleName) => {
      // This would need to be implemented based on how roles are stored in UserContext
      // For now, return false
      return false;
    };
  }, []);

  // Get all permissions for a module-feature combination
  const getFeaturePermissions = useMemo(() => {
    return (moduleName, featureName) => {
      if (!permissions) return [];
      return permissions[moduleName]?.[featureName] || [];
    };
  }, [permissions]);

  // Check if permissions are loaded
  const isPermissionsLoaded = useMemo(() => {
    return permissions !== null;
  }, [permissions]);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    getFeaturePermissions,
    isPermissionsLoaded,
    permissions
  };
};
