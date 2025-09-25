import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { fetchWithRefresh } from "../../Context/RefereshToken";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../Context/UserContext";
import useApi from "../../Hooks/useApi";
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

  // Active Events Count API
  const fetchActiveEventsCount = useCallback(async () => {
    if (!orgIdReady) return null;
    
    const organizationId = selectedOrganizationId || user?.organizationId || "685eb18207416b9271b800b3";
    
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
  }, [orgIdReady, selectedOrganizationId, user?.organizationId]);

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

  // Tasks API
  const fetchTasksData = useCallback(async (filterType = "all") => {
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
  }, [orgIdReady, selectedOrganizationId, user?.organizationId]);

  // Active Events API
  const fetchActiveEventsData = useCallback(async () => {
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
      throw new Error("Active Events API failed");
    }
    
        const data = await response.json();

        // Transform API data to match the expected format for ActiveEvents component
    return data.events.map((event) => ({
      status: "Active",
          eventName: event.eventName,
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
  }, [orgIdReady, selectedOrganizationId, user?.organizationId]);

  // Assigned Events API
  const fetchAssignedEvents = useCallback(async () => {
    if (!orgIdReady) return [];
    
    const organizationId = selectedOrganizationId || user?.organizationId;
    const userId = user?.userId;
    
    const includeChildren = isViewingOwnOrganization() ? "&includeChildren=true" : "&includeChildren=false";
    
    const response = await fetchWithRefresh(
      `apis/dashboard/assigned-events?orgid=${organizationId}&userid=${userId}${includeChildren}`,
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
  }, [orgIdReady, selectedOrganizationId, user?.organizationId, user?.userId, isViewingOwnOrganization]);

  /** -------------------- Use API Hooks -------------------- **/
  // Dashboard Summary
  const {
    data: summaryData,
    loading: loadingSummary,
    error: errorSummary,
    execute: executeSummary
  } = useApi(fetchSummaryData, [orgIdReady], false);

  // Active Events Count
  const {
    execute: executeCount
  } = useApi(fetchActiveEventsCount, [orgIdReady], false);

  // Events Campaign
  const {
    data: allEvents,
    loading: loadingEventsCampaign,
    error: errorEventsCampaign,
    execute: executeEventsCampaign
  } = useApi(fetchEventsCampaign, [orgIdReady, selectedMonth, selectedYear], false);

  // Tasks - Create a memoized function for tasks
  const fetchTasksForCurrentTitle = useCallback(() => {
    return fetchTasksData(currentTitle);
  }, [fetchTasksData, currentTitle]);

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
  } = useApi(fetchActiveEventsData, [orgIdReady], false);

  // Assigned Events
  const {
    data: eventAssignToMeData,
    loading: loadingAssignToMe,
    error: errorAssignToMe,
    execute: executeAssignedEvents
  } = useApi(fetchAssignedEvents, [orgIdReady], false);

  // Execute APIs when orgIdReady changes or scope changes
  useEffect(() => {
    if (orgIdReady) {
      executeSummary();
      executeCount();
      executeEventsCampaign();
      executeActiveEvents();
      executeAssignedEvents();
    }
  }, [orgIdReady, scopeChangeTrigger, executeSummary, executeCount, executeEventsCampaign, executeActiveEvents, executeAssignedEvents]);

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
      count: summaryData?.assignedEvents,
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
      count: summaryData?.totalTasks ?? 0,
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
      count: summaryData?.dueSoonTasks ?? 0,
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
      count: summaryData?.overdueTasks ?? 0,
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
      count: summaryData?.newTasks ?? 0,
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
      count: summaryData?.activeTasks ?? 0,
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
      count: summaryData?.underApprovalTasks ?? 0,
      title: "Under Review Tasks",
      subtitle: "Awaiting Review",
      bgcolor: "rgba(253, 205, 170, 0.2)",
      // bgcolor: "#ffff",
      iconBgColor: "rgba(249, 115, 22, 0.2)",
      borderColor: "rgba(249, 115, 22, 1)",
      // borderColor: "#E4E6E9",
      textColor: "rgba(124, 45, 18, 1)", // Orange
    },
    {
      icon: <CheckCircleIcon size={24} color="rgba(34, 197, 94, 1)" />,
      count: summaryData?.approvedTasks ?? 0,
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
      count: summaryData?.publishedTasks ?? 0,
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
    const scrollAmount = tilesRef.current.offsetWidth; // scroll one viewport width
    tilesRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
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
                tasks={(tasksData || []).slice(0, 5)}
                title={currentTitle}
                filter={filter}
                onFilterChange={setFilter}
                onTaskClick={handleTaskClick}
                loading={loadingTasks}
                error={errorTasks}
                showDropdown={[
                  "Total Tasks",
            
                ].includes(currentTitle)}
              />
            </div>
          )}

          {/* Active Events */}
          {activeComponent === "activeEvents" && (
            <div className="active-events">
              <ActiveEvents
                events={(activeEventsData || []).slice(0, 5)}
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
