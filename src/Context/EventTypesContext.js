import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchWithRefresh } from "./RefereshToken";
import { useUser } from "./UserContext";

const EventTypesContext = createContext();

export const useEventTypes = () => {
  const context = useContext(EventTypesContext);
  if (!context) {
    throw new Error("useEventTypes must be used within an EventTypesProvider");
  }
  return context;
};

export const EventTypesProvider = ({ children }) => {
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const { user, selectedOrganizationId } = useUser();
  

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  const fetchEventTypes = useCallback(async (forceRefresh = false) => {
    // Check if we have cached data and it's still valid
    if (!forceRefresh && eventTypes.length > 0 && lastFetched) {
      const now = Date.now();
      if (now - lastFetched < CACHE_DURATION) {
        return eventTypes; // Return cached data
      }
    }

    try {
      setLoading(true);
      setError(null);

      const organizationId = selectedOrganizationId || user?.organizationId;
      
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

      const response = await fetchWithRefresh(`/apis/eventtype/get_all_event-types?organizationId=${organizationId}`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn("Event types API not available, using fallback data");
          // Return fallback event types when API is not available
          const fallbackTypes = [
            { id: '1', name: 'Conference', description: 'Conference event', isActive: true },
            { id: '2', name: 'Workshop', description: 'Workshop event', isActive: true },
            { id: '3', name: 'Meeting', description: 'Meeting event', isActive: true },
            { id: '4', name: 'Training', description: 'Training event', isActive: true },
            { id: '5', name: 'Seminar', description: 'Seminar event', isActive: true }
          ];
          setEventTypes(fallbackTypes);
          setLastFetched(Date.now());
          return fallbackTypes;
        }
        throw new Error(`Failed to fetch event types: ${response.status}`);
      }

      const responseData = await response.json();
      const typesData = responseData.data || responseData;

      if (!Array.isArray(typesData)) {
        console.warn("Event types API returned unexpected data format, using fallback");
        const fallbackTypes = [
          { id: '1', name: 'Conference', description: 'Conference event', isActive: true },
          { id: '2', name: 'Workshop', description: 'Workshop event', isActive: true },
          { id: '3', name: 'Meeting', description: 'Meeting event', isActive: true }
        ];
        setEventTypes(fallbackTypes);
        setLastFetched(Date.now());
        return fallbackTypes;
      }

      // Format the event types for consistent usage
      const formattedTypes = typesData.map((type) => ({
        id: type.id || type._id,
        name: type.eventTypeName || type.name || type.typeName,
        description: type.description || type.typeDescription || "",
        isActive: type.isActive !== false, // Default to true if not specified
        organizationId: type.organizationId,
        ...type // Include any additional properties
      }));

      setEventTypes(formattedTypes);
      setLastFetched(Date.now());
      
      return formattedTypes;
    } catch (err) {
      console.error("Error fetching event types:", err);
      
      // If we have cached data, don't show error to user
      if (eventTypes.length > 0) {
        console.warn("Using cached event types due to fetch error");
        return eventTypes;
      }
      
      // If no cached data, use fallback
      console.warn("No cached data available, using fallback event types");
      const fallbackTypes = [
        { id: '1', name: 'Conference', description: 'Conference event', isActive: true },
        { id: '2', name: 'Workshop', description: 'Workshop event', isActive: true },
        { id: '3', name: 'Meeting', description: 'Meeting event', isActive: true },
        { id: '4', name: 'Training', description: 'Training event', isActive: true },
        { id: '5', name: 'Seminar', description: 'Seminar event', isActive: true }
      ];
      
      setEventTypes(fallbackTypes);
      setLastFetched(Date.now());
      setError(null); // Don't show error for fallback data
      return fallbackTypes;
    } finally {
      setLoading(false);
    }
  }, [selectedOrganizationId, user?.organizationId, user?.userId, lastFetched, CACHE_DURATION, eventTypes.length]);

  // Fetch event types when organization changes or on mount
  useEffect(() => {
    const organizationId = selectedOrganizationId || user?.organizationId;
    
    if (organizationId) {
      fetchEventTypes();
    } else {
      // Use fallback data when no organization is selected
      const fallbackTypes = [
        { id: '1', name: 'Conference', description: 'Conference event', isActive: true },
        { id: '2', name: 'Workshop', description: 'Workshop event', isActive: true },
        { id: '3', name: 'Meeting', description: 'Meeting event', isActive: true },
        { id: '4', name: 'Training', description: 'Training event', isActive: true },
        { id: '5', name: 'Seminar', description: 'Seminar event', isActive: true }
      ];
      setEventTypes(fallbackTypes);
      setLastFetched(Date.now());
    }
  }, [selectedOrganizationId, fetchEventTypes, user?.organizationId, user?.userId, user]);

  // Clear cache when organization changes
  useEffect(() => {
    setEventTypes([]);
    setLastFetched(null);
    setError(null);
  }, [selectedOrganizationId]);

  // Get event type by ID
  const getEventTypeById = useCallback((id) => {
    return eventTypes.find(type => type.id === id);
  }, [eventTypes]);

  // Get event type by name
  const getEventTypeByName = useCallback((name) => {
    return eventTypes.find(type => type.name === name);
  }, [eventTypes]);

  // Get active event types only
  const getActiveEventTypes = useCallback(() => {
    return eventTypes.filter(type => type.isActive);
  }, [eventTypes]);

  // Refresh event types (force refresh)
  const refreshEventTypes = useCallback(() => {
    return fetchEventTypes(true);
  }, [fetchEventTypes]);

  // Check if cache is valid
  const isCacheValid = useCallback(() => {
    if (!lastFetched || eventTypes.length === 0) return false;
    const now = Date.now();
    return now - lastFetched < CACHE_DURATION;
  }, [lastFetched, eventTypes.length, CACHE_DURATION]);

  const value = {
    eventTypes,
    loading,
    error,
    lastFetched,
    fetchEventTypes,
    refreshEventTypes,
    getEventTypeById,
    getEventTypeByName,
    getActiveEventTypes,
    isCacheValid,
    // Helper methods
    hasEventTypes: eventTypes.length > 0,
    isStale: lastFetched ? Date.now() - lastFetched > CACHE_DURATION : true,
  };

  return (
    <EventTypesContext.Provider value={value}>
      {children}
    </EventTypesContext.Provider>
  );
};
