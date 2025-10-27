import { useEventTypes as useEventTypesContext } from '../Context/EventTypesContext';

/**
 * Custom hook to easily access event types functionality
 * This provides a cleaner API for components that need event types
 */
export const useEventTypes = () => {
  const context = useEventTypesContext();
  
  return {
    // Data
    eventTypes: context.eventTypes,
    loading: context.loading,
    error: context.error,
    
    // Helper methods
    getEventTypeById: context.getEventTypeById,
    getEventTypeByName: context.getEventTypeByName,
    getActiveEventTypes: context.getActiveEventTypes,
    
    // Utility methods
    hasEventTypes: context.hasEventTypes,
    isCacheValid: context.isCacheValid,
    isStale: context.isStale,
    
    // Actions
    refreshEventTypes: context.refreshEventTypes,
    fetchEventTypes: context.fetchEventTypes,
  };
};

export default useEventTypes;
