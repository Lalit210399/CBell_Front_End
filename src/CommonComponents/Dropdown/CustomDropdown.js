import React, { useState, useRef, useEffect } from "react";
import "./CustomDropdown.css";
import { ChevronDown } from "lucide-react";

const CustomDropdown = ({
  options = [],          // fallback empty array
  defaultLabel = "Select", 
  onSelect,
  showDot = false,
  disabled = false,     // new prop: disable dropdown if needed
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(defaultLabel);
  const dropdownRef = useRef(null);

  const handleSelect = (option) => {
    setSelected(option.label);
    setIsOpen(false);
    if (onSelect) onSelect(option);
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
    <div
      className={`dropdown-container ${disabled ? "disabled" : ""}`}
      ref={dropdownRef}
    >
      <button
        className="dropdown-toggle"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span>{selected}</span>
        <ChevronDown size={18} />
      </button>

      {isOpen && (
        <ul className="dropdown_menu">
<<<<<<< HEAD
          {options.map((option, index) => (
            <li
              key={index}
              className="dropdown-item"
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
          ))}
=======
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
>>>>>>> a3951b3e1e8c4af6b88d0d22f94bb6251b86cdd9
        </ul>
      )}
    </div>
  );
};

export default CustomDropdown;
