import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../Context/UserContext";
import { useMessages } from "../../Context/MessageContext";
import useApi from "../../Hooks/useApi";
import { fetchSummaryData, fetchActiveEventsCount, fetchEventsCampaign, fetchTasksData, fetchActiveEventsData, fetchAssignedEvents } from "../../Services/Dashboard";
import Tile from "../../CommonComponents/Tiles/Tiles";
import EventCampaign from "../../CommonComponents/TimelineCard/TimelineCard";
import RecentTasks from "../../CommonComponents/RecentTaskBox/RecentTask";
import ActiveEvents from "../../CommonComponents/ActiveEvents/ActiveEvents";
import EventAssignToMe from "../../CommonComponents/EventAssignToMe/EventAssignToMe";
import CustomDropdown from "../../CommonComponents/Dropdown/CustomDropdown";
import PageSkeleton from "../../CommonComponents/SkeletonLoading/PageSkeleton";
import {
  CheckCircle,
  UserCheck,
  ClipboardList,
  AlertCircle,
  Plus,
  Zap,
  Clock as ClockIcon,
  CheckCircle as CheckCircleIcon,
  Star,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import "./Dashboard.css";

const Dashboard = () => {
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

  // Handle new event button click
  const handleNewEvent = () => {
    // Only allow event creation when viewing own organization
    if (!isViewingOwnOrganization()) {
      console.warn("Event creation is only allowed in your own organization");
      return;
    }
    navigate("/events/eventDetailPage", { state: { mode: "create" } });
  };


  // State for active component
  const [activeComponent, setActiveComponent] = useState("activeEvents");

  // State for current title
  const [currentTitle, setCurrentTitle] = useState("Active Events");

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

  // Active Events Count API
  const fetchActiveEventsCountCallback = useCallback(async () => {
    if (!orgIdReady) return null;

    const organizationId = selectedOrganizationId || user?.organizationId || "685eb18207416b9271b800b3";

    return await fetchActiveEventsCount(organizationId);
  }, [orgIdReady, selectedOrganizationId, user?.organizationId]);

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
    return await fetchTasksData(organizationId, apiFilter);
  }, [orgIdReady, selectedOrganizationId, user?.organizationId]);

  // Active Events API
  const fetchActiveEventsDataCallback = useCallback(async () => {
    if (!orgIdReady) return [];
    const organizationId = selectedOrganizationId || user?.organizationId;
    return await fetchActiveEventsData(organizationId);
  }, [orgIdReady, selectedOrganizationId, user?.organizationId]);

  // Assigned Events API
  const fetchAssignedEventsCallback = useCallback(async () => {
    if (!orgIdReady) return [];
    const organizationId = selectedOrganizationId || user?.organizationId;
    const userId = user?.userId;
    const includeChildren = isViewingOwnOrganization();
    return await fetchAssignedEvents(organizationId, userId, includeChildren);
  }, [orgIdReady, selectedOrganizationId, user?.organizationId, user?.userId, isViewingOwnOrganization]);

  /** -------------------- Use API Hooks -------------------- **/
  // Dashboard Summary
  const {
    data: summaryData,
    loading: loadingSummary,
    error: errorSummary,
    execute: executeSummary
  } = useApi(fetchSummaryDataCallback, [orgIdReady], false);

  // Active Events Count
  const {
    execute: executeCount
  } = useApi(fetchActiveEventsCountCallback, [orgIdReady], false);

  // Events Campaign
  const {
    data: allEvents,
    loading: loadingEventsCampaign,
    error: errorEventsCampaign,
    execute: executeEventsCampaign
  } = useApi(fetchEventsCampaignCallback, [orgIdReady, selectedMonth, selectedYear], false);

  // Tasks - Create a memoized function for tasks
  const fetchTasksForCurrentTitle = useCallback(() => {
    return fetchTasksDataCallback(currentTitle);
  }, [fetchTasksDataCallback, currentTitle]);

  const {
    data: tasksData,
    loading: loadingTasks,
    error: errorTasks,
    execute: executeTasks
  } = useApi(fetchTasksForCurrentTitle, [orgIdReady, currentTitle], false);

  // Active Events
  const {
    data: activeEventsData,
    loading: loadingActiveEvents,
    error: errorActiveEvents,
    execute: executeActiveEvents
  } = useApi(fetchActiveEventsDataCallback, [orgIdReady], false);

  // Assigned Events
  const {
    data: eventAssignToMeData,
    loading: loadingAssignToMe,
    error: errorAssignToMe,
    execute: executeAssignedEvents
  } = useApi(fetchAssignedEventsCallback, [orgIdReady], false);

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
    if (errorActiveEvents) {
      showError('Failed to load active events. Please try again.', { duration: 5000 });
    }
  }, [errorActiveEvents, showError]);

  useEffect(() => {
    if (errorAssignToMe) {
      showError('Failed to load assigned events. Please try again.', { duration: 5000 });
    }
  }, [errorAssignToMe, showError]);

  // Execute APIs when orgIdReady changes or scope changes
  useEffect(() => {
    if (orgIdReady) {
      executeSummary();
<<<<<<< HEAD
      executeCount();
      
      executeEventsCampaign();
      executeActiveEvents();
      executeAssignedEvents();
    }
  }, [orgIdReady, scopeChangeTrigger, executeSummary, executeCount, executeEventsCampaign, executeActiveEvents, executeAssignedEvents]);
