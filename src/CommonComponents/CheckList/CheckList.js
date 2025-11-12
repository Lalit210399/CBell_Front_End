import React, { useState, useEffect, useRef } from "react";
import "./CheckList.css";

const Checklist = ({ 
  initialItems = [], 
  onChecklistChange, 
  mode = "view",
  canEdit = null, 
  onChecklistUpdate = null, 
  taskId = null, 
  isUpdatingChecklist = false, 
  onUpdateChecklist = null, 
  onChecklistChanges = null,
  hasError = false,
  errorMessage = ""
}) => {
  const createPlaceholderItem = () => ({ text: "", checked: false, isPlaceholder: true });

  const transformItems = React.useCallback((items) => {
    let transformed = (items || [])
      .filter(item => item.text !== null && item.text !== undefined)
      .map(item => ({
        text: item.text,
        checked: item.checked || false,
        isPlaceholder: false
      }));

    // Add placeholder item for create/edit modes, but not for view mode
    if (mode !== "view") {
      transformed.push(createPlaceholderItem());
    }
    return transformed;
  }, [mode]);

  const [checklist, setChecklist] = useState(() => transformItems(initialItems));
  const inputRefs = useRef([]);
  const isInitialRender = useRef(true);
  const isUpdatingFromProps = useRef(false);
  const lastNotifiedChecklist = useRef(null);
  const originalChecklist = useRef(null);
  const [hasChanges, setHasChanges] = useState(false);

  const normalizeItems = (items) =>
    (items || [])
      .filter((item) => item.text !== null && item.text !== undefined)
      .map((item) => ({ text: item.text, checked: !!item.checked }));

  // Set initial render flag to false after first render
  useEffect(() => {
    isInitialRender.current = false;
  }, []);

  // Store original checklist data for comparison
  useEffect(() => {
    if (originalChecklist.current === null) {
      originalChecklist.current = JSON.stringify(normalizeItems(initialItems));
      setHasChanges(false); // Ensure no changes initially
    }
  }, [initialItems]);

  // Check for changes and notify parent
  useEffect(() => {
    if (isInitialRender.current || isUpdatingFromProps.current || !originalChecklist.current) {
      return;
    }

    const currentNormalized = normalizeItems(checklist);
    const currentString = JSON.stringify(currentNormalized);
    const originalString = originalChecklist.current;

    const hasChangesNow = currentString !== originalString;
    setHasChanges(hasChangesNow);
    
    if (onChecklistChanges) {
      onChecklistChanges(hasChangesNow);
    }
  }, [checklist, onChecklistChanges]);

  // Keep internal state in sync when parent changes initialItems, but only if different
  useEffect(() => {
    const transformed = transformItems(initialItems);
    isUpdatingFromProps.current = true;
    setChecklist(prevChecklist => {
      const currentNormalized = normalizeItems(prevChecklist);
      const incomingNormalized = normalizeItems(transformed);

      if (JSON.stringify(currentNormalized) !== JSON.stringify(incomingNormalized)) {
        // Update original data when props change
        originalChecklist.current = JSON.stringify(normalizeItems(initialItems));
        setHasChanges(false); // Reset changes when new data comes in
        return transformed;
      }
      return prevChecklist;
    });
    // Reset the flag after a short delay to allow the state update to complete
    setTimeout(() => {
      isUpdatingFromProps.current = false;
    }, 0);
  }, [initialItems, transformItems]);

  // Determine if checklist can be edited
  const isEditable = canEdit !== null ? canEdit : mode !== "view";

  // Handle Save button click
  const handleSave = React.useCallback(async () => {
    if (!onUpdateChecklist || !taskId || isUpdatingChecklist) {
      return;
    }

    try {
      await onUpdateChecklist();
      // Update original data after successful save
      originalChecklist.current = JSON.stringify(normalizeItems(checklist));
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to save checklist:", error);
    }
  }, [onUpdateChecklist, taskId, isUpdatingChecklist, checklist]);


  // Handle parent notifications when checklist changes (but not during initial render or prop updates)
  useEffect(() => {
    if (isInitialRender.current || isUpdatingFromProps.current || !isEditable || !onChecklistChange) {
      return;
    }

    const filteredChecklist = checklist.filter(item => item.text !== null && item.text !== undefined && !item.isPlaceholder);
    const lastNotified = lastNotifiedChecklist.current;
    
    // Only notify if the checklist actually changed
    if (JSON.stringify(filteredChecklist) !== JSON.stringify(lastNotified)) {
      lastNotifiedChecklist.current = filteredChecklist;
      onChecklistChange(filteredChecklist);
    }
  }, [checklist, isEditable, onChecklistChange]);



  const toggleCheck = (index) => {
    if (!isEditable) return;
    setChecklist(prev => {
      const updated = prev.map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item
      );
      return updated;
    });
  };

  const handleInputChange = (index, value) => {
    if (!isEditable) return;
    setChecklist(prev => {
      const updated = prev.map((item, i) =>
        i === index ? { ...item, text: value, isPlaceholder: false } : item
      );
      if (!updated.some(item => item.isPlaceholder) && mode !== "view") {
        updated.push(createPlaceholderItem());
      }
      return updated;
    });
    
    // Auto-resize textarea
    const textarea = inputRefs.current[index];
    if (textarea) {
      // Reset height to auto to get the natural height
      textarea.style.height = 'auto';
      // Set height to scrollHeight to fit content
      const newHeight = textarea.scrollHeight;
      textarea.style.height = newHeight + 'px';
    }
  };

  const handleKeyDown = (index, event) => {
    if (!isEditable) return;

    if (event.key === "Enter") {
      event.preventDefault();
      setChecklist(prev => {
        let newList = [...prev];
        if (newList[index].isPlaceholder && newList[index].text) {
          newList[index] = { ...newList[index], isPlaceholder: false };
          if (mode !== "view") {
            newList.push(createPlaceholderItem());
          }

          setTimeout(() => {
            inputRefs.current[newList.length - 1]?.focus();
          }, 0);
        } else {
          // Move focus to the next item
          setTimeout(() => {
            inputRefs.current[index + 1]?.focus();
          }, 0);
        }
        return newList;
      });
    }

    if (event.key === "Backspace" && !checklist[index].text && !checklist[index].isPlaceholder) {
      setChecklist(prev => {
        let newList = prev.filter((_, i) => i !== index);
        if (!newList.some(item => item.isPlaceholder) && mode !== "view") {
          newList.push(createPlaceholderItem());
        }
        setTimeout(() => {
          inputRefs.current[Math.max(0, index - 1)]?.focus();
        }, 0);
        return newList;
      });
    }
  };

  // Auto-resize textareas when component mounts or checklist changes
  useEffect(() => {
    const resizeTextareas = () => {
      inputRefs.current.forEach((textarea) => {
        if (textarea) {
          // Reset height to auto to get the natural height
          textarea.style.height = 'auto';
          // Set height to scrollHeight to fit content
          const newHeight = textarea.scrollHeight;
          textarea.style.height = newHeight + 'px';
        }
      });
    };
    
    // Resize after a short delay to ensure DOM is updated
    const timeoutId = setTimeout(resizeTextareas, 100);
    return () => clearTimeout(timeoutId);
  }, [checklist]);

  // Filter out placeholder items in view mode
  const displayItems = !isEditable 
    ? checklist.filter(item => !item.isPlaceholder && item.text !== null && item.text !== undefined)
    : checklist;

  return (
    <div className={`checklist-container ${hasError ? "error" : ""}`}>
      {/* Save button - only show in view mode when there are changes */}
      {mode === "view" && onUpdateChecklist && taskId && hasChanges && (
        <div className="checklist-actions-sticky">
          <div className="checklist-actions">
            <button
              className="checklist-save-btn"
              onClick={handleSave}
              disabled={isUpdatingChecklist}
              title="Save checklist changes"
            >
              {isUpdatingChecklist ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
      
      {displayItems.map((item, index) => {
        const originalIndex = checklist.findIndex(originalItem => originalItem === item);
        return (
          <label key={originalIndex} className={`checklist-item ${item.checked ? "checked" : ""}`}>
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => toggleCheck(originalIndex)}
              disabled={!isEditable || item.isPlaceholder}
            />
            <span 
              className="checkbox-custom"
              onClick={(e) => {
                if (!item.isPlaceholder && isEditable) {
                  e.preventDefault();
                  toggleCheck(originalIndex);
                }
              }}
            ></span>
          {mode === "view" ? (
            <div className="checklist-input checklist-view-text">
              {item.text}
            </div>
          ) : (
            <textarea
              ref={(el) => (inputRefs.current[originalIndex] = el)}
              placeholder={item.isPlaceholder ? "Add checklist item..." : ""}
              value={item.text}
              onChange={(e) => handleInputChange(originalIndex, e.target.value)}
              onKeyDown={(e) => handleKeyDown(originalIndex, e)}
              className="checklist-input"
              rows={1}
            />
          )}
          </label>
        );
      })}
      
      {/* {hasError && errorMessage && (
        <div className="checklist-error-message">
          {errorMessage}
        </div>
      )} */}
    </div>
  );
};

export default Checklist;
