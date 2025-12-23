// Hooks/useIAMModules.js
import { useEffect } from 'react';
import { useIAM } from '../Context/IAMContext';

/**
 * Custom hook for managing modules
 * @param {boolean} autoFetch - Whether to fetch modules on mount
 * @returns {Object} Module data and functions
 */
export const useIAMModules = (autoFetch = true) => {
  const {
    modules,
    modulesLoading,
    modulesError,
    fetchModules,
    addModule,
    updateModule,
    removeModule,
  } = useIAM();

  useEffect(() => {
    if (autoFetch && modules.length === 0 && !modulesLoading) {
      fetchModules().catch(error => {
        console.error('Failed to fetch modules:', error);
      });
    }
  }, [autoFetch, modules.length, modulesLoading, fetchModules]);

  return {
    modules,
    loading: modulesLoading,
    error: modulesError,
    fetchModules,
    addModule,
    updateModule,
    deleteModule: removeModule,
  };
};
