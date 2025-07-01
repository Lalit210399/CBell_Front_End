import React, { useEffect, useState } from "react";
import CheckList from "../../../CommonComponents/CheckList/CheckList";
import TextEditor from "../../../CommonComponents/TextEditor/TextEditor";
import Dropdown from "../../../CommonComponents/Dropdown/Dropdown";
import { Wand } from "lucide-react";
import "./TaskDetail.css";

const TaskDetail = ({ taskData, onUpdate, mode = "view", permissions = {} }) => {
  const [selectedDate, setSelectedDate] = useState(taskData.date || "");
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
      setSelectedDate(taskData.date || "");
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

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    if (newDate !== taskData.date) {
      onUpdate("date", newDate);
    }
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
            <label htmlFor="task-date">Due Date</label>
            <div className="input-box">
              <input
                id="task-date"
                name="taskDate"
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
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
