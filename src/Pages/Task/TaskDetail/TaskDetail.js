import React, { useEffect, useState } from "react";
import CheckList from "../../../CommonComponents/CheckList/CheckList";
import TextEditor from "../../../CommonComponents/TextEditor/TextEditor";
import Dropdown from "../../../CommonComponents/Dropdown/Dropdown";
import { Wand } from "lucide-react";
import "./TaskDetail.css";

const TaskDetail = ({ taskData, formData = {}, onUpdate, mode = "view", eventDate: eventDateProp, errors = {}, onClearError }) => {
  const prevModeRef = React.useRef(mode);
  
  // Merge taskData and formData for display using useMemo to prevent infinite re-renders
  const mergedData = React.useMemo(() => ({ ...taskData, ...formData }), [taskData, formData]);
  
  // Parse initial datetime from merged data or use current datetime
  const initialDateTime = mergedData.date 
    ? new Date(mergedData.date)
    : new Date();
  
  // Format for datetime-local input (YYYY-MM-DDTHH:mm)
  const [localDate, setLocalDate] = useState(
    initialDateTime.toISOString().slice(0, 10)
  );
  const [localTime, setLocalTime] = useState(
    initialDateTime.toISOString().slice(11, 16)
  );
  const [quantity, setQuantity] = useState(mergedData.quantity || 1);
  const [selectedType, setSelectedType] = useState(
    mergedData.type ? { label: mergedData.type, value: mergedData.type } : null
  );
  const [checklistData, setChecklistData] = useState(
    Array.isArray(mergedData.checklist) ? mergedData.checklist : []
  );
  const [content, setContent] = useState(mergedData.description || "");

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

  const isDisabled = mode === "view";

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
  }, [mode, taskData.id, taskData]); // Include taskData to satisfy dependencies

  // Initialize form data when taskData changes (only for existing tasks)
  useEffect(() => {
    if (taskData.id && mode !== "create") {
      const dateTime = taskData.date ? new Date(taskData.date) : new Date();
      setLocalDate(dateTime.toISOString().slice(0, 10));
      setLocalTime(dateTime.toISOString().slice(11, 16));
      setQuantity(taskData.quantity || 1);
      
      // Handle type selection
      if (taskData.type) {
        const matchingOption = taskTypes.find(option => option.value === taskData.type);
        if (matchingOption) {
          setSelectedType(matchingOption);
        } else {
          setSelectedType({ label: taskData.type, value: taskData.type });
        }
      } else {
        setSelectedType(null);
      }
      
      // Handle checklist data
      const checklistArray = Array.isArray(taskData.checklist) ? taskData.checklist : [];
      setChecklistData(checklistArray);
      
      // Handle description content
      const descriptionContent = taskData.description || "";
      setContent(descriptionContent);
    }
  }, [taskData, mode, taskTypes]);

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

  // These sync effects are now handled in the main initialization useEffect above

  const handleTypeChange = React.useCallback((option) => {
    setSelectedType(option);
    onUpdate("type", option?.value || "");
    if (errors?.type && onClearError) onClearError('type');
  }, [onUpdate, errors?.type, onClearError]);

  const handleDateChange = React.useCallback((e) => {
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
  }, [localTime, onUpdate, errors?.date, onClearError]);

  const handleTimeChange = React.useCallback((e) => {
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
  }, [localDate, onUpdate, errors?.time, onClearError]);

  const handleQuantityChange = React.useCallback((e) => {
    const val = parseInt(e.target.value, 10);
    const newQty = isNaN(val) ? 1 : val;
    setQuantity(newQty);
    onUpdate("quantity", newQty);
  }, [onUpdate]);

  const handleChecklistChange = React.useCallback((newChecklist) => {
    setChecklistData(newChecklist);
    onUpdate("checklist", newChecklist);
  }, [onUpdate]);

  const handleContentChange = React.useCallback((newContent) => {
    setContent(newContent);
    onUpdate("description", newContent);
  }, [onUpdate]);

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
            canEdit={mode !== "view"}
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
          canEdit={mode !== "view"}
        />
      </div>
    </div>
  );
};

export default TaskDetail;