import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useUser } from "./UserContext";
import { fetchWithRefresh } from "./RefereshToken";

const TaskStatusContext = createContext();

export { TaskStatusContext };

export const useTaskStatus = () => {
  const context = useContext(TaskStatusContext);
  if (!context) {
    throw new Error("useTaskStatus must be used within a TaskStatusProvider");
  }
  return context;
};

export const TaskStatusProvider = ({ children }) => {
  const [taskStatuses, setTaskStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const { user, selectedOrganizationId } = useUser();
  
  console.log("TaskStatusContext: Provider initialized", { 
    user: user ? { id: user.id, organizationId: user.organizationId } : null, 
    selectedOrganizationId 
  });
  
  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  // Default color mapping for task statuses
  const getDefaultColor = (statusValue) => {
    const colorMap = {
      "New": "gray",
      "Active": "blue", 
      "Under Approval": "orange",
      "Approved": "green",
      "Published": "purple",
      "Cancelled": "red",
      "Draft": "gray",
      "In Progress": "blue", 
      "Pending": "orange",
      "Completed": "green",
      "On Hold": "yellow"
    };
    return colorMap[statusValue] || "gray";
  };

  const fetchTaskStatuses = useCallback(async (forceRefresh = false) => {
    console.log("TaskStatusContext: fetchTaskStatuses called", { forceRefresh, lastFetched, CACHE_DURATION });
    
    // Check if we have cached data and it's still valid
    if (!forceRefresh && lastFetched) {
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetched;
      console.log("TaskStatusContext: Cache check", { 
        timeSinceLastFetch, 
        CACHE_DURATION, 
        isCacheValid: timeSinceLastFetch < CACHE_DURATION 
      });
      if (timeSinceLastFetch < CACHE_DURATION) {
        console.log("TaskStatusContext: Cache is valid, skipping API call");
        return; // Don't fetch if cache is valid
      }
    }
    
    console.log("TaskStatusContext: Proceeding with API call");

    try {
      setLoading(true);
      setError(null);

      const organizationId = selectedOrganizationId || user?.organizationId;
      
      if (!organizationId) {
        throw new Error("No organization selected");
      }

      // Prepare headers
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        "ngrok-skip-browser-warning": "1",
      };

      // Only add X-Context-Organization header when viewing a different organization
      const isViewingOwnOrg = organizationId === user?.organizationId;
      if (!isViewingOwnOrg) {
        headers["X-Context-Organization"] = organizationId;
      }

      console.log("TaskStatusContext: Fetching task statuses for organization:", organizationId);
      const response = await fetchWithRefresh(`/apis/taskstatus/get-all?organizationId=${organizationId}`, {
        method: "GET",
        headers,
      });
      console.log("TaskStatusContext: API response status:", response.status);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn("Task status API not available, using fallback data");
          // Return fallback task statuses when API is not available
          const fallbackStatuses = [
            { id: '1', statusName: 'New', name: 'New', isActive: true, color: 'gray' },
            { id: '2', statusName: 'Active', name: 'Active', isActive: true, color: 'blue' },
            { id: '3', statusName: 'Under Approval', name: 'Under Approval', isActive: true, color: 'orange' },
            { id: '4', statusName: 'Approved', name: 'Approved', isActive: true, color: 'green' },
            { id: '5', statusName: 'Published', name: 'Published', isActive: true, color: 'purple' },
            { id: '6', statusName: 'Cancelled', name: 'Cancelled', isActive: true, color: 'red' }
          ];
          setTaskStatuses(fallbackStatuses);
          setLastFetched(Date.now());
          setError(null); // Don't show error for fallback data
          return fallbackStatuses;
        }
        throw new Error(`Failed to fetch task statuses: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("TaskStatusContext: API response data:", responseData);
      const statusData = responseData.data || responseData;
      console.log("TaskStatusContext: Processed status data:", statusData);

      if (!Array.isArray(statusData)) {
        console.warn("Task status API returned unexpected data format, using fallback");
        const fallbackStatuses = [
          { id: '1', statusName: 'New', name: 'New', isActive: true, color: 'gray' },
          { id: '2', statusName: 'Active', name: 'Active', isActive: true, color: 'blue' },
          { id: '3', statusName: 'Under Approval', name: 'Under Approval', isActive: true, color: 'orange' },
          { id: '4', statusName: 'Approved', name: 'Approved', isActive: true, color: 'green' },
          { id: '5', statusName: 'Published', name: 'Published', isActive: true, color: 'purple' },
          { id: '6', statusName: 'Cancelled', name: 'Cancelled', isActive: true, color: 'red' }
        ];
        setTaskStatuses(fallbackStatuses);
        setLastFetched(Date.now());
        setError(null);
        return fallbackStatuses;
      }

      // Format the task statuses with consistent structure
      const formattedStatuses = statusData.map((status) => ({
        id: status.id || status._id,
        statusName: status.statusName || status.name || status.label,
        name: status.statusName || status.name || status.label,
        description: status.description || status.statusDescription || "",
        isActive: status.isActive !== false, // Default to true if not specified
        organizationId: status.organizationId,
        color: status.color || getDefaultColor(status.statusName || status.name || status.label),
        ...status // Include any additional properties
      }));

      console.log("TaskStatusContext: Final formatted statuses:", formattedStatuses);
      setTaskStatuses(formattedStatuses);
      setLastFetched(Date.now());
      
      return formattedStatuses;
    } catch (err) {
      console.error("Error fetching task statuses:", err);
      
      // Use fallback data on error
      const fallbackStatuses = [
        { id: '1', statusName: 'New', name: 'New', isActive: true, color: 'gray' },
        { id: '2', statusName: 'Active', name: 'Active', isActive: true, color: 'blue' },
        { id: '3', statusName: 'Under Approval', name: 'Under Approval', isActive: true, color: 'orange' },
        { id: '4', statusName: 'Approved', name: 'Approved', isActive: true, color: 'green' },
        { id: '5', statusName: 'Published', name: 'Published', isActive: true, color: 'purple' },
        { id: '6', statusName: 'Cancelled', name: 'Cancelled', isActive: true, color: 'red' }
      ];
      setTaskStatuses(fallbackStatuses);
      setLastFetched(Date.now());
      setError(err.message);
      return fallbackStatuses;
    } finally {
      setLoading(false);
    }
  }, [selectedOrganizationId, user?.organizationId, lastFetched, CACHE_DURATION]);

  // Fetch task statuses when organization changes or on mount
  useEffect(() => {
    const organizationId = selectedOrganizationId || user?.organizationId;
    console.log("TaskStatusContext: useEffect triggered", {
      organizationId,
      selectedOrganizationId,
      userOrgId: user?.organizationId,
      lastFetched,
      taskStatusesLength: taskStatuses.length
    });
    
    if (organizationId) {
      console.log("TaskStatusContext: Calling fetchTaskStatuses");
      fetchTaskStatuses();
    } else {
      console.log("TaskStatusContext: No organization ID, using fallback data");
      // Use fallback data when no organization is selected
      const fallbackStatuses = [
        { id: '1', statusName: 'New', name: 'New', isActive: true, color: 'gray' },
        { id: '2', statusName: 'Active', name: 'Active', isActive: true, color: 'blue' },
        { id: '3', statusName: 'Under Approval', name: 'Under Approval', isActive: true, color: 'orange' },
        { id: '4', statusName: 'Approved', name: 'Approved', isActive: true, color: 'green' },
        { id: '5', statusName: 'Published', name: 'Published', isActive: true, color: 'purple' },
        { id: '6', statusName: 'Cancelled', name: 'Cancelled', isActive: true, color: 'red' }
      ];
      setTaskStatuses(fallbackStatuses);
      setLastFetched(Date.now());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrganizationId, user?.organizationId, user?.userId]);

  // Clear cache when organization changes
  useEffect(() => {
    console.log("TaskStatusContext: Clearing cache due to organization change", { selectedOrganizationId });
    setTaskStatuses([]);
    setLastFetched(null);
  }, [selectedOrganizationId]);

  // Helper functions
  const getTaskStatusById = useCallback((id) => {
    return taskStatuses.find(status => status.id === id);
  }, [taskStatuses]);

  const getTaskStatusByName = useCallback((name) => {
    return taskStatuses.find(status => 
      status.statusName === name || status.name === name
    );
  }, [taskStatuses]);

  const getActiveTaskStatuses = useCallback(() => {
    console.log("TaskStatusContext: getActiveTaskStatuses called, returning:", taskStatuses.filter(status => status.isActive !== false));
    return taskStatuses.filter(status => status.isActive !== false);
  }, [taskStatuses]);

  const refreshTaskStatuses = useCallback(() => {
    return fetchTaskStatuses(true);
  }, [fetchTaskStatuses]);

  const isCacheValid = useCallback(() => {
    if (!lastFetched) return false;
    return (Date.now() - lastFetched) < CACHE_DURATION;
  }, [lastFetched, CACHE_DURATION]);

  const hasTaskStatuses = taskStatuses.length > 0;

  // Manual trigger for testing
  const forceFetch = useCallback(() => {
    console.log("TaskStatusContext: Force fetch triggered");
    return fetchTaskStatuses(true);
  }, [fetchTaskStatuses]);

  const value = {
    taskStatuses,
    loading,
    error,
    hasTaskStatuses,
    getTaskStatusById,
    getTaskStatusByName,
    getActiveTaskStatuses,
    refreshTaskStatuses,
    isCacheValid,
    fetchTaskStatuses,
    forceFetch
  };

  return (
    <TaskStatusContext.Provider value={value}>
      {children}
    </TaskStatusContext.Provider>
  );
};
