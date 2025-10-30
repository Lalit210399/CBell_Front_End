import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../Context/UserContext";
import { useMessages } from "../../Context/MessageContext";
import useApi from "../../Hooks/useApi";
import { fetchSummaryData, fetchEventsCampaign, fetchTasksData, fetchMyTasksData } from "../../Services/Dashboard";
import Tile from "../../CommonComponents/Tiles/Tiles";
import EventCampaign from "../../CommonComponents/TimelineCard/TimelineCard";
import RecentTasks from "../../CommonComponents/RecentTaskBox/RecentTask";
import CustomDropdown from "../../CommonComponents/Dropdown/CustomDropdown";
import PageSkeleton from "../../CommonComponents/SkeletonLoading/PageSkeleton";
import {
  UserCheck,
  ClipboardList,
  Clock as ClockIcon,
  CheckCircle as CheckCircleIcon,
  Calendar,
} from "lucide-react";
import "./DesignerDashboard.css";

const DesignerDashboard = () => {
  const { user, selectedOrganizationId, isViewingOwnOrganization, loading: userLoading, scopeChangeTrigger } = useUser();
  const { showError, showWarning } = useMessages();
  const navigate = useNavigate();

  // State for orgIdReady - now based on global selectedOrganizationId
  const [orgIdReady, setOrgIdReady] = useState(false);

  // Initialize orgIdReady based on global state and user context
  useEffect(() => {
    // Don't set orgIdReady until user context is fully loaded
    if (userLoading) {
      setOrgIdReady(false);
      return;
    }
    
    // Set orgIdReady to true when we have either selectedOrganizationId or user.organizationId
    // This ensures data loads even if selectedOrganizationId is not set initially
    const hasOrgId = selectedOrganizationId || user?.organizationId;
    if (hasOrgId) {
      setOrgIdReady(true);
    }
  }, [selectedOrganizationId, user?.organizationId, userLoading]);


  // State for active component
  const [activeComponent, setActiveComponent] = useState("recent");

  // State for current title
  const [currentTitle, setCurrentTitle] = useState("Total Tasks");

  // State for filter
  const [filter, setFilter] = useState("All");

  /** -------------------- Month/Year Calculations -------------------- **/
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0); // index from current month

  // Dropdown options for months - next 12 months from current
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentDate = new Date();
  const monthOptions = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + i,
      1
    );
    const monthName = monthNames[date.getMonth()];
    const year = date.getFullYear();
    monthOptions.push({ label: `${monthName} ${year}`, value: i });
  }

  // Calculate selected month and year from index
  const selectedMonth =
    ((currentDate.getMonth() + selectedMonthIndex) % 12) + 1;
  const selectedYear =
    currentDate.getFullYear() +
    Math.floor((currentDate.getMonth() + selectedMonthIndex) / 12);

  /** -------------------- API Functions -------------------- **/
  // Dashboard Summary API
  const fetchSummaryDataCallback = useCallback(async () => {
    if (!orgIdReady) return null;

    const organizationId = selectedOrganizationId || user?.organizationId;
    const includeChildren = isViewingOwnOrganization();

    return await fetchSummaryData(organizationId, user?.userId, includeChildren);
  }, [orgIdReady, selectedOrganizationId, user?.organizationId, user?.userId, isViewingOwnOrganization]);

  // Events Campaign API
  const fetchEventsCampaignCallback = useCallback(async () => {
    if (!orgIdReady) return [];
    const organizationId = selectedOrganizationId || user?.organizationId;
    return await fetchEventsCampaign(organizationId, selectedMonth, selectedYear);
  }, [orgIdReady, selectedOrganizationId, user?.organizationId, selectedMonth, selectedYear]);

  // Tasks API
