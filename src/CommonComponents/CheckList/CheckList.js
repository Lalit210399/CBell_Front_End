import React, { useState, useEffect } from "react";
import "./CheckList.css";

const Checklist = ({ initialItems = [], onChecklistChange, mode = "view" }) => {
  const transformItems = (items) => {
    if (!items || items.length === 0) {
      return [{ text: "", checked: false, isPlaceholder: true }];
    }
    return items.map(item => ({
      text: item.text || "",
      checked: item.checked || false,
      isPlaceholder: item.isPlaceholder || false
    }));
  };

  const [checklist, setChecklist] = useState(() => transformItems(initialItems));

  useEffect(() => {
    onChecklistChange(checklist);
  }, [checklist, onChecklistChange]);

  const toggleCheck = (index) => {
    if (mode === "view") return;
    setChecklist(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleInputChange = (index, value) => {
    if (mode === "view") return;
    setChecklist(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, text: value } : item
      )
    );
  };

  const handleKeyDown = (index, event) => {
    if (mode === "view") return;

    if (event.key === "Enter" && checklist[index].text.trim()) {
      setChecklist(prev => {
        const newList = [...prev];
        newList[index] = { ...newList[index], isPlaceholder: false };
        if (!newList.some(item => item.isPlaceholder)) {
          newList.push({ text: "", checked: false, isPlaceholder: true });
        }
        return newList;
      });
    }

    if (event.key === "Backspace" && !checklist[index].text && !checklist[index].isPlaceholder) {
      setChecklist(prev => prev.filter((_, i) => i !== index));
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
            disabled={mode === "view"}
          />
          <span className="checkbox-custom"></span>
          <input
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
