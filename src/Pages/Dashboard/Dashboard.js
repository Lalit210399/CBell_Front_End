import React, { useEffect, useState } from "react";
import { fetchWithRefresh } from "../../Context/RefereshToken";
import { useNavigate } from "react-router-dom";
import EventList from "../../CommonComponents/EventsList/EventsList";
import { CirclePlus } from "lucide-react";
import { useUser } from "../../Context/UserContext";
<<<<<<< HEAD
import { useMessages } from "../../Context/MessageContext";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import styled, { keyframes } from "styled-components";
=======
>>>>>>> e26ae9932f102f0b1766b1bf1cd6208f60d549d5
import "./Dashboard.css";

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-20px);}
  to { opacity: 1; transform: translateY(0);}
`;

const cardHover = keyframes`
  from { box-shadow: 0 2px 8px rgba(0,0,0,0.08);}
  to { box-shadow: 0 8px 24px rgba(0,0,0,0.18);}
`;

// Styled Components
const DashboardContainer = styled.div`
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  background: #f7fafd;
  min-height: 100vh;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const StatusCards = styled.div`
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
`;

const StatusCardStyled = styled.div`
  flex: 1 1 220px;
  min-width: 220px;
  background: linear-gradient(135deg, #4f8cff 60%, #6ee2f5 100%);
  color: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  transition: box-shadow 0.3s;
  cursor: pointer;
  animation: ${fadeIn} 0.7s;
  &:hover {
    animation: ${cardHover} 0.3s forwards;
    transform: translateY(-4px) scale(1.03);
  }
`;


const ToastContainer = styled.div`
  position: fixed;
  top: 32px;
  right: 32px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Toast = styled.div`
  background: ${({ type }) => type === "success" ? "#4f8cff" : "#ff6b81"};
  color: #fff;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  box-shadow: 0 2px 12px rgba(0,0,0,0.12);
  animation: ${fadeIn} 0.5s;
  opacity: 0.95;
  transition: opacity 0.4s;
