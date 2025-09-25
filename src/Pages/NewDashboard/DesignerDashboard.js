import React, { useState, useEffect, useMemo, useCallback } from "react";
import { fetchWithRefresh } from "../../Context/RefereshToken";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../Context/UserContext";
import useApi from "../../Hooks/useApi";
import Tile from "../../CommonComponents/Tiles/Tiles";
import EventCampaign from "../../CommonComponents/TimelineCard/TimelineCard";
import RecentTasks from "../../CommonComponents/RecentTaskBox/RecentTask";
import EventAssignToMe from "../../CommonComponents/EventAssignToMe/EventAssignToMe";
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

  // Tasks API
  const fetchTasksData = useCallback(async (filterType = "all") => {
    if (!orgIdReady) return [];
    
    const organizationId = selectedOrganizationId || user?.organizationId || "681460dcb8327b2e3417d8b1";
    const includeChildren = isViewingOwnOrganization() ? "&includeChildren=true" : "&includeChildren=false";
      // Map tile titles to API filter values
      const filterMap = {
        "Total Tasks": "all",
        "Tasks Under Approval": "under_review",
        "Approved Tasks": "approved",
      };

    const apiFilter = filterMap[filterType] || "all";

      const response = await fetchWithRefresh(
        `apis/dashboard/tasks?orgid=${organizationId}&filter=${apiFilter}${includeChildren}`,
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
    return data.tasks.map((task) => ({
      id: task.id,
      status: task.statusName,
      taskName: task.taskName,
      eventName: task.eventName,
      eventId: task.eventId,
      assignedTo: task.assignedTo?.map((name, index) => ({
        name: name,
        src: "",
        id: `user-${index}`
      })) || [],
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
    }));
  }, [orgIdReady, selectedOrganizationId, user?.organizationId, user?.userId, isViewingOwnOrganization]);


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
    execute: executeSummary
  } = useApi(fetchSummaryData, [orgIdReady], false);


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
  } = useApi(fetchTasksForCurrentTitle, [orgIdReady], false);

  // My Tasks - for "Tasks Assigned to Me" tile
  const {
    data: myTasksData,
    loading: loadingMyTasks,
    error: errorMyTasks,
    execute: executeMyTasks
  } = useApi(fetchMyTasksData, [orgIdReady], false);


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
      executeAssignedEvents();
      // Execute tasks API for Total Tasks by default
      executeTasks();
    }
  }, [orgIdReady, scopeChangeTrigger, executeSummary, executeAssignedEvents, executeTasks]);

  // Separate useEffect for Events Campaign to prevent unnecessary re-execution
  useEffect(() => {
    if (orgIdReady) {
      executeEventsCampaign();
    }
  }, [selectedMonth, selectedYear, orgIdReady, executeEventsCampaign]);

  // Define task tiles for reuse
  const taskTiles = useMemo(() => [
    "Total Tasks",
    "Tasks Assigned to Me",
    "Tasks Under Approval",
    "Approved Tasks",
  ], []);


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
      count: summaryData?.totalTasks ?? 0,
      title: "Total Tasks",
      subtitle: "Current Organization Tasks",
      bgcolor: "rgba(181, 224, 194, 0.2)",
      iconBgColor: "rgba(52, 168, 83, 0.2)",
      borderColor: "rgba(92, 185, 117, 1)",
      textColor: "rgba(20, 83, 45, 1)",
    },
    {
      icon: <UserCheck size={24} color="rgba(60, 131, 246, 1)" />,
      count: summaryData?.taskAssignedToMeCount ?? 0,
      title: "Tasks Assigned to Me",
      subtitle: "Tasks I'm Managing",
      bgcolor: "rgba(185, 210, 251, 0.2)",
      iconBgColor: "rgba(60, 131, 246, 0.2)",
      borderColor: "rgba(60, 131, 246, 1)",
      textColor: "rgba(30, 58, 138, 1)", // Blue
    },
    {
      icon: <ClockIcon size={24} color="rgba(249, 115, 22, 1)" />,
      count: summaryData?.underApprovalTasks ?? 0,
      title: "Tasks Under Approval",
      subtitle: "Awaiting Approval",
      bgcolor: "rgba(253, 205, 170, 0.2)",
      iconBgColor: "rgba(249, 115, 22, 0.2)",
      borderColor: "rgba(249, 115, 22, 1)",
      textColor: "rgba(124, 45, 18, 1)", // Orange
    },
    {
      icon: <CheckCircleIcon size={24} color="rgba(34, 197, 94, 1)" />,
      count: summaryData?.approvedTasks ?? 0,
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
    console.log("Tile clicked:", tile.title);
    setCurrentTitle(tile.title);

    if (tile.title === "Events Assigned to Me") {
      setActiveComponent("assignedToMe");
      executeAssignedEvents(); // Execute assigned events API when tile is clicked
    } else if (tile.title === "Tasks Assigned to Me") {
      setActiveComponent("recent");
      setFilter("All");
      executeMyTasks(); // Execute my tasks API when tile is clicked
    } else {
      setActiveComponent("recent");

      // Set filter based on tile title - default to "All" for Total Tasks
      if (tile.title === "Total Tasks") {
        setFilter("All");
      } else {
        // Map tile titles to filter values that match the actual API status values
        const filterMap = {
          "Tasks Under Approval": "Under Review",  // Match API status value
          "Approved Tasks": "Approved",
        };
        setFilter(filterMap[tile.title] || tile.title);
      }

      // Only execute tasks API if the current title is different from the clicked tile
      // This prevents unnecessary API calls when clicking the same tile
      if (taskTiles.includes(tile.title) && currentTitle !== tile.title) {
        console.log("Executing tasks API for:", tile.title);
        executeTasks();
      }
    }
  }, [executeAssignedEvents, executeMyTasks, executeTasks, taskTiles, currentTitle]);

  // Handle task click
  const handleTaskClick = (task, key) => {
    console.log("Task clicked:", { task, clickedField: key, taskId: task.id });
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
    console.log("Event clicked:", event);
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
    console.log("Event campaign item clicked:", item);
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
                tasks={currentTitle === "Tasks Assigned to Me" ? (myTasksData || []) : (tasksData || [])}
                title={currentTitle}
                filter={filter}
                onFilterChange={setFilter}
                onTaskClick={handleTaskClick}
                loading={currentTitle === "Tasks Assigned to Me" ? loadingMyTasks : loadingTasks}
                error={currentTitle === "Tasks Assigned to Me" ? errorMyTasks : errorTasks}
                showDropdown={[
                  "Total Tasks",
                ].includes(currentTitle)}
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

export default DesignerDashboard;
