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
  onParticipantsChange = () => {},
}) => {
  const [editableTitle, setEditableTitle] = useState(title || ""); // Initialize with empty string if title is undefined
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const dropdownRef = useRef(null);
  const titleRef = useRef(null); // Add a ref for the title element

  // const getDummyAvatar = (name) => {
  //   return `https://i.pravatar.cc/400?u=${name}`;
  // };

  const creatorUser = users.find(user =>
    `${user.firstName} ${user.lastName}` === createdBy
  ) || { firstName: createdBy?.split(' ')[0] || 'User', lastName: createdBy?.split(' ')[1] || '' };

  const creatorAvatar = {
    id: 'creator',
    name: createdBy,
    // src: creatorUser.avatar || (createdBy),
    fallback: creatorUser.firstName?.charAt(0).toUpperCase() || "U",
    size: "24px",
    shape: "circle",
  };

  useEffect(() => {
    if (users.length > 0 && assignedTo.length > 0) {
      const matchedUserIds = users
        .filter(user => assignedTo.includes(`${user.firstName} ${user.lastName}`))
        .map(user => user.id);
      setSelectedUserIds(matchedUserIds);
    }
  }, [users, assignedTo]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedParticipants = users
    .filter((user) => selectedUserIds.includes(user.id))
    .map((user) => {
      const fullName = `${user.firstName} ${user.lastName}`;
      return {
        id: user.id,
        name: fullName,
        src: user.avatar || (fullName),
        fallback: user.firstName?.charAt(0).toUpperCase() || "?",
        size: "20px",
        shape: "circle",
      };
    });

  useEffect(() => {
    setEditableTitle(title || ""); // Handle case where title might be undefined
  }, [title]);

  useEffect(() => {
    if (mode === "create" && titleRef.current && !title) {
      // Focus the title input when in create mode and title is empty
      titleRef.current.focus();
    }
  }, [mode, title]);

  useEffect(() => {
    onParticipantsChange(selectedUserIds);
  }, [selectedUserIds, onParticipantsChange]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.innerText;
    setEditableTitle(newTitle);
    setTitle(newTitle);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent line breaks in the title
    }
  };

  const handleDropdownSelect = (option) => {
    setStatus(option);
  };

  const handleAddButtonClick = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleUserSelect = (selected) => {
    const ids = Array.isArray(selected)
      ? selected.map((s) => s.value)
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

        {/* Rest of your component remains the same */}
        <div className="header-avatar-dropdown">
          <div className="header-avatar-group">
            <AvatarList avatars={selectedParticipants} />

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
                    <Dropdown
                      options={users.map((user) => ({
                        value: user.id,
                        label: `${user.firstName} ${user.lastName}`,
                      }))}
                      onSelect={handleUserSelect}
                      multiSelect={true}
                      selectedOptions={selectedUserIds.map(id => ({
                        value: id,
                        label: `${users.find(u => u.id === id)?.firstName || ''} ${users.find(u => u.id === id)?.lastName || ''}`
                      }))}
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
              disabled={mode === "view"}
            />
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="header-date-creator">
          <div className="header-creator">
            <AvatarList
              avatars={[creatorAvatar]}
              showTooltip={false}
              stack={false}
            />
            <span>{createdBy}</span>
          </div>
        </div>

        <div className="header-actions">
          {(mode === "edit" || mode === "create") && (
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