import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BellRing } from "lucide-react";
import { useUser } from "../../Context/UserContext";
import { logout } from "../../Services/AuthN";
import "./Navbar.css";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const {user, permissions: userPermissions } = useUser();
  const [dropdownVisible, setDropdownVisible] = useState(false);

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

  // Check permissions for each tab
  const hasDashboardPermission = userPermissions?.permissions?.Dashboard?.["Dashboard Management"]?.includes("Read") ?? false;
  const hasEventsPermission = userPermissions?.permissions?.Events?.["Event Management"]?.includes("Read") ?? false;
  const hasSchedulePermission = userPermissions?.permissions?.Events?.["Event Management"]?.includes("Read") ?? false;

  return (
    <nav className="navbar">
      <div className="nav-links">
        {hasDashboardPermission && (
          <Link to="/dashboard" className={location.pathname === "/dashboard" ? "active" : ""}>
            Dashboard
          </Link>
        )}
        {hasEventsPermission && (
          <Link to="/events" className={location.pathname.startsWith("/events") ? "active" : ""}>
            Events
          </Link>
        )}
        {hasSchedulePermission && (
          <Link to="/schedule" className={location.pathname === "/schedule" ? "active" : ""}>
            Schedule
          </Link>
        )}
      </div>
      <div className="nav-right">
        <BellRing size={22} className="bell-icon" />
        <div className="user-info">
          <div className="user-details">
            <span className="user-name">{user?.firstName}</span>
            <span className="user-role">Creator</span>
          </div>
          <div className="avatar-dropdown-wrapper">
            <img
              src="https://randomuser.me/api/portraits/men/1.jpg"
              alt="User"
              className="user-avatar"
              onClick={toggleDropdown}
            />
            {dropdownVisible && (
              <div className="logout_dropdown">
                <button onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