<<<<<<< HEAD
  const fetchTasksDataCallback = useCallback(async (filterType = "all") => {
    if (!orgIdReady) return [];
    const organizationId = selectedOrganizationId || user?.organizationId || "681460dcb8327b2e3417d8b1";

    // Map UI filter labels to API filter parameters
    const filterMap = {
      "Total Tasks": "all",
      "Tasks Under Approval": "under_review", // API uses under_review
      "Approved Tasks": "approved", // API uses approved
      // Handle dropdown filter values
      "All": "all",
      "New": "new",
      "Active": "active",
      "Under Approval": "under_review", // API uses under_review
      "Approved": "approved", // API uses approved
      "Published": "published",
      "Cancelled": "cancelled",
    };

    const apiFilter = filterMap[filterType] || "all";
    return await fetchTasksData(organizationId, apiFilter);
  }, [orgIdReady, selectedOrganizationId, user?.organizationId]);

  // My Tasks API - for "Tasks Assigned to Me" tile
  const fetchMyTasksDataCallback = useCallback(async () => {
=======
  // Tasks API
const fetchTasksData = useCallback(async (filterType = "all") => {
  if (!orgIdReady) {
    return [];
  }
  
  const organizationId = selectedOrganizationId || user?.organizationId || "681460dcb8327b2e3417d8b1";
  
  // Map UI filter labels to API filter parameters
  const filterMap = {
    "Total Tasks": "all",
    "Tasks Under Approval": "under_review", // API uses under_review
    "Approved Tasks": "approved", // API uses approved
    // Handle dropdown filter values
    "All": "all",
    "New": "new",
    "Active": "active", 
    "Under Approval": "under_review", // API uses under_review
    "Approved": "approved", // API uses approved
    "Published": "published",
    "Cancelled": "cancelled",
  };

  const apiFilter = filterMap[filterType] || "all";

  try {
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
      throw new Error(`Tasks API failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();

    // Check if data has tasks array or if it's the response structure
    const tasksArray = data.tasks || data.data?.tasks || data;

    // Transform API data to match the expected format for RecentTasks component
    const transformedTasks = (Array.isArray(tasksArray) ? tasksArray : []).map((task) => ({
      id: task.id,
      status: task.taskStatusName, // This will be "Under Approval" from API response
      taskName: task.taskTitle,
      eventName: task.eventName,
      eventId: task.eventId,
      assignedTo: task.assignedToNames?.map((name, index) => ({
        name: name,
        src: "",
        id: task.assignedTo?.[index] || `user-${index}`
      })) || [],
      assignedBy: task.assignmentDetails?.[0]?.assignedByName || task.createdByName || "Unknown",
      dueDate: new Date(task.dueDate).toLocaleDateString("en-GB"),
      description: task.description,
      creativeType: task.creativeType,
      daysUntilDue: task.daysUntilDue,
      createdBy: task.createdByName || "Unknown",
      updatedBy: task.updatedByName || "Unknown",
      taskStatusId: task.taskStatusId,
      createdOn: task.createdOn,
      createdById: task.createdBy,
      updatedById: task.updatedBy,
    }));
    
     return transformedTasks;
  } catch (error) {
    throw error;
  }
}, [orgIdReady, selectedOrganizationId, user?.organizationId]);
  // My Tasks API - for "Tasks Assigned to Me" tile
  const fetchMyTasksData = useCallback(async () => {
>>>>>>> f88ac0c2bcc489808a9865f1616882a3a5750ddb
    if (!orgIdReady) return [];
    const organizationId = selectedOrganizationId || user?.organizationId;
    const userId = user?.userId;
<<<<<<< HEAD
    const includeChildren = isViewingOwnOrganization();
    return await fetchMyTasksData(organizationId, userId, includeChildren);
=======
    const includeChildren = isViewingOwnOrganization() ? "true" : "false";
    
    const response = await fetchWithRefresh(
      `apis/dashboard/my-tasks?orgid=${organizationId}&userid=${userId}&includeChildren=${includeChildren}`,
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
    return data.tasks.map((task) => {
      // Find the assignment detail where userId matches current user ID
      const currentUserAssignment = task.assignmentDetails?.find(
        detail => detail.userId === user?.userId
      );
      
      // Console log for debugging
      
      
      return {
        id: task.id,
        status: task.statusName,
        taskName: task.taskName,
        eventName: task.eventName,
        eventId: task.eventId,
        assignedTo: task.assignedTo?.map((assignee, index) => ({
          name: assignee.name,
          src: "",
          id: assignee.id || `user-${index}`
        })) || [],
        assignedBy: currentUserAssignment?.assignedByName || task.assignmentDetails?.[0]?.assignedByName || "Unknown",
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
      };
    });
>>>>>>> f88ac0c2bcc489808a9865f1616882a3a5750ddb
  }, [orgIdReady, selectedOrganizationId, user?.organizationId, user?.userId, isViewingOwnOrganization]);



  /** -------------------- Use API Hooks -------------------- **/
  // Dashboard Summary
  const {
    data: summaryData,
    loading: loadingSummary,
    error: errorSummary,
    execute: executeSummary,
    reset: resetSummary
  } = useApi(fetchSummaryDataCallback, [orgIdReady], false);

  // Events Campaign
  const {
    data: allEvents,
    loading: loadingEventsCampaign,
    error: errorEventsCampaign,
    execute: executeEventsCampaign,
    reset: resetEventsCampaign
  } = useApi(fetchEventsCampaignCallback, [orgIdReady, selectedMonth, selectedYear], false);

  // Tasks - Create a memoized function for tasks
  const fetchTasksForCurrentTitle = useCallback(() => {
    // For "Total Tasks", use the filter state; for others, use the title
    const filterToUse = currentTitle === "Total Tasks" ? filter : currentTitle;

    // Special handling for "Tasks Under Approval"
    if (currentTitle === "Tasks Under Approval") {
    }

    return fetchTasksDataCallback(filterToUse);
  }, [fetchTasksDataCallback, currentTitle, filter]);

  const {
    data: tasksData,
    loading: loadingTasks,
    error: errorTasks,
    execute: executeTasks,
    reset: resetTasks
  } = useApi(fetchTasksForCurrentTitle, [orgIdReady, currentTitle, filter], false);

  // My Tasks - for "Tasks Assigned to Me" tile
  const {
    data: myTasksData,
    loading: loadingMyTasks,
    error: errorMyTasks,
    execute: executeMyTasks,
    reset: resetMyTasks
  } = useApi(fetchMyTasksDataCallback, [orgIdReady], false);

  // Handle API errors and show user-friendly messages
  useEffect(() => {
    if (errorSummary) {
      showError('Failed to load dashboard summary. Please try again.', { duration: 5000 });
    }
  }, [errorSummary, showError]);

  useEffect(() => {
    if (errorEventsCampaign) {
      showError('Failed to load events campaign data. Please try again.', { duration: 5000 });
    }
  }, [errorEventsCampaign, showError]);

  useEffect(() => {
    if (errorTasks) {
      showError('Failed to load tasks data. Please try again.', { duration: 5000 });
    }
  }, [errorTasks, showError]);

  useEffect(() => {
    if (errorMyTasks) {
      showError('Failed to load assigned tasks. Please try again.', { duration: 5000 });
    }
  }, [errorMyTasks, showError]);

  // Execute APIs when orgIdReady changes or scope changes
  useEffect(() => {
    if (orgIdReady) {
      executeSummary();
      // Tasks API will be executed automatically by useApi hook when currentTitle changes
    }
  }, [orgIdReady, scopeChangeTrigger, executeSummary]);

  // Separate useEffect for Events Campaign to only run when month/year changes
  useEffect(() => {
    if (orgIdReady) {
      executeEventsCampaign();
    }
  }, [orgIdReady, selectedMonth, selectedYear, executeEventsCampaign]);

  // Clear and refetch summary on scope change to avoid stale counts
  useEffect(() => {
    if (!orgIdReady) return;
    resetSummary();
    executeSummary();
  }, [scopeChangeTrigger, orgIdReady, resetSummary, executeSummary]);



  // Filter events by selected month
  const filteredEvents = useMemo(() => {
    if (!allEvents || !allEvents.length) return [];

    return allEvents.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getMonth() + 1 === selectedMonth &&
        eventDate.getFullYear() === selectedYear
      );
    });
  }, [allEvents, selectedMonth, selectedYear]);


  /** -------------------- Tiles Data -------------------- **/
  const summaryTiles = [
    {
      icon: <ClipboardList size={24} color="rgba(52, 168, 83, 1)" />,
      count: loadingSummary ? "..." : errorSummary ? "!" : summaryData?.totalTasks ?? 0,
      title: "Total Tasks",
      subtitle: "Current Organization Tasks",
      bgcolor: "rgba(181, 224, 194, 0.2)",
      iconBgColor: "rgba(52, 168, 83, 0.2)",
      borderColor: "rgba(92, 185, 117, 1)",
      textColor: "rgba(20, 83, 45, 1)",
    },
    {
      icon: <UserCheck size={24} color="rgba(60, 131, 246, 1)" />,
      count: loadingSummary ? "..." : errorSummary ? "!" : summaryData?.taskAssignedToMeCount ?? 0,
      title: "Tasks Assigned to Me",
      subtitle: "Tasks I'm Managing",
      bgcolor: "rgba(185, 210, 251, 0.2)",
      iconBgColor: "rgba(60, 131, 246, 0.2)",
      borderColor: "rgba(60, 131, 246, 1)",
      textColor: "rgba(30, 58, 138, 1)", // Blue
    },
    {
      icon: <ClockIcon size={24} color="rgba(249, 115, 22, 1)" />,
      count: loadingSummary ? "..." : errorSummary ? "!" : summaryData?.underApprovalTasks ?? 0,
      title: "Tasks Under Approval",
      subtitle: "Awaiting Approval",
      bgcolor: "rgba(253, 205, 170, 0.2)",
      iconBgColor: "rgba(249, 115, 22, 0.2)",
      borderColor: "rgba(249, 115, 22, 1)",
      textColor: "rgba(124, 45, 18, 1)", // Orange
    },
    {
      icon: <CheckCircleIcon size={24} color="rgba(34, 197, 94, 1)" />,
      count: loadingSummary ? "..." : errorSummary ? "!" : summaryData?.approvedTasks ?? 0,
      title: "Approved Tasks",
      subtitle: "Ready To Publish",
      bgcolor: "rgba(176, 233, 197, 0.2)",
      iconBgColor: "rgba(34, 197, 94, 0.2)",
      borderColor: "rgba(34, 197, 94, 1)",
      textColor: "rgba(20, 83, 45, 1)", // Green
    },
  ];

  // Handle tile click
  const handleTileClick = useCallback((tile) => {
    setCurrentTitle(tile.title);

    if (tile.title === "Tasks Assigned to Me") {
      setActiveComponent("recent");
      setFilter("All");
      // Clear any stale data; effect will handle the fetch
      resetMyTasks();
    } else {
      setActiveComponent("recent");

      // Set filter based on tile title - default to "All" for Total Tasks
      if (tile.title === "Total Tasks") {
        setFilter("All");
      } else {
        // Map tile titles to filter values that match the actual task status names
        const filterMap = {
          "Tasks Under Approval": "Under Approval",  // Match actual task status name
          "Approved Tasks": "Approved",
        };
        setFilter(filterMap[tile.title] || tile.title);
      }

      // Clear stale tasks list; effect will run a single fetch
      resetTasks();
    }
  }, [resetMyTasks, resetTasks]);

  // Single effect to handle all task fetching based on current title
  useEffect(() => {
    if (!orgIdReady) return;
    
    if (currentTitle === "Tasks Assigned to Me") {
      // Clear and fetch my tasks
      resetMyTasks();
      executeMyTasks();
    } else {
      // Clear and fetch regular tasks for other tiles
      resetTasks();
      executeTasks();
    }
  }, [orgIdReady, currentTitle, filter, scopeChangeTrigger, executeMyTasks, resetMyTasks, executeTasks, resetTasks]);

  // Handle task click
  const handleTaskClick = (task, key) => {
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

  // Handle event click
  const handleEventClick = (task) => {
    if (task && task.eventId) {
      navigate("/events/eventDetailPage", {
        state: {
          eventId: task.eventId,
          mode: "view",
        },
      });
    } else {
      console.warn("Task missing eventId:", task);
    }
  };


  // Handle event campaign item click
  const handleEventCampaignClick = (item) => {
    if (item && (item.id || item.eventData?.id)) {
      navigate("/events/eventDetailPage", {
        state: {
          eventId: item.id || item.eventData?.id,
          mode: "view",
          eventData: item.eventData || item,
        },
      });
    } else {
    }
  };

  // Show loading skeleton while user context is loading
  if (userLoading || !orgIdReady) {
    return <PageSkeleton type="event" />;
  }

  return (
    <div className="designer-dashboard-middle-container">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h2>Welcome {user?.firstName}, here's your creative dashboard.</h2>
        <div className="welcome-controls">
        </div>
      </div>

      {/* Summary Tiles - No scroll functionality */}
      <div className="designer-summary-tiles">
        {summaryTiles.map((tile, idx) => (
          <Tile
            key={idx}
            {...tile}
            onClick={() => handleTileClick(tile)}
            isSelected={tile.title === currentTitle}
          />
        ))}
      </div>

      {/* Bottom Section */}
      <div className="Second_Row_Section">
        <div className="bottom_section">
          {/* Recent Tasks */}
          {activeComponent === "recent" && (
            <div className="recent-tasks">
              <RecentTasks
                tasks={(currentTitle === "Tasks Assigned to Me" ? (myTasksData || []) : (tasksData || [])).slice(0, 5)}
                title={currentTitle}
                filter={filter}
                onFilterChange={setFilter}
                onTaskClick={handleTaskClick}
                onEventClick={handleEventClick}
                loading={currentTitle === "Tasks Assigned to Me" ? loadingMyTasks : loadingTasks}
                error={currentTitle === "Tasks Assigned to Me" ? errorMyTasks : errorTasks}
                showDropdown={[
                  "Total Tasks",
                ].includes(currentTitle)}
                hideAssignedToColumn={currentTitle === "New Tasks"}
                disableClientFiltering={true}
                showOrganizationColumn={currentTitle === "Tasks Assigned to Me"}
                showAssignedByColumn={true}
              />
            </div>
          )}


        </div>

        {/* Events Campaign Section */}
        <div className="events-campaign">
          <div className="event-header">
            <div className="event-title">
              <Calendar size={20} />
              <span>Events Campaign</span>
            </div>

            {/* Month Dropdown */}
            <div className="month-dropdown">
              <CustomDropdown
                options={monthOptions}
                defaultLabel={monthOptions[selectedMonthIndex]?.label}
                onSelect={(opt) => setSelectedMonthIndex(opt.value)}
              />
            </div>
          </div>

          {/* EventCampaign without header */}
          <EventCampaign
            title="Events Campaign"
            month={monthOptions[selectedMonthIndex]?.label}
            events={filteredEvents || []}
            onItemClick={handleEventCampaignClick}
            loading={loadingEventsCampaign}
            error={errorEventsCampaign}
          />
        </div>
      </div>
    </div>
  );
};

export default DesignerDashboard;
