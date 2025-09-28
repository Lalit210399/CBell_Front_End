import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchWithRefresh } from "./RefereshToken";
import { useUser } from "./UserContext";

const DepartmentContext = createContext();

export const useDepartments = () => {
  const context = useContext(DepartmentContext);
  if (!context) {
    throw new Error("useDepartments must be used within a DepartmentProvider");
  }
  return context;
};

export const DepartmentProvider = ({ children }) => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const { user, selectedOrganizationId } = useUser();
  
  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  const fetchDepartments = useCallback(async (forceRefresh = false) => {
    // Check if we have cached data and it's still valid
    if (!forceRefresh && departments.length > 0 && lastFetched) {
      const now = Date.now();
      if (now - lastFetched < CACHE_DURATION) {
        return departments; // Return cached data
      }
    }

    try {
      setLoading(true);
      setError(null);

      const organizationId = selectedOrganizationId || user?.organizationId;
      
      console.log("DepartmentContext: selectedOrganizationId:", selectedOrganizationId);
      console.log("DepartmentContext: user?.organizationId:", user?.organizationId);
      console.log("DepartmentContext: final organizationId:", organizationId);
      
      if (!organizationId) {
        throw new Error("No organization selected");
      }

      // Determine if we need to include X-Context-Organization header
      const isViewingOwnOrg = organizationId === user?.organizationId;
      
      // Prepare headers
      const headers = {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "1",
      };

      // Only add X-Context-Organization header when viewing a different organization
      if (!isViewingOwnOrg) {
        headers["X-Context-Organization"] = organizationId;
      }

      const apiUrl = `/apis/department/organization/${organizationId}`;
      console.log(`DepartmentContext: Calling API URL: ${apiUrl}`);
      console.log(`DepartmentContext: Headers:`, headers);
      
      const response = await fetchWithRefresh(apiUrl, {
        method: "GET",
        headers,
      });
      console.log(`DepartmentContext: API response status: ${response.status}`);
      console.log(`DepartmentContext: API response headers:`, response.headers);

      if (!response.ok) {
        throw new Error(`Failed to fetch departments: ${response.status}`);
      }
   

      const responseData = await response.json();
      const deptData = responseData.data || responseData;

      if (!Array.isArray(deptData)) {
        console.warn("Departments API returned unexpected data format, using fallback");
        const fallbackDepartments = [
          { id: '1', name: 'Marketing', description: 'Marketing Department', isActive: true },
          { id: '2', name: 'Sales', description: 'Sales Department', isActive: true },
          { id: '3', name: 'HR', description: 'Human Resources Department', isActive: true }
        ];
        setDepartments(fallbackDepartments);
        setLastFetched(Date.now());
        return fallbackDepartments;
      }

      // Format the departments for consistent usage
      const formattedDepartments = deptData.map((dept) => ({
        id: dept.id || dept._id,
        name: dept.departmentName || dept.name || dept.deptName,
        description: dept.description || dept.deptDescription || "",
        isActive: dept.isActive !== false, // Default to true if not specified
        organizationId: dept.organizationId,
        ...dept // Include any additional properties
      }));

      setDepartments(formattedDepartments);
      setLastFetched(Date.now());
      
      return formattedDepartments;
    } catch (err) {
      console.error("Error fetching departments:", err);
      setError(err.message);
      
      // If we have cached data, don't show error to user
      if (departments.length > 0) {
        console.warn("Using cached departments due to fetch error");
        return departments;
      }
      
      // No fallback - return empty array on error
      setDepartments([]);
      setLastFetched(null);
      return [];
    } finally {
      setLoading(false);
    }
  }, [selectedOrganizationId, user?.organizationId, user?.userId]);

  // Fetch departments when organization changes or on mount
  useEffect(() => {
    const organizationId = selectedOrganizationId || user?.organizationId;
    
    if (organizationId) {
      // Check if organization supports departments before fetching
      const currentOrg = user?.scope?.accessibleOrganizations?.find(org => org.id === organizationId);
      const orgCode = currentOrg?.data?.organizationCode?.toLowerCase();
      
      // Business logic: Only colleges have departments, institutes don't
      const supportsDepartments = orgCode?.includes('college') || orgCode?.includes('university') || 
                                 (!orgCode?.includes('institute') && !orgCode?.includes('school'));
      
      if (supportsDepartments) {
        fetchDepartments();
      } else {
        // Organization doesn't support departments - clear state
        setDepartments([]);
        setLastFetched(null);
        setError(null);
      }
    } else {
      // No organization selected - clear departments
      setDepartments([]);
      setLastFetched(null);
      setError(null);
    }
  }, [selectedOrganizationId, user?.organizationId, user?.scope]);

  // Clear cache when organization changes
  useEffect(() => {
    setDepartments([]);
    setLastFetched(null);
    setError(null);
  }, [selectedOrganizationId]);

  // Get department by ID
  const getDepartmentById = useCallback((id) => {
    return departments.find(dept => dept.id === id);
  }, [departments]);

  // Get department by name
  const getDepartmentByName = useCallback((name) => {
    return departments.find(dept => dept.name === name);
  }, [departments]);

  // Get active departments only
  const getActiveDepartments = useCallback(() => {
    return departments.filter(dept => dept.isActive);
  }, [departments]);

  // Refresh departments (force refresh)
  const refreshDepartments = useCallback(() => {
    return fetchDepartments(true);
  }, [fetchDepartments]);

  // Check if cache is valid
  const isCacheValid = useCallback(() => {
    if (!lastFetched || departments.length === 0) return false;
    const now = Date.now();
    return now - lastFetched < CACHE_DURATION;
  }, [lastFetched, departments.length, CACHE_DURATION]);

  const value = {
    departments,
    loading,
    error,
    lastFetched,
    fetchDepartments,
    refreshDepartments,
    getDepartmentById,
    getDepartmentByName,
    getActiveDepartments,
    isCacheValid,
    // Helper methods
    hasDepartments: departments.length > 0,
    isStale: lastFetched ? Date.now() - lastFetched > CACHE_DURATION : true,
  };

  return (
    <DepartmentContext.Provider value={value}>
      {children}
    </DepartmentContext.Provider>
  );
};
