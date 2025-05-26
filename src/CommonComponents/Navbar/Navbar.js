import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BellRing } from "lucide-react";
import { useUser } from "../../Context/UserContext"; // Import the UserContext
import { logout } from "../../Services/AuthN"; // Adjust the path based on your file structure

import "./Navbar.css";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser(); // Access the user from context
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const handleLogout = async () => {
  try {
    await logout(); // call the actual API
    // Reset context (if using UserContext for auth)
    // Example: setUser(null) if you have setUser in your context
    navigate("/"); // Redirect to home/login page
  } catch (error) {
    console.error("Logout failed:", error);
    navigate("/");
  }
};

  const toggleDropdown = () => {
    setDropdownVisible((prev) => !prev);
  };

  return (
    <nav className="navbar">
      <div className="nav-links">
        <Link to="/dashboard" className={location.pathname === "/dashboard" ? "active" : ""}>Dashboard</Link>
        <Link to="/events" className={location.pathname.startsWith("/events") ? "active" : ""}>Events</Link>
        <Link to="/schedule" className={location.pathname === "/schedule" ? "active" : ""}>Schedule</Link>
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
