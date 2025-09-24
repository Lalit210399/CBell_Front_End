// Schedule.js
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import CustomCalendar from "../../CommonComponents/Calendar/CustomCalendar";
import { useMessages } from "../../Context/MessageContext";
import { useUser } from "../../Context/UserContext";
import { fetchWithRefresh } from "../../Context/RefereshToken";
import useApi from "../../Hooks/useApi";
import "./Schedule.css";

const Schedule = () => {
  const { addMessage } = useMessages();
<<<<<<< HEAD
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetchWithRefresh(`/apis/event/get_events_only?organizationId=${user?.organizationId}&userId=${user?.userId}&role=${encodeURIComponent(user?.roles[0]?.name || "")}`, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "ngrok-skip-browser-warning": "1",
          },
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
            category = "new";
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

        setEvents(formattedEvents);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError(err.message);
        addMessage({
          text: "Failed to load events. Please try again.",
          type: "error",
          duration: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.organizationId) {
      fetchEvents();
    }
  }, [user?.organizationId]);
=======
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
    const response = await fetchWithRefresh(`/apis/event/hierarchy/${organizationId}?userId=${user?.userId}`, {
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
        category = "new";
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

  /** -------------------- Use API Hook -------------------- **/
  const {
    data: eventsData,
    loading,
    error,
    execute: executeFetchEvents
  } = useApi(fetchEvents, [selectedOrganizationId], false);

  // Execute API when organization is ready or scope changes
  useEffect(() => {
    if (selectedOrganizationId) {
      executeFetchEvents();
    }
  }, [selectedOrganizationId, executeFetchEvents, scopeChangeTrigger]);

  // Process events data
  const events = useMemo(() => {
    return eventsData || [];
  }, [eventsData]);
>>>>>>> a3951b3e1e8c4af6b88d0d22f94bb6251b86cdd9

  // 👇 handle click
  const handleEventClick = (event) => {
    navigate("/events/eventDetailPage", {
      state: {
        eventId: event.id,
        mode: "view",
        eventData: event.rawData,
      },
    });
  };

  return (
    <div className="schedule-container">
      <CustomCalendar 
        events={events}
        loading={loading}
        error={error}
        onEventClick={handleEventClick} // pass to calendar
      />
    </div>
  );
};

export default Schedule;
