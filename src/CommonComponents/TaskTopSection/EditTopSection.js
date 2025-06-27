import React, { useEffect, useState, useRef } from "react";
import { ArrowLeft, Save } from "lucide-react";
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
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const dropdownRef = useRef(null);
  const titleRef = useRef(null);

  const creatorUser = users.find(user =>
    `${user.firstName} ${user.lastName}` === createdBy
  ) || { firstName: createdBy?.split(' ')[0] || 'User', lastName: createdBy?.split(' ')[1] || '' };

  const creatorAvatar = {
    id: 'creator',
    name: createdBy,
    fallback: creatorUser.firstName?.charAt(0).toUpperCase() || "U",
    size: "24px",
    shape: "circle",
  };

  // ✅ Update selected user IDs from assignedTo (assumed to be array of IDs)
  useEffect(() => {
    if (users.length > 0 && assignedTo.length > 0) {
      setSelectedUserIds(assignedTo);
    }
  }, [users, assignedTo]);

  // ✅ Notify parent with selected participants as array of IDs
  useEffect(() => {
    if (onParticipantsChange) {
      onParticipantsChange(selectedUserIds);
    }
  }, [selectedUserIds, onParticipantsChange]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setEditableTitle(title || "");
  }, [title]);

  useEffect(() => {
    if (mode === "create" && titleRef.current && !title) {
      titleRef.current.focus();
    }
  }, [mode, title]);

  const selectedParticipants = users
    .filter(user => selectedUserIds.includes(user.id))
    .map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      fallback: user.firstName?.charAt(0).toUpperCase() || "?",
      size: "20px",
      shape: "circle",
    }));

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
    setIsDropdownOpen(prev => !prev);
  };

  const handleUserSelect = (selected) => {
    const ids = Array.isArray(selected)
      ? selected.map(s => s.value)
      : [selected.value];
    setSelectedUserIds(ids);
  };

  return (
    <div className="header-wrapper">
      <div className="header-left">
        <div className="header-top-left">
          <button className="header-back-button" onClick={onBackClick}>
            <ArrowLeft size={20} />
          </button>
          <div className="header-title-container">
            {(mode === "edit" || mode === "create") ? (
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
            <AvatarList avatars={selectedParticipants} maxVisible={2} />

            {(mode === "edit" || mode === "create") && permissions.canAssignUsers && (
              <div className="add-participant-section">
                <button 
                  className="avatar-add-button" 
                  onClick={handleAddButtonClick}
                >
                  +
                </button>
                {isDropdownOpen && (
                  <div className="inline-dropdown" ref={dropdownRef}>
                    <Dropdown
                      options={users.map(user => ({
                        value: user.id,
                        label: `${user.firstName} ${user.lastName}`,
                      }))}
                      onSelect={handleUserSelect}
                      multiSelect={true}
                      selectedOptions={selectedUserIds.map(id => {
                        const u = users.find(u => u.id === id);
                        return {
                          value: id,
                          label: `${u?.firstName || ''} ${u?.lastName || ''}`
                        };
                      })}
                    />
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
            <span>{createdBy}</span>
            <AvatarList
              avatars={[creatorAvatar]}
              showTooltip={false}
              stack={false}
            />
          </div>
        </div>

        <div className="header-actions">
          {(mode === "edit" || mode === "create") && permissions.canSave && (
            <button
              className="header-save"
              onClick={onSaveClick}
            >
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
