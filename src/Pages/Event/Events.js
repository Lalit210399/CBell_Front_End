import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Events.css";
import Table from "../../CommonComponents/Table/Table";
import AvatarList from "../../CommonComponents/Avatar/AvatarList";
import CustomDropdown from "../../CommonComponents/Dropdown/CustomDropdown";
import ConfirmationModal from "../../CommonComponents/ConfirmationModal";
import SearchBar from "../../CommonComponents/SearchBar";
import { useMessages } from "../../Context/MessageContext";
import { useUser } from "../../Context/UserContext";
import { fetchWithRefresh } from "../../Context/RefereshToken";
import useApi from "../../Hooks/useApi";
import { useDebouncedCallback } from "../../Hooks/useDebounce";
import { formatDateTime, toCamelCase, toTitleCase, generateInitials } from "../../CommonUtils/formatters";
import { 
  INITIAL_FILTER_STATE, 
  DATE_RANGE_OPTIONS, 
  PERMISSION_ACTIONS, 
  PERMISSION_PATHS,
  EVENT_STATUS,
  SEARCH_DEBOUNCE_DELAY,
  EMPTY_FIELD_TEXT 
} from "../../CommonUtils/eventConstants";
import { X, Trash2 } from "lucide-react";

const EventTable = () => {
  const [filters, setFilters] = useState(INITIAL_FILTER_STATE);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  
  const navigate = useNavigate();
  const { addMessage } = useMessages();
  const { user, permissions: userPermissions, selectedOrganizationId, isViewingOwnOrganization, scopeChangeTrigger, loading: userLoading } = useUser();


  // Helper to check permission
  const hasPermission = useCallback((action) => {
    const { MODULE, FEATURE } = PERMISSION_PATHS.EVENTS;
    return userPermissions?.permissions?.[MODULE]?.[FEATURE]?.includes(action) ?? false;
  }, [userPermissions]);

  const permissions = useMemo(() => ({
    // New Event: Only check organization scope (not canCRUD)
    canCreate: hasPermission(PERMISSION_ACTIONS.CREATE) && isViewingOwnOrganization(),
    canRead: hasPermission(PERMISSION_ACTIONS.READ),
    // Edit/Update/Delete/Archive/Duplicate: Check user permissions + organization scope (canCRUD checked per event)
    canUpdate: hasPermission(PERMISSION_ACTIONS.UPDATE) && isViewingOwnOrganization(),
    canDelete: hasPermission(PERMISSION_ACTIONS.DELETE) && isViewingOwnOrganization(),
    canArchive: hasPermission(PERMISSION_ACTIONS.UPDATE) && isViewingOwnOrganization(),
    canDuplicate: hasPermission(PERMISSION_ACTIONS.UPDATE) && isViewingOwnOrganization(),
  }), [hasPermission, isViewingOwnOrganization]);

  // Helper function to determine event status
  const getEventStatus = (eventDate) => {
    if (!eventDate) return EVENT_STATUS.UNKNOWN;
    const now = new Date();
    const event = new Date(eventDate);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDay = new Date(event.getFullYear(), event.getMonth(), event.getDate());
    
    if (eventDay < today) return EVENT_STATUS.COMPLETED;
    if (eventDay.getTime() === today.getTime()) return EVENT_STATUS.ONGOING;
    return EVENT_STATUS.UPCOMING;
  };

  // Helper function to check if event matches date range filter
  // Wrapped in useCallback to maintain stable reference
  const matchesDateRange = useCallback((eventDate, dateRange) => {
    if (!dateRange || !eventDate) return true;
    
    const now = new Date();
    const event = new Date(eventDate);
    
    switch (dateRange) {
      case "Today":
        return event.toDateString() === now.toDateString();
      case "This Week": {
        // Create new date objects to avoid mutation
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + (6 - now.getDay()));
        endOfWeek.setHours(23, 59, 59, 999);
        
        return event >= startOfWeek && event <= endOfWeek;
      }
      case "This Month":
        return event.getMonth() === now.getMonth() && event.getFullYear() === now.getFullYear();
      case "Next 30 Days": {
        const in30Days = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        return event >= now && event <= in30Days;
      }
      default:
        return true;
    }
  }, []);

  /** -------------------- API Function -------------------- **/
  const fetchEvents = useCallback(async () => {
    // Use global selectedOrganizationId instead of user.organizationId
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


    // Use the new hierarchy endpoint
    const res = await fetchWithRefresh(`/apis/event/hierarchy/${organizationId}?userId=${user?.userId}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch events: ${res.status} - ${res.statusText}`);
    }

    const response = await res.json();
    const data = response.data;

    if (!Array.isArray(data)) {
      throw new Error("Expected an array of events but got something else");
    }

    const formatted = data.map(event => {
      const assignedUsers = event.assignedUsers || [];

      const allParticipants = assignedUsers.map((user) => {
        let participantName = "Unknown";
        if (typeof user === "string") {
          participantName = user;
        } else if (user && user.userName) {
          participantName = user.userName;
        } else if (user && user.name) {
          participantName = user.name;
        }

        // Use imported generateInitials from formatters
        return {
          name: toTitleCase(participantName), // Use title case for display
          src: participantName,
          fallback: generateInitials(participantName),
          size: "32px",
          shape: "circle",
        };
      });

      return {
        id: event.id || Date.now().toString(),
        name: toCamelCase(event.eventName) || "Unnamed Event",
        type: toCamelCase(event.eventTypeDesc || event.eventTypeName) || "N/A",
        // ✅ Use formatted date
        date: event.eventDate ? formatDateTime(event.eventDate) : "N/A",
        createdBy: toCamelCase(event.createdByName || event.createdBy?.name || event.createdBy) || "Unknown",
        participants: allParticipants,
        rawData: event,
        eventDate: event.eventDate, // Keep original date for filtering
        status: getEventStatus(event.eventDate)
      };
    });

    return formatted;
  }, [selectedOrganizationId, user?.organizationId, user?.userId]);

  /** -------------------- State Management -------------------- **/
  const [eventsData, setEventsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isFetchingRef = useRef(false);

  // Execute API when permissions and organization are ready or scope changes
  const executeFetchEvents = useCallback(async () => {
    if (!userLoading && permissions.canRead && selectedOrganizationId && user?.userId && !isFetchingRef.current) {
      
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      
      try {
        // Call fetchEvents directly without including it in dependencies
        const data = await fetchEvents();
        setEventsData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, permissions.canRead, selectedOrganizationId, user?.userId]);

  useEffect(() => {
    executeFetchEvents();
  }, [executeFetchEvents, scopeChangeTrigger]);

  // Process events data and extract filter options
  // Fixed: Removed setState calls from useMemo to avoid side effects
  const { originalEvents, extractedTypes, extractedUsers } = useMemo(() => {
    if (!eventsData) {
      return { originalEvents: [], extractedTypes: [], extractedUsers: [] };
    }

    // Extract unique types and users for filter options
    const uniqueTypes = [...new Set(eventsData.map(event => event.type).filter(type => type !== "N/A"))];
    const uniqueUsers = [...new Set(eventsData.map(event => event.createdBy).filter(user => user !== "Unknown"))];
    
    return {
      originalEvents: eventsData,
      extractedTypes: uniqueTypes.map(type => ({ label: toTitleCase(type), value: type })),
      extractedUsers: uniqueUsers.map(user => ({ label: toTitleCase(user), value: user }))
    };
  }, [eventsData]);

  // Update available filter options when extracted data changes
  useEffect(() => {
    setAvailableTypes(extractedTypes);
    setAvailableUsers(extractedUsers);
  }, [extractedTypes, extractedUsers]);

  // Initialize filtered events when originalEvents changes
  useEffect(() => {
    setFilteredEvents(originalEvents);
  }, [originalEvents]);

  const handleRetry = () => {
    if (permissions.canRead) {
      executeFetchEvents();
    }
  };

  const handleNewEvent = () => {
    navigate("/events/eventDetailPage", { state: { mode: "create" } });
  };

  const handleSort = (key, direction) => {
    const sorted = [...filteredEvents].sort((a, b) => {
      if (key === "date") {
        const dateA = a.date === "N/A" ? new Date(0) : new Date(a.date);
        const dateB = b.date === "N/A" ? new Date(0) : new Date(b.date);
        return direction === "asc" ? dateA - dateB : dateB - dateA;
      }
      return direction === "asc"
        ? String(a[key]).localeCompare(String(b[key]))
        : String(b[key]).localeCompare(String(a[key]));
    });
    setFilteredEvents(sorted);
  };

  // Debounced search handler to avoid excessive filtering on every keystroke
  const debouncedApplyFilters = useDebouncedCallback((filterValues) => {
    applyFilters(filterValues);
  }, SEARCH_DEBOUNCE_DELAY);

  const handleSearch = (query) => {
    setSearchQuery(query);
    const newFilters = { ...filters, eventName: query };
    setFilters(newFilters);
    debouncedApplyFilters(newFilters);
  };

  const applyFilters = useCallback((filterValues) => {
    let filtered = [...originalEvents];

    // Filter by event name
    if (filterValues.eventName) {
      const lowerQuery = filterValues.eventName.toLowerCase();
      const camelCaseQuery = toCamelCase(filterValues.eventName);
      filtered = filtered.filter(event =>
        String(event.name).toLowerCase().includes(lowerQuery) ||
        String(event.name).includes(camelCaseQuery)
      );
    }

    // Filter by event type
    if (filterValues.eventType) {
      filtered = filtered.filter(event =>
        event.type === filterValues.eventType
      );
    }

    // Filter by status
    if (filterValues.status) {
      filtered = filtered.filter(event =>
        event.status === filterValues.status
      );
    }

    // Filter by date range
    if (filterValues.dateRange) {
      filtered = filtered.filter(event =>
        matchesDateRange(event.eventDate, filterValues.dateRange)
      );
    }

    // Filter by created by
    if (filterValues.createdBy) {
      filtered = filtered.filter(event =>
        event.createdBy === filterValues.createdBy
      );
    }

    // Filter by assigned user (participants)
    if (filterValues.assignedUser) {
      const lowerQuery = filterValues.assignedUser.toLowerCase();
      const camelCaseQuery = toCamelCase(filterValues.assignedUser);
      filtered = filtered.filter(event =>
        event.participants.some(participant =>
          participant.name.toLowerCase().includes(lowerQuery) ||
          toCamelCase(participant.name).includes(camelCaseQuery)
        )
      );
    }

    setFilteredEvents(filtered);
  }, [originalEvents, matchesDateRange]);

  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...filters, [filterKey]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilters(INITIAL_FILTER_STATE);
    setFilteredEvents(originalEvents);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== "").length;
  };

  // Delete API function
  const deleteEvent = useCallback(async (id) => {
    // Get the user ID for the API call
    const userId = user?.userId || user?.id || user?._id || user?.user_id || user?.uid;
    
    if (!userId) {
      throw new Error("User ID not available for delete operation");
    }
    
    const res = await fetchWithRefresh(`/apis/event/delete/${id}?userId=${userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "1",
      },
    });

    if (!res.ok) throw new Error(`Failed to delete event: ${res.status}`);

    return id; // Return the deleted event ID
  }, [user?.userId, user?.id, user?._id, user?.user_id, user?.uid]);

  // Use API hook for delete operation
  const {
    execute: executeDeleteEvent,
    loading: deleteLoading
  } = useApi(deleteEvent, [], false);

  // Open delete confirmation modal
  const handleDeleteClick = (event) => {
    setEventToDelete(event);
    setDeleteModalOpen(true);
  };

  // Close delete confirmation modal
  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setEventToDelete(null);
  };

  // Confirm delete action
  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    
    try {
      await executeDeleteEvent(eventToDelete.id);
      
      // Close modal
      handleCloseDeleteModal();
      
      // Refresh the events list after successful deletion
      executeFetchEvents();

      addMessage({
        text: "Event deleted successfully.",
        type: "success",
        duration: 3000,
      });
    } catch (err) {
      addMessage({
        text: `Failed to delete event: ${err.message}`,
        type: "error",
        duration: 5000,
      });
    }
  };

  // Get empty field text helper
  const getEmptyText = (key) => EMPTY_FIELD_TEXT[key] || EMPTY_FIELD_TEXT.default;

  const columns = [
    { key: "name", label: "Event Name", skeletonWidth: "40%", skeletonHeight: "20px" },
    { key: "type", label: "Type", skeletonWidth: "15%", skeletonHeight: "20px" },
    { key: "date", label: "Date", skeletonWidth: "15%", skeletonHeight: "20px" },
    { key: "participants", label: "Team Members", skeletonWidth: "20%", skeletonHeight: "40px" },
    { key: "createdBy", label: "Created By", skeletonWidth: "10%", skeletonHeight: "20px" },
  ];

  return (
    <div className="Events">
      {/* New Header Section */}
      <div className="events-header">
        <div className="events-header-content">
          <div className="events-title-section">
            <h1 className="events-main-title">Events for {user?.organization?.name || "AISSMS"}</h1>
            <p className="events-subtitle">Manage all your events in one place</p>
          </div>
          {permissions.canCreate && (
            <button className="events-new-button" onClick={handleNewEvent}>
              <span className="plus-icon">+</span>
              New Event
            </button>
          )}
        </div>
      </div>

      <div className="events-toolbar">
        <SearchBar
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search events..."
          aria-label="Search events"
          id="event-search-input"
        />

        <div className="filter-chips" role="group" aria-label="Event filters">
          <CustomDropdown
              options={[{ label: "All Types", value: "" }, ...availableTypes]}
              defaultLabel={filters.eventType ? toTitleCase(filters.eventType) : "Event Type"}
              onSelect={(option) => handleFilterChange("eventType", option.value)}
              compact={true}
            />

          <CustomDropdown
              options={DATE_RANGE_OPTIONS}
              defaultLabel={filters.dateRange ? toTitleCase(filters.dateRange) : "Date Range"}
              onSelect={(option) => handleFilterChange("dateRange", option.value)}
              compact={true}
            />

          <CustomDropdown
              options={[{ label: "All Users", value: "" }, ...availableUsers]}
              defaultLabel={filters.createdBy ? toTitleCase(filters.createdBy) : "Created By"}
              onSelect={(option) => handleFilterChange("createdBy", option.value)}
              compact={true}
            />

          <input
              type="text"
              id="assigned-user-filter"
              placeholder="Assigned to..."
              value={filters.assignedUser}
              onChange={(e) => handleFilterChange("assignedUser", e.target.value)}
              className="filter-chip-text-input"
              aria-label="Filter by assigned user"
            />

          {getActiveFiltersCount() > 0 && (
            <button 
              className="clear-filters-link"
              onClick={clearFilters}
              aria-label="Clear all filters"
            >
              <X size={14} aria-hidden="true" />
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="Table_Container" role="region" aria-label="Events table">
        <Table
          columns={columns}
          data={filteredEvents}
          loading={loading || deleteLoading}
          error={error}
          onRetry={handleRetry}
          onSort={handleSort}
          renderCell={(key, item) => {
            if (key === "participants") {
              return item.participants && item.participants.length > 0 ? (
                <AvatarList
                  avatars={item.participants}
                  stack={true}
                  maxVisible={3}
                  showTooltip={true}
                />
              ) : (
                <span className="empty-field">{getEmptyText(key)}</span>
              );
            }
            if (key === "type") {
              return (
                <span className="type-pill">
                  {toTitleCase(item.type) || getEmptyText(key)}
                </span>
              );
            }
            if (key === "createdBy") {
              return (
                <div className="created-by-name">
                  {toTitleCase(item.createdBy) || getEmptyText(key)}
                </div>
              );
            }
            if (key === "name") {
              return toTitleCase(item[key]) || getEmptyText(key);
            }
            return item[key] || getEmptyText(key);
          }}
          noDataText="No Events Scheduled at this time"
          addEventText="Click here to add a New Event"
          onAddEventClick={permissions.canCreate ? handleNewEvent : undefined}
          sortableColumns={["name", "type", "date", "createdBy"]}
          onDelete={permissions.canDelete ? (event) => handleDeleteClick(event) : undefined}
          // onArchive={permissions.canArchive ? () => alert("Archive pressed") : undefined}
          // onDuplicate={permissions.canDuplicate ? () => alert("Duplicate pressed") : undefined}
          onRowClick={(event) => {
            if (!loading && !error && permissions.canRead) {
              navigate("/events/eventDetailPage", {
                state: {
                  eventId: event.id,
                  mode: "view",
                  eventData: event.rawData
                },
              });
            }
          }}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Event"
        message={`Are you sure you want to delete the event "${eventToDelete ? toTitleCase(eventToDelete.name) : ''}"?`}
        warningText="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonVariant="danger"
        loading={deleteLoading}
        icon={<Trash2 size={20} />}
      />
    </div>
  );
};

export default EventTable;