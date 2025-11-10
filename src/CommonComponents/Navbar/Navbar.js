import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Building2, LogOut, Shield, ChevronDown } from "lucide-react";
import { useUser } from "../../Context/UserContext";
import { logout } from "../../Services/AuthN";
import CustomDropdown from "../Dropdown/CustomDropdown";
import NotificationDropdown from "../NotificationDropdown/NotificationDropdown";
import "./Navbar.css";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    user, 
    permissions: userPermissions, 
    scope, 
    selectedOrganizationId, 
    handleScopeChange,
    resetUserState
  } = useUser();
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout(); // call backend logout (clear cookies)

      // ✅ clear frontend state
      localStorage.removeItem("user");
      localStorage.removeItem("permissions");
      localStorage.removeItem("scope");
      localStorage.removeItem("dashboard-selected-organization");
      resetUserState();

      // ✅ redirect after state cleared
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);

      // still force clear on failure
      localStorage.removeItem("user");
      localStorage.removeItem("permissions");
      localStorage.removeItem("scope");
      localStorage.removeItem("dashboard-selected-organization");
      resetUserState();

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

  const hasDashboardPermission =
    userPermissions?.permissions?.Dashboard?.["Dashboard Management"]?.includes("Read") ?? false;
  const hasEventsPermission =
    userPermissions?.permissions?.Events?.["Event Management"]?.includes("Read") ?? false;
  const hasSchedulePermission =
    userPermissions?.permissions?.Events?.["Event Management"]?.includes("Read") ?? false;
  const hasChatPermission =
    userPermissions?.permissions?.Events?.["Event Management"]?.includes("Read") ?? false;

  // Prepare scope options
  const scopeOptions = scope?.accessibleOrganizations?.map((org) => ({
    label: org.data.organizationCode,
    value: org.id,
  })) || [];

  const currentScopeLabel = scope?.accessibleOrganizations?.find(
    (org) => org.id === selectedOrganizationId
  )?.data.organizationCode || "Select Organization";

  // Generate user initials
  const getUserInitials = (firstName = "", lastName = "") => {
    const firstInitial = (firstName[0] || "").toUpperCase();
    const lastInitial = (lastName[0] || "").toUpperCase();
    return (firstInitial + lastInitial) || "U";
  };

  const userInitials = getUserInitials(user?.firstName, user?.lastName);

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
        {hasChatPermission && (
          <Link to="/NewChatLayout" className={location.pathname === "/NewChatLayout" ? "active" : ""} style={{width:87, textAlign:'center'}}>
            Chat
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
              onSelect={(option) => handleScopeChange(option.value, location)}
            />
          </div>
        </div>
        
        {/* Notification Bell */}
        <NotificationDropdown />
        
        <div className="user-info" ref={dropdownRef}>
          
          <div className="avatar-dropdown-wrapper">
            <div className="profile-trigger" onClick={toggleDropdown}>
              <div className="user-avatars user-avatar-initials">
                {userInitials}
              </div>
              <ChevronDown size={16} className={`chevron-icon ${dropdownVisible ? 'rotated' : ''}`} />
            </div>
            {dropdownVisible && (
              <div className="profile-dropdown">
                <div className="profile-header">
                  <div className="profile-avatar-section">
                    <div className="profile-avatar-large profile-avatar-initials-large">
                      {userInitials}
                    </div>
                    <div className="profile-status"></div>
                  </div>
                  <div className="profile-info">
                    <h3 className="profile-name">{user?.firstName} {user?.lastName}</h3>
                    <p className="profile-email">{user?.email}</p>
                  </div>
                </div>
                
                <div className="profile-details">
                  <div className="profile-detail-item">
                    <Building2 size={16} className="detail-icon" />
                    <div className="detail-content">
                      <span className="detail-label">Organization</span>
                      <span className="detail-value">{user?.organization?.name || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="profile-detail-item">
                    <Shield size={16} className="detail-icon" />
                    <div className="detail-content">
                      <span className="detail-label">Role</span>
                      <span className="detail-value">{user?.roles?.[0]?.name || user?.roles?.[0]?.displayName || 'User'}</span>
                    </div>
                  </div>
                  
               
                  
                  {user?.organizationId && (
                    <div className="profile-detail-item">
                      <Building2 size={16} className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-label">Organization Code</span>
                        <span className="detail-value">{user?.organization?.code}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="profile-actions">
                  <button className="logout-button" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
