import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Events.css";
import Table from "../../CommonComponents/Table/Table";
import AvatarList from "../../CommonComponents/Avatar/AvatarList";
import { useMessages } from "../../Context/MessageContext";
import { useUser } from "../../Context/UserContext";
import { fetchWithRefresh } from "../../Context/RefereshToken";

const EventTable = () => {
  const [events, setEvents] = useState([]);
  const [originalEvents, setOriginalEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { addMessage } = useMessages();
  const { user, permissions: userPermissions, selectedOrganizationId, isViewingOwnOrganization } = useUser();

  console.log("user", user?.roles[0]?.name);

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

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use global selectedOrganizationId instead of user.organizationId
      const organizationId = selectedOrganizationId || user?.organizationId;

      if (!organizationId) {
        throw new Error("No organization selected");
      }

      // Determine if we need to include X-Context-Organization header
      const isViewingOwnOrganization = organizationId === user?.organizationId;
      
      // Prepare headers
      const headers = {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "1",
      };

      // Only add X-Context-Organization header when viewing a different organization
      if (!isViewingOwnOrganization) {
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
        throw new Error(`Failed to fetch events: ${res.status}`);
      }

      const response = await res.json();
      const data = response.data;

      if (!Array.isArray(data)) {
        throw new Error("Expected an array of events but got something else");
      }

      const formatted = data.map(event => {
        const coordinators = event.coordinators || [];
        const specialGuests = event.specialGuests || [];

        const allParticipants = [...coordinators, ...specialGuests].map((person) => {
          let participantName = "Unknown";
          if (typeof person === "string") {
            participantName = person;
          } else if (person && person.name) {
            participantName = person.name;
          }

          return {
            name: participantName,
            src: participantName,
            fallback: participantName.charAt(0).toUpperCase() || "?",
            size: "32px",
            shape: "circle",
          };
        });

        return {
          id: event.id || Date.now().toString(),
          name: event.eventName || "Unnamed Event",
          type: event.eventTypeDesc || event.eventTypeName || "N/A",
          // ✅ Use formatted date
          date: event.eventDate ? formatDateTime(event.eventDate) : "N/A",
          createdBy: event.createdByName || event.createdBy?.name || event.createdBy || "Unknown",
          participants: allParticipants,
          actions: "menu", // For the three dots menu
          rawData: event
        };
      });

      setEvents(formatted);
      setOriginalEvents(formatted);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err.message);
      addMessage({
        text: `Failed to load events: ${err.message}`,
        type: "error",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (permissions.canRead && selectedOrganizationId) {
      fetchEvents();
    } else if (permissions.canRead && !selectedOrganizationId) {
      setLoading(false);
      setError("No organization selected");
    } else {
      setLoading(false);
      setError("You don't have permission to view events");
    }
  }, [permissions.canRead, selectedOrganizationId]);

  const handleRetry = () => {
    if (permissions.canRead) {
      fetchEvents();
    }
  };

  const handleNewEvent = () => {
    navigate("/events/eventDetailPage", { state: { mode: "create" } });
  };

  const handleSort = (key, direction) => {
    const sorted = [...events].sort((a, b) => {
      if (key === "date") {
        const dateA = a.date === "N/A" ? new Date(0) : new Date(a.date);
        const dateB = b.date === "N/A" ? new Date(0) : new Date(b.date);
        return direction === "asc" ? dateA - dateB : dateB - dateA;
      }
      return direction === "asc"
        ? String(a[key]).localeCompare(String(b[key]))
        : String(b[key]).localeCompare(String(a[key]));
    });
    setEvents(sorted);
  };

  const handleSearch = (query) => {
    if (!query) {
      setEvents(originalEvents);
      return;
    }
    const lowerQuery = query.toLowerCase();
    setEvents(
      originalEvents.filter(({ name, type, createdBy }) =>
        String(name).toLowerCase().includes(lowerQuery) ||
        String(type).toLowerCase().includes(lowerQuery) ||
        String(createdBy).toLowerCase().includes(lowerQuery)
      )
    );
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      setLoading(true);
      const res = await fetchWithRefresh(`/apis/event/delete/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error(`Failed to delete event: ${res.status}`);

      setEvents(prev => prev.filter(event => event.id !== id));
      setOriginalEvents(prev => prev.filter(event => event.id !== id));

      addMessage({
        text: "Event deleted successfully.",
        type: "success",
        duration: 3000,
      });
    } catch (err) {
      console.error("Error deleting event:", err);
      addMessage({
        text: `Failed to delete event: ${err.message}`,
        type: "error",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: "name", label: "Event Name", skeletonWidth: "60%", skeletonHeight: "20px" },
    { key: "type", label: "Type", skeletonWidth: "25%", skeletonHeight: "20px" },
    { key: "date", label: "Dates", skeletonWidth: "25%", skeletonHeight: "20px" },
    { key: "participants", label: "Team Members", skeletonWidth: "100%", skeletonHeight: "40px" },
    { key: "createdBy", label: "Created By", skeletonWidth: "30%", skeletonHeight: "20px" },
    { key: "actions", label: "Action", skeletonWidth: "20%", skeletonHeight: "20px" },
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
              className="search-input"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
        <button className="filters-button">
          <svg className="filter-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"></polygon>
          </svg>
          Filters
        </button>
      </div>

      <div className="Table_Container">
        <Table
          columns={columns}
          data={events}
          loading={loading}
          error={error}
          onRetry={handleRetry}
          onSort={handleSort}
          renderCell={(key, item) => {
            if (key === "participants") {
              return (
                <AvatarList
                  avatars={item.participants}
                  stack={true}
                  maxVisible={3}
                  showTooltip={true}
                />
              );
            }
            if (key === "type") {
              return (
                <span className="type-pill">
                  {item.type}
                </span>
              );
            }
            if (key === "createdBy") {
              const initials = item.createdBy ? item.createdBy.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';
              return (
                <div className="created-by-avatar">
                  <span className="avatar-initials">{initials}</span>
                </div>
              );
            }
            if (key === "actions") {
              return (
                <button className="action-menu-button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="19" cy="12" r="1"></circle>
                    <circle cx="5" cy="12" r="1"></circle>
                  </svg>
                </button>
              );
            }
            return item[key];
          }}
          noDataText="No Events Scheduled at this time"
          addEventText="Click here to add a New Event"
          onAddEventClick={permissions.canCreate ? handleNewEvent : undefined}
          sortableColumns={["name", "type", "date", "createdBy"]}
          onDelete={permissions.canDelete ? ({ id }) => handleDelete(id) : undefined}
          onArchive={permissions.canArchive ? () => alert("Archive pressed") : undefined}
          onDuplicate={permissions.canDuplicate ? () => alert("Duplicate pressed") : undefined}
          onRowClick={(event) => {
            if (!loading && !error && permissions.canRead) {
              console.log("Clicked event data:", {
                id: event.id,
                rawData: event.rawData,
                allEventData: event
              });

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