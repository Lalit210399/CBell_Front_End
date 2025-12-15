import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { fetchWithRefresh } from "../../Context/RefereshToken";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../Context/UserContext";
import { useMessages } from "../../Context/MessageContext";
import useApi from "../../Hooks/useApi";
import Tile from "../../CommonComponents/Tiles/Tiles";
import EventCampaign from "../../CommonComponents/TimelineCard/TimelineCard";
import RecentTasks from "../../CommonComponents/RecentTaskBox/RecentTask";

import CustomDropdown from "../../CommonComponents/Dropdown/CustomDropdown";
import PageSkeleton from "../../CommonComponents/SkeletonLoading/PageSkeleton";
import {
  CheckCircle,
  UserCheck,
  ClipboardList,
  Clock as ClockIcon,
  CheckCircle as CheckCircleIcon,
  Calendar,
  ChevronLeft,
  ChevronRight,
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
  const fetchSummaryData = useCallback(async () => {
    if (!orgIdReady) return null;
    
    const organizationId = selectedOrganizationId || user?.organizationId;
    const includeChildren = isViewingOwnOrganization() ? "&includeChildren=true" : "&includeChildren=false";
    
    const response = await fetchWithRefresh(
      `apis/dashboard/summary?orgid=${organizationId}&userid=${user?.userId}${includeChildren}`,
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
  }, [orgIdReady, selectedOrganizationId, user?.organizationId, user?.userId, isViewingOwnOrganization]);


  // Events Campaign API
  const fetchEventsCampaign = useCallback(async () => {
    if (!orgIdReady) return [];

    const organizationId = selectedOrganizationId || user?.organizationId;
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
              eventData: ev
            }],
          }));
  }, [orgIdReady, selectedOrganizationId, user?.organizationId, selectedMonth, selectedYear]);

  // Active Events API
  const fetchActiveEvents = useCallback(async () => {
    if (!orgIdReady) return [];

    const organizationId = selectedOrganizationId || user?.organizationId;

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
      throw new Error("Active events API failed");
    }

    const data = await response.json();

    // Transform API data to match ActiveEvents component structure
    return data.events.map((ev) => ({
      id: ev.id,
      eventName: ev.eventName,
      assignTo: ev.assignedTo?.map((assignee) => ({
        name: assignee.name,
        src: assignee.avatar || "",
        id: assignee.id
      })) || [],
      displayDate: new Date(ev.eventDate).toLocaleDateString("en-GB"),
      createdBy: {
        name: ev.createdByName || "Unknown",
        src: ""
      },
      eventData: ev
    }));
  }, [orgIdReady, selectedOrganizationId, user?.organizationId]);

  // Tasks API
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
    if (!orgIdReady) return [];
    
    const organizationId = selectedOrganizationId || user?.organizationId;
    const userId = user?.userId;
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
  }, [orgIdReady, selectedOrganizationId, user?.organizationId, user?.userId, isViewingOwnOrganization]);



  /** -------------------- Use API Hooks -------------------- **/
  // Dashboard Summary
  const {
    data: summaryData,
    loading: loadingSummary,
    error: errorSummary,
    execute: executeSummary,
    reset: resetSummary
  } = useApi(fetchSummaryData, [orgIdReady], false);


  // Events Campaign
  const {
    data: allEvents,
    loading: loadingEventsCampaign,
    error: errorEventsCampaign,
    execute: executeEventsCampaign,
    reset: resetEventsCampaign
  } = useApi(fetchEventsCampaign, [orgIdReady, selectedMonth, selectedYear], false);

  // Active Events
  const {
    data: activeEventsData,
    loading: loadingActiveEvents,
    error: errorActiveEvents,
    execute: executeActiveEvents,
    reset: resetActiveEvents
  } = useApi(fetchActiveEvents, [orgIdReady], false);

  // Tasks - Create a memoized function for tasks
  const fetchTasksForCurrentTitle = useCallback(() => {
    // For "Total Tasks", use the filter state; for others, use the title
    const filterToUse = currentTitle === "Total Tasks" ? filter : currentTitle;
    
    // Special handling for "Tasks Under Approval"
    if (currentTitle === "Tasks Under Approval") {
    }
    
    return fetchTasksData(filterToUse);
  }, [fetchTasksData, currentTitle, filter]);

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
  } = useApi(fetchMyTasksData, [orgIdReady], false);

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
    if (errorActiveEvents) {
      showError('Failed to load active events data. Please try again.', { duration: 5000 });
    }
  }, [errorActiveEvents, showError]);

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

  // Execute Active Events API when orgIdReady changes
  useEffect(() => {
    if (orgIdReady) {
      executeActiveEvents();
    }
  }, [orgIdReady, executeActiveEvents]);

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
      icon: <UserCheck size={24} color="rgba(99, 102, 241, 1)" />,
      count: loadingSummary ? "..." : errorSummary ? "!" : summaryData?.standaloneTaskCount ?? 0,
      title: "My Individual Tasks",
      subtitle: "Your Personal Task List",
      bgcolor: "rgba(224, 231, 255, 0.2)",
      iconBgColor: "rgba(99, 102, 241, 0.2)",
      borderColor: "rgba(99, 102, 241, 1)",
      textColor: "rgba(49, 46, 129, 1)", // Indigo
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

  const tilesRef = useRef(null);

  const scrollTiles = (direction) => {
    if (!tilesRef.current) return;
    const container = tilesRef.current;
    const scrollAmount = container.offsetWidth; // scroll one viewport width
    const newScrollLeft = direction === "left"
      ? Math.max(0, container.scrollLeft - scrollAmount)
      : Math.min(container.scrollWidth - container.offsetWidth, container.scrollLeft + scrollAmount);
    container.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });
  };

  // Handle tile click
  const handleTileClick = useCallback((tile) => {
  // If user clicks the same tile again — do nothing
  if (tile.title === currentTitle) return;

  setCurrentTitle(tile.title);

  if (tile.title === "Tasks Assigned to Me" || tile.title === "My Individual Tasks") {
    setActiveComponent("recent");
    setFilter("All");
    resetMyTasks(); // only reset when switching
  } else {
    setActiveComponent("recent");

    if (tile.title === "Total Tasks") {
      setFilter("All");
    } else {
      const filterMap = {
        "Tasks Under Approval": "Under Approval",
        "Approved Tasks": "Approved",
      };
      setFilter(filterMap[tile.title] || tile.title);
    }

    resetTasks(); // only reset when switching
  }
}, [currentTitle, resetMyTasks, resetTasks]);

  // Handle more button click on tiles - navigate to TaskList page
  const handleMoreClick = useCallback((tile) => {
    // Map tile titles to appropriate filter values for tasks
    let filter = "all";
    let assignedToMe = false;
    switch (tile.title) {
      case "Total Tasks":
        filter = "all";
        break;
      case "Tasks Assigned to Me":
        filter = "all"; // Use 'all' but set assignedToMe flag
        assignedToMe = true;
        break;
      case "Tasks Under Approval":
        filter = "under_review";
        break;
      case "Approved Tasks":
        filter = "approved";
        break;
      default:
        filter = "all";
    }

    navigate('/tasks/list', {
      state: {
        filter,
        title: tile.title,
        assignedToMe
      }
    });
  }, [navigate]);

  // Single effect to handle all task fetching based on current title
  useEffect(() => {
    if (!orgIdReady) return;
    
    if (currentTitle === "Tasks Assigned to Me" || currentTitle === "My Individual Tasks") {
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

      {/* Summary Tiles */}
      <div className="tiles-container">
        <button className="scroll-btn left" onClick={() => scrollTiles("left")}>
          <ChevronLeft size={24} />
        </button>

        <div
          className="designer-summary-tiles"
          ref={tilesRef}
          style={{
            display: "flex",
            gap: 20,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            padding: "10px 0",
            flex: 1,
            scrollBehavior: "smooth",
            // hide default scrollbar on modern browsers (still shows on some)
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {summaryTiles.map((tile, idx) => (
            <div
              key={idx}
              style={{
                flex: "0 0 calc(20% - 16px)",
                display: "flex",
                scrollSnapAlign: "start",
              }}
            >
              <Tile
                {...tile}
                onClick={() => handleTileClick(tile)}
                isSelected={tile.title === currentTitle}
                onMoreClick={() => handleMoreClick(tile)}
              />
            </div>
          ))}
        </div>

        <button
          className="scroll-btn right"
          onClick={() => scrollTiles("right")}
        >
          <ChevronRight size={24} />
        </button>
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
                showOrganizationColumn={currentTitle === "Tasks Assigned to Me" || currentTitle === "My Individual Tasks"}
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
