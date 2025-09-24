import React, { useEffect, useState, useRef } from "react";
import { ArrowLeft, Save, Users } from "lucide-react";
import AvatarList from "../Avatar/index";
import "./EditTopSection.css";

const TopSection = ({
  mode,
  title,
  setTitle,
  status,
  setStatus,
  statusOptions,
  createdBy,
  onBackClick,
  onSaveClick,
  users = [],
  assignedTo = [],
  onParticipantsChange,
  onClearError,
  onStatusChange, // New prop for handling status changes
  isUpdatingStatus = false, // Loading state for status updates
}) => {
  const [editableTitle, setEditableTitle] = useState(title || "");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const titleRef = useRef(null);
  const [userSearch, setUserSearch] = useState("");
  const isTitleManuallyEdited = useRef(false);

  
  // Get CSS class for status badge based on status value
  const getStatusClass = (statusValue) => {
    if (!statusValue) return 'default';
    
    const statusMap = {
      'New': 'new',
      'Active': 'active', 
      'Under Approval': 'under-approval',
      'Approved': 'approved',
      'Published': 'published'
    };
    
    return statusMap[statusValue] || 'default';
  };

  // Get default color for status
  const getDefaultColor = (statusValue) => {
    const colorMap = {
      "New": "gray",
      "Active": "blue", 
      "Under Approval": "orange",
      "Approved": "green",
      "Published": "purple"
    };
    return colorMap[statusValue] || "gray";
  };


  // Note: Status automatically changes to 'Active' when users are assigned
  // and back to 'New' when all users are removed (handled in TaskDetailPage)

  // Local state for assigned user IDs
  const [assignedIds, setAssignedIds] = useState([]);

  // Sync local assignedIds with incoming prop
  useEffect(() => {
    const ids = (assignedTo || [])
      .map((item) => {
        const id = typeof item === "string" || typeof item === "number" ? item : item?.id;
        return id;
      })
      .filter(Boolean);
    setAssignedIds(ids);
  }, [assignedTo]);

  // Find creator user from users list or create a fallback
  const creatorUser =
    users.find(
      (user) =>
        user.id === createdBy?.id ||
        `${user.firstName} ${user.lastName}` === createdBy
    ) || {
      firstName:
        createdBy?.name?.split(" ")[0] || createdBy?.split(" ")[0] || "User",
      lastName:
        createdBy?.name?.split(" ")[1] || createdBy?.split(" ")[1] || "",
    };

  const creatorAvatar = {
    id: "creator",
    name: creatorUser.firstName + " " + creatorUser.lastName,
    fallback: creatorUser.firstName?.charAt(0).toUpperCase() || "U",
    size: "24px",
    shape: "circle",
  };

  useEffect(() => {
    // Only update editableTitle if it's different from current value and not empty
    // AND if the title hasn't been manually edited by the user
    // This prevents clearing user input during validation
    if (title !== editableTitle && title !== undefined && title !== "" && !isTitleManuallyEdited.current) {
      setEditableTitle(title || "");
    }
  }, [title]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mode === "create" && titleRef.current && !title) {
      titleRef.current.focus();
    }
  }, [mode, title]);

  // Reset manual editing flag when title prop changes significantly (new task loaded)
  useEffect(() => {
    if (title && title !== editableTitle) {
      isTitleManuallyEdited.current = false;
    }
  }, [title, editableTitle]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prepare selected participants (handle both API assignedTo data and users list lookup)
  const selectedParticipants = React.useMemo(() => {
    return assignedIds.map((assignedId) => {
      // First, try to find in the assignedTo prop (from API) which has name field
      const assignedUser = assignedTo.find((u) => u.id === assignedId);
      
      if (assignedUser && assignedUser.name) {
        // Use the name directly from assignedTo (API data)
        const fullName = assignedUser.name;
        const nameParts = fullName.split(" ");
        const firstName = nameParts[0] || "User";
        
        return {
          id: assignedId,
          name: fullName,
          fallback: (firstName?.charAt(0) || "?").toUpperCase(),
          size: "20px",
          shape: "circle",
        };
      }
      
      // Fallback: try to find in users list
      const fullUser = users.find((u) => u.id === assignedId);
      const firstName = fullUser?.firstName || "User";
      const fullName = `${firstName} ${fullUser?.lastName || ""}`.trim();

      return {
        id: assignedId,
        name: fullName,
        fallback: (firstName?.charAt(0) || "?").toUpperCase(),
        size: "20px",
        shape: "circle",
      };
    });
  }, [assignedIds, assignedTo, users]);

  const hasAssignedUsers = selectedParticipants && selectedParticipants.length > 0;

  const filteredUsers = React.useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const isUserSelected = (id) => assignedIds.includes(id);

  const toggleUserSelection = (id) => {
    const next = isUserSelected(id)
      ? assignedIds.filter((x) => x !== id)
      : [...assignedIds, id];
    
    setAssignedIds(next);
    onParticipantsChange(next); // notify parent immediately
  };

  const getUserInitials = (firstName = "", lastName = "") => {
    const a = (firstName[0] || "").toUpperCase();
    const b = (lastName[0] || "").toUpperCase();
    return (a + b) || "?";
  };

  // Handle title change and clear validation errors
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setEditableTitle(newTitle);
    setTitle(newTitle);
    isTitleManuallyEdited.current = true; // Mark as manually edited
    // Clear any validation errors for title when user starts typing
    if (onClearError) {
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
        // Create a fallback status object if not found
        const fallbackStatus = {
          id: newStatusValue.toLowerCase().replace(/\s+/g, '_'),
          label: newStatusValue,
          value: newStatusValue,
          color: getDefaultColor(newStatusValue)
        };
        onStatusChange(fallbackStatus);
      }
    }
  };

  return (
    <div className="header-wrapper">
      <div className="header-left">
        <div className="header-top-left">
          <button className="header-back-button" onClick={onBackClick}>
            <ArrowLeft size={20} />
          </button>
          <div className="header-titles">
            {(mode === "edit" || mode === "create") ? (
              <div className="edit-mode-fields">
                <input
                  type="text"
                  className="editable-title-input"
                  value={editableTitle}
                  onChange={handleTitleChange}
                  onKeyDown={handleKeyDown}
                  ref={titleRef}
                  placeholder="Enter task title"
                  autoFocus={mode === "create"}
                />
              </div>
            ) : (
              <div className="view-mode-fields">
                <span className="header_title">{editableTitle}</span>
              </div>
            )}
          </div>
        </div>

        <div className="header-avatar-dropdown">
          <div className="header-avatar-group">
            {hasAssignedUsers ? (
              <AvatarList avatars={selectedParticipants} maxVisible={2} />
            ) : (
              <div className="no-assigned-users-placeholder">
                <Users size={14} className="placeholder-icon" />
                <span className="placeholder-text">No assigned users</span>
              </div>
            )}

            {(mode === "edit" || mode === "create") && (
              <div className="add-participant-section">
                <button
                  className="avatar-add-button"
                  onClick={handleAddButtonClick}
                >
                  +
                </button>
                  {isDropdownOpen && (
                    <div className="inline-dropdown" ref={dropdownRef}>
                      <div className="user-dropdown">
                        <div className="user-dropdown-header">
                          <input
                            type="text"
                            className="user-search"
                            placeholder="Search users..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                          />
                          <button
                            className="user-done"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            Done
                          </button>
                        </div>
                        <div className="user-dropdown-list">
                          {filteredUsers.length === 0 ? (
                            <div className="user-empty">No users found</div>
                          ) : (
                            filteredUsers.map((u) => (
                              <label
                                key={u.id}
                                className={`user-item ${
                                  isUserSelected(u.id) ? "selected" : ""
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isUserSelected(u.id)}
                                  onChange={() => toggleUserSelection(u.id)}
                                />
                                <span className="user-avatar">
                                  {getUserInitials(u.firstName, u.lastName)}
                                </span>
                                <span className="user-name">{`${u.firstName || "User"} ${u.lastName || ""}`}</span>
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>

          <div className="header-dropdown-container">
            {/* Status badge display - always show in view mode */}
            <div className="status-display">
              <span className="status-label">Status:</span>
              <div 
                className={`status-badge status-${getStatusClass(status?.value)}`}
                data-status={status?.value || status?.label}
              >
                {/* <div className="status-dot"></div> */}
                <span className="status-text">{status?.label || status?.value || "Unknown"}</span>
              </div>
            </div>
            
            {/* TaskStatus dropdown functionality temporarily disabled */}
            {/* {mode === "view" ? (
              <div className="status-display">
                <span className="status-label">Status:</span>
                <div className={`status-badge status-${status?.color}`}>
                  <div className="status-dot"></div>
                  <span className="status-text">{status?.label || status?.value || "Unknown"}</span>
                </div>
              </div>
            ) : (
              <div className="status-dropdown-wrapper">
                <span className="status-label">Status:</span>
                {statusOptions && statusOptions.length > 0 ? (
                  <Dropdown
                    options={statusOptions}
                    selectedOption={status}
                    onSelect={handleDropdownSelect}
                    disabled={!permissions.canChangeStatus}
                  />
                ) : (
                  <div className="no-status-options">
                    <span className="no-options-text">No status options available</span>
                  </div>
                )}
              </div>
            )} */}
          </div>
        </div>
      </div>

      <div className="right-section">
        <div className="date-creator-container">
          <div className="creator-section">
            <span>{creatorUser.firstName} {creatorUser.lastName}</span>
            <div className="creator-avatar">
              <AvatarList
                avatars={[creatorAvatar]}
                showTooltip={false}
                stack={false}
              />
            </div>
          </div>
        </div>

        <div className="action-buttons">
          {/* Hide all buttons (Save, Under Review, Approved) when status is Approved */}
          {status?.value !== "Approved" && (
            <>
              {(mode === "edit" || mode === "create") && (
                <button className="save-btn" onClick={onSaveClick}>
                  <Save size={16} />
                  Save
                </button>
              )}
              
              {/* Status change buttons - only show in view mode */}
              {mode === "view" && (
                <div className="status-change-buttons">
                  {/* Under Approval button - show for all statuses except Under Approval */}
                  {status?.value !== "Under Approval" && (
                    <button 
                      className="status-btn under-approval-btn"
                      onClick={() => handleStatusChange("Under Approval")}
                      title="Move to Under Approval"
                      disabled={isUpdatingStatus}
                    >
                      {isUpdatingStatus ? "Updating..." : "Under Approval"}
                    </button>
                  )}
                  {/* Approved button - show only when status is Under Approval */}
                  {status?.value === "Under Approval" && (
                    <button 
                      className="status-btn approved-btn"
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
  );
};

export default TopSection;
