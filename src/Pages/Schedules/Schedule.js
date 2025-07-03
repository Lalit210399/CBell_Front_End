// Schedule.js
import React, { useEffect, useState } from "react";
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
  const { user } = useUser();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetchWithRefresh(`/apis/event/get_all_events?organizationId=${user?.organizationId}`, {
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
        const eventsData = responseData.data || responseData; // Handle both response formats

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

  return (
    <div className="schedule-container">
      <CustomCalendar 
        events={events}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default Schedule;