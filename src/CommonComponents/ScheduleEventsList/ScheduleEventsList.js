import React from "react";
import { ArrowLeft, Plus } from "lucide-react";
import "./ScheduleEventsList.css";

const ScheduleEventsList = ({
  events = [],
  title = "Events",
  subtitle = "Monthly overview",
  onEventClick,
  onCreateEvent,
  loading = false,
  error = null,
  emptyStateMessage = "No events found",
  viewMode = "month", // "month" or "day"
  selectedDate = null,
  onBackToMonth = null,
  isViewingOwnOrganization = null,
}) => {
  // Format date for display
  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Get title based on view mode
  const getDisplayTitle = () => {
    if (viewMode === 'day' && selectedDate) {
      return `Events for ${selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      })}`;
    }
    return title;
  };

  // Get subtitle based on view mode
  const getDisplaySubtitle = () => {
    if (viewMode === 'day' && selectedDate) {
      return `${events.length} event${events.length !== 1 ? 's' : ''} found`;
    }
    return subtitle;
  };

  // Check if selected date is in the past
  const isPastDate = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const selectedDateOnly = new Date(date);
    selectedDateOnly.setHours(0, 0, 0, 0);
    return selectedDateOnly < today;
  };

  // Check if user can create events
  const canCreateEvent = () => {
    return viewMode === 'day' &&
      selectedDate &&
      !isPastDate(selectedDate) &&
      isViewingOwnOrganization &&
      isViewingOwnOrganization();
  };

  return (
    <div className="schedule-events-list">
      {/* Header */}
      <div className="schedule-events-header">
        <div className="schedule-events-top-actions">
          {viewMode === 'day' && onBackToMonth && (
            <button
              className="back-to-month-btn"
              onClick={onBackToMonth}
              title="Back to month view"
            >
              <ArrowLeft size={14} />
              <span>Month</span>
            </button>
          )}
          
          {canCreateEvent() && (
            <button
              className="create-event-btn"
              onClick={() => onCreateEvent && onCreateEvent(selectedDate)}
              title={`Create event for ${selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`}
            >
              <Plus size={14} />
              <span>Create Event</span>
            </button>
          )}
        </div>
        
        <div className="schedule-events-title-section">
          <h2 className="schedule-events-title">{getDisplayTitle()}</h2>
          <p className="schedule-events-subtitle">{getDisplaySubtitle()}</p>
        </div>
      </div>

      {/* Content */}
      <div className="schedule-events-content">
        {loading ? (
          <div className="schedule-events-loading">Loading events...</div>
        ) : error ? (
          <div className="schedule-events-error">Error: {error}</div>
        ) : events.length === 0 ? (
          <div className="schedule-events-empty">
            <div className="empty-state-content">
              <div className="empty-state-message">
                {viewMode === 'day'
                  ? `No events found for ${selectedDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
                  : emptyStateMessage
                }
              </div>

              {canCreateEvent() && (
                <button 
                  className="create-event-btn-empty"
                  onClick={() => onCreateEvent && onCreateEvent(selectedDate)}
                  title={`Create event for ${selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`}
                >
                  <Plus size={16} />
                  <span>Create Event</span>
                </button>
              )}

              {viewMode === 'day' && isPastDate(selectedDate) && (
                <div className="past-date-message">
                  Cannot create events for past dates
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="schedule-events-list">
            {events.map((event) => (
              <div
                key={event.id}
                className="schedule-event-item"
                onClick={() => onEventClick && onEventClick(event)}
              >
                <div className="schedule-event-date">
                  {formatEventDate(event.start)}
                </div>
                <div className="schedule-event-details">
                  <div className="schedule-event-title">{event.title}</div>
                  <div className={`schedule-event-category ${event.category}`}>
                    {event.category}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleEventsList;
