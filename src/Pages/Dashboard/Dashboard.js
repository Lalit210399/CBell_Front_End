import React, { useEffect, useState, useMemo } from "react";
import { fetchWithRefresh } from "../../Context/RefereshToken";
import { useNavigate } from "react-router-dom";
import EventList from "../../CommonComponents/EventsList/EventsList";
import { CirclePlus, Calendar, CheckSquare, Clock } from "lucide-react";
import { useUser } from "../../Context/UserContext";
import { useMessages } from "../../Context/MessageContext";
import "./Dashboard.css";

const formatDate = (date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
};

const Dashboard = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { addMessage } = useMessages();

  const [dashboardData, setDashboardData] = useState({
    activeEvents: 0,
    pendingTasks: 0,
    deadlines: 0,
    upcomingEvents: [],
    pastEvents: [],
    tasks: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // // Memoize status cards data
  // const statusCards = useMemo(
  //   () => [
  //     {
  //       title: "Active Events",
  //       count: dashboardData.activeEvents,
  //       icon: Calendar,
  //       color: "#02968A",
  //     },
  //     {
  //       title: "Pending Tasks",
  //       count: dashboardData.pendingTasks,
  //       icon: CheckSquare,
  //       color: "#043E54",
  //       status: "warning",
  //     },
  //     {
  //       title: "Upcoming Deadlines",
  //       count: dashboardData.deadlines,
  //       icon: Clock,
  //       color: "#02968A",
  //       status: "alert",
  //     },
  //   ],
  //   [
  //     dashboardData.activeEvents,
  //     dashboardData.pendingTasks,
  //     dashboardData.deadlines,
  //   ]
  // );

  // Potential fix 

  // Put these above the useEffect

  const norm = (s) => (s || "").toLowerCase();

  const safeParseDate = (d) => {
    const t = Date.parse(d);
    return Number.isFinite(t) ? new Date(t) : null;
  };

  const fmtDate = (dateLike) => {
    const d = typeof dateLike === "string" ? safeParseDate(dateLike) : dateLike;
    return d ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d) : "—";
  };

  const isUpcoming = (d) => {
    if (!d) return false;
    return d.getTime() >= Date.now();
  };

  // Keep addMessage from retriggering the effect by storing it in a ref
  const addMessageRef = React.useRef(addMessage);
  useEffect(() => { addMessageRef.current = addMessage; }, [addMessage]);





  useEffect(() => {
    const orgId = user?.organizationId || "681460dcb8327b2e3417d8b1";
    if (!orgId) return;
  
    const ac = new AbortController();
    let alive = true;
  
    (async () => {
      try {
        setLoading(true);
        setError(null);
  
        const response = await fetchWithRefresh(
          `/apis/dashboard?OrganizationId=${encodeURIComponent(orgId)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "1",
            },
            signal: ac.signal,
          }
        );
  
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
  
        // Ensure JSON and parse defensively
        const ct = response.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          throw new Error("Invalid response content type");
        }
  
        const data = await response.json();
  
        const rawEvents = Array.isArray(data?.events) ? data.events : [];
        const rawTasks = Array.isArray(data?.tasks) ? data.tasks : [];
  
        // Map events with stable IDs
        const events = rawEvents.map((event) => {
          const d = safeParseDate(event?.eventDate);
          const stableId =
            event?.id ||
            [event?.eventName ?? "event", event?.eventDate ?? "", event?.organizationName ?? ""]
              .join("|")
              .toLowerCase()
              .replace(/\s+/g, "-");
          return {
            id: stableId,
            name: event?.eventName ?? "—",
            college: event?.organizationName ?? "—",
            date: fmtDate(d),
            rawDate: d,
          };
        });
  
        const upcoming = events.filter((e) => isUpcoming(e.rawDate));
        const past = events.filter((e) => e.rawDate && !isUpcoming(e.rawDate));
  
        // Map tasks with normalized status
        const tasks = rawTasks.map((task) => {
          const d = safeParseDate(task?.dueDate);
          const stableId =
            task?.id ||
            [task?.taskTitle ?? "task", task?.dueDate ?? "", task?.organizationName ?? ""]
              .join("|")
              .toLowerCase()
              .replace(/\s+/g, "-");
          const status = task?.taskStatus ?? "";
          return {
            id: stableId,
            name: task?.taskTitle ?? "—",
            event: task?.eventName ?? "—",
            college: task?.organizationName ?? "—",
            status,
            date: fmtDate(d),
            rawDate: d,
            statusClass: getStatusClass(status),
          };
        });
  
        const pendingTasksCount = tasks.filter((t) => norm(t.status) !== "approved").length;
        const upcomingDeadlines = tasks.filter((t) => isUpcoming(t.rawDate)).length;
  
        if (!alive) return;
  
        setDashboardData({
          activeEvents: data?.activeEventsCount ?? upcoming.length,
          pendingTasks: data?.pendingTasksCount ?? pendingTasksCount,
          deadlines: data?.upcomingDeadlinesCount ?? upcomingDeadlines,
          upcomingEvents: upcoming,
          pastEvents: past,
          tasks,
        });
      } catch (err) {
        if (ac.signal.aborted) return; // ignore aborts
        const msg =
          err?.message === "Failed to fetch"
            ? "Unable to connect to the server. Please check your internet connection."
            : (err?.message || "Failed to load dashboard data. Please try again.");
        if (alive) {
          setError(msg);
          // read from ref so the effect deps stay stable
          addMessageRef.current?.({ text: msg, type: "error", duration: 5000 });
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
  
    return () => {
      alive = false;
      ac.abort();
    };
  }, [user?.organizationId]);
  

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
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        <div className="hero-section">
          <div className="hero-content">
            <div className="welcome-section">
              <h1 className="hero-title">
                <span className="greeting-text">
                  Good{" "}
                  {new Date().getHours() < 12
                    ? "morning"
                    : new Date().getHours() < 17
                      ? "afternoon"
                      : "evening"}
                  ,
                </span>
                <span className="user-name">{user?.firstName || "User"}</span>
              </h1>
              <p className="hero-subtitle">
                Here's what's happening with your events today
              </p>
            </div>

            <div className="hero-actions">
              <button
                className="cta-button primary"
                onClick={handleAddEventClick}
              >
                <CirclePlus size={20} />
                New Event
              </button>
              <button
                className="cta-button secondary"
                onClick={() => navigate("/dashboard/tasks/new")}
              >
                <CheckSquare size={20} />
                Create Task
              </button>
            </div>
          </div>
          {/* 
          <section className="quick-stats">
            {statusCards.map((card) => (
              <div
                className={`quick-stat-card ${card.status || ""}`}
                key={card.title}
              >
                <div
                  className="stat-icon-wrapper"
                  style={{ backgroundColor: `${card.color}15` }}
                >
                  <card.icon size={24} color={card.color} />
                </div>
                <div className="stat-info">
                  <h3>{card.title}</h3>
                  <div className="stat-number">
                    {loading ? (
                      <div className="stat-skeleton"></div>
                    ) : (
                      <>
                        <span className="stat-value">{card.count}</span>
                        <span className="stat-label">
                          {card.count === 1 ? "item" : "items"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </section> */}

          <section className="main-content">
            <div className="content-grid">
              <div className="events-panel">
                <div className="panel-header">
                  <h2>Upcoming Events</h2>
                  <button
                    className="view-all"
                    onClick={() => handleSeeAllClick("Upcoming Events")}
                  >
                    View All
                  </button>
                </div>
                <div className="event-cards">
                  {loading ? (
                    Array(2)
                      .fill(0)
                      .map((_, i) => (
                        <div key={i} className="event-card skeleton"></div>
                      ))
                  ) : dashboardData.upcomingEvents.length > 0 ? (
                    <EventList
                      data={dashboardData.upcomingEvents}
                      type="upcoming"
                      loading={loading}
                      className="modern-list"
                    />
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <Calendar size={32} />
                      </div>
                      <p>No upcoming events</p>
                      <button
                        className="create-button"
                        onClick={handleAddEventClick}
                      >
                        Schedule New Event
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="tasks-panel">
                <div className="panel-header">
                  <h2>Tasks Overview</h2>
                  <button
                    className="view-all"
                    onClick={() => handleSeeAllClick("Pending Tasks")}
                  >
                    View All
                  </button>
                </div>
                <div className="task-cards">
                  {loading ? (
                    Array(3)
                      .fill(0)
                      .map((_, i) => (
                        <div key={i} className="task-card skeleton"></div>
                      ))
                  ) : dashboardData.tasks.length > 0 ? (
                    <EventList
                      data={dashboardData.tasks}
                      type="tasks"
                      loading={loading}
                      className="modern-list"
                    />
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <CheckSquare size={32} />
                      </div>
                      <p>No pending tasks</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {error && (
        <div className="error-toast" role="alert">
          <p>{error}</p>
          <button className="dismiss-button" onClick={() => setError(null)}>
            <span className="sr-only">Dismiss</span>×
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
