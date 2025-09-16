import React, { useState, useEffect, useMemo, useRef } from "react";
import { fetchWithRefresh } from "../../Context/RefereshToken";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../Context/UserContext";
import Tile from "../../CommonComponents/Tiles/Tiles";
import EventCampaign from "../../CommonComponents/TimelineCard/TimelineCard";
import RecentTasks from "../../CommonComponents/RecentTaskBox/RecentTask";
import ActiveEvents from "../../CommonComponents/ActiveEvents/ActiveEvents";
import EventAssignToMe from "../../CommonComponents/EventAssignToMe/EventAssignToMe";
import CustomDropdown from "../../CommonComponents/Dropdown/CustomDropdown";
import {
  CheckCircle,
  UserCheck,
  ClipboardList,
  Clock,
  AlertCircle,
  Plus,
  Zap,
  Clock as ClockIcon,
  CheckCircle as CheckCircleIcon,
  Star,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Building2
} from "lucide-react";
import "./Dashboard.css";

const Dashboard = () => {
  const { user, scope } = useUser();
  const navigate = useNavigate();

  // State for selected organization
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(null);
  const [orgIdReady, setOrgIdReady] = useState(false);

  // Initialize selected organization from localStorage or default to user's org
  useEffect(() => {
    const savedOrgId = localStorage.getItem('dashboard-selected-organization');
    if (savedOrgId && scope?.accessibleOrganizations?.some(org => org.id === savedOrgId)) {
      setSelectedOrganizationId(savedOrgId);
    } else {
      setSelectedOrganizationId(user?.organizationId);
    }
    setOrgIdReady(true);
  }, [user?.organizationId, scope?.accessibleOrganizations]);

  // Handle new event button click
  const handleNewEvent = () => {
    navigate("/events/eventDetailPage", { state: { mode: "create" } });
  };

  const handleNewTask = () => {
    navigate("/events/eventDetailPage/tasks", { state: { mode: "create" } });
  }

  // State for active component
  const [activeComponent, setActiveComponent] = useState("activeEvents");

  // State for current title
  const [currentTitle, setCurrentTitle] = useState("Active Events");

  // State for filter
  const [filter, setFilter] = useState("All");

  // State for tasks data from API
  const [tasksData, setTasksData] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [errorTasks, setErrorTasks] = useState(null);

  // State for active events data from API
  const [activeEventsData, setActiveEventsData] = useState([]);
  const [loadingActiveEvents, setLoadingActiveEvents] = useState(false);
  const [errorActiveEvents, setErrorActiveEvents] = useState(null);

  /** -------------------- Dashboard Summary API -------------------- **/
  const [summaryData, setSummaryData] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [errorSummary, setErrorSummary] = useState(null);

  useEffect(() => {
    if (!orgIdReady) return;

    const organizationId = selectedOrganizationId || user?.organizationId;

    const fetchSummaryData = async () => {
      setLoadingSummary(true);
      setErrorSummary(null);
      try {
        const response = await fetchWithRefresh(
          `apis/dashboard/summary?orgid=${organizationId}&userid=${user?.userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "1",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSummaryData(data);
        } else {
          console.warn("Dashboard summary API failed");
        }
      } catch (error) {
        setErrorSummary(error.message);
        console.error("Error fetching dashboard summary:", error);
      } finally {
        setLoadingSummary(false);
      }
    };

    if (organizationId) {
      fetchSummaryData();
    }
  }, [selectedOrganizationId, user?.organizationId, orgIdReady]);


  /** -------------------- Active Events Count -------------------- **/
  const [activeEventsCount, setActiveEventsCount] = useState(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [errorCount, setErrorCount] = useState(null);

  useEffect(() => {
    if (!orgIdReady) return;

    const organizationId = selectedOrganizationId || user?.organizationId || "685eb18207416b9271b800b3";

    const fetchActiveEventsCount = async () => {
      setLoadingCount(true);
      setErrorCount(null);
      try {
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
        if (response.ok) {
          const data = await response.json();
          setActiveEventsCount(data.count);
        } else {
          console.warn("Active events count API failed");
        }
      } catch (error) {
        setErrorCount(error.message);
        console.error("Error fetching active events count:", error);
      } finally {
        setLoadingCount(false);
      }
    };

    if (organizationId) {
      fetchActiveEventsCount();
    }
  }, [selectedOrganizationId, user?.organizationId, orgIdReady]);

  /** -------------------- Events Campaign API -------------------- **/
  const [allEvents, setAllEvents] = useState([]);
  const [loadingEventsCampaign, setLoadingEventsCampaign] = useState(false);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0); // index from current month

  // Dropdown options for months - next 12 months from current
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentDate = new Date();
  const monthOptions = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    const monthName = monthNames[date.getMonth()];
    const year = date.getFullYear();
    monthOptions.push({ label: `${monthName} ${year}`, value: i });
  }

  // Calculate selected month and year from index
  const selectedMonth = ((currentDate.getMonth() + selectedMonthIndex) % 12) + 1;
  const selectedYear = currentDate.getFullYear() + Math.floor((currentDate.getMonth() + selectedMonthIndex) / 12);


  /** -------------------- Events Campaign API -------------------- **/

  useEffect(() => {
    if (!orgIdReady) return;

    const organizationId = selectedOrganizationId || user?.organizationId;

    const fetchEventsCampaign = async () => {
      setLoadingEventsCampaign(true);
      try {
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

        if (response.ok) {
          const data = await response.json();

          // Transform API data into EventCampaign structure - only show eventName
          const groupedEvents = data.events.map((ev) => ({
            date: new Date(ev.eventDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            // Only include the event name in the items array
            items: [ev.eventName],
          }));

          setAllEvents(groupedEvents);
        } else {
          console.warn("Events campaign API failed");
          setAllEvents([]);
        }
      } catch (error) {
        console.error("Error fetching events campaign:", error);
        setAllEvents([]);
      } finally {
        setLoadingEventsCampaign(false);
      }
    };

    if (organizationId) {
      fetchEventsCampaign();
    }
  }, [selectedOrganizationId, user?.organizationId, selectedMonth, selectedYear, orgIdReady]);

  /** -------------------- Tasks API -------------------- **/
  const fetchTasksData = async (filterType) => {
    const organizationId = selectedOrganizationId || user?.organizationId || "681460dcb8327b2e3417d8b1";

    setLoadingTasks(true);
    setErrorTasks(null);

    try {
      let apiFilter = "all";

      // Map tile titles to API filter values
      const filterMap = {
        "Total Tasks": "all",
        "Tasks Due Next 7 Days": "due_soon",
        "Overdue Task": "overdue",
        "New": "new",
        "Active": "active",
        "Under Review": "under_review",
        "Approved": "approved",
        "Published": "published"
      };

      apiFilter = filterMap[filterType] || "all";

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

      if (response.ok) {
        const data = await response.json();

        // Transform API data to match the expected format for RecentTasks component
        const transformedTasks = data.tasks.map(task => ({
          status: task.taskStatusName,
          taskName: task.taskTitle,
          eventName: task.eventName,
          assignedTo: [], // This might need to be populated from the API if available
          dueDate: new Date(task.dueDate).toLocaleDateString("en-GB"),
          description: task.description,
          creativeType: task.creativeType,
          daysUntilDue: task.daysUntilDue
        }));

        setTasksData(transformedTasks.slice(0, 5));
      } else {
        console.warn("Tasks API failed");
        setTasksData([]);
      }
    } catch (error) {
      setErrorTasks(error.message);
      console.error("Error fetching tasks:", error);
      setTasksData([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  /** -------------------- Active Events API -------------------- **/
  const fetchActiveEventsData = async () => {
    const organizationId = selectedOrganizationId || user?.organizationId;

    setLoadingActiveEvents(true);
    setErrorActiveEvents(null);

    try {
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

      if (response.ok) {
        const data = await response.json();

        // Transform API data to match the expected format for ActiveEvents component
        const transformedEvents = data.events.map(event => ({
          status: "Active", // Assuming all events from this API are active
          eventName: event.eventName,
          assignTo: [], // This might need to be populated from the API if available
          eventDate: new Date(event.eventDate).toLocaleDateString("en-GB"),
          createdBy: { name: "Admin", src: "" }, // Default value, update if API provides this info
          description: event.eventDescription,
          location: event.locationDetails,
          eventType: event.eventTypeDesc
        }));

        setActiveEventsData(transformedEvents.slice(0, 5));
      } else {
        console.warn("Active Events API failed");
        setActiveEventsData([]);
      }
    } catch (error) {
      setErrorActiveEvents(error.message);
      console.error("Error fetching active events:", error);
      setActiveEventsData([]);
    } finally {
      setLoadingActiveEvents(false);
    }
  };

  useEffect(() => {
    if (!orgIdReady) return;

    fetchActiveEventsData();
  }, [selectedOrganizationId, user?.organizationId, orgIdReady]);

  // Refetch data for current component on scope change
  useEffect(() => {
    if (!orgIdReady) return;

    if (activeComponent === "activeEvents") {
      setActiveEventsData([]);
      fetchActiveEventsData();
    } else if (activeComponent === "recent") {
      setTasksData([]);
      fetchTasksData(currentTitle);
    }
  }, [selectedOrganizationId, user?.organizationId, orgIdReady]);

  // Filter events by selected month
  const filteredEvents = useMemo(() => {
    if (!allEvents.length) return [];

    return allEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getMonth() + 1 === selectedMonth &&
        eventDate.getFullYear() === selectedYear;
    });
  }, [allEvents, selectedMonth, selectedYear]);

  // Define task tiles for reuse
  const taskTiles = [
    "Total Tasks",
    "Tasks Due Next 7 Days",
    "Overdue Task",
    "New",
    "Active",
    "Under Review",
    "Approved",
    "Published"
  ];

  /** -------------------- Tiles Data -------------------- **/
  const summaryTiles = [
    {
      icon: <CheckCircle size={24} color="rgba(52, 168, 83, 1)" />,
      count: loadingSummary ? "..." : errorSummary ? "!" : summaryData?.activeEvents ?? 0,
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
      title: "Overdue Task",
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
      title: "New",
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
      title: "Active",
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
      title: "Under Review",
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
      title: "Approved",
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
      title: "Published",
      subtitle: "Completed Tasks",
      bgcolor: "rgba(224, 194, 251, 0.2)",
      // bgcolor: "#ffff",
      iconBgColor: "rgba(168, 85, 247, 0.2)",
      borderColor: "rgba(168, 85, 247, 1)",
      // borderColor: "#E4E6E9",
      textColor: "rgba(88, 28, 135, 1)", // Purple
    }
  ];

  /** -------------------- Events Assigned to Me Data -------------------- **/
  const [eventAssignToMeData, setEventAssignToMeData] = React.useState([]);
  const [loadingAssignToMe, setLoadingAssignToMe] = React.useState(false);
  const [errorAssignToMe, setErrorAssignToMe] = React.useState(null);

  React.useEffect(() => {
    if (!orgIdReady) return;

    const organizationId = selectedOrganizationId || user?.organizationId;
    const userId = user?.userId;

    const fetchAssignedEvents = async () => {
      setLoadingAssignToMe(true);
      setErrorAssignToMe(null);
      try {
        const response = await fetchWithRefresh(
          `apis/dashboard/assigned-events?orgid=${organizationId}&userid=${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "1",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();

          // Transform API data to match EventAssignToMe component format
          const transformedData = data.events.map(event => ({
            status: event.status || "Active",
            eventName: event.eventName,
            collegeName: event.collegeName || event.college || "",
            assignTo: event.assignTo || event.assignedTo || [],
            eventDate: new Date(event.eventDate).toLocaleDateString("en-GB"),
            createdBy: {
              name: event.createdBy?.name || "Unknown",
              src: event.createdBy?.src || ""
            }
          }));

          setEventAssignToMeData(transformedData.slice(0, 5));
        } else {
          console.warn("Assigned events API failed");
          setEventAssignToMeData([]);
        }
      } catch (error) {
        setErrorAssignToMe(error.message);
        console.error("Error fetching assigned events:", error);
        setEventAssignToMeData([]);
      } finally {
        setLoadingAssignToMe(false);
      }
    };

    if (organizationId && userId) {
      fetchAssignedEvents();
    }
  }, [selectedOrganizationId, user?.organizationId, user?.userId, orgIdReady]);

  const scopeOptions = scope?.accessibleOrganizations?.map(org => ({
    label: org.data.organizationCode,
    value: org.id
  }));

  // Update selected organization and persist selection on scope change
  const handleScopeSelect = (option) => {
    setSelectedOrganizationId(option.value);
    if (option.value) {
      localStorage.setItem('dashboard-selected-organization', option.value);
    } else {
      localStorage.removeItem('dashboard-selected-organization');
    }
  };

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
      fetchActiveEventsData(); // Fetch active events data when tile is clicked
    } else if (tile.title === "Events Assigned to Me") {
      setActiveComponent("assignedToMe");
    } else {
      setActiveComponent("recent");

      // Set filter based on tile title
      if (tile.title === "Total Tasks") {
        setFilter("All");
      } else {
        setFilter(tile.title);
      }

      // Fetch tasks data for task-related tiles
      if (taskTiles.includes(tile.title)) {
        fetchTasksData(tile.title);
      }
    }
  };

  // Handle task click
  const handleTaskClick = (task, key) => {
    console.log("Task clicked:", { task, clickedField: key });
  };

  // Handle event click
  const handleEventClick = (event, key) => {
    console.log("Event clicked:", { event, clickedField: key });
  };

  // Handle event campaign item click
  const handleEventCampaignClick = (item) => {
    console.log("Event campaign item clicked:", item);
  };

  return (
    <div className="dashboard-middle-container">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h2>Welcome {user?.firstName}, Plan Your Day Ahead</h2>
        <div className="welcome-controls">
          <div className="scope-section">
            <span className="scope-label"><Building2 />Scope:</span>
            <div className="scope-dropdown">
              <CustomDropdown
                options={scopeOptions}
                defaultLabel={scope?.accessibleOrganizations?.find(org => org.id === selectedOrganizationId)?.data.organizationCode}
                onSelect={handleScopeSelect}
              />
            </div>
          </div>
          <button className="dashboard-btn dashboard-btn-secondary" onClick={handleNewTask}>
            + New Task
          </button>
          <button className="dashboard-btn dashboard-btn-primary" onClick={handleNewEvent}>
            + New Event
          </button>
        </div>
      </div>

      {/* Summary Tiles */}
      <div className="tiles-container">
        <button className="scroll-btn left" onClick={() => scrollTiles("left")}>
          <ChevronLeft size={24} />
        </button>

        <div className="summary-tiles" ref={tilesRef}>
          {summaryTiles.map((tile, idx) => (
            <Tile key={idx} {...tile} onClick={() => handleTileClick(tile)} isSelected={tile.title === currentTitle} />
          ))}
        </div>

        <button className="scroll-btn right" onClick={() => scrollTiles("right")}>
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Bottom Section */}
      <div className="bottom_section">
        <div className="bottom_section">
          {/* Recent Tasks */}
          {activeComponent === "recent" && (
            <div className="recent-tasks">
            <RecentTasks
                tasks={tasksData}
                title={currentTitle}
                filter={filter}
                onFilterChange={setFilter}
                onTaskClick={handleTaskClick}
                loading={loadingTasks}
                error={errorTasks}
                showDropdown={["Total Tasks", "Tasks Due Next 7 Days", "Overdue Task"].includes(currentTitle)}
              />
            </div>
          )}

          {/* Active Events */}
          {activeComponent === "activeEvents" && (
            <div className="active-events">
              <ActiveEvents
                events={activeEventsData}
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
            events={eventAssignToMeData.slice(0, 5)}
            title="Events Assigned to Me"
            onEventClick={handleEventClick}
            loading={loadingAssignToMe}
          />
            </div>
          )}
        </div>

        {/* Events Campaign Section */}
        <div className="events-campaign">
          <div className="event-header">
            <div className="event-title">
              <Calendar size={20} />
              <p>Events Campaign</p>
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
            events={filteredEvents}
            onItemClick={handleEventCampaignClick}
            loading={loadingEventsCampaign}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;