import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BellRing } from "lucide-react";
import { useUser } from "../../Context/UserContext";
import { logout } from "../../Services/AuthN";
import "./Navbar.css";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, permissions: userPermissions } = useUser();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");

  // Close drawer on Escape key
  useEffect(() => {
    if (!notificationDrawerOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setNotificationDrawerOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [notificationDrawerOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/");
    }
  };

  const toggleDropdown = () => {
    setDropdownVisible((prev) => !prev);
  };

  // Fetch notifications when the drawer opens
  useEffect(() => {
    if (!notificationDrawerOpen) return;
    const fetchNotifications = async () => {
      try {
        setIsLoadingNotifications(true);
        setNotificationsError("");
        // Placeholder: replace with API integration
        // Example:
        // const result = await NotificationsService.list();
        // setNotifications(result);
        await new Promise((r) => setTimeout(r, 400));
        const mock = [
          { id: "1", text: "New comment on Task Alpha", time: "Just now", read: false },
          { id: "2", text: "File \"brief.pdf\" uploaded", time: "10m ago", read: false },
          { id: "3", text: "Event \"Sprint Planning\" tomorrow", time: "1h ago", read: true },
        ];
        setNotifications(mock);
      } catch (err) {
        setNotificationsError("Failed to load notifications");
      } finally {
        setIsLoadingNotifications(false);
      }
    };
    fetchNotifications();
  }, [notificationDrawerOpen]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const refreshNotifications = async () => {
    // Trigger re-fetch by briefly toggling state
    setNotificationDrawerOpen((prev) => {
      const next = !prev;
      return next;
    });
    setNotificationDrawerOpen(true);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Check permissions for each tab
  const hasDashboardPermission =
    userPermissions?.permissions?.Dashboard?.["Dashboard Management"]?.includes(
      "Read"
    ) ?? false;
  const hasEventsPermission =
    userPermissions?.permissions?.Events?.["Event Management"]?.includes(
      "Read"
    ) ?? false;
  const hasSchedulePermission =
    userPermissions?.permissions?.Events?.["Event Management"]?.includes(
      "Read"
    ) ?? false;

  return (
    <>
    <nav className="navbar">
      <div className="nav-links">
        {hasDashboardPermission && (
          <Link
            to="/dashboard"
            className={location.pathname === "/dashboard" ? "active" : ""}
          >
            Dashboard
          </Link>
        )}
        {hasEventsPermission && (
          <Link
            to="/events"
            className={location.pathname.startsWith("/events") ? "active" : ""}
          >
            Events
          </Link>
        )}
        {hasSchedulePermission && (
          <Link
            to="/schedule"
            className={location.pathname === "/schedule" ? "active" : ""}
          >
            Schedule
          </Link>
        )}
      </div>
      <div className="nav-right">
        <button
          className="bell-icon-button"
          aria-label="Open notifications"
          onClick={() => {
            setNotificationDrawerOpen(true);
            markAllAsRead();
          }}
        >
          <BellRing
            size={18}
            className={`bell-icon ${unreadCount > 0 ? "ringing" : ""}`}
          />
          {unreadCount > 0 && <span className="notification-badge" />}
        </button>
       
        <div className="user-profile">
          <div className="user-info">
            <div className="user-details">
              <span className="user-name">
                {user?.firstName || "Selma Knight"}
              </span>
              <span className="user-email">
                {user?.email || "selma@gmail.com"}
              </span>
            </div>
            <button className="chevron-button" onClick={toggleDropdown}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>
          <img
            src="https://randomuser.me/api/portraits/men/1.jpg"
            alt="User"
            className="user-avatar"
          />
          {dropdownVisible && (
            <div className="user_dropdown">
              <button onClick={handleLogout} className="dropdown_menu_item">
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
    {notificationDrawerOpen && (
      <div
        className="notification-overlay"
        role="presentation"
        onClick={() => setNotificationDrawerOpen(false)}
      >
        <aside
          className="notification-drawer"
          role="dialog"
          aria-label="Notifications"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="notification-header">
            <h3 className="notification-title">Notifications</h3>
            <div className="notification-actions">
              <button
                className="notification-action"
                onClick={markAllAsRead}
                disabled={notifications.length === 0 || notifications.every((n) => n.read)}
              >
                Mark all as read
              </button>
              <button
                className="notification-close"
                aria-label="Close notifications"
                onClick={() => setNotificationDrawerOpen(false)}
              >
                ×
              </button>
            </div>
          </div>
          <div className="notification-content">
            {isLoadingNotifications ? (
              <div className="notification-loading">Loading notifications…</div>
            ) : notificationsError ? (
              <div className="notification-error">
                {notificationsError}
                <button className="notification-retry" onClick={refreshNotifications}>Retry</button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">You're all caught up</div>
            ) : (
              <ul className="notification-list">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`notification-item ${n.read ? "read" : "unread"}`}
                    onClick={() => markAsRead(n.id)}
                  >
                    <div className="notification-text">{n.text}</div>
                    <div className="notification-time">{n.time}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    )}
    </>
  );
}

export default Navbar;
