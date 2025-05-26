import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Events.css";
import TableHeader from "../../CommonComponents/TableHeader/TableHeader";
import Table from "../../CommonComponents/Table/Table";
import AvatarList from "../../CommonComponents/Avatar/AvatarList";
import { useMessages } from "../../Context/MessageContext";

const EventTable = () => {
  const [events, setEvents] = useState([]);
  const [originalEvents, setOriginalEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { addMessage } = useMessages();

  const users = {
    "permissions": {
      "Events": {
        "EventManagement": [
          "Update",
          "Read",
          "Delete",
          "Create"
        ]
      },
      "Tasks": {
        "Task Management": [
          "Update",
          "Read",
          "Delete",
          "Create"
        ]
      },
      "Thread": {
        "Thread Management": [
          "Update",
          "Read",
          "Delete",
          "Create"
        ]
      }
    }
  }

  // Sample permissions (replace with real user permissions)
  const permissions = {
    // canCreate: users.permissions.Events.EventManagement.includes("Create"),
    // canRead: users.permissions.Events.EventManagement.includes("Read"),
    // canUpdate: users.permissions.Events.EventManagement.includes("Update"),
    // canDelete: users.permissions.Events.EventManagement.includes("Update"),
    // canArchive: users.permissions.Events.EventManagement.includes("Update"),
    // canDuplicate: users.permissions.Events.EventManagement.includes("Update"),
    canCreate:true, 
    canRead:true, 
    canUpdate:true, 
    canDelete:true, 
    canArchive:true, 
    canDuplicate:true, 
  };

  const getRandomAvatar = (name) => {
    return `https://i.pravatar.cc/400?u=${encodeURIComponent(name)}`;
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/apis/event/get_all_events", {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "ngrok-skip-browser-warning": "1",
        },
      });

      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();

      const formatted = data.map(
        ({ id, eventName, eventDate, coordinators = [], specialGuests = [] }) => {
          const allParticipants = [...coordinators, ...specialGuests].map((name) => ({
            name,
            src: getRandomAvatar(name),
            fallback: name.charAt(0).toUpperCase(),
            size: "32px",
            shape: "circle",
          }));

          return {
            id,
            name: eventName,
            date: eventDate?.split("T")[0] || "N/A",
            participants: allParticipants,
          };
        }
      );

      setEvents(formatted);
      setOriginalEvents(formatted);
    } catch (err) {
      console.error("Error fetching events:", err);
      addMessage({
        text: "Failed to load events. Please try again.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchEvents();
  };

  const handleNewEvent = () => navigate("/events/stepForm");

  const handleSort = (key, direction) => {
    const sorted = [...events].sort((a, b) => {
      if (key === "date") {
        return direction === "asc"
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date);
      }
      return direction === "asc"
        ? a[key].localeCompare(b[key])
        : b[key].localeCompare(a[key]);
    });
    setEvents(sorted);
  };

  const handleSearch = (query) => {
    setEvents(
      !query
        ? originalEvents
        : originalEvents.filter(({ name }) =>
          name.toLowerCase().includes(query.toLowerCase())
        )
    );
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      setLoading(true);
      const res = await fetch(`/apis/event/delete/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

      setEvents((prev) => prev.filter((event) => event.id !== id));
      setOriginalEvents((prev) => prev.filter((event) => event.id !== id));

      addMessage({
        text: "Event deleted successfully.",
        type: "success",
        duration: 3000,
      });
    } catch (err) {
      console.error("Error deleting event:", err);
      addMessage({
        text: "Failed to delete event!",
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
        Welcome to <span className="text-style-1">AISSMS IOIT</span> College
      </span>

      <TableHeader
        onSearch={handleSearch}
        onNewEventClick={handleNewEvent}
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
          renderCell={(key, item) =>
            key === "participants" ? (
              <AvatarList
                avatars={item.participants}
                stack={true}
                maxVisible={4}
                showTooltip={true}
              />
            ) : (
              item[key]
            )
          }
          noDataText="No Events Scheduled at this time"
          addEventText="Click here to add a New Event"
          onAddEventClick={permissions.canCreate ? handleNewEvent : undefined}
          sortableColumns={["name", "date"]}
          onDelete={permissions.canDelete ? ({ id }) => handleDelete(id) : undefined}
          onArchive={permissions.canArchive ? () => alert("Archive pressed") : undefined}
          onDuplicate={permissions.canDuplicate ? () => alert("Duplicate pressed") : undefined}
          onRowClick={(event) => {
            if (!loading && !error) {
              navigate("/events/eventDetailPage", {
                state: {
                  eventId: event.id,
                  mode: "view",
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
