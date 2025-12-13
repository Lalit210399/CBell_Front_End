/**
 * Event-related constants
 */

// Initial filter state for events
export const INITIAL_FILTER_STATE = {
  eventName: "",
  eventType: "",
  status: "",
  dateRange: "",
  assignedUser: "",
  createdBy: ""
};

// Date range filter options
export const DATE_RANGE_OPTIONS = [
  { label: "All Dates", value: "" },
  { label: "Today", value: "Today" },
  { label: "This Week", value: "This Week" },
  { label: "This Month", value: "This Month" },
  { label: "Next 30 Days", value: "Next 30 Days" }
];

// Status options (for future use)
export const STATUS_OPTIONS = [
  { label: "All Status", value: "" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Ongoing", value: "ongoing" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" }
];

// Permission action types
export const PERMISSION_ACTIONS = {
  CREATE: "Create",
  READ: "Read",
  UPDATE: "Update",
  DELETE: "Delete"
};

// Permission module and feature paths
export const PERMISSION_PATHS = {
  EVENTS: {
    MODULE: "Events",
    FEATURE: "Event Management"
  }
};

// Event status types
export const EVENT_STATUS = {
  UPCOMING: "upcoming",
  ONGOING: "ongoing",
  COMPLETED: "completed",
  UNKNOWN: "unknown"
};

// Debounce delay in milliseconds
export const SEARCH_DEBOUNCE_DELAY = 300;

// Empty field placeholder text
export const EMPTY_FIELD_TEXT = {
  name: "Untitled Event",
  type: "No Type",
  date: "No Date",
  participants: "No Team Members",
  createdBy: "Unknown Creator",
  default: "N/A"
};
