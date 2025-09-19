// CustomCalendar.js
import React, { useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { ArrowBigRight, ArrowBigLeft } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./Calendar.css";
import { useMessages } from "../../Context/MessageContext";
import { useUser } from "../../Context/UserContext";

const localizer = momentLocalizer(moment);

const CustomToolbar = ({ label, onNavigate }) => (
  <div className="calendar-custom-toolbar">
    <button onClick={() => onNavigate("PREV")}><ArrowBigLeft /></button>
    <span className="calendar-title">{label}</span>
    <button onClick={() => onNavigate("NEXT")}><ArrowBigRight /></button>
  </div>
);

const CustomCalendar = ({ events = [], loading = true, error = null, isViewingOwnOrganization = null }) => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const { addMessage } = useMessages();
  const { permissions: userPermissions } = useUser();

  // ✅ Permissions (same as EventTable)
  const permissions = {
    canRead: userPermissions?.permissions?.Events?.["Event Management"]?.includes("Read") ?? false,
    canCreate: userPermissions?.permissions?.Events?.["Event Management"]?.includes("Create") ?? false,
  };

  const handleSelectSlot = ({ start }) => {
    // Check if user has permission to create events
    if (!permissions.canCreate) {
      addMessage({
        text: "You don't have permission to create events.",
        type: "warning",
        duration: 3000,
      });
      return;
    }

    // Check if user is viewing their own organization
    if (isViewingOwnOrganization && !isViewingOwnOrganization()) {
      addMessage({
        text: "Event creation is only allowed in your own organization.",
        type: "warning",
        duration: 3000,
      });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(start);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      addMessage({
        text: "You cannot select a past date.",
        type: "warning",
        duration: 3000,
      });
      return;
    }

    navigate("/events/eventDetailPage", {
      state: {
        mode: "create",
        selectedDate: start,
        fromCalendar: true,
      },
    });
  };

  const CalendarSkeleton = () => {
    return (
      <div className="calendar-skeleton">
        <div className="skeleton-toolbar">
          <div className="skeleton-button"></div>
          <div className="skeleton-title"></div>
          <div className="skeleton-button"></div>
        </div>
        <div className="skeleton-header">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="skeleton-header-cell"></div>
          ))}
        </div>
        {[...Array(6)].map((_, rowIndex) => (
          <div key={rowIndex} className="skeleton-week">
            {[...Array(7)].map((_, cellIndex) => (
              <div key={cellIndex} className="skeleton-day">
                <div className="skeleton-event"></div>
                <div className="skeleton-event"></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const eventStyleGetter = (event) => {
    const style = {
      backgroundColor: "",
      borderRadius: "4px",
      border: "none",
      color: "white",
      display: "block",
    };

    switch (event.category) {
      case "new":
        style.backgroundColor = "#4CAF50";
        break;
      case "on-track":
        style.backgroundColor = "#2196F3";
        break;
      case "critical":
        style.backgroundColor = "#FF5722";
        break;
      case "completed":
        style.backgroundColor = "#9E9E9E";
        break;
      default:
        style.backgroundColor = "#673AB7";
    }

    return { style };
  };

  if (loading) return <CalendarSkeleton />;
  if (error) return <div className="calendar-container">Error: {error}</div>;

  return (
    <div className="calendar-container">
      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#4CAF50" }}></span>
          Future Events
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#2196F3" }}></span>
          Upcoming
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#FF5722" }}></span>
          Critical
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#9E9E9E" }}></span>
          Completed
        </div>
      </div>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        date={currentDate}
        onNavigate={(date) => setCurrentDate(date)}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={(event) => {
          if (!permissions.canRead) {
            addMessage({
              text: "You don't have permission to view events.",
              type: "error",
              duration: 3000,
            });
            return;
          }

          navigate("/events/eventDetailPage", {
            state: {
              eventId: event.id,
              mode: "view",
              eventData: event.rawData, // ✅ pass full event data
            },
          });
        }}
        eventPropGetter={eventStyleGetter}
        components={{ toolbar: CustomToolbar }}
      />
    </div>
  );
};

export default CustomCalendar;