`;

// Calendar Demo

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
  // eslint-disable-next-line no-empty-pattern
  const [] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [toasts, setToasts] = useState([]);

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
<<<<<<< HEAD
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        return res.json();
      })
      .then((data) => {
        const currentDate = new Date();
        const events = data.events.map((event) => ({
          id: event.id || Math.random().toString(36).substring(2, 9),
          name: event.eventName,
          college: event.organizationName,
          date: new Date(event.eventDate).toLocaleDateString(),
          rawDate: new Date(event.eventDate),
        }));
        const upcoming = events.filter((event) => event.rawDate >= currentDate);
        const past = events.filter((event) => event.rawDate < currentDate);

        // Process tasks with status
        const tasks = data.tasks.map((task) => ({
          id: task.id || Math.random().toString(36).substring(2, 9),
          name: task.taskTitle,
          event: task.eventName,
          college: task.organizationName,
          status: task.taskStatus,
          date: new Date(task.dueDate).toLocaleDateString(),
          rawDate: new Date(task.dueDate),
          statusClass: getStatusClass(task.taskStatus),
        }));

        const pendingTasksCount = tasks.filter((task) => task.status !== "Approved").length;

        setActiveEvents(data.activeEventsCount || upcoming.length);
        setPendingTasks(data.pendingTasksCount || pendingTasksCount);
        setDeadlines(data.upcomingDeadlinesCount || tasks.filter((task) => task.rawDate >= currentDate).length);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
=======
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
        const allTasks =
          dashboardData.pendingTasks?.map((task) => ({
            id: task.id || Math.random().toString(36).substring(2, 9),
            name: task.taskTitle,
            event: task.eventName,
            eventId: task.eventId || null, // may be missing
            college: task.organizationName || organizationName,
            status: task.taskStatus,
            date: new Date(task.dueDate).toLocaleDateString(),
            rawDate: new Date(task.dueDate),
            statusClass: getStatusClass(task.taskStatus),
            rawData: task,
          })) || [];

        // --- State Update ---
        setActiveEvents(dashboardData.activeEventsCount || 0);
        setPendingTasks(dashboardData.pendingTasksCount || allTasks.length);
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
>>>>>>> e26ae9932f102f0b1766b1bf1cd6208f60d549d5

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "status-approved";
      case "pending":
        return "status-pending";
      case "rejected":
        return "status-rejected";
      case "approval":
        return "status-approval";
<<<<<<< HEAD
=======
      case "active":
        return "status-active";
      case "new":
        return "status-new";
>>>>>>> e26ae9932f102f0b1766b1bf1cd6208f60d549d5
      default:
        return "status-default";
    }
  };

  const handleAddEventClick = () => {
    navigate("/dashboard/stepForm");
  };

  const handleSeeAllClick = (type) => {
    navigate(`/dashboard/${type.toLowerCase().replace(" ", "-")}`);
<<<<<<< HEAD
  };

  // Helper to get event dates as strings
  const eventDates = upcomingEvents.map(ev => {
    const d = new Date(ev.rawDate);
    return d.toDateString();
  });

  // Calendar tile class for highlighting
  const tileClassName = ({ date, view }) => {
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    if (view === 'month') {
      if (eventDates.includes(date.toDateString()) && isToday) {
        return 'calendar-event-date calendar-today-date';
      }
      if (eventDates.includes(date.toDateString())) {
        return 'calendar-event-date';
      }
      if (isToday) {
        return 'calendar-today-date';
      }
    }
    return null;
  };

  // Calendar click handler
  const handleCalendarClick = (date) => {
    if (eventDates.includes(date.toDateString())) {
      navigate('/dashboard/schedule');
    }
=======
>>>>>>> e26ae9932f102f0b1766b1bf1cd6208f60d549d5
  };

  return (
    <DashboardContainer>
      <h1>
        Welcome <span className="user-name">{user?.firstName || "User"}</span>, Plan your day ahead...
      </h1>

<<<<<<< HEAD
      {/* Status Cards */}
      {/* <StatusCards>
        <motion.div whileHover={{ scale: 1.04 }}>
          <StatusCardStyled title="Active Events" count={activeEvents} loading={loading} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.04 }}>
          <StatusCardStyled title="Pending Tasks" count={pendingTasks} loading={loading} status="warning" />
        </motion.div>
        <motion.div whileHover={{ scale: 1.04 }}>
          <StatusCardStyled title="Upcoming Deadlines" count={deadlines} loading={loading} status="alert" />
        </motion.div>
      </StatusCards> */}

      {/* Visuals: Calendar & Bar Graph */}
      <div className="dashboard-visuals">
        <motion.div className="calendar-card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <h2>Calendar</h2>
          <Calendar
            tileClassName={tileClassName}
            onClickDay={handleCalendarClick}
          />
        </motion.div>
        <motion.div className="bargraph-card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2>Events Overview</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={[
                { name: "Active", value: activeEvents },
                { name: "Pending", value: pendingTasks },
                { name: "Deadlines", value: deadlines },
              ]}
            >
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#4f8cff" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
=======
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
>>>>>>> e26ae9932f102f0b1766b1bf1cd6208f60d549d5
      </div>

      {/* Event Lists */}
      <div className="event-section">
        <div className="event-topbar">
          <h2>EVENT</h2>
          <button className="add_event" onClick={handleAddEventClick}>
            <CirclePlus className="add-icon" />
            New Event
          </button>
        </div>
        <EventList
          title="Upcoming Events"
          data={upcomingEvents}
          type="upcoming"
          loading={loading}
          onSeeAll={() => handleSeeAllClick("Upcoming Events")}
<<<<<<< HEAD
          // icon={
          //   <div className="add_event" onClick={handleAddEventClick}>
          //     <CirclePlus size={20} className="add-icon" />
          //     <span className="add_event_text">New Event</span>
          //   </div>
          // }
=======
          onEventClick={handleEventClick}
          icon={
            <div className="add_event" onClick={handleAddEventClick}>
              <CirclePlus size={20} className="add-icon" />
              <span className="add_event_text">New Event</span>
            </div>
          }
>>>>>>> e26ae9932f102f0b1766b1bf1cd6208f60d549d5
        />
        <EventList
          title="Past Events"
          data={pastEvents}
          loading={loading}
          onSeeAll={() => handleSeeAllClick("Past Events")}
          onEventClick={handleEventClick}
        />
      </div>

<<<<<<< HEAD
      <EventList
        title="Pending Tasks"
        data={tasks}
        type="tasks"
        loading={loading}
        onSeeAll={() => handleSeeAllClick("Pending Tasks")}
      />

      <ToastContainer>
        {toasts.map((t, i) => (
          <Toast key={i} type={t.type}>{t.msg}</Toast>
        ))}
      </ToastContainer>
    </DashboardContainer>
=======
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
>>>>>>> e26ae9932f102f0b1766b1bf1cd6208f60d549d5
  );
};

export default Dashboard;
