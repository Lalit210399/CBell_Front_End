import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Calendar } from "lucide-react";
import AvatarList from "../Avatar/index";
import Dropdown from "../Dropdown/Dropdown";
import "./DetailTopSection.css";

const DetailTopSection = ({
  mode,
  onBackClick,
  onNewTaskClick,
  onSaveClick,
  data,
  participants = [],
  users = [],
  permissions = {},
}) => {
  const [editableTitle, setEditableTitle] = useState(data?.title || "");
  const [editableDate, setEditableDate] = useState(data?.date || "");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const { createdBy, creatorAvatar } = data;

  useEffect(() => {
    if (mode === "create") {
      setEditableTitle("");
      setEditableDate("");
      setSelectedUserIds([]);
    } else {
      setEditableTitle(data?.title || "");
      setEditableDate(data?.date || "");
    }
  }, [data, mode]);


  useEffect(() => {
    setEditableTitle(data?.title || "");
    setEditableDate(data?.date || "");
  }, [data]);

  const handleTitleChange = (e) => {
    setEditableTitle(e.target.value);
  };

  const handleDateChange = (e) => {
    setEditableDate(e.target.value);
  };

  const handleAddButtonClick = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleUserSelect = (selectedUser) => {
    if (Array.isArray(selectedUser)) {
      // Handle multi-select
      const selectedIds = selectedUser.map((user) => user.value); // Extract IDs
      setSelectedUserIds(selectedIds);
    } else {
      // Handle single-select (if needed)
      setSelectedUserIds([selectedUser.value]);
    }
    console.log("Selected User IDs:", selectedUserIds); // Log selected IDs
  };

  const handleSaveClick = () => {
    const payload = {
      title: editableTitle,
      date: editableDate,
      userIds: selectedUserIds, // Include selected user IDs in the payload
    };
    console.log("Payload:", payload); // Debugging payload
    onSaveClick(payload);
  };

  return (
    <div className="detail-header-container">
      <div className="header-left-section">
        <div className="top-left">
          <button className="back-button" onClick={onBackClick}>
            <ArrowLeft size={20} />
          </button>
          <div className="header-titles">
            {(mode === "edit" || mode === "create") ? (
              <input
                type="text"
                className="editable-title-input"
                value={editableTitle}
                onChange={handleTitleChange}
                placeholder={mode === "create" ? "Enter event title" : ""}
              />
            ) : (
              <span className="header_title">{editableTitle}</span>
            )}
          </div>
        </div>
        <div className="avatar-dropdown-container">
          <div className="avatar-group">
            <AvatarList avatars={participants} />
            {(mode === "edit" || mode === "create") && (
              <>
                <button
                  className="avatar-add-button"
                  onClick={handleAddButtonClick}
                >
                  +
                </button>
                {isDropdownOpen && (
                  <div className="popup-dropdown">
                    <Dropdown
                      options={users.map((user) => ({
                        value: user.id,
                        label: `${user.firstName} ${user.lastName}`,
                      }))}
                      onSelect={handleUserSelect}
                      multiSelect={true} // Allow multiple selections
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="right-section">
        <div className="date-creator-container">
          <div className="date-section">
            {mode === "view" && <Calendar size={16} />}
            {(mode === "edit" || mode === "create") ? (
              <input
                type="date"
                className="editable-date-input"
                value={editableDate}
                onChange={handleDateChange}
                placeholder="Select date"
              />
            ) : (
              <span>{editableDate}</span>
            )}
          </div>

          <div className="creator-section">
            <span>Created By</span>
            <div className="creator-avatar">
              <AvatarList avatars={[creatorAvatar]} />
            </div>
          </div>
        </div>

        <div className="action-buttons">
          {(mode === "view" || mode === "edit") && permissions.canCreateTask && (
            <button className="new-task-btn" onClick={onNewTaskClick}>
              New Task
            </button>
          )}

          {(mode === "edit" || mode === "create") && permissions.canSave && (
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