import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Calendar,
  Clock,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { useUser } from "../../Context/UserContext";
import "./Sidebar.css";

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { permissions: userPermissions, user, logout } = useUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check permissions for each menu item
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

  const menuItems = [
    {
      path: "/dashboard",
      icon: LayoutGrid,
      label: "Dashboard",
      hasPermission: hasDashboardPermission,
      isActive: location.pathname === "/dashboard",
    },
    {
      path: "/events",
      icon: Calendar,
      label: "Events",
      hasPermission: hasEventsPermission,
      isActive: location.pathname.startsWith("/events"),
    },
    {
      path: "/schedule",
      icon: Clock,
      label: "Schedules",
      hasPermission: hasSchedulePermission,
      isActive: location.pathname === "/schedule",
    },
  ];

  const filteredMenuItems = menuItems.filter(item => item.hasPermission);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsDropdownOpen(false);
  };

  const handleProfileClick = () => {
    navigate("/profile");
    setIsDropdownOpen(false);
  };

  const handleSettingsClick = () => {
    navigate("/settings");
    setIsDropdownOpen(false);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return "U";
    const names = user.name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <div className="logo">CB</div>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <ul className="menu">
          {filteredMenuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`menu-item ${item.isActive ? "active" : ""}`}
                  aria-label={item.label}
                >
                  <div className="menu-icon">
                    <IconComponent size={20} />
                  </div>
                  <div className="tooltip">{item.label}</div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Section */}
      <div className="sidebar-footer">
        <div className="user-profile" ref={dropdownRef}>
          <button
            className={`profile-button ${isDropdownOpen ? 'active' : ''}`}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label="User profile menu"
            aria-expanded={isDropdownOpen}
          >
            <div className="avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt="User avatar" />
              ) : (
                <span className="avatar-initials">{getUserInitials()}</span>
              )}
            </div>
            <div className="tooltip">
              {user?.name || "User Profile"}
            </div>
          </button>

          {/* Minimalist Right-Side Dropdown */}
          {isDropdownOpen && (
            <div className="profile-dropdown">
              <div className="user-header">
                <div className="user-name">{user?.name || "User"}</div>
                <div className="user-email">{user?.email || "user@example.com"}</div>
              </div>
              
              <div className="menu-list">
                <button className="menu-option" onClick={handleProfileClick}>
                  <User size={18} />
                  Profile
                </button>
                
                <button className="menu-option" onClick={handleSettingsClick}>
                  <Settings size={18} />
                  Settings
                </button>
                
                <button className="menu-option logout-option" onClick={handleLogout}>
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
