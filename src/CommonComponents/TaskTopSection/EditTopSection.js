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
  const dropdownRef = useRef(null);
  const titleRef = useRef(null);

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

  // Prepare selected participants for AvatarList
  const selectedParticipants = (assignedTo || []).map((assigned) => {
    const assignedId =
      typeof assigned === "string" || typeof assigned === "number"
        ? assigned
        : assigned?.id;
    const assignedName =
      typeof assigned === "object" && assigned?.name
        ? assigned.name
        : undefined;

    const fullUser = users.find((u) => u.id === assignedId);
    const firstName = fullUser?.firstName || assignedName?.split(" ")[0] || "User";
    const lastName = fullUser?.lastName || assignedName?.split(" ")[1] || "";
    const fullName = assignedName || `${firstName} ${lastName}`.trim();

    return {
      id: assignedId,
      name: fullName,
      fallback: (firstName?.charAt(0) || "?").toUpperCase(),
      size: "20px",
      shape: "circle",
    };
  });

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

  const handleUserSelect = (selected) => {
    // Pass only IDs to parent
    const selectedIds = selected.map((option) => option.value);
    onParticipantsChange(selectedIds);
  };

  // Prepare dropdown options from users list
  const userOptions = users.map((user) => ({
    value: user.id,
    label: `${user.firstName} ${user.lastName}`,
  }));

  // Prepare selected options for dropdown
  const selectedOptions = (assignedTo || []).map((item) => {
    const id =
      typeof item === "string" || typeof item === "number" ? item : item?.id;
    const nameFromItem = typeof item === "object" ? item?.name : undefined;
    const fallbackName = users.find((u) => u.id === id);
    return {
      value: id,
      label:
        nameFromItem ||
        (fallbackName
          ? `${fallbackName.firstName} ${fallbackName.lastName}`
          : "Unknown User"),
    };
  });

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
            <AvatarList avatars={selectedParticipants} maxVisible={2} />

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
                      <Dropdown
                        options={userOptions}
                        onSelect={handleUserSelect}
                        multiSelect={true}
                        selectedOptions={selectedOptions}
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
