import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Calendar } from "lucide-react";
import AvatarList from "../Avatar/index";
import "./DetailTopSection.css";

function formatDateInput(date) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date + "T00:00:00") : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
    mode === "create" ? formatDateInput(initialDate) : formatDateInput(data?.date)
  );
  const [editableTypeDesc, setEditableTypeDesc] = useState(
    mode === "create" ? "" : data?.typeDesc || ""
  );
  console.log("data in DetailTopSection:", data);

  useEffect(() => {
    if (mode === "create") {
      if (editableTitle !== "") setEditableTitle("");
      if (editableDate !== formatDateInput(initialDate)) setEditableDate(formatDateInput(initialDate));
      if (editableTypeDesc !== "") setEditableTypeDesc("");
    } else {
      if (editableTitle !== (data?.title || "")) setEditableTitle(data?.title || "");
      if (editableDate !== formatDateInput(data?.date)) setEditableDate(formatDateInput(data?.date));
      if (editableTypeDesc !== (data?.typeDesc || "")) setEditableTypeDesc(data?.typeDesc || "");
    }
  }, [data?.title, data?.date, data?.typeDesc, mode, initialDate]);

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