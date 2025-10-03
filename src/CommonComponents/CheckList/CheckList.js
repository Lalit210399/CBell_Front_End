import React, { useState, useEffect, useRef } from "react";
import "./CheckList.css";

const Checklist = ({ initialItems = [], onChecklistChange, mode = "view", canEdit = null }) => {
  const createPlaceholderItem = () => ({ text: "", checked: false, isPlaceholder: true });

  const transformItems = React.useCallback((items) => {
    let transformed = (items || [])
      .filter(item => item.text && item.text.trim() !== "")
      .map(item => ({
        text: item.text,
        checked: item.checked || false,
        isPlaceholder: false
      }));

    transformed.push(createPlaceholderItem());
    return transformed;
  }, []);

  const [checklist, setChecklist] = useState(() => transformItems(initialItems));
  const inputRefs = useRef([]);

  const normalizeItems = (items) =>
    (items || [])
      .filter((item) => item.text && item.text.trim() !== "")
      .map((item) => ({ text: item.text, checked: !!item.checked }));

  // Keep internal state in sync when parent changes initialItems, but only if different
  useEffect(() => {
    const transformed = transformItems(initialItems);
    const currentNormalized = normalizeItems(checklist);
    const incomingNormalized = normalizeItems(transformed);

    if (JSON.stringify(currentNormalized) !== JSON.stringify(incomingNormalized)) {
      setChecklist(transformed);
    }
  }, [initialItems, checklist, transformItems]);

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

  // Determine if checklist can be edited
  const isEditable = canEdit !== null ? canEdit : mode !== "view";

  // Notify parent when user makes changes (not on initial render or external updates)
  const notifyParent = React.useCallback((newChecklist) => {
    if (!isEditable || !onChecklistChange) return;
    
    const filteredChecklist = newChecklist.filter(item => item.text.trim() && !item.isPlaceholder);
    onChecklistChange(filteredChecklist);
  }, [isEditable, onChecklistChange]);

  const toggleCheck = (index) => {
    if (!isEditable) return;
    setChecklist(prev => {
      const updated = prev.map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item
      );
      notifyParent(updated);
      return updated;
    });
  };

  const handleInputChange = (index, value) => {
    if (!isEditable) return;
    setChecklist(prev => {
      const updated = prev.map((item, i) =>
        i === index ? { ...item, text: value, isPlaceholder: false } : item
      );
      if (!updated.some(item => item.isPlaceholder)) {
        updated.push(createPlaceholderItem());
      }
      notifyParent(updated);
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
        if (newList[index].isPlaceholder && newList[index].text.trim()) {
          newList[index] = { ...newList[index], isPlaceholder: false };
          newList.push(createPlaceholderItem());

          setTimeout(() => {
            inputRefs.current[newList.length - 1]?.focus();
          }, 0);
        } else {
          // Move focus to the next item
          setTimeout(() => {
            inputRefs.current[index + 1]?.focus();
          }, 0);
        }
        notifyParent(newList);
        return newList;
      });
    }

    if (event.key === "Backspace" && !checklist[index].text && !checklist[index].isPlaceholder) {
      setChecklist(prev => {
        let newList = prev.filter((_, i) => i !== index);
        if (!newList.some(item => item.isPlaceholder)) {
          newList.push(createPlaceholderItem());
        }
        setTimeout(() => {
          inputRefs.current[Math.max(0, index - 1)]?.focus();
        }, 0);
        notifyParent(newList);
        return newList;
      });
    }
  };

  // Filter out placeholder items in view mode
  const displayItems = !isEditable 
    ? checklist.filter(item => !item.isPlaceholder && item.text.trim())
    : checklist;

  return (
    <div className="checklist-container">
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
          {!isEditable ? (
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
    </div>
  );
};

export default Checklist;
