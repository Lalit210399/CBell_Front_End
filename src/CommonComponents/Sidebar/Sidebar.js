import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, Calendar, Clock, MessageCircleMore } from "lucide-react";
import { useUser } from "../../Context/UserContext";
import "./Sidebar.css";

function Sidebar() {
  const location = useLocation();
  const { permissions:userPermissions } = useUser();

  const hasDashboardPermission = userPermissions?.permissions?.Dashboard?.["Dashboard Management"]?.includes("Read") ?? false;
  const hasEventsPermission = userPermissions?.permissions?.Events?.["Event Management"]?.includes("Read") ?? false;
  const hasSchedulePermission = userPermissions?.permissions?.Events?.["Event Management"]?.includes("Read") ?? false;
  const hasChatPermission = userPermissions?.permissions?.Events?.["Event Management"]?.includes("Read") ?? false;

  return (
    <nav className="sidebar" aria-label="Main navigation">
      <div className="sidebar-logo">CB</div>
      <ul className="sidebar-menu">
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
    </nav>
  );
}

export default Sidebar;