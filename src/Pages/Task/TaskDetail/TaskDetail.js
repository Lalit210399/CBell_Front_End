import React, { useEffect, useState } from "react";
import CheckList from "../../../CommonComponents/CheckList/CheckList";
import TextEditor from "../../../CommonComponents/TextEditor/TextEditor";
import Dropdown from "../../../CommonComponents/Dropdown/Dropdown";
import { Wand } from "lucide-react";
import "./TaskDetail.css";

const EditDetail = ({ taskData, onUpdate, mode = "view", permissions = {} }) => {
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
    { label: "Podcast", value: "Podcast" },
    { label: "Success Story", value: "Success Story" },
    { label: "Testimonial", value: "Testimonial" },
    { label: "Newsletter", value: "Newsletter" },
    { label: "Social Media Post", value: "Social Media Post" },
  ];

  const isDisabled = mode === "view" || !permissions.canEdit;

  useEffect(() => {
    if (selectedType?.value !== taskData.type) {
      onUpdate("type", selectedType?.value || "");
    }
  }, [selectedType]);

  useEffect(() => {
    if (selectedDate !== taskData.date) {
      onUpdate("date", selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (quantity !== taskData.quantity) {
      onUpdate("quantity", quantity);
    }
  }, [quantity]);

  useEffect(() => {
    onUpdate("checklist", checklistData);
  }, [checklistData]);

  useEffect(() => {
    onUpdate("description", content);
  }, [content]);

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
                onSelect={setSelectedType}
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
                onChange={(e) => setSelectedDate(e.target.value)}
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
                min="1"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setQuantity(isNaN(val) ? 1 : val);
                }}
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
            onChecklistChange={setChecklistData}
            mode={mode}
            canEdit={permissions.canEdit}
          />
        </div>
      </div>

      <div className="Left_Section Section">
        <TextEditor
          initialContent={content}
          onContentChange={setContent}
          isFullWidth={true}
          mode={mode}
          canEdit={permissions.canEdit}
        />
      </div>
    </div>
  );
};

export default EditDetail;