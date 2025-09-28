import React, { useState, useRef, useEffect } from "react";
import "./MultiSelectDropdown.css";
import { ChevronDown, X } from "lucide-react";

const MultiSelectDropdown = ({
  options = [],
  defaultLabel = "Select items",
  onSelect,
  selectedValues = [],
  disabled = false,
  placeholder = "Select departments",
  maxDisplayItems = 2,
}) => {
  // Debug logging
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get display text for selected items
  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return placeholder || defaultLabel;
    }
    if (selectedValues.length <= maxDisplayItems) {
      return selectedValues.map(id => {
        const option = options.find(opt => opt.value === id);
        return option ? option.label : id;
      }).join(", ");
    }
    return `${selectedValues.length} items selected`;
  };

  // Handle checkbox change
  const handleCheckboxChange = (option) => {
    const newSelectedValues = selectedValues.includes(option.value)
      ? selectedValues.filter(id => id !== option.value)
      : [...selectedValues, option.value];
    
    if (onSelect) {
      onSelect({ value: option.value, label: option.label });
    }
  };

  // Remove individual item
  const handleRemoveItem = (valueToRemove, e) => {
    e.stopPropagation();
    const newSelectedValues = selectedValues.filter(id => id !== valueToRemove);
    if (onSelect) {
      // Find the option and trigger selection to update parent state
      const option = options.find(opt => opt.value === valueToRemove);
      if (option) {
        onSelect({ value: option.value, label: option.label });
      }
    }
  };

  // Clear all selections
  const handleClearAll = (e) => {
    e.stopPropagation();
    // Call onSelect with an empty array to clear all
    if (onSelect) {
      // We need to trigger the parent's onDepartmentsChange with an empty array
      // This will be handled by the parent component
      onSelect({ clearAll: true });
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      className={`multi-select-dropdown ${disabled ? "disabled" : ""}`}
      ref={dropdownRef}
    >
      <button
        className="multi-select-toggle"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <div className="selected-items-display">
          {selectedValues.length > 0 && (
            <div className="selected-items">
              {selectedValues.slice(0, maxDisplayItems).map((value, index) => {
                const option = options.find(opt => opt.value === value);
                return (
                  <span key={value} className="selected-item">
                    {option ? option.label : value}
                    <button
                      type="button"
                      className="remove-item"
                      onClick={(e) => handleRemoveItem(value, e)}
                    >
                      <X size={12} />
                    </button>
                  </span>
                );
              })}
              {selectedValues.length > maxDisplayItems && (
                <span className="more-items">+{selectedValues.length - maxDisplayItems} more</span>
              )}
            </div>
          )}
          {selectedValues.length === 0 && (
            <span className="placeholder">{placeholder || "Select departments"}</span>
          )}
        </div>
        <ChevronDown 
          size={18} 
          color="#8B8B8B"
          className={`chevron ${isOpen ? "rotated" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="multi-select-menu">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              autoFocus
            />
          </div>
          
          {selectedValues.length > 0 && (
            <div className="clear-all-container">
              <button
                type="button"
                className="clear-all-button"
                onClick={handleClearAll}
              >
                Clear all
              </button>
            </div>
          )}

          <div className="options-container">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <label
                  key={index}
                  className={`option-item ${
                    selectedValues.includes(option.value) ? "selected" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => handleCheckboxChange(option)}
                    className="checkbox-input"
                  />
                  <span className="checkbox-custom"></span>
                  <span className="option-label">{option.label}</span>
                </label>
              ))
            ) : (
              <div className="no-options">
                {searchTerm ? "No departments found" : "No departments available"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
