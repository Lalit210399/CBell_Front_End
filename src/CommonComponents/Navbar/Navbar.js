import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BellRing, Building2 } from "lucide-react";
import { useUser } from "../../Context/UserContext";
import { logout } from "../../Services/AuthN";
import CustomDropdown from "../Dropdown/CustomDropdown";
import "./Navbar.css";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    user, 
    permissions: userPermissions, 
    setUser, 
    setPermissions, 
    scope, 
    selectedOrganizationId, 
    handleScopeChange,
    resetUserState
  } = useUser();
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout(); // call backend logout (clear cookies)

      // ✅ clear frontend state
      localStorage.removeItem("user");
      localStorage.removeItem("permissions");
      localStorage.removeItem("scope");
      localStorage.removeItem("dashboard-selected-organization");
      resetUserState();

      // ✅ redirect after state cleared
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);

      // still force clear on failure
      localStorage.removeItem("user");
      localStorage.removeItem("permissions");
      localStorage.removeItem("scope");
      localStorage.removeItem("dashboard-selected-organization");
      resetUserState();

      navigate("/login", { replace: true });
    }
  };

  const toggleDropdown = () => {
    setDropdownVisible((prev) => !prev);
  };

  // ✅ Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Check permissions for each tab
  const hasDashboardPermission =
    userPermissions?.permissions?.Dashboard?.["Dashboard Management"]?.includes("Read") ?? false;
  const hasEventsPermission =
    userPermissions?.permissions?.Events?.["Event Management"]?.includes("Read") ?? false;
  const hasSchedulePermission =
    userPermissions?.permissions?.Events?.["Event Management"]?.includes("Read") ?? false;

  // Prepare scope options
  const scopeOptions = scope?.accessibleOrganizations?.map((org) => ({
    label: org.data.organizationCode,
    value: org.id,
  })) || [];

  const currentScopeLabel = scope?.accessibleOrganizations?.find(
    (org) => org.id === selectedOrganizationId
  )?.data.organizationCode || "Select Organization";

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
        {/* Scope Selection */}
        <div className="scope-section">
          <span className="scope-label">
            <Building2 size={16} />
            Scope:
          </span>
          <div className="scope-dropdown">
            <CustomDropdown
              options={scopeOptions}
              defaultLabel={currentScopeLabel}
              onSelect={(option) => handleScopeChange(option.value, location)}
            />
          </div>
        </div>
        
        <BellRing size={22} className="bell-icon" />
        <div className="user-info" ref={dropdownRef}>
          <div className="user-details">
            <span className="user-name">{user?.firstName}</span>
            <span className="user-role">{user?.roles[0]?.name}</span>
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
