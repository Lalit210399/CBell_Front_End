import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchWithRefresh } from "../../Context/RefereshToken";
import { useUser } from "../../Context/UserContext";
import useApi from "../../Hooks/useApi";
import Table from "../../CommonComponents/Table/Table";
import CustomDropdown from "../../CommonComponents/Dropdown/CustomDropdown";
import StatusBadge from "../../CommonComponents/StatusBadge/StatusBadge";
import PageSkeleton from "../../CommonComponents/SkeletonLoading/PageSkeleton";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Calendar,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Zap,
  Star
} from "lucide-react";
import "./TasksList.css";

const TasksList = () => {
  const { user, selectedOrganizationId, isViewingOwnOrganization, loading: userLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get task type from navigation state
  const taskType = location.state?.taskType || "Total Tasks";
  const initialFilter = location.state?.filter || "All";
  
  // State management
  const [orgIdReady, setOrgIdReady] = useState(false);
  const [filter, setFilter] = useState(initialFilter);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("dueDate");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Initialize orgIdReady
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

  // API function to fetch tasks
  const fetchTasksData = useCallback(async () => {
    if (!orgIdReady) return [];
    
    const organizationId = selectedOrganizationId || user?.organizationId;
    
    // Map task types to API filter values
    const filterMap = {
      "Total Tasks": "all",
      "Tasks Due Next 7 Days": "due_soon",
      "Overdue Tasks": "overdue",
      "New Tasks": "new",
      "Active Tasks": "active",
      "Under Approval Tasks": "under_review",
      "Approved Tasks": "approved",
      "Published Tasks": "published",
    };

    const apiFilter = filterMap[taskType] || "all";
    const includeChildren = isViewingOwnOrganization() ? "&includeChildren=true" : "&includeChildren=false";

    const response = await fetchWithRefresh(
      `/apis/dashboard/tasks?orgid=${organizationId}&filter=${apiFilter}${includeChildren}`,
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
    return data.tasks || [];
  }, [orgIdReady, selectedOrganizationId, user?.organizationId, taskType, isViewingOwnOrganization]);

  // Use API hook
  const {
    data: tasksData,
    loading: loadingTasks,
    error: errorTasks,
    execute: executeTasks
  } = useApi(fetchTasksData, [orgIdReady, taskType], false);

  // Execute API when dependencies change
  useEffect(() => {
    if (orgIdReady) {
      executeTasks();
    }
  }, [orgIdReady, executeTasks]);

  // Debug: Log the raw data
  console.log("TasksList Debug:", {
    tasksData,
    tasksDataLength: tasksData?.length,
    taskType,
    filter,
    orgIdReady
  });

  // Transform API data to match table format
  const allTasks = (tasksData || []).map((task) => ({
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
    organizationName: task.organizationName || task.collegeName || "Unknown",
    rawData: task
  }));

  // Client-side filtering and search
  const filteredTasks = allTasks.filter(task => {
    // Status filter
    if (filter !== "All" && task.status !== filter) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        task.taskName?.toLowerCase().includes(searchLower) ||
        task.eventName?.toLowerCase().includes(searchLower) ||
        task.organizationName?.toLowerCase().includes(searchLower) ||
        task.createdBy?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // Client-side pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const transformedTasks = filteredTasks.slice(startIndex, endIndex);

  // Debug: Log filtered and transformed data
  console.log("TasksList Filtered Debug:", {
    allTasksLength: allTasks.length,
    filteredTasksLength: filteredTasks.length,
    transformedTasksLength: transformedTasks.length,
    currentPage,
    pageSize,
    startIndex,
    endIndex
  });


  // Filter options for dropdown
  const filterOptions = [
    { label: "All", value: "All" },
    { label: "New", value: "New" },
    { label: "Active", value: "Active" },
    { label: "Under Approval", value: "Under Approval" },
    { label: "Approved", value: "Approved" },
    { label: "Published", value: "Published" },
    { label: "Overdue", value: "Overdue" }
  ];

  // Task type icons mapping
  const getTaskTypeIcon = (type) => {
    const iconMap = {
      "Total Tasks": <CheckCircle size={20} />,
      "Tasks Due Next 7 Days": <Clock size={20} />,
      "Overdue Tasks": <AlertCircle size={20} />,
      "New Tasks": <Plus size={20} />,
      "Active Tasks": <Zap size={20} />,
      "Under Approval Tasks": <Clock size={20} />,
      "Approved Tasks": <CheckCircle size={20} />,
      "Published Tasks": <Star size={20} />
    };
    return iconMap[type] || <CheckCircle size={20} />;
  };

  // Handle task click
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

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  // Handle filter change
  const handleFilterChange = (option) => {
    setFilter(option.value);
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Handle sort
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setCurrentPage(1); // Reset to first page on sort
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Handle page size change
  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // Render cell content
  const renderCell = (column, task) => {
    switch (column) {
      case "status":
        return (
          <StatusBadge 
            status={task.status} 
            onClick={(e) => {
              e.stopPropagation();
              handleTaskClick(task);
            }}
          />
        );
      case "assignedTo":
        return (
          <div className="assigned-users">
            {task.assignedTo?.slice(0, 2).map((user, index) => (
              <div key={index} className="user-avatar">
                {user.name?.charAt(0)?.toUpperCase()}
              </div>
            ))}
            {task.assignedTo?.length > 2 && (
              <div className="more-users">+{task.assignedTo.length - 2}</div>
            )}
          </div>
        );
      case "dueDate":
        const isOverdue = task.daysUntilDue < 0;
        const isDueSoon = task.daysUntilDue >= 0 && task.daysUntilDue <= 7;
        return (
          <span className={`due-date ${isOverdue ? 'overdue' : isDueSoon ? 'due-soon' : ''}`}>
            {task.dueDate}
            {task.daysUntilDue !== undefined && (
              <span className="days-until">
                ({task.daysUntilDue < 0 ? `${Math.abs(task.daysUntilDue)} days overdue` : 
                  task.daysUntilDue === 0 ? 'Due today' : 
                  `${task.daysUntilDue} days left`})
              </span>
            )}
          </span>
        );
      case "creativeType":
        return (
          <span className="creative-type">
            {task.creativeType || "N/A"}
          </span>
        );
      default:
        return task[column] || "";
    }
  };

  // Show loading skeleton while user context is loading
  if (userLoading || !orgIdReady) {
    return <PageSkeleton type="event" />;
  }

  return (
    <div className="tasks-list-container">
      {/* Header */}
      <div className="tasks-list-header">
        <div className="header-left">
          <button 
            className="back-button"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="title-section">
            
            <div>
              <h1>{taskType}</h1>
              <p>Comprehensive view of all {taskType.toLowerCase()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search tasks, events, or organizations..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        
        <div className="filter-controls">
          <CustomDropdown
            options={filterOptions}
            defaultLabel={filter}
            onSelect={handleFilterChange}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <Table
          columns={[
            { key: "status", label: "Status", sortable: true },
            { key: "taskName", label: "Task Name", sortable: true },
            { key: "eventName", label: "Event Name", sortable: true },
            { key: "organizationName", label: "Organization", sortable: true },
            { key: "assignedTo", label: "Assigned To" },
            { key: "dueDate", label: "Due Date", sortable: true },
            { key: "creativeType", label: "Type" },
            { key: "createdBy", label: "Created By", sortable: true }
          ]}
          data={transformedTasks}
          renderCell={renderCell}
          sortableColumns={["status", "taskName", "eventName", "organizationName", "dueDate", "createdBy"]}
          showActions={false}
          onRowClick={handleTaskClick}
          loading={loadingTasks}
          error={errorTasks}
          className="tasks-table"
          // Pagination props
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredTasks.length}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

    </div>
  );
};

export default TasksList;
