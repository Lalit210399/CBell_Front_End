import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, Calendar, Clock, Settings, MessageCircleMore, FolderKanban } from "lucide-react";
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
              className={`menu-item ${location.pathname === "/dashboard" ? "active" : ""}`}
              aria-label="Dashboard"
              title="Dashboard"
            >
              <div className="tooltip" data-tooltip="Dashboard">
                <LayoutGrid size={24} />
              </div>
            </Link>
          </li>
        )}
        {hasEventsPermission && (
          <li>
            <Link
              to="/events"
              className={`menu-item ${location.pathname.startsWith("/events") ? "active" : ""}`}
              aria-label="Events"
              title="Events"
            >
              <div className="tooltip" data-tooltip="Events">
                <Calendar size={24} />
              </div>
            </Link>
          </li>
        )}
        {hasSchedulePermission && (
          <li>
            <Link
              to="/schedule"
              className={`menu-item ${location.pathname === "/schedule" ? "active" : ""}`}
              aria-label="Schedules"
              title="Schedules"
            >
              <div className="tooltip" data-tooltip="Schedule">
                <Clock size={24} />
              </div>
            </Link>
          </li>
        )}
        {hasChatPermission && (
          <li>
            <Link
              to="/chat"
              className={`menu-item ${location.pathname === "/chat" ? "active" : ""}`}
              aria-label="Chat"
              title="Chat"
            >
              <div className="tooltip" data-tooltip="Chat">
                <MessageCircleMore size={24} />
              </div>
            </Link>
          </li>
        )}
        <li>
          <Link
            to="/file-manager"
            className={`menu-item ${location.pathname === "/file-manager" ? "active" : ""}`}
            aria-label="File Manager"
            title="File Manager"
          >
            <div className="tooltip" data-tooltip="File Manager">
              <FolderKanban size={24} />
            </div>
          </Link>
        </li>
      </ul>
      <ul className="menu menu-bottom">
        {!isDesigner && (
          <li>
            <Link
              to="/settings"
              className={`menu-item ${location.pathname === "/settings" ? "active" : ""}`}
              aria-label="Settings"
              title="Settings"
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