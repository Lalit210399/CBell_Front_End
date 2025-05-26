import React, { useState, useRef, useEffect } from "react";
import "./Dropdown.css";

const Dropdown = ({ options, selectedOption, onSelect, disabled, multiSelect = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState(multiSelect ? [] : null);
  const dropdownRef = useRef(null);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen); // Only toggle if not disabled
    }
  };

  const handleSelect = (option) => {
    if (!disabled) {
      if (multiSelect) {
        const isAlreadySelected = selectedOptions.some((item) => item.value === option.value);
        const updatedSelections = isAlreadySelected
          ? selectedOptions.filter((item) => item.value !== option.value)
          : [...selectedOptions, option];
        setSelectedOptions(updatedSelections);
        onSelect(updatedSelections);
      } else {
        onSelect(option);
        setSelectedOptions(option);
        setIsOpen(false);
      }
    }
  };

  const renderSelectedLabel = () => {
    if (multiSelect) {
      return selectedOptions.length > 0
        ? selectedOptions.map((opt) => opt.label).join(", ")
        : "Select options";
    }
    return selectedOption ? selectedOption.label : "Select an option";
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={`dropdown ${disabled ? "disabled" : ""}`} ref={dropdownRef}>
      <button
        className="dropdown-toggle"
        onClick={handleToggle}
        disabled={disabled}
      >
        {renderSelectedLabel()} <span className="arrow">&#9662;</span>
      </button>
      {isOpen && !disabled && (
        <div className="dropdown-menu">
          {options.map((option) => (
            <div
              key={option.value}
              className={`dropdown-item ${
                multiSelect && selectedOptions.some((item) => item.value === option.value)
                  ? "selected"
                  : ""
              }`}
              onClick={() => handleSelect(option)}
            >
              {multiSelect && (
                <input
                  type="checkbox"
                  checked={selectedOptions.some((item) => item.value === option.value)}
                  readOnly
                />
              )}
              <span className="dot" style={{ backgroundColor: option.color }}></span>
              <span className="label">{option.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
