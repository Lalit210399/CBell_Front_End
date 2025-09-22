import React, { useEffect, useState } from "react";
import { fetchWithRefresh } from "../../Context/RefereshToken";
import { useNavigate } from "react-router-dom";
import StatusCard from "../../CommonComponents/Status_Card/Status_Card";
import EventList from "../../CommonComponents/EventsList/EventsList";
import { CirclePlus } from "lucide-react";
import { useUser } from "../../Context/UserContext";
import "./Dashboard.css";

const Dashboard = () => {
  const { user, isViewingOwnOrganization } = useUser();
  const navigate = useNavigate();

  const [activeEvents, setActiveEvents] = useState(0);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [deadlines, setDeadlines] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  console.log("user", user?.roles[0]?.name);
  console.log("user", user?.userId);

  // Handle event click
  const handleEventClick = (eventData) => {
    navigate("/events/eventDetailPage", {
      state: {
        eventId: eventData.id,
        mode: "view",
        eventData: eventData,
      },
    });
  };

  // Handle task click
  const handleTaskClick = (taskData) => {
    navigate("/events/eventDetailPage/tasks", {
      state: {
        taskId: taskData.id,
        mode: "view",
        eventId: taskData.eventId || null, // eventId may not exist in new API
        organizationId: user?.organizationId,
        eventName: taskData.eventName || taskData.event || "Unknown Event",
        eventDate: taskData.eventDate || null,
      },
    });
  };

  useEffect(() => {
    const organizationId = user?.organizationId;
    const organizationName = user?.organization?.name || "Organization";

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // --- Dashboard Summary + Pending Tasks ---
        let dashboardData = {};
        try {
          const res = await fetchWithRefresh(
            `/apis/dashboard?OrganizationId=${organizationId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "1",
              },
            }
          );
          if (res.ok) {
            dashboardData = await res.json();
          } else {
            console.warn("Dashboard API failed");
          }
        } catch (err) {
          console.error("Error fetching dashboard:", err);
        }

        // --- Upcoming Events ---
        let processedUpcomingEvents = [];
        try {
          const res = await fetchWithRefresh(
            `/apis/event/get_upcoming_events?organizationId=${organizationId}&userId=${user?.userId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "1",
              },
            }
          );
          if (res.ok) {
            const data = await res.json();
            processedUpcomingEvents = data.data.map((event) => ({
              id: event.id || Math.random().toString(36).substring(2, 9),
              name: event.eventName,
              college: organizationName,
              date: new Date(event.eventDate).toLocaleDateString(),
              rawDate: new Date(event.eventDate),
              type: event.typeName,
              rawData: event,
            }));
          } else {
            console.warn("Upcoming events API failed");
          }
        } catch (err) {
          console.error("Error fetching upcoming events:", err);
        }

        // --- Past Events ---
        let processedPastEvents = [];
        try {
          const res = await fetchWithRefresh(
            `/apis/event/get_past_events?organizationId=${organizationId}&userId=${user?.userId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "1",
              },
            }
          );
          if (res.ok) {
            const data = await res.json();
            processedPastEvents = data.data.map((event) => ({
              id: event.id || Math.random().toString(36).substring(2, 9),
              name: event.eventName,
              college: organizationName,
              date: new Date(event.eventDate).toLocaleDateString(),
              rawDate: new Date(event.eventDate),
              type: event.typeName,
              rawData: event,
            }));
          } else {
            console.warn("Past events API failed");
          }
        } catch (err) {
          console.error("Error fetching past events:", err);
        }

        // --- Pending Tasks from dashboard API ---
        console.log("Dashboard API Response:", dashboardData);
        console.log("Tasks from API:", dashboardData.tasks);
        
        const allTasks =
          dashboardData.tasks?.map((task) => {
            const processedTask = {
              id: task.id || Math.random().toString(36).substring(2, 9),
              name: task.taskTitle,
              event: task.eventName,
              eventId: task.eventId || null, // may be missing
              college: task.organizationName || organizationName,
              status: task.taskStatusName || task.taskStatus, // Use taskStatusName from API
              date: new Date(task.dueDate).toLocaleDateString(),
              rawDate: new Date(task.dueDate),
              statusClass: getStatusClass(task.taskStatusName || task.taskStatus),
              rawData: task,
            };
            console.log("Processed task:", processedTask);
            return processedTask;
          }) || [];

        // --- State Update ---
        setActiveEvents(dashboardData.activeEventsCount || 0);
        setPendingTasks(dashboardData.pendingTasksCount || dashboardData.totalCount || allTasks.length);
        setDeadlines(dashboardData.upcomingDeadlinesCount || 0);
        setUpcomingEvents(processedUpcomingEvents);
        setPastEvents(processedPastEvents);
        setTasks(allTasks);
      } finally {
        setLoading(false);
      }
    };

    if (organizationId) {
      fetchDashboardData();
    }
  }, [user?.organizationId, user?.organization?.name]);

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "status-approved";
      case "published":
        return "status-published";
      case "pending":
        return "status-pending";
      case "rejected":
        return "status-rejected";
      case "approval":
        return "status-approval";
      case "under review":
        return "status-under-review";
      case "active":
        return "status-active";
      case "new":
        return "status-new";
      default:
        return "status-default";
    }
  };

  const handleAddEventClick = () => {
    navigate("/dashboard/stepForm");
  };

  const handleSeeAllClick = (type) => {
    navigate(`/dashboard/${type.toLowerCase().replace(" ", "-")}`);
  };

  return (
    <div className="dashboard-container">
      <h1>Welcome {user?.firstName || "User"}, Plan your day ahead</h1>

      <div className="status-cards">
        <StatusCard title="Active Events" count={activeEvents} loading={loading} />
        <StatusCard
          title="Pending Tasks"
          count={pendingTasks}
          loading={loading}
          status="warning"
        />
        <StatusCard
          title="Upcoming Deadlines"
          count={deadlines}
          loading={loading}
          status="alert"
        />
      </div>

      <div className="event-section">
        <EventList
          title="Upcoming Events"
          data={upcomingEvents}
          type="upcoming"
          loading={loading}
          onSeeAll={() => handleSeeAllClick("Upcoming Events")}
          onEventClick={handleEventClick}
          icon={
            // New Event: Only check organization scope (not canCRUD)
            isViewingOwnOrganization() && (
              <div className="add_event" onClick={handleAddEventClick}>
                <CirclePlus size={20} className="add-icon" />
                <span className="add_event_text">New Event</span>
              </div>
            )
          }
        />
        <EventList
          title="Past Events"
          data={pastEvents}
          loading={loading}
          onSeeAll={() => handleSeeAllClick("Past Events")}
          onEventClick={handleEventClick}
        />
      </div>

      <div className="task-section">
        <EventList
          title="Pending Tasks"
          data={tasks}
          type="tasks"
          loading={loading}
          onSeeAll={() => handleSeeAllClick("Pending Tasks")}
          onTaskClick={handleTaskClick}
        />
      </div>
    </div>
  );
};

export default Dashboard;
