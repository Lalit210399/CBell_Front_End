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
    handleScopeChange 
  } = useUser();
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout(); // call backend logout (clear cookies)

      // ✅ clear frontend state
      localStorage.removeItem("user");
      localStorage.removeItem("permissions");
      localStorage.removeItem("dashboard-selected-organization");
      setUser(null);
      setPermissions(null);

      // ✅ redirect after state cleared
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);

      // still force clear on failure
      localStorage.removeItem("user");
      localStorage.removeItem("permissions");
      localStorage.removeItem("dashboard-selected-organization");
      setUser(null);
      setPermissions(null);

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
              onSelect={(option) => handleScopeChange(option.value)}
            />
          </div>
        </div>
        
        <BellRing size={22} className="bell-icon" />
        <div className="user-info" ref={dropdownRef}>
          <div className="user-details">
            <span className="user-name">{user?.firstName}</span>
            <span className="user-role">{user?.roles[0]?.name}</span>
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
