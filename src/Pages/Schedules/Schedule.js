// Schedule.js
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NewCalendar from "../../CommonComponents/Calendar/NewCalendar";
import ScheduleEventsList from "../../CommonComponents/ScheduleEventsList/ScheduleEventsList";
import { useUser } from "../../Context/UserContext";
import { fetchWithRefresh } from "../../Context/RefereshToken";
import "./Schedule.css";

const Schedule = () => {
  const { user, selectedOrganizationId, isViewingOwnOrganization, scopeChangeTrigger } = useUser();
  const navigate = useNavigate();

  /** -------------------- API Function -------------------- **/
  const fetchEvents = useCallback(async () => {
    // Use global selectedOrganizationId instead of user.organizationId
    const organizationId = selectedOrganizationId || user?.organizationId;

    if (!organizationId) {
      throw new Error("No organization selected");
    }

    // Determine if we need to include X-Context-Organization header
    const isViewingOwnOrg = organizationId === user?.organizationId;
    
    // Prepare headers
    const headers = {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "1",
    };

    // Only add X-Context-Organization header when viewing a different organization
    if (!isViewingOwnOrg) {
      headers["X-Context-Organization"] = organizationId;
    }

    // Use the new hierarchy endpoint
    const response = await fetchWithRefresh(`/apis/event/hierarchy/${organizationId}?userId=${user?.userId}&filter=schedule`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.status}`);
    }

    const responseData = await response.json();
    const eventsData = responseData.data || responseData;

    if (!Array.isArray(eventsData)) {
      throw new Error("Expected array of events but got something else");
    }

    const formattedEvents = eventsData.map((event) => {
      const eventDate = new Date(event.eventDate);
      const now = new Date();
      const timeDiff = eventDate.getTime() - now.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      let category;
      if (daysDiff < 0) {
        category = "completed";
      } else if (daysDiff <= 7) {
        category = "critical";
      } else if (daysDiff <= 30) {
        category = "on-track";
      } else {
        category = "future-event";
      }

      return {
        id: event.id,
        title: event.eventName,
        start: eventDate,
        end: eventDate,
        category: category,
        rawData: event, // keep full event data for detail page
      };
    });

    return formattedEvents;
  }, [selectedOrganizationId, user?.organizationId, user?.userId]);

  /** -------------------- State Management -------------------- **/
  const [eventsData, setEventsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'day'
  const [currentMonth, setCurrentMonth] = useState(new Date()); // Track current month
  const isFetchingRef = useRef(false);

  // Execute API when organization is ready or scope changes
  const executeFetchEvents = useCallback(async () => {
    if (selectedOrganizationId && !isFetchingRef.current) {
      
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      
      try {
        // Call fetchEvents directly without including it in dependencies
        const data = await fetchEvents();
        setEventsData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrganizationId, user?.userId]);

  useEffect(() => {
    executeFetchEvents();
  }, [executeFetchEvents, scopeChangeTrigger]);

  // Process events data
  const events = useMemo(() => {
    return eventsData || [];
  }, [eventsData]);

  // Handle date selection from calendar
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setViewMode('day');
  };

  // Handle month navigation from calendar
  const handleMonthChange = (date) => {
    setCurrentMonth(date);
    setViewMode('month'); // Reset to month view when changing months
    setSelectedDate(null); // Clear selected date
  };

  // Handle event click - navigate to event detail
  const handleEventClick = (event) => {
    navigate("/events/eventDetailPage", {
      state: {
        eventId: event.id,
        mode: "view",
        eventData: event.rawData,
      },
    });
  };

  // Handle create event
  const handleCreateEvent = (selectedDate) => {
    // Only allow event creation when viewing own organization
    if (!isViewingOwnOrganization()) {
      console.warn("Event creation is only allowed in your own organization");
      return;
    }
    
    navigate("/events/eventDetailPage", {
      state: {
        mode: "create",
        selectedDate: selectedDate,
      },
    });
  };

  // Get events to display based on view mode
  const getDisplayEvents = () => {
    let filteredEvents = events;

    if (viewMode === 'day' && selectedDate) {
      // Filter events for selected date
      const selectedDateStr = selectedDate.toDateString();
      filteredEvents = events.filter(event => 
        new Date(event.start).toDateString() === selectedDateStr
      );
    } else {
      // Filter events for current month
      const currentYear = currentMonth.getFullYear();
      const currentMonthNum = currentMonth.getMonth();
      
      filteredEvents = events.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate.getFullYear() === currentYear && 
               eventDate.getMonth() === currentMonthNum;
      });
    }

    // Sort events by priority (critical first, then by date)
    const priorityOrder = { 'critical': 1, 'on-track': 2, 'future-event': 3, 'completed': 4 };
    
    return filteredEvents.sort((a, b) => {
      // First sort by priority
      const priorityA = priorityOrder[a.category] || 5;
      const priorityB = priorityOrder[b.category] || 5;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Then sort by date
      return new Date(a.start) - new Date(b.start);
    });
  };

  // Get events list title based on view mode
  const getEventsListTitle = () => {
    if (viewMode === 'day' && selectedDate) {
      return `Events for ${selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      })}`;
    }
    return `Events for ${currentMonth.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    })}`;
  };

  // Get events list subtitle based on view mode
  const getEventsListSubtitle = () => {
    const displayEvents = getDisplayEvents();
    if (viewMode === 'day' && selectedDate) {
      return `${displayEvents.length} event${displayEvents.length !== 1 ? 's' : ''} found`;
    }
    return `${displayEvents.length} event${displayEvents.length !== 1 ? 's' : ''} this month`;
  };

  return (
    <div className="schedule-container">
      <div className="schedule-split-layout">
        {/* Left Section - Events List */}
        <ScheduleEventsList
          events={getDisplayEvents()}
          title={getEventsListTitle()}
          subtitle={getEventsListSubtitle()}
          onEventClick={handleEventClick}
          onCreateEvent={handleCreateEvent}
          loading={loading}
          error={error}
          emptyStateMessage={viewMode === 'day' 
            ? `No events found for ${selectedDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
            : 'No events found for this month'
          }
          viewMode={viewMode}
          selectedDate={selectedDate}
          onBackToMonth={() => {
            setViewMode('month');
            setSelectedDate(null);
          }}
          isViewingOwnOrganization={isViewingOwnOrganization}
        />

        {/* Right Section - Calendar */}
        <div className="calendar-section">
          <NewCalendar 
            events={events}
            loading={loading}
            error={error}
            onEventClick={handleEventClick}
            onDateSelect={handleDateSelect}
            onMonthChange={handleMonthChange}
            selectedDate={selectedDate}
            currentMonth={currentMonth}
            isViewingOwnOrganization={isViewingOwnOrganization}
          />
        </div>
      </div>
    </div>
  );
};

export default Schedule;