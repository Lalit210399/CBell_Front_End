import React from "react";
import { useNavigate } from "react-router-dom";
import { UserRoundPlus } from "lucide-react";
import Button from "../Button/Button";

const StepTwo = ({ prevStep, formData, handleChange }) => {
    const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();

    const eventData = {
      eventName: formData.eventName,
      OrganizationId: "asbb124",  
      eventTypeId: formData.eventTypeId,  
      eventTypeDesc: formData.eventTypeDesc,
      eventDescription: formData.eventDescription,
      locationDetails: formData.location,
      coordinators: formData.coordinators?.split(",") || [],
      specialGuests: formData.guests?.split(",") || [],
      eventDate: formData.eventDate,
    };

    try {
      const response = await fetch(
        "https://90d6-114-143-74-202.ngrok-free.app/api/event/create_event",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "ngrok-skip-browser-warning": "1",
          },
          body: JSON.stringify(eventData),
        }
      );

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      const result = await response.json();
      console.log("Event Created:", result);
      alert("Event created successfully!");
      navigate("/events"); // Redirect to the events page after successful creation
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event.");
    }
  };

  return (
    <form className="step-container" onSubmit={handleSubmit}>
      <h3>Event Details</h3>

      <div className="form-group-row">
        <div className="form-group">
          <label>Event Name</label>
          <input type="text" name="eventName" value={formData.eventName} onChange={handleChange} placeholder="Podcast with Karan" required />
        </div>
        <div className="form-group">
          <label>Event Date</label>
          <input type="date" name="eventDate" value={formData.eventDate} onChange={handleChange} required />
        </div>
      </div>

      <div className="form-group full-width">
        <label>Event Description</label>
        <textarea name="eventDescription" value={formData.eventDescription} onChange={handleChange} placeholder="Enter Description" required />
      </div>

      <div className="form-group full-width">
        <label>Location Details</label>
        <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Search Manually" required />
      </div>

      <label>Dignitaries</label>
      <div className="form-group-row">
        <div className="form-group input-with-icon">
          <input type="text" name="guests" value={formData.guests} onChange={handleChange} placeholder="Add Special Guests" />
          <UserRoundPlus className="input-icon" size={20} />
        </div>
        <div className="form-group input-with-icon">
          <input type="text" name="coordinators" value={formData.coordinators} onChange={handleChange} placeholder="Add Coordinators" />
          <UserRoundPlus className="input-icon" size={20} />
        </div>
      </div>

      <div className="buttons">
        <Button onClick={prevStep} className="btn-secondary">Back</Button>
        <Button type="submit" className="btn-primary">Finish</Button>
      </div>
    </form>
  );
};

export default StepTwo;
