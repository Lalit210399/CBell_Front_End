// CustomCalendar.js
import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { ArrowBigRight, ArrowBigLeft, Plus, Calendar as CalendarIcon } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./Calendar.css";
import { useMessages } from "../../Context/MessageContext";
import { useUser } from "../../Context/UserContext";

const localizer = momentLocalizer(moment);


const CustomCalendar = ({ events = [], loading = true, error = null, isViewingOwnOrganization = null }) => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isNavigating, setIsNavigating] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const { addMessage } = useMessages();
  const { permissions: userPermissions } = useUser();

  // Navigation helper function
  const navigateToMonth = (direction) => {
    setIsNavigating(true);
    const newDate = direction === 'prev' 
      ? new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
      : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    
    setCurrentDate(newDate);
    
    // Reset navigation state after a short delay
    setTimeout(() => setIsNavigating(false), 300);
  };


  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          navigateToMonth('prev');
          break;
        case 'ArrowRight':
          event.preventDefault();
          navigateToMonth('next');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentDate]);

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
    const clickedDate = new Date(start);
    clickedDate.setHours(0, 0, 0, 0);

    if (clickedDate < today) {
      addMessage({
        text: "You cannot select a past date.",
        type: "warning",
        duration: 3000,
      });
      return;
    }

    // Show modal instead of direct navigation
    setSelectedDate(start);
    setShowDateModal(true);
  };

  const handleCreateEvent = () => {
    setShowDateModal(false);
    navigate("/events/eventDetailPage", {
      state: {
        mode: "create",
        selectedDate: selectedDate,
        fromCalendar: true,
      },
    });
  };

  const handleCloseModal = () => {
    setShowDateModal(false);
    setSelectedDate(null);
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
    const baseStyle = {
      borderRadius: "8px",
      border: "none",
      color: "white",
      display: "block",
      fontSize: "12px",
      fontWeight: "600",
      padding: "6px 10px",
      cursor: "pointer",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
      position: "relative",
      overflow: "hidden",
      lineHeight: "1.3",
    };

    const categoryStyles = {
      "new": {
        background: "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)",
        color: "white",
        textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
      },
      "on-track": {
        background: "linear-gradient(135deg, #2196F3 0%, #1976D2 100%)",
        color: "white",
        textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
      },
      "critical": {
        background: "linear-gradient(135deg, #FF5722 0%, #E64A19 100%)",
        color: "white",
        textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
      },
      "completed": {
        background: "linear-gradient(135deg, #9E9E9E 0%, #757575 100%)",
        color: "white",
        textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
        opacity: 0.85,
      },
    };

    return { 
      style: { ...baseStyle, ...categoryStyles[event.category] || categoryStyles["new"] }
    };
  };

  // Date Selection Modal
  const DateSelectionModal = () => {
    if (!showDateModal || !selectedDate) return null;

    const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return (
      <div className="date-modal-overlay" onClick={handleCloseModal}>
        <div className="date-modal" onClick={(e) => e.stopPropagation()}>
          <div className="date-modal-header">
            <CalendarIcon size={24} />
            <h3>Select Date: {formattedDate}</h3>
          </div>
          <div className="date-modal-content">
            <p>What would you like to do with this date?</p>
            <div className="date-modal-actions">
              <button 
                className="date-modal-btn create-btn"
                onClick={handleCreateEvent}
              >
                <Plus size={20} />
                Create Event
              </button>
              <button 
                className="date-modal-btn cancel-btn"
                onClick={handleCloseModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <CalendarSkeleton />;
  if (error) return <div className="calendar-container">Error: {error}</div>;

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-title-section">
          <h1 className="calendar-main-title">Event Schedule</h1>
          <p className="calendar-subtitle">View and manage all your events in a calendar format</p>
        </div>
        
        <div className="calendar-month-selector">
          <button 
            onClick={() => navigateToMonth('prev')}
            disabled={isNavigating}
            title="Previous month (←)"
            aria-label="Previous month"
            className={isNavigating ? 'navigating' : ''}
          >
            <ArrowBigLeft />
          </button>
          <span className={`calendar-month-title ${isNavigating ? 'navigating' : ''}`}>
            {new Date(currentDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button 
            onClick={() => navigateToMonth('next')}
            disabled={isNavigating}
            title="Next month (→)"
            aria-label="Next month"
            className={isNavigating ? 'navigating' : ''}
          >
            <ArrowBigRight />
          </button>
        </div>
        
        <div className="calendar-legend-inline">
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
        components={{ toolbar: () => null }}
      />
      
      <DateSelectionModal />
    </div>
  );
};

export default CustomCalendar;
