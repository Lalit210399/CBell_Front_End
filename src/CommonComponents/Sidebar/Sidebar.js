import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Calendar, Clock, MessageSquare, Settings } from "lucide-react";
import { useUser } from "../../Context/UserContext";
import "./Sidebar.css";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser?.() || {};

  // Adjust permission checks to your actual user shape
  const hasDashboardPermission = true;
  const hasEventsPermission = true;
  const hasSchedulePermission = true;
  const hasChatPermission = true;

  return (
    <aside className="sidebar">
      <div className="logo">CB</div>

      <ul className="menu">
        {hasDashboardPermission && (
          <li>
            <Link
              to="/dashboard"
              className={`menu-item ${location.pathname === "/dashboard" ? "active" : ""}`}
              title="Dashboard"
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
              className={`menu-item ${location.pathname.startsWith("/events") ? "active" : ""}`}
              title="Events"
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
              className={`menu-item ${location.pathname === "/schedule" ? "active" : ""}`}
              title="Schedules"
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
              title="Chat"
            >
              <div className="tooltip" data-tooltip="Chat">
                <MessageSquare size={20} />
              </div>
            </Link>
          </li>
        )}
      </ul>

      {/* Settings Icon - Opens Settings Page Directly */}
      <div className="sidebar-settings">
        <button
          className="settings-button"
          onClick={() => navigate("/settings")}
          title="Settings"
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </aside>
  );
}