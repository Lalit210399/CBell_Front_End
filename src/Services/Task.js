// Services/Task.js

import { fetchWithRefresh } from '../Context/RefereshToken';

// Fetch task details
export const fetchTaskDetails = async (taskId, organizationId, userId) => {
  if (!organizationId) {
    throw new Error("No organization selected");
  }

  // Prepare headers similar to EventDetailPage
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "ngrok-skip-browser-warning": "1",
  };

  // Add organization context if needed
  if (organizationId !== userId) {
    headers["X-Context-Organization"] = organizationId;
  }

  const response = await fetchWithRefresh(`/apis/task/get_task/${taskId}?organizationId=${organizationId}`, {
    method: "GET",
    headers,
  });

  if (response.status === 404) {
    throw new Error("Task not found");
  }

  if (response.status === 500) {
    throw new Error("Unable to load task due to server error. Please try again later.");
  }

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const responseData = await response.json();
  const data = Array.isArray(responseData) ? responseData[0] : responseData;

  if (!data) {
    throw new Error("No task data found");
  }

  return data;
};

// Create new task
export const createTask = async (taskData) => {
  const response = await fetchWithRefresh("/apis/task/create_task", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "1",
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Task creation failed");
  }

  const result = await response.json();
  return result;
};

// Update existing task
export const updateTask = async (taskId, taskData) => {
  const response = await fetchWithRefresh(`/apis/task/update/${taskId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "1",
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Task update failed");
  }

  const result = await response.json();
  return result;
};

// Update task status
export const updateTaskStatus = async (taskId, statusId) => {
  const response = await fetchWithRefresh(`/apis/task/update-status/${taskId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "1",
    },
    body: JSON.stringify({
      taskStatusId: statusId
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Status update failed");
  }

  return await response.json();
};

// Check if task has documents (for validation)
export const checkTaskDocuments = async (taskId) => {
  const response = await fetchWithRefresh(`/apis/document-details/task/${taskId}`, {
    method: "GET",
    headers: {
      "ngrok-skip-browser-warning": "1",
    },
  });

  if (!response.ok) {
    throw new Error('Failed to check task documents');
  }

  const documents = await response.json();
  return documents || [];
};

// Approve document
export const approveDocument = async (documentId) => {
  const response = await fetchWithRefresh(`/apis/document/approve/${documentId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "1",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to approve document ${documentId}`);
  }

  return response.json();
};