=======
      executeActiveEvents();
      executeAssignedEvents();
    }
  }, [orgIdReady, scopeChangeTrigger, executeSummary, executeActiveEvents, executeAssignedEvents]);

  // Separate effect for events campaign to only run when month/year changes
  useEffect(() => {
    if (orgIdReady) {
      executeEventsCampaign();
    }
  }, [orgIdReady, selectedMonth, selectedYear, executeEventsCampaign]);
>>>>>>> f88ac0c2bcc489808a9865f1616882a3a5750ddb

  // Define task tiles for reuse
  const taskTiles = useMemo(() => [
    "Total Tasks",
    "Tasks Due Next 7 Days",
    "Overdue Tasks",
    "New Tasks",
    "Active Tasks",
    "Under Review Tasks",
    "Approved Tasks",
    "Published Tasks",
  ], []);

  // Refetch data for current component on scope change
  useEffect(() => {
    if (!orgIdReady) return;

    if (activeComponent === "activeEvents") {
      executeActiveEvents();
    } else if (activeComponent === "recent") {
      // Only refetch if we have a valid currentTitle
      if (currentTitle && taskTiles.includes(currentTitle)) {
        executeTasks();
      }
    }
  }, [activeComponent, currentTitle, orgIdReady, executeActiveEvents, executeTasks, taskTiles]);

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
      icon: <CheckCircle size={24} color="rgba(52, 168, 83, 1)" />,
      count: loadingSummary
        ? "..."
        : errorSummary
        ? "!"
        : summaryData?.activeEvents ?? 0,
      title: "Active Events",
      subtitle: "Active Institute events",
      bgcolor: "rgba(181, 224, 194, 0.2)",
      // bgcolor: "#ffff",
      iconBgColor: "rgba(52, 168, 83, 0.2)",
      borderColor: "rgba(92, 185, 117, 1)",
      // borderColor: "#E4E6E9",
      textColor: "rgba(20, 83, 45, 1)",
    },
    {
      icon: <UserCheck size={24} color="rgba(60, 131, 246, 1)" />,
      count: loadingSummary
        ? "..."
        : errorSummary
        ? "!" :summaryData?.assignedEvents ?? 0,
      title: "Events Assigned to Me",
      subtitle: "Events I'm Managing",
      bgcolor: "rgba(185, 210, 251, 0.2)",
      // bgcolor: "#ffff",
      iconBgColor: "rgba(60, 131, 246, 0.2)",
      borderColor: "rgba(60, 131, 246, 1)",
      // borderColor: "#E4E6E9",
      textColor: "rgba(30, 58, 138, 1)", // Blue
    },
    {
      icon: <ClipboardList size={24} color="rgba(168, 85, 247, 1)" />,
      count: loadingSummary
        ? "..."
        : errorSummary
        ? "!" :summaryData?.totalTasks ?? 0,
      title: "Total Tasks",
      subtitle: "All Tasks Across Events",
      bgcolor: "rgba(224, 194, 251, 0.2)",
      // bgcolor: "#ffff",
      iconBgColor: "rgba(168, 85, 247, 0.2)",
      borderColor: "rgba(168, 85, 247, 1)",
      // borderColor: "#E4E6E9",
      textColor: "rgba(88, 28, 135, 1)", // Purple
    },
    {
      icon: <ClockIcon size={24} color="#F59F0A" />,
      count: loadingSummary
        ? "..."
        : errorSummary
        ? "!" :summaryData?.dueSoonTasks ?? 0,
      title: "Tasks Due Next 7 Days",
      subtitle: "Tasks Due Soon",
      bgcolor: "rgba(245, 159, 10, 0.1)",
      // bgcolor: "#ffff",
      iconBgColor: "rgba(245, 159, 10, 0.2)",
      borderColor: "rgba(245, 159, 10, 1)",
      // borderColor: "#E4E6E9",
      textColor: "rgba(172, 123, 38, 1)", // Orange
    },
    {
      icon: <AlertCircle size={24} color="rgba(220, 38, 38, 1)" />,
      count: loadingSummary
        ? "..."
        : errorSummary
        ? "!" :summaryData?.overdueTasks ?? 0,
      title: "Overdue Tasks",
      subtitle: "For Institute Level",
      bgcolor: "rgba(242, 178, 178, 0.2)",
      // bgcolor: "#ffff",
      iconBgColor: "rgba(220, 38, 38, 0.2)",
      borderColor: "rgba(220, 38, 38, 1)",
      // borderColor: "#E4E6E9",
      textColor: "rgba(129, 15, 40, 1)", // Red
    },
    {
      icon: <Plus size={24} color="rgba(156, 163, 175, 1)" />,
      count: loadingSummary
        ? "..."
        : errorSummary
        ? "!" :summaryData?.newTasks ?? 0,
      title: "New Tasks",
      subtitle: "Awaiting Assignment",
      bgcolor: "rgba(219, 223, 226, 0.2)",
      // bgcolor: "#ffff",
      iconBgColor: "rgba(156, 163, 175, 0.2)",
      borderColor: "rgba(156, 163, 175, 1)",
      // borderColor: "#E4E6E9",
      textColor: "rgba(17, 24, 39, 1)", // Gray
    },
    {
      icon: <Zap size={24} color="rgba(59, 130, 246, 1)" />,
      count: loadingSummary
        ? "..."
        : errorSummary
        ? "!" :summaryData?.activeTasks ?? 0,
      title: "Active Tasks",
      subtitle: "Currently In Progress",
      bgcolor: "rgba(216, 230, 253, 0.2)",
      // bgcolor: "#ffff",
      iconBgColor: "rgba(59, 130, 246, 0.2)",
      borderColor: "rgba(59, 130, 246, 1)",
      // borderColor: "#E4E6E9",
      textColor: "rgba(30, 58, 138, 1)", // Blue
    },
    {
      icon: <ClockIcon size={24} color="rgba(249, 115, 22, 1)" />,
      count: loadingSummary
        ? "..."
        : errorSummary
        ? "!" :summaryData?.underApprovalTasks ?? 0,
      title: "Under Approval Tasks",
      subtitle: "Awaiting Approvals",
      bgcolor: "rgba(253, 205, 170, 0.2)",
      // bgcolor: "#ffff",
      iconBgColor: "rgba(249, 115, 22, 0.2)",
      borderColor: "rgba(249, 115, 22, 1)",
      // borderColor: "#E4E6E9",
      textColor: "rgba(124, 45, 18, 1)", // Orange
    },
    {
      icon: <CheckCircleIcon size={24} color="rgba(34, 197, 94, 1)" />,
      count: loadingSummary
        ? "..."
        : errorSummary
        ? "!" :summaryData?.approvedTasks ?? 0,
      title: "Approved Tasks",
      subtitle: "Ready To Publish",
      bgcolor: "rgba(176, 233, 197, 0.2)",
      // bgcolor: "#ffff",
      iconBgColor: "rgba(34, 197, 94, 0.2)",
      borderColor: "rgba(34, 197, 94, 1)",
      // borderColor: "#E4E6E9",
      textColor: "rgba(20, 83, 45, 1)", // Green
    },
    {
      icon: <Star size={24} color="rgba(168, 85, 247, 1)" />,
      count: loadingSummary
        ? "..."
        : errorSummary
        ? "!" :summaryData?.publishedTasks ?? 0,
      title: "Published Tasks",
      subtitle: "Completed Tasks",
      bgcolor: "rgba(224, 194, 251, 0.2)",
      // bgcolor: "#ffff",
      iconBgColor: "rgba(168, 85, 247, 0.2)",
      borderColor: "rgba(168, 85, 247, 1)",
      // borderColor: "#E4E6E9",
      textColor: "rgba(88, 28, 135, 1)", // Purple
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
  const handleTileClick = (tile) => {
    setCurrentTitle(tile.title);

    if (tile.title === "Active Events") {
      setActiveComponent("activeEvents");
      executeActiveEvents(); // Execute active events API when tile is clicked
    } else if (tile.title === "Events Assigned to Me") {
      setActiveComponent("assignedToMe");
      executeAssignedEvents(); // Execute assigned events API when tile is clicked
    } else {
      setActiveComponent("recent");

      // Set filter based on tile title - default to "All" for most tiles
      if (tile.title === "Total Tasks" || tile.title === "Tasks Due Next 7 Days" || tile.title === "Overdue Tasks") {
        setFilter("All");
      } else {
        // Map tile titles to filter values that match the actual API status values
        const filterMap = {
          "New Tasks": "New",
          "Active Tasks": "Active", 
          "Under Review Tasks": "Under Review",  // Match API status value
          "Approved Tasks": "Approved",
          "Published Tasks": "Published"
        };
        setFilter(filterMap[tile.title] || tile.title);
      }

      // Execute tasks API for task-related tiles
      if (taskTiles.includes(tile.title)) {
        executeTasks();
      }
    }
  };

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
  const handleEventClick = (event, key) => {
    console.log("Event clicked:", event, key);
    // Navigate to event detail page with event id and data
    if (event && (event.id || event.eventId)) {
      navigate("/events/eventDetailPage", {
        state: {
          eventId: event.id || event.eventId, // Use proper event ID
          mode: "view",
          eventData: event,
        },
      });
    } else {
      console.warn("Event missing required ID:", event);
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
      console.warn("Event campaign item missing required ID:", item);
    }
  };

  // Show loading skeleton while user context is loading
  if (userLoading || !orgIdReady) {
    return <PageSkeleton type="event" />;
  }

  return (
    <div className="dashboard-middle-container">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h2>Welcome {user?.firstName}, Plan Your Day Ahead</h2>
        <div className="welcome-controls">
          {/* Scope section removed - now in navbar */}
          {/* Only show New Event button when viewing own organization */}
          {isViewingOwnOrganization() && (
            <button
              className="dashboard-btn dashboard-btn-primary"
              onClick={handleNewEvent}
            >
              + New Event
            </button>
          )}
        </div>
      </div>

      {/* Summary Tiles */}
      <div className="tiles-container">
        <button className="scroll-btn left" onClick={() => scrollTiles("left")}>
          <ChevronLeft size={24} />
        </button>

        <div className="summary-tiles" ref={tilesRef}>
          {summaryTiles.map((tile, idx) => (
            <Tile
              key={idx}
              {...tile}
              onClick={() => handleTileClick(tile)}
              isSelected={tile.title === currentTitle}
            />
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
                tasks={tasksData || []}
                title={currentTitle}
                filter={filter}
                onFilterChange={setFilter}
                onTaskClick={handleTaskClick}
                onEventClick={handleEventClick}
                loading={loadingTasks}
                error={errorTasks}
                showDropdown={[
                  "Total Tasks",
                  "Tasks Due Next 7 Days",
                  "Overdue Tasks",
                ].includes(currentTitle)}
                hideAssignedToColumn={currentTitle === "New Tasks"}
                showOrganizationColumn={currentTitle === "Events Assigned to Me" ? false : (currentTitle === "Tasks Assigned to Me")}
                emptyStateMessage={`No ${currentTitle.toLowerCase()} found`}
              />
            </div>
          )}

          {/* Active Events */}
          {activeComponent === "activeEvents" && (
            <div className="active-events">
              <ActiveEvents
                events={activeEventsData || []}
                title="Active Events"
                onEventClick={handleEventClick}
                loading={loadingActiveEvents}
                error={errorActiveEvents}
              />
            </div>
          )}

          {/* Events Assigned to Me */}
          {activeComponent === "assignedToMe" && (
            <div className="event-assign-to-me">
              <EventAssignToMe
                events={(eventAssignToMeData || []).slice(0, 5)}
                title="Events Assigned to Me"
                onEventClick={handleEventClick}
                loading={loadingAssignToMe}
                error={errorAssignToMe}
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

export default Dashboard;
