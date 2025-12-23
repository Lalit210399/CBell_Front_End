// Schedule.js
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import CustomCalendar from "../../CommonComponents/Calendar/CustomCalendar";
import { useUser } from "../../Context/UserContext";
import { fetchWithRefresh } from "../../Context/RefereshToken";
import "./Schedule.css";
 
const Schedule = () => {
  const { user, selectedOrganizationId, isViewingOwnOrganization, scopeChangeTrigger, loading: userLoading } = useUser();
  const navigate = useNavigate();
 
  /** -------------------- API Function -------------------- **/
  const fetchEvents = useCallback(async () => {
    if (!user?.userId) {
      throw new Error("Missing userId");
    }
 
    const selectedOrgRaw = selectedOrganizationId;
    const selectedOrgValue = selectedOrgRaw == null ? "" : String(selectedOrgRaw);
    const normalizedSelectedOrg = selectedOrgValue.trim().toLowerCase();
    // Treat explicit sentinel values as "All". Empty/undefined selection falls back to user's org.
    const isAllOrganizationsSelected =
      normalizedSelectedOrg === "all" ||
      normalizedSelectedOrg === "*" ||
      normalizedSelectedOrg === "null" ||
      normalizedSelectedOrg === "undefined";
 
    // Use global selectedOrganizationId instead of user.organizationId
    const organizationId = isAllOrganizationsSelected ? null : (selectedOrgValue || String(user?.organizationId || ""));
 
    if (!isAllOrganizationsSelected && !organizationId) {
      throw new Error("No organization selected");
    }
 
    // Determine if we need to include X-Context-Organization header
    const isViewingOwnOrg = !isAllOrganizationsSelected && String(organizationId) === String(user?.organizationId);
   
    // Prepare headers
    const headers = {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "1",
    };
 
    // Only add X-Context-Organization header when viewing a different organization
    // (All-organizations endpoint does not require an org-context header)
    if (!isAllOrganizationsSelected && !isViewingOwnOrg) {
      headers["X-Context-Organization"] = organizationId;
    }
 
    // Use the new hierarchy endpoint.
    // Key rule: when “All” is selected, do not send orgId in path or query.
    const url = isAllOrganizationsSelected
      ? `/apis/event/hierarchy?userId=${user.userId}&filter=schedule`
      : `/apis/event/hierarchy/${organizationId}?userId=${user.userId}&filter=schedule`;
 
    const response = await fetchWithRefresh(url, {
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
 
  /** -------------------- State Management -------------------- **/
  const [eventsData, setEventsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isFetchingRef = useRef(false);
 
  // Execute API when organization is ready or scope changes
  const executeFetchEvents = useCallback(async () => {
    if (!userLoading && user?.userId && !isFetchingRef.current) {
     
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
  }, [userLoading, selectedOrganizationId, user?.userId]);
 
  useEffect(() => {
    executeFetchEvents();
  }, [executeFetchEvents, scopeChangeTrigger]);
 
  // Process events data
  const events = useMemo(() => {
    return eventsData || [];
  }, [eventsData]);
 
  // Original handle click - just pass event ID to EventDetailPage
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
        isViewingOwnOrganization={isViewingOwnOrganization} // pass organization check
      />
    </div>
  );
};
 
export default Schedule;
 
 