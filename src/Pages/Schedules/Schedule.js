// Schedule.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomCalendar from "../../CommonComponents/Calendar/CustomCalendar";
import { useMessages } from "../../Context/MessageContext";
import { useUser } from "../../Context/UserContext";
import { fetchWithRefresh } from "../../Context/RefereshToken";
import "./Schedule.css";

const Schedule = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addMessage } = useMessages();
  const { user, selectedOrganizationId } = useUser();
  const navigate = useNavigate();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use global selectedOrganizationId instead of user.organizationId
      const organizationId = selectedOrganizationId || user?.organizationId;

      if (!organizationId) {
        throw new Error("No organization selected");
      }

      // Determine if we need to include X-Context-Organization header
      const isViewingOwnOrganization = organizationId === user?.organizationId;
      
      // Prepare headers
      const headers = {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "1",
      };

      // Only add X-Context-Organization header when viewing a different organization
      if (!isViewingOwnOrganization) {
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

  useEffect(() => {
    if (selectedOrganizationId) {
      fetchEvents();
    } else if (!selectedOrganizationId) {
      setLoading(false);
      setError("No organization selected");
    }
  }, [selectedOrganizationId]);

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
