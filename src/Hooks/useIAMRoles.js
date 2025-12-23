// Hooks/useIAMRoles.js
import { useEffect } from 'react';
import { useIAM } from '../Context/IAMContext';

/**
 * Custom hook for managing roles
 * @param {boolean} autoFetch - Whether to fetch roles on mount
 * @returns {Object} Role data and functions
 */
export const useIAMRoles = (autoFetch = true) => {
  const {
    roles,
    rolesLoading,
    rolesError,
    fetchRoles,
    addRole,
    updateRole,
    removeRole,
    assignRoles,
  } = useIAM();

  useEffect(() => {
    if (autoFetch && roles.length === 0 && !rolesLoading) {
      fetchRoles().catch(error => {
        console.error('Failed to fetch roles:', error);
      });
    }
  }, [autoFetch, roles.length, rolesLoading, fetchRoles]);

  return {
    roles,
    loading: rolesLoading,
    error: rolesError,
    fetchRoles,
    addRole,
    updateRole,
    deleteRole: removeRole,
    assignRolesToUser: assignRoles,
  };
};
