import React, { useMemo } from "react";
import "./TimelineCard.css";

const EventCampaign = ({
  events,
  onItemClick,
  emptyText = "No events available",
  showButton = false,
  buttonLabel = "Add Event",
  onButtonClick,
}) => {
  // Function to get day name from date string
  const getDayName = (dateString) => {
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const date = new Date(dateString);
    return days[date.getDay()];
  };

  // Add day property
  const processedEvents = useMemo(() => {
    return events.map((event) => ({
      ...event,
      day: getDayName(event.date),
    }));
  }, [events]);

  return (
    <div className="event-campaign-container">
      {/* ✅ Removed header completely */}

      {/* Events */}
      <div className="event-list">
        {processedEvents.length > 0 ? (
          processedEvents.map((eventGroup, index) => (
            <div key={index} className="event-group">
              <div className="event-date">
                <span className="event-day">{eventGroup.day}</span>
                <span className="event-date-text">{eventGroup.date}</span>
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
