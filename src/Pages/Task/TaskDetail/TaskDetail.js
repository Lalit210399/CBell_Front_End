import React, { useEffect, useState } from "react";
import CheckList from "../../../CommonComponents/CheckList/CheckList";
import TextEditor from "../../../CommonComponents/TextEditor/TextEditor";
import Dropdown from "../../../CommonComponents/Dropdown/Dropdown";
import { Wand } from "lucide-react";
import "./TaskDetail.css";

const TaskDetail = ({ taskData, onUpdate, mode = "view", permissions = {}, eventDate: eventDateProp }) => {
  // Parse initial datetime from taskData or use current datetime
  const initialDateTime = taskData.date 
    ? new Date(taskData.date)
    : new Date();
  
  // Format for datetime-local input (YYYY-MM-DDTHH:mm)
  const [localDateTime, setLocalDateTime] = useState(
    initialDateTime.toISOString().slice(0, 16)
  );
  const [quantity, setQuantity] = useState(taskData.quantity || 1);
  const [selectedType, setSelectedType] = useState(
    taskData.type ? { label: taskData.type, value: taskData.type } : null
  );
  const [checklistData, setChecklistData] = useState(
    Array.isArray(taskData.checklist) ? taskData.checklist : []
  );
  const [content, setContent] = useState(taskData.description || "");

  const dropdownOptions = [
    { label: "Standees", value: "Standees" },
    { label: "Banner", value: "Banner" },
    { label: "Stage Flex", value: "Stage Flex" },
    { label: "Brochure / Leaflet", value: "Brochure / Leaflet" },
    { label: "Placards / Poster", value: "Placards / Poster" },
    { label: "Invitation/Envelope", value: "Invitation/Envelope" },
    { label: "certificates/trophies", value: "certificates/trophies" },
  ];

  const isDisabled = mode === "view" || !permissions.canEdit;

  // Reset form when switching to view mode or task data changes
  useEffect(() => {
    if (mode === "view") {
      const dateTime = taskData.date ? new Date(taskData.date) : new Date();
      setLocalDateTime(dateTime.toISOString().slice(0, 16));
      setQuantity(taskData.quantity || 1);
      setSelectedType(
        taskData.type ? { label: taskData.type, value: taskData.type } : null
      );
      setChecklistData(Array.isArray(taskData.checklist) ? taskData.checklist : []);
      setContent(taskData.description || "");
    }
  }, [taskData, mode]);

  const handleTypeChange = (option) => {
    setSelectedType(option);
    if (option?.value !== taskData.type) {
      onUpdate("type", option?.value || "");
    }
  };

  const handleDateTimeChange = (e) => {
    const newLocalDateTime = e.target.value;
    setLocalDateTime(newLocalDateTime);
    
    // Convert to ISO format with timezone (YYYY-MM-DDTHH:mm:ss.sssZ)
    const isoDateTime = new Date(newLocalDateTime).toISOString();
    onUpdate("date", isoDateTime);
  };

  const handleQuantityChange = (e) => {
    const val = parseInt(e.target.value, 10);
    const newQty = isNaN(val) ? 1 : val;
    setQuantity(newQty);
    if (newQty !== taskData.quantity) {
      onUpdate("quantity", newQty);
    }
  };

  const handleChecklistChange = (newChecklist) => {
    setChecklistData(newChecklist);
    if (JSON.stringify(newChecklist) !== JSON.stringify(taskData.checklist)) {
      onUpdate("checklist", newChecklist);
    }
  };

  const handleContentChange = (newContent) => {
    setContent(newContent);
    if (newContent !== taskData.description) {
      onUpdate("description", newContent);
    }
  };

  const minDateTime = (() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  })();

  const maxDateTime = (() => {
    if (!eventDateProp) return undefined;
    const end = new Date(eventDateProp);
    end.setMinutes(end.getMinutes() - end.getTimezoneOffset());
    // Task must be earlier than event date → set max to event date minus 1 minute
    end.setMinutes(end.getMinutes() - 1);
    return end.toISOString().slice(0, 16);
  })();

  return (
    <div className="detail_container">
      <div className="Right_Section Section">
        <div className="form-container">
          <div className="input-group">
            <label htmlFor="task-type">Creative Type</label>
            <div className="input-box">
              <span className="icon"><Wand /></span>
              <Dropdown
                id="task-type"
                name="taskType"
                options={dropdownOptions}
                selectedOption={selectedType}
                onSelect={handleTypeChange}
                disabled={isDisabled}
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="task-datetime">Due Date & Time</label>
            <div className="input-box">
              <input
                id="task-datetime"
                name="taskDateTime"
                type="datetime-local"
                value={localDateTime}
                onChange={handleDateTimeChange}
                min={minDateTime}
                max={maxDateTime}
                disabled={isDisabled}
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="task-quantity">Nos</label>
            <div className="input-box number-input">
              <input
                id="task-quantity"
                name="taskQuantity"
                type="number"
                value={quantity}
                onChange={handleQuantityChange}
                className="no-spinner"
                disabled={isDisabled}
              />
            </div>
          </div>
        </div>

        <div className="checkList">
          <label>Specification</label>
          <CheckList
            initialItems={checklistData}
            onChecklistChange={handleChecklistChange}
            mode={mode}
            canEdit={permissions.canEdit}
          />
          {eventDateProp && (
            <div className="event-date-hint">Event date: {new Date(eventDateProp).toLocaleString()}</div>
          )}
        </div>
      </div>

      <div className="Left_Section Section">
        <TextEditor
          initialContent={content}
          onContentChange={handleContentChange}
          isFullWidth={true}
          mode={mode}
          canEdit={permissions.canEdit}
        />
      </div>
    </div>
  );
};

export default TaskDetail;