import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Events.css";
import TableHeader from "../../CommonComponents/TableHeader/TableHeader";
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
  const { user, permissions: userPermissions } = useUser();

  const permissions = {
    canCreate: userPermissions?.permissions?.Events?.["Event Management"]?.includes("Create") ?? false,
    canRead: userPermissions?.permissions?.Events?.["Event Management"]?.includes("Read") ?? false,
    canUpdate: userPermissions?.permissions?.Events?.["Event Management"]?.includes("Update") ?? false,
    canDelete: userPermissions?.permissions?.Events?.["Event Management"]?.includes("Delete") ?? false,
    canArchive: userPermissions?.permissions?.Events?.["Event Management"]?.includes("Update") ?? false,
    canDuplicate: userPermissions?.permissions?.Events?.["Event Management"]?.includes("Update") ?? false,
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetchWithRefresh(`/apis/event/get_all_events?organizationId=${user?.organizationId}`);

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
          date: event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : "N/A",
          participants: allParticipants,
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
    if (permissions.canRead) {
      fetchEvents();
    } else {
      setLoading(false);
      setError("You don't have permission to view events");
    }
  }, [permissions.canRead]);

  const handleRetry = () => {
    if (permissions.canRead) {
      fetchEvents();
    }
  };

  const handleNewEvent = () => navigate("/events/stepForm");

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
      originalEvents.filter(({ name }) =>
        String(name).toLowerCase().includes(lowerQuery)
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
    { key: "name", label: "Name", skeletonWidth: "60%", skeletonHeight: "20px" },
    { key: "date", label: "Date", skeletonWidth: "30%", skeletonHeight: "20px" },
    { key: "participants", label: "Participants", skeletonWidth: "100%", skeletonHeight: "40px" },
  ];

  return (
    <div className="Events">
      <span className="Welcome-to-AISSMS-IOIT-College">
        Welcome to <span className="text-style-1">{user?.organization?.name || "AISSMS IOIT"}</span>
      </span>

      <TableHeader
        onSearch={handleSearch}
        onNewEventClick={permissions.canCreate ? handleNewEvent : undefined}
        loading={loading}
        permissions={permissions}
      />

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
                  maxVisible={2}
                  showTooltip={true}
                />
              );
            }
            return item[key];
          }}
          noDataText="No Events Scheduled at this time"
          addEventText="Click here to add a New Event"
          onAddEventClick={permissions.canCreate ? handleNewEvent : undefined}
          sortableColumns={["name", "date"]}
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