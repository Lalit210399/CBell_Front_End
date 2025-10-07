// Services/Dashboard.js

import { fetchWithRefresh } from '../Context/RefereshToken';

// Dashboard Summary API
export const fetchSummaryData = async (organizationId, userId, includeChildren) => {
  const includeChildrenParam = includeChildren ? "&includeChildren=true" : "&includeChildren=false";

  const response = await fetchWithRefresh(
    `apis/dashboard/summary?orgid=${organizationId}&userid=${userId}${includeChildrenParam}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "1",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Dashboard summary API failed");
  }

  return await response.json();
};

// Active Events Count API
export const fetchActiveEventsCount = async (organizationId) => {
  const response = await fetchWithRefresh(
    `apis/dashboard/active-events-count?organizationId=${organizationId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "1",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Active events count API failed");
  }

  const data = await response.json();
  return data.count;
};

// Events Campaign API
export const fetchEventsCampaign = async (organizationId, selectedMonth, selectedYear) => {
  const monthParam = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;

  const response = await fetchWithRefresh(
    `apis/dashboard/events?orgid=${organizationId}&filter=month&month=${monthParam}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "1",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Events campaign API failed");
  }

  const data = await response.json();

  // Transform API data into EventCampaign structure
  return data.events.map((ev) => ({
    date: new Date(ev.eventDate).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    items: [{
      name: ev.eventName,
      id: ev.id,
      // Use event's organization ID if available, otherwise use the current scope organization ID
      organizationId: ev.organizationId || ev.orgId || organizationId,
      eventData: {
        ...ev,
        organizationId: ev.organizationId || ev.orgId || organizationId
      }
    }],
  }));
};

// Tasks API
export const fetchTasksData = async (organizationId, filterType = "all") => {
  // Map tile titles to API filter values
  const filterMap = {
    "Total Tasks": "all",
    "Tasks Due Next 7 Days": "due_soon",
    "Overdue Tasks": "overdue",
    "New Tasks": "new",
    "Active Tasks": "active",
    "Under Review Tasks": "under_review",
    "Approved Tasks": "approved",
    "Published Tasks": "published",
  };

  const apiFilter = filterMap[filterType] || "all";

  const response = await fetchWithRefresh(
    `apis/dashboard/tasks?orgid=${organizationId}&filter=${apiFilter}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "1",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Tasks API failed");
  }

  const data = await response.json();

  // Transform API data to match the expected format for RecentTasks component
  return data.tasks.map((task) => ({
    id: task.id || task.taskId,
    status: task.taskStatusName,
    taskName: task.taskTitle,
    eventName: task.eventName,
    eventId: task.eventId,
    assignedTo: task.assignedToNames?.map((name, index) => ({
      name: name,
      src: "",
      id: task.assignedTo?.[index] || `user-${index}`
    })) || [],
    dueDate: new Date(task.dueDate).toLocaleDateString("en-GB"),
    description: task.description,
    creativeType: task.creativeType,
    daysUntilDue: task.daysUntilDue,
    createdBy: task.createdByName || "Unknown",
    updatedBy: task.updatedByName || "Unknown",
  }));
};

// Active Events API
export const fetchActiveEventsData = async (organizationId) => {
  const response = await fetchWithRefresh(
    `apis/dashboard/events?orgid=${organizationId}&filter=active`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "1",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Active Events API failed");
  }

  const data = await response.json();

  // Transform API data to match the expected format for ActiveEvents component
  return data.events.map((event) => ({
    status: "Active",
    eventName: event.eventName,
    // Use event's organization ID if available, otherwise use the current scope organization ID
    organizationId: event.organizationId || event.orgId || organizationId,
    assignTo: event.assignedUsers?.map((user, index) => ({
      name: user.userName || user.name || user.fullName || `User ${index + 1}`,
      src: user.src || "",
      id: user.userId || user.id || `user-${index}`
    })) || [],
    displayDate: new Date(event.eventDate).toLocaleDateString("en-GB"),
    eventDate: new Date(event.eventDate).toLocaleDateString("en-GB"),
    createdBy: {
      name: event.createdByUser?.fullName || "Unknown",
      src: ""
    },
    description: event.eventDescription,
    location: event.locationDetails,
    eventType: event.eventTypeDesc || "Event",
    id: event.id,
  }));
};

// My Tasks API
export const fetchMyTasksData = async (organizationId, userId, includeChildren) => {
  const includeChildrenParam = includeChildren ? "&includeChildren=true" : "&includeChildren=false";

  const response = await fetchWithRefresh(
    `apis/dashboard/my-tasks?orgid=${organizationId}&userid=${userId}${includeChildrenParam}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "1",
      },
    }
  );

  if (!response.ok) {
    throw new Error("My Tasks API failed");
  }

  const data = await response.json();

  // Transform API data to match the expected format for RecentTasks component
  return data.tasks.map((task) => ({
    id: task.id,
    status: task.statusName,
    taskName: task.taskName,
    eventName: task.eventName,
    eventId: task.eventId,
    assignedTo: task.assignedTo?.map((name, index) => ({
      name: name,
      src: "",
      id: `user-${index}`
    })) || [],
    dueDate: new Date(task.dueDate).toLocaleDateString("en-GB"),
    description: task.taskDescription,
    creativeType: task.priority,
    daysUntilDue: task.isDueSoon ? "Due Soon" : task.isDueToday ? "Due Today" : task.isOverdue ? "Overdue" : "",
    createdBy: "Unknown", // Not provided in API response
    updatedBy: "Unknown", // Not provided in API response
    isOverdue: task.isOverdue,
    isDueSoon: task.isDueSoon,
    isDueToday: task.isDueToday,
    eventDate: task.eventDate ? new Date(task.eventDate).toLocaleDateString("en-GB") : "",
    organizationId: task.organizationId,
    organizationName: task.organizationName,
  }));
};

// Assigned Events API
export const fetchAssignedEvents = async (organizationId, userId, includeChildren) => {
  const includeChildrenParam = includeChildren ? "&includeChildren=true" : "&includeChildren=false";

  const response = await fetchWithRefresh(
    `apis/dashboard/assigned-events?orgid=${organizationId}&userid=${userId}${includeChildrenParam}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "1",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Assigned events API failed");
  }

  const data = await response.json();

  // Transform API data to match EventAssignToMe component format
  return data.events.map((event) => ({
    id: event.id || event.eventId,
    status: event.status || "Active",
    eventName: event.eventName,
    collegeName: event.organizationName || event.collegeName || event.college || "",
    // Use event's organization ID if available, otherwise use the current scope organization ID
    organizationId: event.organizationId || event.orgId || organizationId,
    assignTo: event.assignedUsers?.map((user, index) => ({
      name: user.userName || user.name || user.fullName || `User ${index + 1}`,
      src: user.src || "",
      id: user.userId || user.id || `user-${index}`
    })) || [],
    eventDate: new Date(event.eventDate).toLocaleDateString("en-GB"),
    createdBy: {
      name: event.createdByUser?.fullName || event.createdByUser?.name || "Unknown",
      src: event.createdByUser?.src || "",
    },
  }));
};
