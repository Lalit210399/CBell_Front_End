import React, { useState, useEffect, useMemo, useRef } from "react";
import { fetchWithRefresh } from "../../Context/RefereshToken";
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
} from "lucide-react";
import "./Dashboard.css";

const Dashboard = () => {
  const { user } = useUser();

  // State for active component
  const [activeComponent, setActiveComponent] = useState("recent");

  // State for current title
  const [currentTitle, setCurrentTitle] = useState("Total Tasks");

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
    const organizationId = user?.organizationId || "681460dcb8327b2e3417d8b1";

    const fetchSummaryData = async () => {
      setLoadingSummary(true);
      setErrorSummary(null);
      try {
        const response = await fetchWithRefresh(
          `apis/dashboard/summary?orgid=${organizationId}`,
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
  }, [user?.organizationId]);


  /** -------------------- Active Events Count -------------------- **/
  const [activeEventsCount, setActiveEventsCount] = useState(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [errorCount, setErrorCount] = useState(null);

  useEffect(() => {
    const organizationId = user?.organizationId || "685eb18207416b9271b800b3";

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
  }, [user?.organizationId]);

  /** -------------------- Events Campaign API -------------------- **/
  const [allEvents, setAllEvents] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear] = useState(new Date().getFullYear());

  // Dropdown options for months
  const monthOptions = [
    { label: "January", value: 1 },
    { label: "February", value: 2 },
    { label: "March", value: 3 },
    { label: "April", value: 4 },
    { label: "May", value: 5 },
    { label: "June", value: 6 },
    { label: "July", value: 7 },
    { label: "August", value: 8 },
    { label: "September", value: 9 },
    { label: "October", value: 10 },
    { label: "November", value: 11 },
    { label: "December", value: 12 },
  ];

  /** -------------------- Events Campaign API -------------------- **/

  useEffect(() => {
    const organizationId = user?.organizationId;

    const fetchEventsCampaign = async () => {
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
      }
    };

    if (organizationId) {
      fetchEventsCampaign();
    }
  }, [user?.organizationId, selectedMonth, selectedYear]);

  /** -------------------- Tasks API -------------------- **/
  const fetchTasksData = async (filterType) => {
    const organizationId = user?.organizationId || "681460dcb8327b2e3417d8b1";

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
        "Under Approval": "under_review",
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
    const organizationId = user?.organizationId || "681460dcb8327b2e3417d8b1";
    
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

  // Filter events by selected month
  const filteredEvents = useMemo(() => {
    if (!allEvents.length) return [];

    return allEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getMonth() + 1 === selectedMonth &&
        eventDate.getFullYear() === selectedYear;
    });
  }, [allEvents, selectedMonth, selectedYear]);

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
      count: "-", // ❌ no mapping in API (maybe another endpoint later)
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
      title: "Under Approval",
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
  const eventAssignToMeData = [
    {
      status: "Active",
      eventName: "Sports Tournament",
      collegeName: "ABC College",
      assignTo: ["ML"],
      eventDate: "15/10/2024",
      createdBy: { name: "John Doe", src: "" },
    },
    {
      status: "Active",
      eventName: "Design Expo",
      collegeName: "XYZ University",
      assignTo: ["MP"],
      eventDate: "20/10/2024",
      createdBy: { name: "Jane Smith", src: "" },
    },
    {
      status: "Upcoming",
      eventName: "Tech Conference",
      collegeName: "Tech Institute",
      assignTo: ["XY"],
      eventDate: "25/10/2024",
      createdBy: { name: "Alice Johnson", src: "" },
    },
  ];

  const scopeOptions = [{ label: "Institute" }];

  const handleNewTask = () => alert("New Task clicked");
  const handleNewEvent = () => alert("New Event clicked");

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
      const taskTiles = [
        "Total Tasks",
        "Tasks Due Next 7 Days",
        "Overdue Task",
        "New",
        "Active",
        "Under Approval",
        "Approved",
        "Published"
      ];

      if (taskTiles.includes(tile.title)) {
        fetchTasksData(tile.title);
      }
    }
  };

  return (
    <div className="dashboard-middle-container">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h2>Welcome {user?.firstName}, Plan Your Day Ahead</h2>
        <div className="welcome-controls">
          <div className="scope-dropdown">
            <CustomDropdown
              options={scopeOptions}
              defaultLabel="Institute"
              onSelect={() => { }}
            />
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
                loading={loadingTasks}
                error={errorTasks}
              />
            </div>
          )}

          {/* Active Events */}
          {activeComponent === "activeEvents" && (
            <div className="active-events">
              <ActiveEvents 
                events={activeEventsData} 
                title="Active Events" 
                loading={loadingActiveEvents}
                error={errorActiveEvents}
              />
            </div>
          )}

          {/* Events Assigned to Me */}
          {activeComponent === "assignedToMe" && (
            <div className="event-assign-to-me">
              <EventAssignToMe events={eventAssignToMeData.slice(0, 5)} title="Events Assigned to Me" />
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
                options={monthOptions.map((m) => ({
                  label: `${m.label} ${selectedYear}`,
                  value: m.value,
                }))}
                defaultLabel={
                  monthOptions.find((m) => m.value === selectedMonth)?.label +
                  " " +
                  selectedYear
                }
                onSelect={(opt) => setSelectedMonth(opt.value)}
              />
            </div>
          </div>

          {/* EventCampaign without header */}
          <EventCampaign
            title="Events Campaign"
            month={`${monthOptions.find((m) => m.value === selectedMonth)?.label} ${selectedYear}`}
            events={filteredEvents}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;