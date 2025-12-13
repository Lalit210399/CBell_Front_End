import React, { useState, useEffect, useCallback, useMemo } from "react";
import { fetchWithRefresh } from "../../Context/RefereshToken";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../Context/UserContext";
import { useMessages } from "../../Context/MessageContext";
import useApi from "../../Hooks/useApi";
import TableNew from "../../CommonComponents/Table/TableNew";
import CustomDropdown from "../../CommonComponents/Dropdown/CustomDropdown";
import PageSkeleton from "../../CommonComponents/SkeletonLoading/PageSkeleton";
import Breadcrumb from "../../CommonComponents/Breadcrumb/Breadcrumb";
import {
  ClipboardList,
  Building,
  Filter,
  Plus,
} from "lucide-react";
import "./Tasks.css";

const Tasks = () => {
  const { user, selectedOrganizationId, isViewingOwnOrganization, loading: userLoading, scopeChangeTrigger } = useUser();
  const { showError, addMessage } = useMessages();
  const navigate = useNavigate();

  // State for orgIdReady
  const [orgIdReady, setOrgIdReady] = useState(false);

  // Initialize orgIdReady based on global state and user context
  useEffect(() => {
    if (userLoading) {
      setOrgIdReady(false);
      return;
    }
    
    const hasOrgId = selectedOrganizationId || user?.organizationId;
    if (hasOrgId) {
      setOrgIdReady(true);
    }
  }, [selectedOrganizationId, user?.organizationId, userLoading]);

  // State for filter
  const [filter, setFilter] = useState("All");

  // Filter options
  const filterOptions = [
    { label: "All Tasks", value: "All" },
    { label: "New", value: "New" },
    { label: "Active", value: "Active" },
    { label: "Under Approval", value: "Under Approval" },
    { label: "Approved", value: "Approved" },
    { label: "Published", value: "Published" },
    { label: "Due Soon", value: "Due Soon" },
    { label: "Overdue", value: "Overdue" },
  ];

  // Check if user is a Designer
  const isDesigner = user?.roles?.some(role => 
    role.name === "Designer" || role.displayName === "Designer"
  );

  /** -------------------- API Functions -------------------- **/
  // Fetch all tasks accessible to user
  const fetchAllTasks = useCallback(async () => {
    if (!orgIdReady) return [];
    
    const organizationId = selectedOrganizationId || user?.organizationId;
    
    // Map UI filter to API filter
    const filterMap = {
      "All": "all",
      "New": "new",
      "Active": "active",
      "Under Approval": "under_review",
      "Approved": "approved",
      "Published": "published",
      "Due Soon": "due_soon",
      "Overdue": "overdue",
    };

    const apiFilter = filterMap[filter] || "all";

    const response = await fetchWithRefresh(
      `/apis/dashboard/tasks?orgid=${organizationId}&filter=${apiFilter}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch tasks");
    }
    
    const data = await response.json();

    // Transform API data to match table format
    return (data.tasks || []).map((task) => ({
      id: task.id || task.taskId,
      taskTitle: task.taskTitle,
      taskStatus: task.taskStatusName,
      eventName: task.eventName,
      eventId: task.eventId,
      assignedTo: task.assignedToNames?.map((name, index) => ({
        name: name,
        src: "",
        id: task.assignedTo?.[index] || `user-${index}`
      })) || [],
      dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-GB") : "",
      creativeType: task.creativeType,
      description: task.description,
      createdBy: task.createdByName || "Unknown",
      organizationId: task.organizationId,
      organizationName: task.organizationName,
      daysUntilDue: task.daysUntilDue,
      isOverdue: task.daysUntilDue < 0,
    }));
  }, [orgIdReady, selectedOrganizationId, user?.organizationId, filter]);

  // Use API hook
  const {
    data: tasksData,
    loading: loadingTasks,
    error: errorTasks,
    execute: executeTasks
  } = useApi(fetchAllTasks, [orgIdReady, filter], false);

  // Handle API errors
  useEffect(() => {
    if (errorTasks) {
      showError('Failed to load tasks. Please try again.', { duration: 5000 });
    }
  }, [errorTasks, showError]);

  // Execute API when ready or scope changes
  useEffect(() => {
    if (orgIdReady) {
      executeTasks();
    }
  }, [orgIdReady, scopeChangeTrigger, filter, executeTasks]);

  // Handle new task button click
  const handleNewTask = () => {
    // Navigate to task creation page
    navigate("/events/eventDetailPage/tasks", { 
      state: { 
        mode: "create",
        organizationId: selectedOrganizationId || user?.organizationId 
      } 
    });
  };

  // Handle task row click
  const handleTaskClick = (task) => {
    navigate('/events/eventDetailPage/tasks', { 
      state: { 
        taskId: task.id, 
        mode: "view", 
        eventId: task.eventId || null,
        eventName: task.eventName || null,
        organizationId: selectedOrganizationId || user?.organizationId 
      } 
    });
  };

  // Define table columns
  const columns = useMemo(() => {
    const baseColumns = [
      {
        header: "Task Title",
        accessor: "taskTitle",
        width: "20%",
      },
      {
        header: "Status",
        accessor: "taskStatus",
        width: "10%",
        cell: (row) => (
          <span className={`status-badge status-${row.taskStatus?.toLowerCase().replace(/\s+/g, '-')}`}>
            {row.taskStatus}
          </span>
        ),
      },
      {
        header: "Event",
        accessor: "eventName",
        width: "15%",
      },
      {
        header: "Assigned To",
        accessor: "assignedTo",
        width: "15%",
        cell: (row) => (
          <div className="assigned-users">
            {row.assignedTo?.slice(0, 3).map((user, idx) => (
              <span key={idx} className="user-avatar" title={user.name}>
                {user.name?.charAt(0).toUpperCase()}
              </span>
            ))}
            {row.assignedTo?.length > 3 && (
              <span className="user-count">+{row.assignedTo.length - 3}</span>
            )}
          </div>
        ),
      },
      {
        header: "Creative Type",
        accessor: "creativeType",
        width: "10%",
      },
      {
        header: "Due Date",
        accessor: "dueDate",
        width: "10%",
        cell: (row) => (
          <span className={row.isOverdue ? "text-danger" : ""}>
            {row.dueDate}
          </span>
        ),
      },
      {
        header: "Created By",
        accessor: "createdBy",
        width: "10%",
      },
    ];

    // Add organization column if viewing across multiple orgs
    if (!isViewingOwnOrganization()) {
      baseColumns.splice(3, 0, {
        header: "Organization",
        accessor: "organizationName",
        width: "12%",
      });
    }

    return baseColumns;
  }, [isViewingOwnOrganization]);

  // Breadcrumb items
  const breadcrumbItems = useMemo(() => {
    const organizationName = user?.organization?.name || user?.organizationName || "Organization";
    
    return [
      { 
        label: organizationName, 
        href: "#", 
        icon: Building 
      },
      { 
        label: "Tasks", 
        href: "#", 
        icon: ClipboardList 
      }
    ];
  }, [user?.organization?.name, user?.organizationName]);

  // Show loading skeleton while user context is loading
  if (userLoading || !orgIdReady) {
    return <PageSkeleton type="task" />;
  }

  return (
    <div className="tasks-page-container">
      <div className="BreadCrumb">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className="tasks-header">
        <div className="tasks-title">
          <ClipboardList size={24} />
          <h2>All Tasks</h2>
        </div>
        <div className="tasks-controls">
          <div className="filter-dropdown">
            <Filter size={18} />
            <CustomDropdown
              options={filterOptions}
              defaultLabel={filterOptions.find(opt => opt.value === filter)?.label || "All Tasks"}
              onSelect={(opt) => setFilter(opt.value)}
            />
          </div>
          {!isDesigner && (
            <button
              className="dashboard-btn dashboard-btn-primary"
              onClick={handleNewTask}
            >
              <Plus size={18} />
              New Task
            </button>
          )}
        </div>
      </div>

      <div className="tasks-content">
        {loadingTasks ? (
          <PageSkeleton type="task" />
        ) : errorTasks ? (
          <div className="error-state">
            <p>Failed to load tasks. Please try again.</p>
            <button onClick={executeTasks} className="retry-button">
              Retry
            </button>
          </div>
        ) : !tasksData || tasksData.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={48} />
            <p>No tasks found</p>
            <span>
              {filter === "All" 
                ? "There are no tasks in this organization yet."
                : `No ${filter.toLowerCase()} tasks found.`}
            </span>
          </div>
        ) : (
          <TableNew
            columns={columns}
            data={tasksData}
            onRowClick={handleTaskClick}
            emptyMessage={`No ${filter.toLowerCase()} tasks found`}
          />
        )}
      </div>
    </div>
  );
};

export default Tasks;
