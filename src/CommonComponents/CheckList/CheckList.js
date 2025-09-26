import React, { useState, useEffect, useRef } from "react";
import "./CheckList.css";

const Checklist = ({ initialItems = [], onChecklistChange, mode = "view" }) => {
  const createPlaceholderItem = () => ({ text: "", checked: false, isPlaceholder: true });

  const transformItems = (items) => {
    let transformed = (items || [])
      .filter(item => item.text && item.text.trim() !== "")
      .map(item => ({
        text: item.text,
        checked: item.checked || false,
        isPlaceholder: false
      }));

    transformed.push(createPlaceholderItem());
    return transformed;
  };

  const [checklist, setChecklist] = useState(() => transformItems(initialItems));
  const inputRefs = useRef([]);
  const prevChecklistRef = useRef(null);

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
  }, [initialItems]);

  // Notify parent when user makes changes (not on initial render or external updates)
  const notifyParent = React.useCallback((newChecklist) => {
    if (mode === "view" || !onChecklistChange) return;
    
    const filteredChecklist = newChecklist.filter(item => item.text.trim() && !item.isPlaceholder);
    onChecklistChange(filteredChecklist);
  }, [mode, onChecklistChange]);

  const toggleCheck = (index) => {
    if (mode === "view") return;
    setChecklist(prev => {
      const updated = prev.map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item
      );
      notifyParent(updated);
      return updated;
    });
  };

  const handleInputChange = (index, value) => {
    if (mode === "view") return;
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
  };

  const handleKeyDown = (index, event) => {
    if (mode === "view") return;

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

  return (
    <div className="checklist-container">
      {checklist.map((item, index) => (
        <label key={index} className={`checklist-item ${item.checked ? "checked" : ""}`}>
          <input
            type="checkbox"
            checked={item.checked}
            onChange={() => toggleCheck(index)}
            disabled={mode === "view" || item.isPlaceholder}
          />
          <span className="checkbox-custom"></span>
          <input
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            placeholder={item.isPlaceholder ? "Add checklist item..." : ""}
            value={item.text}
            onChange={(e) => handleInputChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="checklist-input"
            disabled={mode === "view"}
          />
        </label>
      ))}
    </div>
  );
};

export default Checklist;
