import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./NewCalendar.css";

const NewCalendar = ({
  events = [],
  loading = false,
  error = null,
  onEventClick = () => {},
  onDateSelect = () => {},
  onMonthChange = () => {},
  selectedDate: externalSelectedDate = null,
  currentMonth = new Date(),
  isViewingOwnOrganization = null
}) => {
  const [currentDate, setCurrentDate] = useState(currentMonth);

  // Sync with external currentMonth prop
  useEffect(() => {
    setCurrentDate(currentMonth);
  }, [currentMonth]);

  // Get month and year
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Generate calendar days - ensure we always show 6 weeks (42 days) for consistent layout
  const calendarDays = useMemo(() => {
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    // Add empty cells to fill remaining weeks (ensure 6 weeks total)
    const totalCells = 42; // 6 weeks * 7 days
    const remainingCells = totalCells - days.length;
    for (let i = 0; i < remainingCells; i++) {
      days.push(null);
    }
    
    return days;
  }, [startingDayOfWeek, daysInMonth]);

  // Get events for a specific date
  const getEventsForDate = (day) => {
    if (!day) return [];
    const date = new Date(year, month, day);
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  // Check if date is today
  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return year === today.getFullYear() && 
           month === today.getMonth() && 
           day === today.getDate();
  };

  // Check if date is selected
  const isSelected = (day) => {
    if (!day || !externalSelectedDate) return false;
    return year === externalSelectedDate.getFullYear() &&
           month === externalSelectedDate.getMonth() &&
           day === externalSelectedDate.getDate();
  };

  // Handle date click
  const handleDateClick = (day) => {
    if (!day) return;
    const clickedDate = new Date(year, month, day);
    onDateSelect(clickedDate);
  };

  // Handle month navigation
  const navigateMonth = (direction) => {
    const newDate = new Date(year, month + direction, 1);
    setCurrentDate(newDate);
    onMonthChange(newDate);
  };

  // Month names
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Day names
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="calendar_box">
      {/* Header */}
      <div className="calendar-header">
        <div className="calendar-title-section">
          <h2 className="calendar-main-title">
            {monthNames[month]} {year}
          </h2>
          <p className="calendar-subtitle">Click on any date to view events</p>
        </div>
        
        <div className="calendar-header-right">
          {/* Legend */}
          <div className="calendar-legend">
            <div className="legend-item">
              <div className="legend-dot critical"></div>
              <span>Critical</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot on-track"></div>
              <span>On Track</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot future-event"></div>
              <span>Future Event</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot completed"></div>
              <span>Completed</span>
            </div>
          </div>
          
          <div className="calendar-month-selector">
            <button 
              className="month-nav-btn"
              onClick={() => navigateMonth(-1)}
              disabled={loading}
            >
              <ChevronLeft size={16} />
            </button>
            
            <button 
              className="month-nav-btn"
              onClick={() => navigateMonth(1)}
              disabled={loading}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Day Headers */}
      <div className="calendar-day-headers">
        {dayNames.map(day => (
          <div key={day} className="day-header">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {calendarDays.map((day, index) => {
          const dayEvents = getEventsForDate(day);
          const isCurrentDay = isToday(day);
          const isSelectedDay = isSelected(day);

          return (
            <div
              key={index}
              className={`calendar-day ${!day ? 'empty-day' : ''} ${isCurrentDay ? 'today' : ''} ${isSelectedDay ? 'selected' : ''}`}
              onClick={() => handleDateClick(day)}
            >
              {day && (
                <>
                  <div className="day-number">{day}</div>
                  <div className="day-events">
                    {dayEvents.slice(0, 2).map((event, eventIndex) => (
                      <div
                        key={eventIndex}
                        className={`event-indicator ${event.category || 'default'}`}
                        title={event.title}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                      />
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="more-events">+{dayEvents.length - 2}</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default NewCalendar;
