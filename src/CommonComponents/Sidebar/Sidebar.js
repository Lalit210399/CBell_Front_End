import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, Calendar, Clock } from "lucide-react";
import { useUser } from "../../Context/UserContext";
import "./Sidebar.css";

function Sidebar() {
  const location = useLocation();
  const { permissions:userPermissions } = useUser();

  // Check permissions for each menu item
  const hasDashboardPermission = userPermissions?.permissions?.Dashboard?.["Dashboard Management"]?.includes("Read") ?? false;
  const hasEventsPermission = userPermissions?.permissions?.Events?.["Event Management"]?.includes("Read") ?? false;
  const hasSchedulePermission = userPermissions?.permissions?.Events?.["Event Management"]?.includes("Read") ?? false;

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
      </ul>
    </div>
  );
}

export default Sidebar;