import React, { useState, useEffect, useRef, useMemo } from "react";
import { ArrowLeft, Save, Users } from "lucide-react";
import AvatarList from "../Avatar/index";
import UserDropdown from "../UserDropdown";
import { useUser } from "../../Context/UserContext";
import "./EditTopSection.css";

const HARDCODED_STATUS_IDS = {
  "New": "68baab0b9a31a52d62646ca1",
  "Active": "68bee09b522caf6ac9f65bdc",
  "Under Approval": "68bee0b1522caf6ac9f65bdd",
  "Approved": "68bee0c2522caf6ac9f65bde",
  "Published": "68bee0d1522caf6ac9f65bdf"
};

const getDefaultColor = (status) => {
  const colors = {
    "New": "#6b7280",
    "Active": "#10b981",
    "Under Approval": "#f59e0b",
    "Approved": "#059669",
    "Published": "#8b5cf6"
  };
  return colors[status] || "#6b7280";
};

const getStatusClass = (status) => {
  if (!status) return "unknown";
  return status.toLowerCase().replace(/\s+/g, "-");
};

const TopSection = ({
  mode,
  onBackClick,
  onSaveClick,
  onStatusChange,
  title,
  setTitle,
  status,
  assignedTo = [],
  onParticipantsChange,
  users = [],
  errors = {},
  onClearError,
  isUpdatingStatus = false,
  createdBy = ""
}) => {
  const { user } = useUser();

  // Check if user is a Designer based on the roles array
  const isDesigner = user?.roles?.some(role => role.name === "Designer" || role.displayName === "Designer");

  const [editableTitle, setEditableTitle] = useState(title || "");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [assignedIds, setAssignedIds] = useState([]);
  const [fetchedUsers, setFetchedUsers] = useState([]);
  const titleRef = useRef(null);
  const isTitleManuallyEdited = useRef(false);

  // Status options for dropdown
  const statusOptions = [
    { id: "68baab0b9a31a52d62646ca1", label: "New", value: "New", color: "#6b7280" },
    { id: "68bee09b522caf6ac9f65bdc", label: "Active", value: "Active", color: "#10b981" },
    { id: "68bee0b1522caf6ac9f65bdd", label: "Under Approval", value: "Under Approval", color: "#f59e0b" },
    { id: "68bee0c2522caf6ac9f65bde", label: "Approved", value: "Approved", color: "#059669" },
    { id: "68bee0d1522caf6ac9f65bdf", label: "Published", value: "Published", color: "#8b5cf6" }
  ];

  // Get creator user info - use passed createdBy prop or fallback to current user for new tasks
  const creatorUser = useMemo(() => {
    if (createdBy && createdBy !== "") {
      // Parse the createdBy name (e.g., "Rohan Kulkarni" -> firstName: "Rohan", lastName: "Kulkarni")
      const nameParts = createdBy.trim().split(" ");
      return {
        firstName: nameParts[0] || "Unknown",
        lastName: nameParts.slice(1).join(" ") || "User"
      };
    }
    
    // Fallback to current user for new tasks
    if (!user) return { firstName: "Unknown", lastName: "User" };
    return {
      firstName: user.firstName || "Unknown",
      lastName: user.lastName || "User"
    };
  }, [createdBy, user]);

  useEffect(() => {
    setEditableTitle(title || "");
  }, [title]);

  useEffect(() => {
    const ids = (assignedTo || [])
      .map((item) => {
        if (typeof item === "string" || typeof item === "number") {
          return item;
        } else if (item && typeof item === "object") {
          return item.userId || item.id;
        }
        return null;
      })
      .filter(Boolean);

    const currentIds = assignedIds.sort();
    const newIds = ids.sort();
    if (JSON.stringify(currentIds) !== JSON.stringify(newIds)) {
      setAssignedIds(ids);
    }
  }, [assignedTo, assignedIds]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`/apis/auth/hierarchy-users/${user?.organizationId}`, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "ngrok-skip-browser-warning": "1",
          },
        });

        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const data = await response.json();

        setFetchedUsers(data.users || []);
      } catch (error) {
        console.error("Error fetching users:", error);
        setFetchedUsers([]);
      }
    };

    if (mode === "edit" || mode === "create") {
      fetchUsers();
    } else {
      setFetchedUsers(users);
    }
  }, [mode, users, user?.organizationId]);

  const handleTitleChange = (e) => {
    setEditableTitle(e.target.value);
    if (setTitle) setTitle(e.target.value);
    isTitleManuallyEdited.current = true;

    if (errors && errors.title && onClearError) {
      onClearError('title');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") e.preventDefault();
  };

  const handleAddButtonClick = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  // Handle status change button clicks
  const handleStatusChange = (newStatusValue) => {
    if (onStatusChange) {
      const newStatus = statusOptions.find(option => option.value === newStatusValue);

      if (newStatus) {
        onStatusChange(newStatus);
      } else {
        // Create a fallback status object with hardcoded ID
        const fallbackStatus = {
          id: HARDCODED_STATUS_IDS[newStatusValue] || "",
          label: newStatusValue,
          value: newStatusValue,
          color: getDefaultColor(newStatusValue)
        };
        onStatusChange(fallbackStatus);
      }
    }
  };

  const selectedParticipants = assignedIds.map((assignedId) => {
    const assignedUser = assignedTo.find((u) => (u.userId || u.id) === assignedId);

    if (assignedUser) {
      return {
        id: assignedUser.userId || assignedUser.id,
        name: assignedUser.userName || assignedUser.name,
        fallback: (assignedUser.userName || assignedUser.name || "?").charAt(0).toUpperCase(),
        size: "20px",
        shape: "circle",
      };
    }

    const fullUser = fetchedUsers.find((u) => u.id === assignedId);
    const firstName = fullUser?.firstName || "User";
    const lastName = fullUser?.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();

    return {
      id: assignedId,
      name: fullName,
      fallback: (firstName?.charAt(0) || "?").toUpperCase(),
      size: "20px",
      shape: "circle",
    };
  });

  const hasAssignedUsers = selectedParticipants && selectedParticipants.length > 0;


  const getUserInitials = (firstName = "", lastName = "") => {
    const a = (firstName[0] || "").toUpperCase();
    const b = (lastName[0] || "").toUpperCase();
    return (a + b) || "?";
  };

  return (
    <div className="edit-top-header-wrapper">
      <div className="edit-top-row">
        <button className="edit-top-back-button" onClick={onBackClick}>
          <ArrowLeft size={18} />
        </button>
        <div className="edit-top-title-container">
          <input
            type="text"
            className={`edit-top-title-input ${errors && errors.title ? "error" : ""}`}
            value={editableTitle}
            onChange={handleTitleChange}
            onKeyDown={handleKeyDown}
            ref={titleRef}
            placeholder="Enter task title"
            autoFocus={mode === "create"}
            readOnly={mode === "view"}
          />
          {(mode === "create" || mode === "edit") && <span className="edit-top-required-asterisk">*</span>}
        </div>
        <div className="edit-top-created-by">
          <span className="edit-top-creator-name">{creatorUser.firstName} {creatorUser.lastName}</span>
          <div className="edit-top-creator-avatar">
            <div className="edit-top-avatar-initials">
              {getUserInitials(creatorUser.firstName, creatorUser.lastName)}
            </div>
          </div>
          <span></span>
        </div>
      </div>

      <div className="edit-top-bottom-row">
        <div className="edit-top-left-section">
          <div className="edit-top-team-section">
            <span className="edit-top-label">Team:</span>
            <div className="edit-top-avatar-group">
              {hasAssignedUsers ? (
                <AvatarList avatars={selectedParticipants} maxVisible={2} />
              ) : (
                <div className="edit-top-no-assigned-users">
                  <Users size={14} className="edit-top-placeholder-icon" />
                  <span className="edit-top-placeholder-text">No assigned users</span>
                </div>
              )}
              {(mode === "edit" || mode === "create") && (
                <div className="edit-top-add-participant-section">
                  <button
                    className="edit-top-avatar-add-button"
                    onClick={handleAddButtonClick}
                  >
                    +
                  </button>
                  <UserDropdown
                    isOpen={isDropdownOpen}
                    onClose={() => setIsDropdownOpen(false)}
                    users={fetchedUsers}
                    selectedUserIds={assignedIds}
                    onUserSelectionChange={(newIds) => {
                      setAssignedIds(newIds);
                      if (onParticipantsChange) {
                        onParticipantsChange(newIds);
                      }
                    }}
                    placeholder="Search by name, email, org, or role..."
                    className="edit-top-user-dropdown-wrapper"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="edit-top-status-section">
            <span className="edit-top-label">Status:</span>
            <div
              className={`edit-top-status-badge edit-top-status-${getStatusClass(status?.value)}`}
              data-status={status?.value || status?.label}
            >
              <span className="edit-top-status-text">{status?.label || status?.value || "Unknown"}</span>
            </div>
          </div>
        </div>

        <div className="edit-top-right-section">
          <div className="edit-top-save-button-section" style={{ display: "flex", gap: "8px" }}>
            {/* Hide all buttons (Save, Under Review, Approved) when status is Approved */}
            {status?.value !== "Approved" && (
              <>
                {(mode === "edit" || mode === "create") && (
                  <button className="edit-top-btn-save" onClick={onSaveClick}>
                    <Save size={16} />
                    Save
                  </button>
                )}

                {/* Status change buttons - only show in view mode */}
                {mode === "view" && (
                  <div className="edit-top-status-change-buttons">
                    {/* Submit for Approval button - show only for Designers and for all statuses except Under Approval */}
                    {isDesigner && status?.value !== "Under Approval" && (
                      <button
                        className="edit-top-status-btn edit-top-under-approval-btn"
                        onClick={() => handleStatusChange("Under Approval")}
                        title="Submit for Approval"
                        disabled={isUpdatingStatus}
                      >
                        {isUpdatingStatus ? "Updating..." : "Submit for Approval"}
                      </button>
                    )}

                    {/* Approved button - show to everyone EXCEPT Designers when status is Under Approval */}
                    {!isDesigner && status?.value === "Under Approval" && (
                      <button
                        className="edit-top-status-btn edit-top-approved-btn"
                        onClick={() => handleStatusChange("Approved")}
                        title="Approve Task (requires file selection)"
                        disabled={isUpdatingStatus}
                      >
                        {isUpdatingStatus ? "Updating..." : "Approve"}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopSection;