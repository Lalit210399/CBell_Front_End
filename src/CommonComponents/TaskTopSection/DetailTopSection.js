import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Calendar } from "lucide-react";
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
  initialDate = ""
}) => {
  const [editableTitle, setEditableTitle] = useState(
    mode === "create" ? "" : data?.title || ""
  );
  const [editableDate, setEditableDate] = useState(
    mode === "create" ? formatDateTimeLocal(initialDate || new Date()) : formatDateTimeLocal(data?.date || new Date())
  );
  const [editableTypeDesc, setEditableTypeDesc] = useState(
    mode === "create" ? "" : data?.typeDesc || ""
  );
  //console.log("data in DetailTopSection:", data);

  useEffect(() => {
    if (mode === "create") {
      if (editableTitle !== "") setEditableTitle("");
      if (editableDate !== formatDateTimeLocal(initialDate || new Date())) setEditableDate(formatDateTimeLocal(initialDate || new Date()));
      if (editableTypeDesc !== "") setEditableTypeDesc("");
    } else {
      if (editableTitle !== (data?.title || "")) setEditableTitle(data?.title || "");
      if (editableDate !== formatDateTimeLocal(data?.date || new Date())) setEditableDate(formatDateTimeLocal(data?.date || new Date()));
      if (editableTypeDesc !== (data?.typeDesc || "")) setEditableTypeDesc(data?.typeDesc || "");
    }
  }, [data?.title, data?.date, data?.typeDesc, mode, initialDate, editableTitle, editableDate, editableTypeDesc]);

  const handleTitleChange = (e) => {
    setEditableTitle(e.target.value);
  };

  const handleDateChange = (e) => {
    setEditableDate(e.target.value);
  };

  const handleTypeDescChange = (e) => {
    setEditableTypeDesc(e.target.value);
  };

  const handleSaveClick = () => {
    const payload = {
      title: editableTitle,
      date: editableDate,
      typeDesc: editableTypeDesc,
    };
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
              <div className="edit-mode-fields">
                <input
                  type="text"
                  className="editable-title-input"
                  value={editableTitle}
                  onChange={handleTitleChange}
                  placeholder={mode === "create" ? "Enter event title" : ""}
                />
                <span className="event-type-text">{data?.type || "No type specified"}</span>
                {/* <textarea
                  className="editable-desc-input"
                  value={editableTypeDesc}
                  onChange={handleTypeDescChange}
                  placeholder="Enter event type description"
                  rows={2}
                /> */}
              </div>
            ) : (
              <div className="view-mode-fields">
                <span className="header_title">{editableTitle}</span>
                <span className="event-type-text">{data?.type || "No type specified"}</span>
                {/* {data?.typeDesc && (
                  <span className="event-type-desc">{data.typeDesc}</span>
                )} */}
              </div>
            )}
          </div>
        </div>
        {mode === "view" && (
          <div className="avatar-dropdown-container">
            <div className="avatar-group">
              <AvatarList avatars={participants} maxVisible={2} />
            </div>
          </div>
        )}
      </div>

      <div className="right-section">
        <div className="date-creator-container">
          <div className="date-section">
            {mode === "view" && <Calendar size={16} />}
            {(mode === "edit" || mode === "create") ? (
              <input
                type="datetime-local"
                className="editable-date-input"
                value={editableDate}
                onChange={handleDateChange}
                placeholder="Select date and time"
              />
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