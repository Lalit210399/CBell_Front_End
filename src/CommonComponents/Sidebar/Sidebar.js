import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, Calendar, Clock, FolderOpen } from "lucide-react";
import { useUser } from "../../Context/UserContext";
import "./Sidebar.css";

function Sidebar() {
  const location = useLocation();
  const { permissions:userPermissions } = useUser();

  const hasDashboardPermission = userPermissions?.permissions?.Dashboard?.["Dashboard Management"]?.includes("Read") ?? false;
  const hasEventsPermission = userPermissions?.permissions?.Events?.["Event Management"]?.includes("Read") ?? false;
  const hasSchedulePermission = userPermissions?.permissions?.Events?.["Event Management"]?.includes("Read") ?? false;
  const hasChatPermission = userPermissions?.permissions?.Events?.["Event Management"]?.includes("Read") ?? false;
  const hasFilesPermission = userPermissions?.permissions?.Events?.["Event Management"]?.includes("Read") ?? false;

  return (
    <div className="sidebar">
      <div className="logo">CB</div>
      <ul className="menu">
        {hasDashboardPermission && (
          <li>
            <Link
              to="/dashboard"
              className={`menu-item ${
                location.pathname === "/dashboard" ? "active" : ""
              }`}
            >
              <div className="tooltip" data-tooltip="Dashboard">
                <LayoutGrid size={20} />
              </div>
            </Link>
          </li>
        )}
        {hasEventsPermission && (
          <li>
            <Link
              to="/events"
              className={`menu-item ${
                location.pathname.startsWith("/events") ? "active" : ""
              }`}
            >
              <div className="tooltip" data-tooltip="Events">
                <Calendar size={20} />
              </div>
            </Link>
          </li>
        )}
        {hasSchedulePermission && (
          <li>
            <Link
              to="/schedule"
              className={`menu-item ${
                location.pathname === "/schedule" ? "active" : ""
              }`}
            >
              <div className="tooltip" data-tooltip="Schedules">
                <Clock size={20} />
              </div>
            </Link>
          </li>
        )}
        {hasChatPermission && (
          <li>
            <Link
              to="/chat"
              className={`menu-item ${location.pathname === "/chat" ? "active" : ""}`}
            >
              <div className="tooltip" data-tooltip="Chat">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square"><rect x="3" y="3" width="14" height="14" rx="2"/><path d="m8 12 2-2 2 2m-2-2v3"/></svg>
              </div>
            </Link>
          </li>
        )}
        {hasFilesPermission && (
          <li>
            <Link
              to="/files"
              className={`menu-item ${location.pathname === "/files" ? "active" : ""}`}
            >
              <div className="tooltip" data-tooltip="Files">
                <FolderOpen size={20} />
              </div>
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}

export default Sidebar;