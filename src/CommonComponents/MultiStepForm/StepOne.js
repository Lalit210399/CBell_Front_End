import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "../Button/Button";

const StepOne = ({ nextStep, setFormData, formData }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get selectedDate from location state if present
  const selectedDate = location.state?.selectedDate
    ? new Date(location.state.selectedDate)
    : null;

  const [eventTypes, setEventTypes] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(
          "/apis/eventtype/get_all_event-types",
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "ngrok-skip-browser-warning": "1",
            },
          }
        );

        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const data = await response.json();

        const formattedEventTypes = data.map((event) => ({
          id: event?.id || event?._id || null,
          name: event.typeName,
          desc: event.typeDescription,
        }));

        setEventTypes(formattedEventTypes);
      } catch (error) {
        console.error("Error fetching event types:", error);
      }
    })();
  }, []);

  const selectEventType = (event) => {
    if (!event.id) {
      console.error("Event Type ID is missing!", event);
      return;
    }

    // Update form data
    setFormData((prev) => ({
      ...prev,
      eventType: event.name,
      eventTypeId: event.id,
      eventTypeDesc: event.desc,
      date: selectedDate || null,
    }));

    // Build navigation state
    const navigationState = {
      mode: "create",
      eventType: event.name,
      eventTypeId: event.id,
      eventTypeDesc: event.desc,
    };

    // Add selectedDate only if it exists
    if (selectedDate) {
      navigationState.selectedDate = selectedDate.toISOString();
    }

    // Navigate to EventDetailPage
    navigate("/events/eventDetailPage", { state: navigationState });
  };

  return (
    <div className="step-container">
      <h2 className="step-title">Select the Event Type</h2>
      <div className="event-list">
        {eventTypes.length ? (
          eventTypes.map((event) => (
            <div
              key={event.id || Math.random()}
              className={`event-card ${formData.eventType === event.name ? "selected" : ""}`}
              onClick={() => selectEventType(event)}
            >
              <h3>{event.name}</h3>
              <p>{event.desc}</p>
            </div>
          ))
        ) : (
          <p>Loading event types...</p>
        )}
      </div>
      <div className="bottom-section">
        <Button onClick={() => navigate(-1)} className="btn-secondary">Back</Button>
        <Button onClick={nextStep} className="btn-primary">Next</Button>
      </div>
    </div>
  );
};

export default StepOne;
