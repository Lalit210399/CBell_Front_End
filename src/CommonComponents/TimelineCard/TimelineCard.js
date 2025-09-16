import React, { useMemo } from "react";
import "./TimelineCard.css";

const EventCampaign = ({
  events,
  onItemClick,
  emptyText = "No events available",
  showButton = false,
  buttonLabel = "Add Event",
  onButtonClick,
  loading = false,
}) => {
  // Function to get day name from date string
  const getDayName = (dateString) => {
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const date = new Date(dateString);
    return days[date.getDay()];
  };

  // Function to format date without year
  const formatDateWithoutYear = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  // Add day and formatted date properties
  const processedEvents = useMemo(() => {
    return events.map((event) => ({
      ...event,
      day: getDayName(event.date),
      formattedDate: formatDateWithoutYear(event.date),
    }));
  }, [events]);

  return (
    <div className="event-campaign-container">
      {/* ✅ Removed header completely */}

      {/* Events */}
      <div className="event-list">
        {loading ? (
          // Skeleton loading
          Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="event-group skeleton-group">
              <div className="event-date">
                <div className="skeleton skeleton-day"></div>
                <div className="skeleton skeleton-date"></div>
              </div>
              <div className="event-items">
                <div className="skeleton skeleton-item"></div>
                <div className="skeleton skeleton-item"></div>
              </div>
            </div>
          ))
        ) : processedEvents.length > 0 ? (
          processedEvents.map((eventGroup, index) => (
            <div key={index} className="event-group">
              <div className="event-date">
                <span className="event-day">{eventGroup.day}</span>
                <span className="event-date-text">{eventGroup.formattedDate}</span>
              </div>
              <div className="event-items">
                {eventGroup.items.map((item, i) => (
                  <div
                    key={i}
                    className="event-item"
                    onClick={() => onItemClick && onItemClick(item)}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="no-events">{emptyText}</div>
        )}
      </div>

      {/* Show button only if there are no events */}
      {showButton && processedEvents.length === 0 && (
        <div className="event-footer">
          <button className="event-button" onClick={onButtonClick}>
            {buttonLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default EventCampaign;
