import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Calendar, Users } from "lucide-react";
import AvatarList from "../Avatar/index";
import "./DetailTopSection.css";

function formatDateTimeLocal(date) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDateTimeForDisplay(date) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  
  // Convert to Indian timezone (IST - UTC+5:30)
  const istDate = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
  
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istDate.getUTCDate()).padStart(2, "0");
  const hours = String(istDate.getUTCHours()).padStart(2, "0");
  const minutes = String(istDate.getUTCMinutes()).padStart(2, "0");
  
  // Format with better spacing: "DD/MM/YYYY • HH:MM"
  return (
    <span>
      <span className="date-part">{day}/{month}/{year}</span>
      <span className="date-time-separator">  </span>
      <span className="time-part">{hours}:{minutes}</span>
    </span>
  );
}

const DetailTopSection = ({
  mode,
  onBackClick,
  onNewTaskClick,
  onSaveClick,
  data = {},
  participants = [],
  permissions = {},
  initialDate = "",
  errors = {},
  onClearError,
  users = [],
  assignedTo = [],
  onParticipantsChange
}) => {
  const [editableTitle, setEditableTitle] = useState(
    mode === "create" ? (data?.title || "") : (data?.title || "")
  );
  const [editableDate, setEditableDate] = useState(
    mode === "create" ? formatDateTimeLocal(initialDate || new Date()) : formatDateTimeLocal(data?.date || new Date())
  );
  const [editableTypeDesc, setEditableTypeDesc] = useState(
    mode === "create" ? (data?.typeDesc || "") : (data?.typeDesc || "")
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [assignedIds, setAssignedIds] = useState([]);

  // Sync local assignedIds with incoming prop
  useEffect(() => {
    const ids = (assignedTo || [])
      .map((item) =>
        typeof item === "string" || typeof item === "number" ? item : item?.id
      )
      .filter(Boolean);
    setAssignedIds(ids);
  }, [assignedTo]);

  // Only update state when data or mode changes, not on every render
  useEffect(() => {
    if (mode === "create") {
      setEditableTitle("");
      setEditableDate(formatDateTimeLocal(initialDate || new Date()));
      setEditableTypeDesc("");
    } else {
      setEditableTitle(data?.title || "");
      setEditableDate(formatDateTimeLocal(data?.date || new Date()));
      setEditableTypeDesc(data?.typeDesc || "");
    }
  }, [mode, data?.title, data?.date, data?.typeDesc, initialDate]);

  const handleTitleChange = (e) => {
    setEditableTitle(e.target.value);
    if (errors && errors.title && onClearError) onClearError('title');
  };

  const handleDateChange = (e) => {
    setEditableDate(e.target.value);
    if (errors && errors.date && onClearError) onClearError('date');
  };

  const handleTypeDescChange = (e) => {
    setEditableTypeDesc(e.target.value);
  };

  // Prepare selected participants (from local assignedIds so avatars update instantly)
  const selectedParticipants = assignedIds.map((assignedId) => {
    const fullUser = users.find((u) => u.id === assignedId);
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

  const filteredUsers = React.useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.organizationCode || "").toLowerCase().includes(q) ||
      (u.role || "").toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const isUserSelected = (id) => assignedIds.includes(id);

  const toggleUserSelection = (id) => {
    const next = isUserSelected(id)
      ? assignedIds.filter((x) => x !== id)
      : [...assignedIds, id];
    setAssignedIds(next);
    if (onParticipantsChange) {
      onParticipantsChange(next); // notify parent immediately
    }
  };

  const getUserInitials = (firstName = "", lastName = "") => {
    const a = (firstName[0] || "").toUpperCase();
    const b = (lastName[0] || "").toUpperCase();
    return (a + b) || "?";
  };

  const handleAddButtonClick = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleSaveClick = () => {
    const payload = {
      title: editableTitle,
      date: editableDate,
      typeDesc: editableTypeDesc,
    };
    onSaveClick(payload);
  };

  // Check if participants array is empty
  const hasParticipants = participants && participants.length > 0;

  return (
    <div className="detail-header-container">
      <div className="header-left-section">
        <div className="top-left">
          <button className="back-button" onClick={onBackClick}>
            <ArrowLeft size={20} />
          </button>
          <div className="header-titles">
            {(mode === "edit" || mode === "create") ? (
              <div className="edit-mode-fields">
                <input
                  type="text"
                  className={`editable-title-input ${errors && errors.title ? 'error' : ''}`}
                  value={editableTitle}
                  onChange={handleTitleChange}
                  placeholder={mode === "create" ? "Enter event title" : ""}
                  autoFocus={mode === "create"}
                />
                {(errors && errors.title) && (
                  <div className="field-error">{errors.title}</div>
                )}
                <span className="event-type-text">{data?.type || "No type specified"}</span>
              </div>
            ) : (
              <div className="view-mode-fields">
                <span className="header_title">{editableTitle}</span>
                <span className="event-type-text">{data?.type || "No type specified"}</span>
              </div>
            )}
          </div>
        </div>
        <div className="avatar-dropdown-container">
          <div className="avatar-group">
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
                  <div className="inline-dropdown">
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
                              <div className="user-info">
                                <div className="user-name">{`${u.firstName || "User"} ${u.lastName || ""}`}</div>
                                <div className="user-details">
                                  <span className="user-role">{u.roles?.[0]?.name || u.roles?.[0]?.displayName || "No role"}</span>
                                  {u.organizationCode && (
                                    <span className="user-org">• {u.organizationCode}</span>
                                  )}
                                  {u.email && (
                                    <span className="user-email">• {u.email}</span>
                                  )}         
                                </div>
                              </div>
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
        </div>
      </div>

      <div className="right-section">
        <div className="date-creator-container">
          <div className="date-section">
            {mode === "view" && <Calendar size={16} />}
            {(mode === "edit" || mode === "create") ? (
              <>
                <input
                  type="datetime-local"
                  className={`editable-date-input ${errors && errors.date ? 'error' : ''}`}
                  value={editableDate}
                  onChange={handleDateChange}
                  placeholder="Select date and time"
                  min={new Date().toISOString().slice(0, 16)}
                />
                {(errors && errors.date) && (
                  <div className="field-error">{errors.date}</div>
                )}
              </>
            ) : (
              <span>{formatDateTimeForDisplay(data?.date || editableDate)}</span>
            )}
          </div>

          <div className="creator-section">
            <span>{data.creatorAvatar?.name}</span>
            <div className="creator-avatar">
              <AvatarList avatars={[data.creatorAvatar]} />
            </div>
          </div>
        </div>

        <div className="action-buttons">
          {(mode === "view" || mode === "edit") && permissions?.canCreateTask && (
            <button className="new-task-btn" onClick={onNewTaskClick}>
              New Task
            </button>
          )}

          {(mode === "edit" || mode === "create") && permissions?.canSave && (
            <button className="save-btn" onClick={handleSaveClick}>
              <Save size={16} />
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailTopSection;