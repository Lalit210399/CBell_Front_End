import React, { useState, useEffect } from "react";
import { ArrowLeft, Save } from "lucide-react";
import AvatarList from "../Avatar/index";
import { FaCalendarAlt, FaClock } from "react-icons/fa";
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
      `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase().includes(q)
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

  const creatorUser = {
    firstName: data?.creatorName || "User",
    lastName: "", // or get from data if available
  };

  const creatorAvatar = {
    id: "creator",
    name: creatorUser.firstName + " " + creatorUser.lastName,
    fallback: creatorUser.firstName?.charAt(0).toUpperCase() || "U",
    size: "24px",
    shape: "circle",
  };

  return (
    <div className="detail-header-container">
      <div className="header-row-top">
        <button className="back-button" onClick={onBackClick}>
          <ArrowLeft size={24} color="white" />
        </button>
        <input
          className="event-name-input"
          type="text"
          placeholder="Enter event name"
          value={editableTitle}
          onChange={handleTitleChange}
        />
        <span className="created-by-pill">
          Created by
          <span className="creator-avatar">
            {creatorAvatar.fallback}
          </span>
        </span>
      </div>
      <div className="header-row-bottom">
        <span className="team-label">Team:</span>
        {/* Team info here if needed */}
        <div className="right-elements">
          <span className="type-label">Type:</span>
          <select
            className="event-type-dropdown"
            value={editableTypeDesc}
            onChange={handleTypeDescChange}
          >
            <option value="">Select Event Type</option>
            <option value="meeting">Meeting</option>
            <option value="call">Call</option>
            <option value="review">Review</option>
            {/* Add more options as needed */}
          </select>
          <span className="date-label">
            Date:
            {/* <FaCalendarAlt style={{ marginLeft: 4, marginRight: 4 }} /> */}
            <input
              className="date-input"
              type="date"
              value={editableDate.split("T")[0]}
              onChange={e => setEditableDate(e.target.value + editableDate.slice(10))}
            />
          </span>
          <span className="time-label">
            Time:
            {/* <FaClock style={{ marginLeft: 4, marginRight: 4 }} /> */}
            <input
              className="time-input"
              type="time"
              value={editableDate.split("T")[1] || ""}
              onChange={e => setEditableDate(editableDate.split("T")[0] + "T" + e.target.value)}
            />
          </span>
          <button className="save-btn" onClick={handleSaveClick}>
            <Save size={16} style={{ marginRight: 6 }} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailTopSection;