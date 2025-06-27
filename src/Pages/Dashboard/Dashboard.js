import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusCard from "../../CommonComponents/Status_Card/Status_Card";
import EventList from "../../CommonComponents/EventsList/EventsList";
import { CirclePlus } from "lucide-react";
import { useUser } from "../../Context/UserContext";
import { useMessages } from "../../Context/MessageContext";
import "./Dashboard.css";

const Dashboard = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { addMessage } = useMessages();

  const [activeEvents, setActiveEvents] = useState(0);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [deadlines, setDeadlines] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/apis/dashboard", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "1",
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch dashboard data");
        }
        return res.json();
      })
      .then((data) => {
        const currentDate = new Date();
        
        // Process events
        const events = data.events.map((event) => ({
          id: event.id || Math.random().toString(36).substring(2, 9),
          name: event.eventName,
          college: event.organizationName,
          date: new Date(event.eventDate).toLocaleDateString(),
          rawDate: new Date(event.eventDate)
        }));

        const upcoming = events.filter(
          (event) => event.rawDate >= currentDate
        );
        const past = events.filter(
          (event) => event.rawDate < currentDate
        );

        // Process tasks with status
        const tasks = data.tasks.map((task) => ({
          id: task.id || Math.random().toString(36).substring(2, 9),
          name: task.taskTitle,
          event: task.eventName,
          college: task.organizationName,
          status: task.taskStatus,
          date: new Date(task.dueDate).toLocaleDateString(),
          rawDate: new Date(task.dueDate),
          statusClass: getStatusClass(task.taskStatus)
        }));

        // Count pending tasks (status not "Approved")
        const pendingTasksCount = tasks.filter(
          task => task.status !== "Approved"
        ).length;

        setActiveEvents(data.activeEventsCount || upcoming.length);
        setPendingTasks(data.pendingTasksCount || pendingTasksCount);
        setDeadlines(data.upcomingDeadlinesCount || 
          tasks.filter(task => task.rawDate >= currentDate).length);
        setUpcomingEvents(upcoming);
        setPastEvents(past);
        setTasks(tasks);
      })
      .catch((error) => {
        console.error("Error fetching dashboard data:", error);
        addMessage({
          text: "Failed to load dashboard data. Please try again.",
          type: "error",
          duration: 3000,
        });
      })
      .finally(() => setLoading(false));
  }, []);

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

      <EventList
        title="Pending Tasks"
        data={tasks}
        type="tasks"
        loading={loading}
        onSeeAll={() => handleSeeAllClick("Pending Tasks")}
      />
    </div>
  );
};

export default Dashboard;