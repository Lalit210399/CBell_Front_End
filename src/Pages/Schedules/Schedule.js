import React, { useEffect, useState } from "react";
import CustomCalendar from "../../CommonComponents/Calendar/CustomCalendar";
import { useMessages } from "../../Context/MessageContext";
import "./Schedule.css";

const Schedule = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addMessage } = useMessages();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/apis/event/get_all_events", {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "ngrok-skip-browser-warning": "1",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const formattedEvents = data.map((event) => {
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
        setError(err.message);
        addMessage({
            text: "Failed to load events. Please try again.",
            type: "Error",
            duration: 3000,
          });
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="calendar-container">
      <CustomCalendar 
        events={events}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default Schedule;