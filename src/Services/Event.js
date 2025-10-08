// Services/Event.js

import { fetchWithRefresh } from '../Context/RefereshToken';

// Fetch tasks by event
export const fetchTasksByEvent = async (eventId, organizationId) => {
  const response = await fetchWithRefresh(`/apis/task/by-event/${eventId}?organizationId=${organizationId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "ngrok-skip-browser-warning": "1",
    },
  });

  if (response.status === 404) {
    return []; // Gracefully handle missing endpoint/data without throwing
  }

  if (response.status === 500) {
    throw new Error("Unable to load tasks due to server error. Please try again later.");
  }

  if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
  const data = await response.json();

  const safeArray = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);

  const formattedTasks = safeArray.map((task) => ({
    id: task.id,
    creative_name: task.taskTitle,
    creative_type: task.creativeType,
    // Pass the complete assignedTo array with user objects for avatar display
    assigned_to: Array.isArray(task.assignedTo) ? task.assignedTo : [],
    due_date: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "",
    status: task.taskStatusName,
    // Pass the complete task data for any additional fields needed
    ...task
  }));

  return formattedTasks;
};

// Fetch event details
export const fetchEventDetails = async (eventId, organizationId, userId) => {
  if (!organizationId) {
    throw new Error("No organization selected");
  }

  // Determine if we need to include X-Context-Organization header
  const isViewingOwnOrg = organizationId === userId; // This might need adjustment based on actual logic

  // Prepare headers
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "ngrok-skip-browser-warning": "1",
  };

  // Only add X-Context-Organization header when viewing a different organization
  if (!isViewingOwnOrg) {
    headers["X-Context-Organization"] = organizationId;
  }

  // Use the new event details API endpoint
  const response = await fetchWithRefresh(
    `/apis/event/get_event/${eventId}?organizationId=${organizationId}&userId=${userId}`,
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const responseData = await response.json();
  const eventData = responseData.data || responseData;

  const transformedData = {
    ...eventData,
    coordinators: Array.isArray(eventData.coordinators)
      ? eventData.coordinators.map(coord => typeof coord === 'string' ? { name: coord, title: "Coordinator" } : coord)
      : [],
    specialGuests: Array.isArray(eventData.specialGuests)
      ? eventData.specialGuests.map(guest => typeof guest === 'string' ? { name: guest, title: "Guest" } : guest)
      : [],
    assignedUsers: Array.isArray(eventData.assignedUsers) ? eventData.assignedUsers : [],
    departmentIds: Array.isArray(eventData.departmentIds) ? eventData.departmentIds : []
  };

  return transformedData;
};

// Create new event
export const createEvent = async (eventData) => {
  const response = await fetchWithRefresh("/apis/event/create_event", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "ngrok-skip-browser-warning": "1",
    },
    body: JSON.stringify(eventData),
  });

  if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

  const result = await response.json();
  return result;
};

// Update existing event
export const updateEvent = async (eventId, userId, eventData) => {
  const response = await fetchWithRefresh(`/apis/event/update/${eventId}?userId=${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "ngrok-skip-browser-warning": "1",
    },
    body: JSON.stringify(eventData),
  });

  if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

  const result = await response.json();
  return result;
};
