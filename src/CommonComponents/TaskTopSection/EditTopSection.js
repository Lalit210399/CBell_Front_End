import React, { useEffect, useState, useRef } from "react";
import { ArrowLeft, Save, Users } from "lucide-react";
import AvatarList from "../Avatar/index";
import Dropdown from "../../CommonComponents/Dropdown/Dropdown";
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
  permissions = {},
}) => {
  const [editableTitle, setEditableTitle] = useState(title || "");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const titleRef = useRef(null);
  const [userSearch, setUserSearch] = useState("");

  // Local state for assigned user IDs
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
    setEditableTitle(title || "");
  }, [title]);

  useEffect(() => {
    if (mode === "create" && titleRef.current && !title) {
      titleRef.current.focus();
    }
  }, [mode, title]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleTitleChange = (e) => {
    const newTitle = e.target.innerText;
    setEditableTitle(newTitle);
    setTitle(newTitle);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") e.preventDefault();
  };

  const handleDropdownSelect = (option) => {
    setStatus(option);
  };

  const handleAddButtonClick = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  return (
    <div className="header-wrapper">
      <div className="header-left">
        <div className="header-top-left">
          <button className="header-back-button" onClick={onBackClick}>
            <ArrowLeft size={20} />
          </button>
          <div className="header-title-container">
            {mode === "edit" || mode === "create" ? (
              <h2
                className="header-title-input"
                contentEditable
                suppressContentEditableWarning
                onBlur={handleTitleChange}
                onKeyDown={handleKeyDown}
                ref={titleRef}
                dangerouslySetInnerHTML={{ __html: editableTitle }}
                placeholder={mode === "create" ? "Enter title..." : ""}
              />
            ) : (
              <h2 className="header-title">{editableTitle}</h2>
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

            {(mode === "edit" || mode === "create") &&
              permissions.canAssignUsers && (
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
            <Dropdown
              options={statusOptions}
              selectedOption={status}
              onSelect={handleDropdownSelect}
              disabled={mode === "view" || !permissions.canChangeStatus}
            />
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="header-date-creator">
          <div className="header-creator">
            <span>
              {creatorUser.firstName} {creatorUser.lastName}
            </span>
            <AvatarList
              avatars={[creatorAvatar]}
              showTooltip={false}
              stack={false}
            />
          </div>
        </div>

        <div className="header-actions">
          {(mode === "edit" || mode === "create") && permissions.canSave && (
            <button className="header-save" onClick={onSaveClick}>
              <Save size={16} />
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopSection;
