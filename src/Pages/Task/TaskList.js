import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./TaskList.css";
import Table from "../../CommonComponents/Table/Table";
import AvatarList from "../../CommonComponents/Avatar/AvatarList";
import CustomDropdown from "../../CommonComponents/Dropdown/CustomDropdown";
import ConfirmationModal from "../../CommonComponents/ConfirmationModal";
import SearchBar from "../../CommonComponents/SearchBar";
import { useMessages } from "../../Context/MessageContext";
import { useUser } from "../../Context/UserContext";
import { fetchWithRefresh } from "../../Context/RefereshToken";
import useApi from "../../Hooks/useApi";
import { useDebouncedCallback } from "../../Hooks/useDebounce";
import { formatDateTime, toCamelCase, toTitleCase, generateInitials } from "../../CommonUtils/formatters";
import { X, Trash2, Plus } from "lucide-react";

const SEARCH_DEBOUNCE_DELAY = 300;

const INITIAL_FILTER_STATE = {
  taskName: "",
  status: "",
  eventName: "",
  createdBy: "",
  assignedUser: "",
};

const EMPTY_FIELD_TEXT = {
  taskName: "Untitled Task",
  status: "No Status",
  eventName: "No Event",
  assignedTo: "Unassigned",
  createdBy: "Unknown",
  dueDate: "No Due Date",
  default: "N/A"
};

const TaskList = () => {
  const location = useLocation();
  const initialFilter = location.state?.filter || "all";
  const pageTitle = location.state?.title || "All Tasks";

  const [filters, setFilters] = useState(INITIAL_FILTER_STATE);
  const [availableStatuses, setAvailableStatuses] = useState([]);
  const [availableEvents, setAvailableEvents] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  
  const navigate = useNavigate();
  const { addMessage } = useMessages();
  const { user, selectedOrganizationId, isViewingOwnOrganization, scopeChangeTrigger, loading: userLoading } = useUser();

  // Helper to check if user is a Designer
  const isDesigner = user?.roles?.some(role => 
    role.name === "Designer" || role.displayName === "Designer"
  );

  /** -------------------- API Function -------------------- **/
  const fetchTasks = useCallback(async () => {
    const organizationId = selectedOrganizationId || user?.organizationId;

    if (!organizationId) {
      throw new Error("No organization selected");
    }

    // Map human-friendly or legacy filter labels to canonical API parameter
    const filterMap = {
      "all": "all",
      "Total Tasks": "all",
      "Tasks Assigned to Me": "assigned_to_me",
      "Assigned to Me": "assigned_to_me",
      "My Individual Tasks": "assigned_to_me",
      "Tasks Under Approval": "under_review",
      "Under Approval": "under_review",
      "Approved Tasks": "approved",
      "Approved": "approved",
      "New": "new",
      "New Tasks": "new",
      "Active": "active",
      "Active Tasks": "active",
      "Published": "published",
      "Published Tasks": "published",
      "Cancelled": "cancelled",
      "Tasks Due Next 7 Days": "due_soon",
      "Due Soon": "due_soon",
      "Overdue Tasks": "overdue",
      "Overdue": "overdue",
      // Accept canonical values as-is
      "overdue": "overdue",
      "due_soon": "due_soon",
      "assigned_to_me": "assigned_to_me",
    };

    // Prefer mapped value, else accept canonical incoming filter, otherwise default to 'all'
    const canonicalCandidates = ["all", "overdue", "due_soon", "assigned_to_me", "active", "new", "under_review", "approved", "published", "cancelled"];
    const apiFilter = filterMap[initialFilter] || (canonicalCandidates.includes(initialFilter) ? initialFilter : "all");
    
    // Prepare headers
    const headers = {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "1",
    };

    // Only add X-Context-Organization header when viewing a different organization
    const isViewingOwnOrg = organizationId === user?.organizationId;
    if (!isViewingOwnOrg) {
      headers["X-Context-Organization"] = organizationId;
    }

    let url = `/apis/dashboard/tasks?orgid=${organizationId}&filter=${apiFilter}`;
    
    // For standalone/individual tasks, prefer the standalone endpoint
    const standaloneFilters = [
      "Tasks Assigned to Me",
      "Assigned to Me",
      "My Individual Tasks",
      "assigned_to_me",
      "assigned_to_me",
    ];

    let data = [];

    if (standaloneFilters.includes(initialFilter)) {
      // Inline fetch for standalone (individual) tasks - use fetchWithRefresh so credentials are included
      const standaloneUrl = `/apis/task/standalone?organizationId=${organizationId}`;
      const standaloneRes = await fetchWithRefresh(standaloneUrl, {
        method: "GET",
        headers,
      });

      if (!standaloneRes.ok) {
        throw new Error(`Failed to fetch standalone tasks: ${standaloneRes.status} - ${standaloneRes.statusText}`);
      }

      const resp = await standaloneRes.json();
      // resp may contain tasks in different shapes depending on backend
      data = resp.tasks || resp.data?.tasks || resp.data || resp || [];
      if (!Array.isArray(data)) {
        data = Array.isArray(resp) ? resp : [];
      }
    } else if (initialFilter === "Tasks Assigned to Me") {
      // Backwards-compatible fallback to the my-tasks endpoint
      const userId = user?.userId;
      const includeChildren = isViewingOwnOrganization() ? "true" : "false";
      url = `/apis/dashboard/my-tasks?orgid=${organizationId}&userid=${userId}&includeChildren=${includeChildren}`;

      const res = await fetchWithRefresh(url, {
        method: "GET",
        headers,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch tasks: ${res.status} - ${res.statusText}`);
      }

      const response = await res.json();
      data = response.tasks || response.data?.tasks || [];
    } else {
      const res = await fetchWithRefresh(url, {
        method: "GET",
        headers,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch tasks: ${res.status} - ${res.statusText}`);
      }

      const response = await res.json();
      data = response.tasks || response.data?.tasks || [];
    }

    if (!Array.isArray(data)) {
      throw new Error("Expected an array of tasks but got something else");
    }

    const formatted = data.map(task => {
      const assignedUsers = task.assignedToNames || task.assignedTo || [];

      const allParticipants = assignedUsers.map((user, index) => {
        let participantName = "Unknown";
        if (typeof user === "string") {
          participantName = user;
        } else if (user && user.name) {
          participantName = user.name;
        }

        return {
          name: toTitleCase(participantName),
          src: participantName,
          fallback: generateInitials(participantName),
          size: "32px",
          shape: "circle",
        };
      });

      return {
        id: task.id || task.taskId || Date.now().toString(),
        name: toCamelCase(task.taskTitle || task.taskName) || "Unnamed Task",
        status: task.taskStatusName || task.statusName || "N/A",
        eventName: toCamelCase(task.eventName) || "N/A",
        eventId: task.eventId,
        dueDate: task.dueDate ? formatDateTime(task.dueDate) : "N/A",
        createdBy: toCamelCase(task.createdByName || task.createdBy?.name || task.createdBy) || "Unknown",
        participants: allParticipants,
        rawData: task,
        organizationName: task.organizationName,
        creativeType: task.creativeType || task.priority,
      };
    });

    return formatted;
  }, [selectedOrganizationId, user?.organizationId, user?.userId, initialFilter, isViewingOwnOrganization]);

  /** -------------------- State Management -------------------- **/
  const [tasksData, setTasksData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isFetchingRef = useRef(false);

  // Execute API when organization is ready or scope changes
  const executeFetchTasks = useCallback(async () => {
    if (!userLoading && selectedOrganizationId && user?.userId && !isFetchingRef.current) {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchTasks();
        setTasksData(data);
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
    executeFetchTasks();
  }, [executeFetchTasks, scopeChangeTrigger]);

  // Process tasks data and extract filter options
  const { originalTasks, extractedStatuses, extractedEvents, extractedUsers } = useMemo(() => {
    if (!tasksData) {
      return { originalTasks: [], extractedStatuses: [], extractedEvents: [], extractedUsers: [] };
    }

    // Extract unique statuses, events, and users for filter options
    const uniqueStatuses = [...new Set(tasksData.map(task => task.status).filter(status => status !== "N/A"))];
    const uniqueEvents = [...new Set(tasksData.map(task => task.eventName).filter(event => event !== "N/A"))];
    const uniqueUsers = [...new Set(tasksData.map(task => task.createdBy).filter(user => user !== "Unknown"))];
    
    return {
      originalTasks: tasksData,
      extractedStatuses: uniqueStatuses.map(status => ({ label: toTitleCase(status), value: status })),
      extractedEvents: uniqueEvents.map(event => ({ label: toTitleCase(event), value: event })),
      extractedUsers: uniqueUsers.map(user => ({ label: toTitleCase(user), value: user }))
    };
  }, [tasksData]);

  // Update available filter options when extracted data changes
  useEffect(() => {
    setAvailableStatuses(extractedStatuses);
    setAvailableEvents(extractedEvents);
    setAvailableUsers(extractedUsers);
  }, [extractedStatuses, extractedEvents, extractedUsers]);

  // Initialize filtered tasks when originalTasks changes
  useEffect(() => {
    setFilteredTasks(originalTasks);
  }, [originalTasks]);

  const handleRetry = () => {
    executeFetchTasks();
  };

  const handleNewTask = () => {
    navigate("/events/eventDetailPage/tasks", { 
      state: { 
        mode: "create",
        organizationId: selectedOrganizationId || user?.organizationId 
      } 
    });
  };

  const handleSort = (key, direction) => {
    const sorted = [...filteredTasks].sort((a, b) => {
      if (key === "dueDate") {
        const dateA = a.dueDate === "N/A" ? new Date(0) : new Date(a.dueDate);
        const dateB = b.dueDate === "N/A" ? new Date(0) : new Date(b.dueDate);
        return direction === "asc" ? dateA - dateB : dateB - dateA;
      }
      return direction === "asc"
        ? String(a[key]).localeCompare(String(b[key]))
        : String(b[key]).localeCompare(String(a[key]));
    });
    setFilteredTasks(sorted);
  };

  // Debounced search handler
  const debouncedApplyFilters = useDebouncedCallback((filterValues) => {
    applyFilters(filterValues);
  }, SEARCH_DEBOUNCE_DELAY);

  const handleSearch = (query) => {
    setSearchQuery(query);
    const newFilters = { ...filters, taskName: query };
    setFilters(newFilters);
    debouncedApplyFilters(newFilters);
  };

  const applyFilters = useCallback((filterValues) => {
    let filtered = [...originalTasks];

    // Filter by task name
    if (filterValues.taskName) {
      const lowerQuery = filterValues.taskName.toLowerCase();
      const camelCaseQuery = toCamelCase(filterValues.taskName);
      filtered = filtered.filter(task =>
        String(task.name).toLowerCase().includes(lowerQuery) ||
        String(task.name).includes(camelCaseQuery)
      );
    }

    // Filter by status
    if (filterValues.status) {
      filtered = filtered.filter(task =>
        task.status === filterValues.status
      );
    }

    // Filter by event name
    if (filterValues.eventName) {
      filtered = filtered.filter(task =>
        task.eventName === filterValues.eventName
      );
    }

    // Filter by created by
    if (filterValues.createdBy) {
      filtered = filtered.filter(task =>
        task.createdBy === filterValues.createdBy
      );
    }

    // Filter by assigned user (participants)
    if (filterValues.assignedUser) {
      const lowerQuery = filterValues.assignedUser.toLowerCase();
      const camelCaseQuery = toCamelCase(filterValues.assignedUser);
      filtered = filtered.filter(task =>
        task.participants.some(participant =>
          participant.name.toLowerCase().includes(lowerQuery) ||
          toCamelCase(participant.name).includes(camelCaseQuery)
        )
      );
    }

    setFilteredTasks(filtered);
  }, [originalTasks]);

  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...filters, [filterKey]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilters(INITIAL_FILTER_STATE);
    setFilteredTasks(originalTasks);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== "").length;
  };

  // Delete API function
  const deleteTask = useCallback(async (id) => {
    const userId = user?.userId || user?.id || user?._id || user?.user_id || user?.uid;
    
    if (!userId) {
      throw new Error("User ID not available for delete operation");
    }
    
    const res = await fetchWithRefresh(`/apis/task/delete/${id}?userId=${userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "1",
      },
    });

    if (!res.ok) throw new Error(`Failed to delete task: ${res.status}`);

    return id;
  }, [user?.userId, user?.id, user?._id, user?.user_id, user?.uid]);

  // Use API hook for delete operation
  const {
    execute: executeDeleteTask,
    loading: deleteLoading
  } = useApi(deleteTask, [], false);

  // Open delete confirmation modal
  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setDeleteModalOpen(true);
  };

  // Close delete confirmation modal
  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setTaskToDelete(null);
  };

  // Confirm delete action
  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    
    try {
      await executeDeleteTask(taskToDelete.id);
      
      handleCloseDeleteModal();
      executeFetchTasks();

      addMessage({
        text: "Task deleted successfully.",
        type: "success",
        duration: 3000,
      });
    } catch (err) {
      addMessage({
        text: `Failed to delete task: ${err.message}`,
        type: "error",
        duration: 5000,
      });
    }
  };

  // Get empty field text helper
  const getEmptyText = (key) => EMPTY_FIELD_TEXT[key] || EMPTY_FIELD_TEXT.default;

  const columns = [
    { key: "name", label: "Task Name", skeletonWidth: "30%", skeletonHeight: "20px" },
    { key: "status", label: "Status", skeletonWidth: "10%", skeletonHeight: "20px" },
    { key: "eventName", label: "Event", skeletonWidth: "15%", skeletonHeight: "20px" },
    { key: "participants", label: "Assigned To", skeletonWidth: "20%", skeletonHeight: "40px" },
    { key: "dueDate", label: "Due Date", skeletonWidth: "12%", skeletonHeight: "20px" },
    { key: "createdBy", label: "Created By", skeletonWidth: "13%", skeletonHeight: "20px" },
  ];

  return (
    <div className="TaskList">
      {/* Header Section */}
      <div className="task-list-header">
        <div className="task-list-header-content">
          <div className="task-list-title-section">
            <h1 className="task-list-main-title">{pageTitle} for {user?.organization?.name || "Organization"}</h1>
            <p className="task-list-subtitle">Manage all your tasks in one place</p>
          </div>
          {!isDesigner && (
            <button className="task-list-new-button" onClick={handleNewTask}>
              <span className="plus-icon">+</span>
              New Task
            </button>
          )}
        </div>
      </div>

      <div className="task-list-toolbar">
        <SearchBar
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search tasks..."
          aria-label="Search tasks"
          id="task-search-input"
        />

        <div className="filter-chips" role="group" aria-label="Task filters">
          <CustomDropdown
            options={[{ label: "All Statuses", value: "" }, ...availableStatuses]}
            defaultLabel={filters.status ? toTitleCase(filters.status) : "Status"}
            onSelect={(option) => handleFilterChange("status", option.value)}
            compact={true}
          />

          <CustomDropdown
            options={[{ label: "All Events", value: "" }, ...availableEvents]}
            defaultLabel={filters.eventName ? toTitleCase(filters.eventName) : "Event"}
            onSelect={(option) => handleFilterChange("eventName", option.value)}
            compact={true}
          />

          <CustomDropdown
            options={[{ label: "All Users", value: "" }, ...availableUsers]}
            defaultLabel={filters.createdBy ? toTitleCase(filters.createdBy) : "Created By"}
            onSelect={(option) => handleFilterChange("createdBy", option.value)}
            compact={true}
          />

          <input
            type="text"
            id="assigned-user-filter"
            placeholder="Assigned to..."
            value={filters.assignedUser}
            onChange={(e) => handleFilterChange("assignedUser", e.target.value)}
            className="filter-chip-text-input"
            aria-label="Filter by assigned user"
          />

          {getActiveFiltersCount() > 0 && (
            <button 
              className="clear-filters-link"
              onClick={clearFilters}
              aria-label="Clear all filters"
            >
              <X size={14} aria-hidden="true" />
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="Table_Container" role="region" aria-label="Tasks table">
        <Table
          columns={columns}
          data={filteredTasks}
          loading={loading || deleteLoading}
          error={error}
          onRetry={handleRetry}
          onSort={handleSort}
          renderCell={(key, item) => {
            if (key === "participants") {
              return item.participants && item.participants.length > 0 ? (
                <AvatarList
                  avatars={item.participants}
                  stack={true}
                  maxVisible={3}
                  showTooltip={true}
                />
              ) : (
                <span className="empty-field">{getEmptyText("assignedTo")}</span>
              );
            }
            if (key === "status") {
              return (
                <span className={`status-pill status-${item.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                  {toTitleCase(item.status) || getEmptyText(key)}
                </span>
              );
            }
            if (key === "createdBy") {
              return (
                <div className="created-by-name">
                  {toTitleCase(item.createdBy) || getEmptyText(key)}
                </div>
              );
            }
            if (key === "name" || key === "eventName") {
              return toTitleCase(item[key]) || getEmptyText(key);
            }
            return item[key] || getEmptyText(key);
          }}
          noDataText="No Tasks Found"
          addEventText="Click here to add a New Task"
          onAddEventClick={!isDesigner ? handleNewTask : undefined}
          sortableColumns={["name", "status", "eventName", "dueDate", "createdBy"]}
          onDelete={!isDesigner ? (task) => handleDeleteClick(task) : undefined}
          onRowClick={(task) => {
            if (!loading && !error) {
              navigate("/events/eventDetailPage/tasks", {
                state: {
                  taskId: task.id,
                  mode: "view",
                  eventId: task.eventId,
                  eventName: task.eventName,
                  organizationId: selectedOrganizationId || user?.organizationId
                },
              });
            }
          }}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message={`Are you sure you want to delete the task "${taskToDelete ? toTitleCase(taskToDelete.name) : ''}"?`}
        warningText="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonVariant="danger"
        loading={deleteLoading}
        icon={<Trash2 size={20} />}
      />
    </div>
  );
};

export default TaskList;
