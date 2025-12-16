import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, Calendar, Clock, Settings } from "lucide-react";
import { useUser } from "../../Context/UserContext";
import "./Sidebar.css";

function Sidebar() {
  const location = useLocation();
  const { permissions:userPermissions, user } = useUser();

  // Check if user is a Designer
  const isDesigner = user?.roles?.some(role => role.name === "Designer" || role.displayName === "Designer");

  const hasDashboardPermission = userPermissions?.permissions?.Dashboard?.["Dashboard Management"]?.includes("Read") ?? false;
  const hasEventsPermission = userPermissions?.permissions?.Events?.["Event Management"]?.includes("Read") ?? false;
  const hasSchedulePermission = userPermissions?.permissions?.Events?.["Event Management"]?.includes("Read") ?? false;
  const hasChatPermission = userPermissions?.permissions?.Events?.["Event Management"]?.includes("Read") ?? false;

  return (
    <div className="sidebar">
      <div className="logo">CB</div>
      <ul className="menu menu-top">
        {hasDashboardPermission && (
          <li>
            <Link
              to="/dashboard"
              className={`sidebar-menu-item ${location.pathname === "/dashboard" ? "active" : ""}`}
              aria-label="Dashboard"
              title="Dashboard"
            >
              <LayoutGrid size={24} />
            </Link>
          </li>
        )}
        {hasEventsPermission && (
          <li>
            <Link
              to="/events"
              className={`sidebar-menu-item ${location.pathname.startsWith("/events") ? "active" : ""}`}
              aria-label="Events"
              title="Events"
            >
              <Calendar size={24} />
            </Link>
          </li>
        )}
        {hasSchedulePermission && (
          <li>
            <Link
              to="/schedule"
              className={`sidebar-menu-item ${location.pathname === "/schedule" ? "active" : ""}`}
              aria-label="Schedules"
              title="Schedules"
            >
              <Clock size={24} />
            </Link>
          </li>
        )}
        {hasChatPermission && (
          <li>
            <Link
              to="/chat"
              className={`sidebar-menu-item ${location.pathname === "/chat" ? "active" : ""}`}
              aria-label="Chat"
              title="Chat"
            >
              <MessageCircleMore size={24} />
            </Link>
          </li>
        )}
      </ul>
      <ul className="menu menu-bottom">
        {!isDesigner && (
          <li>
            <Link
              to="/settings"
              className={`menu-item ${location.pathname === "/settings" ? "active" : ""}`}
            >
              <div className="tooltip" data-tooltip="Settings">
                <Settings size={20} />
              </div>
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}

export default Sidebar;