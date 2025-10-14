import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Events.css";
import Table from "../../CommonComponents/Table/Table";
import AvatarList from "../../CommonComponents/Avatar/AvatarList";
import CustomDropdown from "../../CommonComponents/Dropdown/CustomDropdown";
import { useMessages } from "../../Context/MessageContext";
import { useUser } from "../../Context/UserContext";
import { fetchWithRefresh } from "../../Context/RefereshToken";
import useApi from "../../Hooks/useApi";
import { Filter, X } from "lucide-react";

const EventTable = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    eventName: "",
    eventType: "",
    status: "",
    dateRange: "",
    assignedUser: "",
    createdBy: ""
  });
  const [availableTypes, setAvailableTypes] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const navigate = useNavigate();
  const { addMessage } = useMessages();
  const { user, permissions: userPermissions, selectedOrganizationId, isViewingOwnOrganization, scopeChangeTrigger, loading: userLoading } = useUser();


  const permissions = {
    // New Event: Only check organization scope (not canCRUD)
    canCreate: (userPermissions?.permissions?.Events?.["Event Management"]?.includes("Create") ?? false) && isViewingOwnOrganization(),
    canRead: userPermissions?.permissions?.Events?.["Event Management"]?.includes("Read") ?? false,
    // Edit/Update/Delete/Archive/Duplicate: Check user permissions + organization scope (canCRUD checked per event)
    canUpdate: (userPermissions?.permissions?.Events?.["Event Management"]?.includes("Update") ?? false) && isViewingOwnOrganization(),
    canDelete: (userPermissions?.permissions?.Events?.["Event Management"]?.includes("Delete") ?? false) && isViewingOwnOrganization(),
    canArchive: (userPermissions?.permissions?.Events?.["Event Management"]?.includes("Update") ?? false) && isViewingOwnOrganization(),
    canDuplicate: (userPermissions?.permissions?.Events?.["Event Management"]?.includes("Update") ?? false) && isViewingOwnOrganization(),
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    // const hours = String(date.getHours()).padStart(2, "0");
    // const minutes = String(date.getMinutes()).padStart(2, "0");
    // return `${day}/${month}/${year} ${hours}:${minutes}`;
    return `${day}/${month}/${year}`;
  };

  // Utility function to convert text to Camel Case
  const toCamelCase = (text) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .split(/[\s_-]+/)
      .map((word, index) => 
        index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join("");
  };

  // Utility function to convert text to Title Case for display
  const toTitleCase = (text) => {
    if (!text) return "";
    return text
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim() // Remove leading/trailing spaces
      .split(/[\s_-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Filter options
  // const statusOptions = [
  //   { label: "All Status", value: "" },
  //   { label: "Upcoming", value: "upcoming" },
  //   { label: "Ongoing", value: "ongoing" },
  //   { label: "Completed", value: "completed" },
  //   { label: "Cancelled", value: "cancelled" }
  // ];

  const dateRangeOptions = [
    { label: "All Dates", value: "" },
    { label: "Today", value: "Today" },
    { label: "This Week", value: "This Week" },
    { label: "This Month", value: "This Month" },
    { label: "Next 30 Days", value: "Next 30 Days" },
    // { label: "Past Events", value: "past Events" }
  ];

  // Helper function to determine event status
  const getEventStatus = (eventDate) => {
    if (!eventDate) return "unknown";
    const now = new Date();
    const event = new Date(eventDate);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDay = new Date(event.getFullYear(), event.getMonth(), event.getDate());
    
    if (eventDay < today) return "completed";
    if (eventDay.getTime() === today.getTime()) return "ongoing";
    return "upcoming";
  };

  // Helper function to check if event matches date range filter
  const matchesDateRange = (eventDate, dateRange) => {
    if (!dateRange || !eventDate) return true;
    
    const now = new Date();
    const event = new Date(eventDate);
    
    switch (dateRange) {
      case "Today":
        return event.toDateString() === now.toDateString();
      case "This Week":
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        return event >= startOfWeek && event <= endOfWeek;
      case "This Month":
        return event.getMonth() === now.getMonth() && event.getFullYear() === now.getFullYear();
      case "Next 30 Days":
        const in30Days = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        return event >= now && event <= in30Days;
      // case "Past Events":
      //   return event < now;
      default:
        return true;
    }
  };

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

        return {
          name: toCamelCase(participantName),
          src: participantName,
          fallback: participantName.charAt(0).toUpperCase() || "?",
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
  const originalEvents = useMemo(() => {
    if (!eventsData) {
      return [];
    }

    // Extract unique types and users for filter options
    const uniqueTypes = [...new Set(eventsData.map(event => event.type).filter(type => type !== "N/A"))];
    const uniqueUsers = [...new Set(eventsData.map(event => event.createdBy).filter(user => user !== "Unknown"))];
    
    setAvailableTypes(uniqueTypes.map(type => ({ label: toTitleCase(type), value: type })));
    setAvailableUsers(uniqueUsers.map(user => ({ label: toTitleCase(user), value: user })));

    return eventsData;
  }, [eventsData]);

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

  const handleSearch = (query) => {
    setFilters(prev => ({ ...prev, eventName: query }));
    applyFilters({ ...filters, eventName: query });
  };

  const applyFilters = (filterValues) => {
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
  };

  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...filters, [filterKey]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      eventName: "",
      eventType: "",
      status: "",
      dateRange: "",
      assignedUser: "",
      createdBy: ""
    };
    setFilters(clearedFilters);
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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    
    try {
      await executeDeleteEvent(id);
      
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

      <div className="events-controls">
        <div className="search-container">
          <div className="search-input-wrapper">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder="Search events"
              className="search-inputs"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
        <button 
          className="filters-button"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="filter-icon" size={16} />
          Filters
          {getActiveFiltersCount() > 0 && (
            <span className="filter-count">{getActiveFiltersCount()}</span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-panel-header">
            <h3>Filter Events</h3>
            <button 
              className="clear-filters-btn"
              onClick={clearFilters}
            >
              <X size={16} />
              Clear All
            </button>
          </div>
          
          <div className="filter-grid">
            <div className="filter-group">
              <label>Event Type</label>
              <CustomDropdown
                options={[{ label: "All Types", value: "" }, ...availableTypes]}
                defaultLabel={filters.eventType ? toTitleCase(filters.eventType) : "All Types"}
                onSelect={(option) => handleFilterChange("eventType", option.value)}
              />
            </div>

            {/* <div className="filter-group">
              <label>Status</label>
              <CustomDropdown
                options={statusOptions}
                defaultLabel={filters.status ? toTitleCase(filters.status) : "All Status"}
                onSelect={(option) => handleFilterChange("status", option.value)}
              />
            </div> */}

            <div className="filter-group">
              <label>Date Range</label>
              <CustomDropdown
                options={dateRangeOptions}
                defaultLabel={filters.dateRange ? toTitleCase(filters.dateRange) : "All Dates"}
                onSelect={(option) => handleFilterChange("dateRange", option.value)}
              />
            </div>

            <div className="filter-group">
              <label>Created By</label>
              <CustomDropdown
                options={[{ label: "All Users", value: "" }, ...availableUsers]}
                defaultLabel={filters.createdBy ? toTitleCase(filters.createdBy) : "All Users"}
                onSelect={(option) => handleFilterChange("createdBy", option.value)}
              />
            </div>

            <div className="filter-group">
              <label>Assigned User</label>
              <input
                type="text"
                placeholder="Search by participant name..."
                value={filters.assignedUser}
                onChange={(e) => handleFilterChange("assignedUser", e.target.value)}
                className="filter-input"
              />
            </div>
          </div>
        </div>
      )}

      <div className="Table_Container">
        <Table
          columns={columns}
          data={filteredEvents}
          loading={loading || deleteLoading}
          error={error}
          onRetry={handleRetry}
          onSort={handleSort}
          renderCell={(key, item) => {
            const getEmptyText = (key) => {
              switch (key) {
                case "name":
                  return "Untitled Event";
                case "type":
                  return "No Type";
                case "date":
                  return "No Date";
                case "participants":
                  return "No Team Members";
                case "createdBy":
                  return "Unknown Creator";
                default:
                  return "N/A";
              }
            };

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
          onDelete={permissions.canDelete ? ({ id }) => handleDelete(id) : undefined}
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
    </div>
  );
};

export default EventTable;