import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../Context/UserContext";
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
    if (!orgIdReady) return [];
    const organizationId = selectedOrganizationId || user?.organizationId;
    const userId = user?.userId;
    const includeChildren = isViewingOwnOrganization();
    return await fetchMyTasksData(organizationId, userId, includeChildren);
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



  // Execute APIs when orgIdReady changes or scope changes
  useEffect(() => {
    if (orgIdReady) {
      executeSummary();
      // Tasks API will be executed automatically by useApi hook when currentTitle changes
    }
  }, [orgIdReady, scopeChangeTrigger, executeSummary]);

  // Separate useEffect for Events Campaign to prevent unnecessary re-execution
  useEffect(() => {
    if (orgIdReady) {
      // Clear stale events before fetching new scope
      resetEventsCampaign();
      executeEventsCampaign();
    }
  }, [selectedMonth, selectedYear, orgIdReady, scopeChangeTrigger, executeEventsCampaign, resetEventsCampaign]);

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
                loading={currentTitle === "Tasks Assigned to Me" ? loadingMyTasks : loadingTasks}
                error={currentTitle === "Tasks Assigned to Me" ? errorMyTasks : errorTasks}
                showDropdown={[
                  "Total Tasks",
                ].includes(currentTitle)}
                hideAssignedToColumn={currentTitle === "New Tasks"}
                disableClientFiltering={true}
                showOrganizationColumn={currentTitle === "Tasks Assigned to Me"}
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
