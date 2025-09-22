import React, { useEffect, useState } from "react";
import CheckList from "../../../CommonComponents/CheckList/CheckList";
import TextEditor from "../../../CommonComponents/TextEditor/TextEditor";
import Dropdown from "../../../CommonComponents/Dropdown/Dropdown";
import { Wand } from "lucide-react";
import "./TaskDetail.css";

const TaskDetail = ({ taskData, onUpdate, mode = "view", permissions = {}, eventDate: eventDateProp, errors = {}, onClearError }) => {
  const prevModeRef = React.useRef(mode);
  
  // Parse initial datetime from taskData or use current datetime
  const initialDateTime = taskData.date 
    ? new Date(taskData.date)
    : new Date();
  
  // Format for datetime-local input (YYYY-MM-DDTHH:mm)
  const [localDate, setLocalDate] = useState(
    initialDateTime.toISOString().slice(0, 10)
  );
  const [localTime, setLocalTime] = useState(
    initialDateTime.toISOString().slice(11, 16)
  );
  const [quantity, setQuantity] = useState(taskData.quantity || 1);
  const [selectedType, setSelectedType] = useState(
    taskData.type ? { label: taskData.type, value: taskData.type } : null
  );
  const [checklistData, setChecklistData] = useState(
    Array.isArray(taskData.checklist) ? taskData.checklist : []
  );
  const [content, setContent] = useState(taskData.description || "");

  // Hardcoded task types list
  const taskTypes = React.useMemo(() => [
    { label: "Standees", value: "Standees" },
    { label: "Banner", value: "Banner" },
    { label: "Stage Flex", value: "Stage Flex" },
    { label: "Brochure / Leaflet", value: "Brochure / Leaflet" },
    { label: "Placards / Poster", value: "Placards / Poster" },
    { label: "Invitation/Envelope", value: "Invitation/Envelope" },
    { label: "certificates/trophies", value: "certificates/trophies" },
  ], []);

  const isDisabled = mode === "view" || !permissions.canEdit;

  // Reset form when switching to view mode only - but preserve user input during validation
  useEffect(() => {
    if (mode === "view" && prevModeRef.current !== "view") {
      // Only reset if we're actually switching from edit/create to view
      // Don't reset if we're already in view mode to prevent clearing during validation
      const dateTime = taskData.date ? new Date(taskData.date) : new Date();
      setLocalDate(dateTime.toISOString().slice(0, 10));
      setLocalTime(dateTime.toISOString().slice(11, 16));
      setQuantity(taskData.quantity || 1);
      setSelectedType(
        taskData.type ? { label: taskData.type, value: taskData.type } : null
      );
      setChecklistData(Array.isArray(taskData.checklist) ? taskData.checklist : []);
      setContent(taskData.description || "");
    }
    prevModeRef.current = mode;
  }, [mode]); // Only depend on mode, not taskData to prevent clearing during validation
  // eslint-disable-next-line react-hooks/exhaustive-deps

  // Initialize form data only once when component mounts or task changes
  useEffect(() => {
    if (taskData.id && mode !== "create") {
      const dateTime = taskData.date ? new Date(taskData.date) : new Date();
      setLocalDate(dateTime.toISOString().slice(0, 10));
      setLocalTime(dateTime.toISOString().slice(11, 16));
      setQuantity(taskData.quantity || 1);
      setSelectedType(
        taskData.type ? { label: taskData.type, value: taskData.type } : null
      );
      setChecklistData(Array.isArray(taskData.checklist) ? taskData.checklist : []);
      setContent(taskData.description || "");
    }
  }, [taskData.id]); // Only reset when task ID changes (new task loaded)
  // eslint-disable-next-line react-hooks/exhaustive-deps

  // Initialize form data for create mode
  useEffect(() => {
    if (mode === "create") {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      
      setLocalDate(now.toISOString().slice(0, 10));
      setLocalTime(oneHourLater.toISOString().slice(11, 16));
      setQuantity(1);
      setSelectedType(null);
      setChecklistData([{ text: "", checked: false, isPlaceholder: false }]);
      setContent("");
      
      // Set the initial due date to 1 hour from now
      const initialDateTime = oneHourLater.toISOString();
      onUpdate("date", initialDateTime);
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync selectedType with taskData.type changes
  useEffect(() => {
    if (taskData.type && taskData.type !== selectedType?.value) {
      const matchingOption = taskTypes.find(option => option.value === taskData.type);
      if (matchingOption) {
        setSelectedType(matchingOption);
      } else {
        // Create a new option if not found in predefined list
        setSelectedType({ label: taskData.type, value: taskData.type });
      }
    }
  }, [taskData.type, selectedType?.value, taskTypes]);

  const handleTypeChange = (option) => {
    setSelectedType(option);
    onUpdate("type", option?.value || "");
    if (errors?.type && onClearError) onClearError('type');
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setLocalDate(newDate);
    
    // Combine with existing time
    const combinedDateTime = new Date(`${newDate}T${localTime}`).toISOString();
    onUpdate("date", combinedDateTime);
    
    // Clear date error if it exists
    if (errors?.date && onClearError) onClearError('date');
    
    // Check if the new date/time combination is valid
    if (!isDateTimeValid(newDate, localTime)) {
      if (onClearError) onClearError('time');
    }
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setLocalTime(newTime);
    
    // Combine with existing date
    const combinedDateTime = new Date(`${localDate}T${newTime}`).toISOString();
    onUpdate("date", combinedDateTime);
    
    // Clear time error if it exists
    if (errors?.time && onClearError) onClearError('time');
    
    // Check if the new date/time combination is valid
    if (!isDateTimeValid(localDate, newTime)) {
      if (onClearError) onClearError('time');
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

  const minDate = (() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 10);
  })();

  // Calculate minimum time (1 hour from now)
  const getMinTime = () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000); // Add 1 hour
    return oneHourLater.toISOString().slice(11, 16);
  };

  // Check if the selected date and time is at least 1 hour from now
  const isDateTimeValid = (date, time) => {
    if (!date || !time) return true; // Allow empty values for initial state
    
    const selectedDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    
    return selectedDateTime >= oneHourLater;
  };

  const maxDate = (() => {
    if (!eventDateProp) return undefined;
    const end = new Date(eventDateProp);
    end.setMinutes(end.getMinutes() - end.getTimezoneOffset());
    // Task must be earlier than event date → set max to event date minus 1 day
    end.setDate(end.getDate() - 1);
    return end.toISOString().slice(0, 10);
  })();

  return (
    <div className="task-detail-container">
      <div className="task-right-section task-section">
        <div className="form-container">
          <div className={`input-group ${errors?.type ? 'error' : ''}`}>
            <label htmlFor="task-type">Creative Type</label>
            <div className="input-box">
              <span className="icon"><Wand /></span>
              {mode === "view" ? (
                <div className="view-mode-text">
                  {selectedType?.label || selectedType?.value || "Not specified"}
                </div>
              ) : (
                <Dropdown
                  id="task-type"
                  name="taskType"
                  options={taskTypes}
                  selectedOption={selectedType}
                  onSelect={handleTypeChange}
                  disabled={isDisabled}
                  placeholder="Select type"
                />
              )}
            </div>
            {errors?.type && <div className="field-error">{errors.type}</div>}
          </div>

          <div className={`input-group ${errors?.date ? 'error' : ''}`}>
            <label htmlFor="task-date">Due Date</label>
            <div className="input-box">
              {mode === "view" ? (
                <div className="view-mode-text">
                  {localDate ? new Date(`${localDate}T${localTime}`).toLocaleDateString() : "Not specified"}
                </div>
              ) : (
                <input
                  id="task-date"
                  name="taskDate"
                  type="date"
                  value={localDate}
                  onChange={handleDateChange}
                  min={minDate}
                  max={maxDate}
                  disabled={isDisabled}
                />
              )}
            </div>
            {errors?.date && <div className="field-error">{errors.date}</div>}
          </div>

          <div className={`input-group ${errors?.time ? 'error' : ''}`}>
            <label htmlFor="task-time">Due Time</label>
            <div className="input-box">
              {mode === "view" ? (
                <div className="view-mode-text">
                  {localTime ? new Date(`2000-01-01T${localTime}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Not specified"}
                </div>
              ) : (
                <input
                  id="task-time"
                  name="taskTime"
                  type="time"
                  value={localTime}
                  onChange={handleTimeChange}
                  disabled={isDisabled}
                  min={localDate === new Date().toISOString().slice(0, 10) ? getMinTime() : undefined}
                />
              )}
            </div>
            {mode !== "view" && localDate === new Date().toISOString().slice(0, 10) && (
              <div className="field-hint">
                Due time must be at least 1 hour from now (minimum: {getMinTime()})
              </div>
            )}
            {errors?.time && <div className="field-error">{errors.time}</div>}
          </div>

          <div className="input-group">
            <label htmlFor="task-quantity">Nos</label>
            <div className="input-box number-input">
              {mode === "view" ? (
                <div className="view-mode-text quantity-badge">
                  {quantity}
                </div>
              ) : (
                <input
                  id="task-quantity"
                  name="taskQuantity"
                  type="number"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="no-spinner"
                  disabled={isDisabled}
                  min={1}
                />
              )}
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

      <div className="task-left-section task-section">
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