// Services/Schedule.js

import { fetchWithRefresh } from '../Context/RefereshToken';

// Fetch events for schedule/calendar view
export const fetchEventsForSchedule = async (organizationId, userId, isViewingOwnOrg) => {
  if (!organizationId) {
    throw new Error("No organization selected");
  }

  // Prepare headers
  const headers = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "1",
  };

  // Only add X-Context-Organization header when viewing a different organization
  if (!isViewingOwnOrg) {
    headers["X-Context-Organization"] = organizationId;
  }

  // Use the hierarchy endpoint for schedule
  const response = await fetchWithRefresh(`/apis/event/hierarchy/${organizationId}?userId=${userId}&filter=schedule`, {
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
};
