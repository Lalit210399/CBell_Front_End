// Hooks/useIAMFeatures.js
import { useEffect } from 'react';
import { useIAM } from '../Context/IAMContext';

/**
 * Custom hook for managing features
 * @param {boolean} autoFetch - Whether to fetch features on mount
 * @param {string} moduleId - Optional module ID to filter features
 * @returns {Object} Feature data and functions
 */
export const useIAMFeatures = (autoFetch = true, moduleId = null) => {
  const {
    features,
    featuresLoading,
    featuresError,
    fetchFeatures,
    addFeature,
    updateFeature,
    removeFeature,
  } = useIAM();

  useEffect(() => {
    if (autoFetch && features.length === 0 && !featuresLoading) {
      fetchFeatures(moduleId).catch(error => {
        console.error('Failed to fetch features:', error);
      });
    }
  }, [autoFetch, features.length, featuresLoading, moduleId, fetchFeatures]);

  return {
    features,
    loading: featuresLoading,
    error: featuresError,
    fetchFeatures,
    addFeature,
    updateFeature,
    deleteFeature: removeFeature,
  };
};
