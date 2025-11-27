import React, { useState, useRef, useEffect } from "react";
import "./CustomDropdown.css";
import { ChevronDown } from "lucide-react";

const CustomDropdown = ({
  options = [], // fallback empty array
  defaultLabel = "Select",
  onSelect,
  showDot = false,
  disabled = false, // new prop: disable dropdown if needed
  compact = false, // new prop: compact mode for inline filters
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(defaultLabel);
  const dropdownRef = useRef(null);

  const handleSelect = (option) => {
    setSelected(option.label);
    setIsOpen(false);
    if (onSelect) onSelect(option);
  };

  // Update selected when defaultLabel changes
  useEffect(() => {
    setSelected(defaultLabel);
  }, [defaultLabel]);

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
    <div
      className={`dropdown-container ${disabled ? "disabled" : ""} ${compact ? "compact" : ""}`}
      ref={dropdownRef}
    >
      <button
        className={`dropdown_toggle ${compact ? "compact" : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span>{selected}</span>
        <ChevronDown size={compact ? 16 : 18} color="#8B8B8B"/>
      </button>

      {isOpen && (
        <ul className="dropdown_menu">
          {options.length > 0 ? (
            options.map((option, index) => (
              <li
                key={index}
                className={`dropdown-item ${
                  option.label === selected ? "selected" : ""
                }`}
                onClick={() => handleSelect(option)}
              >
                {showDot && (
                  <span
                    className="dot"
                    style={{ backgroundColor: option.color || "#111827" }}
                  />
                )}
                {option.label}
              </li>
            ))
          ) : (
            <li className="dropdown-item">No options available</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default CustomDropdown;
