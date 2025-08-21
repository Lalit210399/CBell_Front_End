import React, { useEffect, useState } from "react";
import { fetchWithRefresh } from "../../Context/RefereshToken";
import { useNavigate } from "react-router-dom";
import StatusCard from "../../CommonComponents/Status_Card/Status_Card";
import EventList from "../../CommonComponents/EventsList/EventsList";
import { CirclePlus } from "lucide-react";
import { useUser } from "../../Context/UserContext";
import "./Dashboard.css";

const Dashboard = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  

  const [activeEvents, setActiveEvents] = useState(0);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [deadlines, setDeadlines] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const organizationId = user?.organizationId;
  const organizationName = user?.organization?.name || "Organization"; 

  const fetchDashboardData = async () => {
    setLoading(true);
    const currentDate = new Date();

    try {
      // --- Dashboard Summary ---
      let dashboardData = {};
      try {
        const res = await fetchWithRefresh(`/apis/dashboard?OrganizationId=${organizationId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "1" },
        });
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
        const res = await fetchWithRefresh(`/apis/event/get_upcoming_events?organizationId=${organizationId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "1" },
        });
        if (res.ok) {
          const data = await res.json();
          processedUpcomingEvents = data.data.map(event => ({
            id: event.id || Math.random().toString(36).substring(2, 9),
            name: event.eventName,
            college: organizationName,
            date: new Date(event.eventDate).toLocaleDateString(),
            rawDate: new Date(event.eventDate),
            type: event.typeName
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
        const res = await fetchWithRefresh(`/apis/event/get_past_events?organizationId=${organizationId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "1" },
        });
        if (res.ok) {
          const data = await res.json();
          processedPastEvents = data.data.map(event => ({
            id: event.id || Math.random().toString(36).substring(2, 9),
            name: event.eventName,
            college: organizationName,
            date: new Date(event.eventDate).toLocaleDateString(),
            rawDate: new Date(event.eventDate),
            type: event.typeName
          }));
        } else {
          console.warn("Past events API failed");
        }
      } catch (err) {
        console.error("Error fetching past events:", err);
      }

      // --- Tasks (from dashboard) ---
      const allTasks = dashboardData.tasks?.map((task) => ({
        id: task.id || Math.random().toString(36).substring(2, 9),
        name: task.taskTitle,
        event: task.eventName,
        college: task.organizationName || organizationName,
        status: task.taskStatus,
        date: new Date(task.dueDate).toLocaleDateString(),
        rawDate: new Date(task.dueDate),
        statusClass: getStatusClass(task.taskStatus)
      })) || [];

      // Filter out approved tasks for the pending list
      const pendingTasksList = allTasks.filter(t => (t.status || "").toLowerCase() !== "approved");
      const pendingTasksCount = pendingTasksList.length;

      // --- State Update ---
      setActiveEvents(dashboardData.activeEventsCount || processedUpcomingEvents.length);
      setPendingTasks(dashboardData.pendingTasksCount || pendingTasksCount);
      setDeadlines(dashboardData.upcomingDeadlinesCount || pendingTasksList.filter(task => task.rawDate >= currentDate).length);
      setUpcomingEvents(processedUpcomingEvents);
      setPastEvents(processedPastEvents);
      setTasks(pendingTasksList);
    } finally {
      setLoading(false);
    }
  };

  if (organizationId) {
    fetchDashboardData();
  }
}, [user?.organizationId, user?.organization?.name]);

  const getStatusClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'approved':
        return 'status-approved';
      case 'pending':
        return 'status-pending';
      case 'rejected':
        return 'status-rejected';
      case 'approval':
        return 'status-approval';
      default:
        return 'status-default';
    }
  };

  const handleAddEventClick = () => {
    navigate("/dashboard/stepForm");
  };

  const handleSeeAllClick = (type) => {
    navigate(`/dashboard/${type.toLowerCase().replace(' ', '-')}`);
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
          icon={
            <div className="add_event" onClick={handleAddEventClick}>
              <CirclePlus size={20} className="add-icon" />
              <span className="add_event_text">New Event</span>
            </div>
          }
        />
        <EventList
          title="Past Events"
          data={pastEvents}
          loading={loading}
          onSeeAll={() => handleSeeAllClick("Past Events")}
        />
      </div>

      <div className="task-section">
        <EventList
        title="Pending Tasks"
        data={tasks}
        type="tasks"
        loading={loading}
        onSeeAll={() => handleSeeAllClick("Pending Tasks")}
      />
      <EventList
        title="Pending Tasks"
        data={tasks}
        type="tasks"
        loading={loading}
        onSeeAll={() => handleSeeAllClick("Pending Tasks")}
      />
      </div>

      
    </div>
  );
};

export default Dashboard;