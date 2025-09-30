import { useDepartments as useDepartmentsContext } from '../Context/DepartmentContext';

/**
 * Custom hook to easily access departments functionality
 * This provides a cleaner API for components that need departments
 */
export const useDepartments = () => {
  const context = useDepartmentsContext();
  
  return {
    // Data
    departments: context.departments,
    loading: context.loading,
    error: context.error,
    
    // Helper methods
    getDepartmentById: context.getDepartmentById,
    getDepartmentByName: context.getDepartmentByName,
    getActiveDepartments: context.getActiveDepartments,
    
    // Utility methods
    hasDepartments: context.hasDepartments,
    isCacheValid: context.isCacheValid,
    isStale: context.isStale,
    
    // Actions
    refreshDepartments: context.refreshDepartments,
    fetchDepartments: context.fetchDepartments,
  };
};

export default useDepartments;
