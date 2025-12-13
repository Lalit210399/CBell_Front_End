import React, { useEffect, useState } from "react";
import CheckList from "../../../CommonComponents/CheckList/CheckList";
import TextEditor from "../../../CommonComponents/TextEditor/TextEditor";
import Dropdown from "../../../CommonComponents/Dropdown/Dropdown";
import { Wand } from "lucide-react";
import "./TaskDetail.css";

const TaskDetail = ({ taskData, formData = {}, onUpdate, mode = "view", eventDate: eventDateProp, errors = {}, onClearError, onChecklistUpdate = null, taskId = null }) => {
  const prevModeRef = React.useRef(mode);
  
  // Merge taskData and formData for display using useMemo to prevent infinite re-renders
  const mergedData = React.useMemo(() => ({ ...taskData, ...formData }), [taskData, formData]);
  
  
  // Parse initial datetime from merged data or use empty for create mode
  const initialDateTime = mergedData.date 
    ? new Date(mergedData.date)
    : null;
  
  // Format for datetime-local input (YYYY-MM-DDTHH:mm) - empty for create mode
  const [localDate, setLocalDate] = useState(
    initialDateTime ? initialDateTime.toISOString().slice(0, 10) : ""
  );
  const [localTime, setLocalTime] = useState(
    initialDateTime ? initialDateTime.toISOString().slice(11, 16) : ""
  );
  const [quantity, setQuantity] = useState(mergedData.quantity || 1);
  const [selectedType, setSelectedType] = useState(
    mergedData.type ? { label: mergedData.type, value: mergedData.type } : null
  );
  const [checklistData, setChecklistData] = useState(
    Array.isArray(mergedData.checklist) ? mergedData.checklist : []
  );
  const [content, setContent] = useState(mergedData.description || "");
  const [isUpdatingChecklist, setIsUpdatingChecklist] = useState(false);

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
      setLocalDate("");
      setLocalTime("");
      setQuantity(1);
      setSelectedType(null);
      setChecklistData([{ text: "", checked: false, isPlaceholder: false }]);
      setContent("");
      
      // Don't set any initial date - let user choose
      onUpdate("date", "");
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
    
    // Only combine with time if both are provided
    if (newDate && localTime) {
      const combinedDateTime = new Date(`${newDate}T${localTime}`).toISOString();
      onUpdate("date", combinedDateTime);
    } else if (newDate) {
      // If only date is provided, set date with default time (current time + 1 hour)
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      const defaultTime = oneHourLater.toISOString().slice(11, 16);
      setLocalTime(defaultTime);
      const combinedDateTime = new Date(`${newDate}T${defaultTime}`).toISOString();
      onUpdate("date", combinedDateTime);
    } else {
      // If date is cleared, clear the date
      onUpdate("date", "");
    }
    
    // Clear date error if it exists
    if (errors?.date && onClearError) onClearError('date');
    
    // Check if the new date/time combination is valid
    if (newDate && localTime && !isDateTimeValid(newDate, localTime)) {
      if (onClearError) onClearError('time');
    }
  }, [localTime, onUpdate, errors?.date, onClearError]);

  const handleTimeChange = React.useCallback((e) => {
    const newTime = e.target.value;
    setLocalTime(newTime);
    
    // Only combine with date if both are provided
    if (localDate && newTime) {
      const combinedDateTime = new Date(`${localDate}T${newTime}`).toISOString();
      onUpdate("date", combinedDateTime);
    } else if (newTime && !localDate) {
      // If only time is provided, set today's date with the selected time
      const today = new Date().toISOString().slice(0, 10);
      setLocalDate(today);
      const combinedDateTime = new Date(`${today}T${newTime}`).toISOString();
      onUpdate("date", combinedDateTime);
    } else if (!newTime) {
      // If time is cleared, clear the date
      onUpdate("date", "");
    }
    
    // Clear time error if it exists
    if (errors?.time && onClearError) onClearError('time');
    
    // Check if the new date/time combination is valid
    if (localDate && newTime && !isDateTimeValid(localDate, newTime)) {
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
    // Only update local state - no automatic API calls
    onUpdate("checklist", newChecklist);
    if (errors?.specification && onClearError) onClearError('specification');
  }, [onUpdate, errors?.specification, onClearError]);

  // Handle checklist update API call
  const handleChecklistUpdate = React.useCallback(async () => {
    if (!onChecklistUpdate || !taskId || isUpdatingChecklist) {
      return;
    }

    setIsUpdatingChecklist(true);
    try {
      await onChecklistUpdate(taskId, checklistData);
      // You can add a success message here if needed
    } catch (error) {
      console.error("Failed to update checklist:", error);
      // You can add error handling here if needed
    } finally {
      setIsUpdatingChecklist(false);
    }
  }, [onChecklistUpdate, taskId, checklistData, isUpdatingChecklist]);

  const handleContentChange = React.useCallback((newContent) => {
    setContent(newContent);
    onUpdate("description", newContent);
    if (errors?.description && onClearError) onClearError('description');
  }, [onUpdate, errors?.description, onClearError]);

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
    // Task can be on the same day as event but not after
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

          <div className={`input-group ${(errors?.date || errors?.time) ? 'error' : ''}`}>
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
                  placeholder="Select date"
                />
              )}
            </div>
            {errors?.date && <div className="field-error">{errors.date}</div>}
            {!errors?.date && errors?.time && <div className="field-error">{errors.time}</div>}
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
                  placeholder="Select time"
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
            canEdit={true}
            onChecklistUpdate={onChecklistUpdate}
            taskId={taskId}
            isUpdatingChecklist={isUpdatingChecklist}
            onUpdateChecklist={handleChecklistUpdate}
            hasError={!!errors?.specification}
            errorMessage={errors?.specification}
          />
          {errors?.specification && (
            <div className="field-error">{errors.specification}</div>
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
          hasError={!!errors?.description}
          errorMessage={errors?.description}
        />
        {/* {errors?.description && (
          <div className="field-error">{errors.description}</div>
        )} */}
      </div>
    </div>
  );
};

export default TaskDetail;