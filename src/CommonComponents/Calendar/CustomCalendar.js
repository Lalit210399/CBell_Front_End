// CustomCalendar.js
import React, { useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./Calendar.css";
import { useMessages } from "../../Context/MessageContext";
import { useUser } from "../../Context/UserContext";

const localizer = momentLocalizer(moment);

const CustomToolbar = ({ label, onNavigate, view, onView }) => (
  <div className="calendar-header-wrapper">
    <div className="calendar-view-selector">
      <button 
        className={view === "month" ? "view-btn active" : "view-btn"}
        onClick={() => onView("month")}
      >
        Month
      </button>
      <button 
        className={view === "week" ? "view-btn active" : "view-btn"}
        onClick={() => onView("week")}
      >
        Week
      </button>
      <button 
        className={view === "day" ? "view-btn active" : "view-btn"}
        onClick={() => onView("day")}
      >
        Day
      </button>
      <button 
        className={view === "agenda" ? "view-btn active" : "view-btn"}
        onClick={() => onView("agenda")}
      >
        Agenda
      </button>
    </div>
    <div className="calendar-custom-toolbar">
      <button onClick={() => onNavigate("PREV")}><ChevronLeft /></button>
      <span className="calendar-title">{label}</span>
      <button onClick={() => onNavigate("NEXT")}><ChevronRight /></button>
    </div>
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
  </div>
);

const CustomCalendar = ({ events = [], loading = true, error = null, isViewingOwnOrganization = null }) => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentView, setCurrentView] = useState("month");
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

  // Custom Day Cell Component
  const CustomDateCellWrapper = ({ children, value }) => {
    const dayEvents = events.filter((event) => {
      const eventDate = moment(event.start).format("YYYY-MM-DD");
      const cellDate = moment(value).format("YYYY-MM-DD");
      return eventDate === cellDate;
    });

    return (
      <div className="custom-date-cell">
        {children}
        {dayEvents.length > 3 && (
          <div className="event-count-badge">
            {dayEvents.length} events
          </div>
        )}
      </div>
    );
  };

  // Custom Event Component with truncation
  const CustomEvent = ({ event, title }) => {
    return (
      <div className="custom-event-wrapper">
        <span className="event-title-truncate" title={event.title}>{title}</span>
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
      padding: "2px 4px",
      fontSize: "12px",
      marginBottom: "2px",
      cursor: "pointer",
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

  // Handle clicking on "show more" link
  const handleShowMore = (events, date) => {
    setSelectedDayEvents({ events, date });
    setShowModal(true);
  };

  // Navigate to event detail
  const navigateToEvent = (event) => {
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
        eventData: event.rawData,
      },
    });
  };

  // Get category color
  const getCategoryColor = (category) => {
    switch (category) {
      case "new": return "#4CAF50";
      case "on-track": return "#2196F3";
      case "critical": return "#FF5722";
      case "completed": return "#9E9E9E";
      default: return "#673AB7";
    }
  };

  // Modal Component
  const EventsModal = () => {
    if (!showModal || !selectedDayEvents) return null;

    return (
      <div className="calendar-modal-overlay" onClick={() => setShowModal(false)}>
        <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
          <div className="calendar-modal-header">
            <h3>
              <CalendarIcon size={20} />
              Events on {moment(selectedDayEvents.date).format("MMMM DD, YYYY")}
            </h3>
            <button className="modal-close-btn" onClick={() => setShowModal(false)}>
              <X size={20} />
            </button>
          </div>
          <div className="calendar-modal-body">
            {selectedDayEvents.events.length === 0 ? (
              <p className="no-events-message">No events scheduled for this day.</p>
            ) : (
              <div className="modal-events-list">
                {selectedDayEvents.events.map((event, index) => (
                  <div
                    key={index}
                    className="modal-event-item"
                    onClick={() => {
                      navigateToEvent(event);
                      setShowModal(false);
                    }}
                    style={{ borderLeftColor: getCategoryColor(event.category) }}
                  >
                    <div className="modal-event-title">{event.title}</div>
                    <div className="modal-event-category">
                      <span
                        className="category-badge"
                        style={{ backgroundColor: getCategoryColor(event.category) }}
                      >
                        {event.category.replace("-", " ").toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <CalendarSkeleton />;
  if (error) return <div className="calendar-container">Error: {error}</div>;

  return (
    <div className="calendar-container">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        date={currentDate}
        view={currentView}
        onView={(view) => setCurrentView(view)}
        onNavigate={(date) => setCurrentDate(date)}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={navigateToEvent}
        onShowMore={(events, date) => handleShowMore(events, date)}
        eventPropGetter={eventStyleGetter}
        components={{
          toolbar: CustomToolbar,
          dateCellWrapper: CustomDateCellWrapper,
          event: CustomEvent,
          timeSlotWrapper: ({ children }) => children,
        }}
        views={["month", "week", "day", "agenda"]}
        popup={false}
        style={{ height: "100%", flex: 1 }}
        step={30}
        timeslots={2}
        defaultDate={new Date()}
      />

      <EventsModal />
    </div>
  );
};

export default CustomCalendar;
