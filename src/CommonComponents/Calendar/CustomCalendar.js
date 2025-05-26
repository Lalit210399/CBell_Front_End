import React, { useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { ArrowBigRight, ArrowBigLeft } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./Calendar.css";

const localizer = momentLocalizer(moment);

const CustomToolbar = ({ label, onNavigate }) => (
  <div className="calendar-custom-toolbar">
    <button onClick={() => onNavigate("PREV")}><ArrowBigLeft /></button>
    <span className="calendar-title">{label}</span>
    <button onClick={() => onNavigate("NEXT")}><ArrowBigRight /></button>
  </div>
);

const CalendarSkeleton = () => {
  return (
    <div className="calendar-skeleton">
      {/* Toolbar Skeleton */}
      <div className="skeleton-toolbar">
        <div className="skeleton-button"></div>
        <div className="skeleton-title"></div>
        <div className="skeleton-button"></div>
      </div>
      
      {/* Header Skeleton */}
      <div className="skeleton-header">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="skeleton-header-cell"></div>
        ))}
      </div>
      
      {/* Week Rows Skeleton */}
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

const CustomCalendar = ({ events = [], loading = true, error = null }) => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleSelectSlot = ({ start }) => {
    navigate("/schedule/stepForm", {
      state: { selectedDate: start.toISOString() },
    });
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
          <span className="legend-color" style={{ backgroundColor: "#4CAF50" }}></span>{" "}
          Future Events
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#2196F3" }}></span>{" "}
          Upcoming
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#FF5722" }}></span>{" "}
          Critical
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#9E9E9E" }}></span>{" "}
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
        onSelectEvent={(event) =>
          navigate("/events/eventDetailPage/", {
            state: { eventId: event.id, mode: "view" },
          })
        }
        eventPropGetter={eventStyleGetter}
        components={{ toolbar: CustomToolbar }}
      />
    </div>
  );
};

export default CustomCalendar;