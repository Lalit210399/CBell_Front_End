import React, { useState, useEffect, useRef } from "react";
import "./NewList.css";

const courtesyTitles = [
  "Mr.", "Mrs.", "Miss", "Ms.", "Mx.", "Dr.", "Prof.", "Rev.", "Fr.", "Sr.", "Br.",
  "Rabbi", "Imam", "Pandit", "Swami", "Acharya", "Sir", "Dame", "Lord", "Lady",
  "Baron", "Count", "Duke", "Earl", "Hon.", "Rt. Hon.", "His Excellency", "Her Excellency",
  "His Highness", "Her Highness", "His Majesty", "Her Majesty", "Eng.", "Adv.", "Capt.",
  "Col.", "Maj.", "Gen.", "Lt.", "Cmdr.", "Esq.", "Jr.", "Sr.", "Shri", "Smt.", "Kumari",
  "Sri", "Sree", "Maulana", "Hazrat"
];

const getInitials = (name) => {
  if (!name) return "--";
  let words = name.trim().split(" ");

  // Remove courtesy titles from the start
  while (words.length > 0 && courtesyTitles.includes(words[0])) {
    words.shift();
  }

  if (words.length === 0) return "--";
  if (words.length === 1) return words[0].charAt(0).toUpperCase();

  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

const List = ({ 
  isEditMode = true, 
  guests: initialGuests = [], 
  onGuestsChange,
  title = "Special Guests (Dignitaries)"
}) => {
  const [guests, setGuests] = useState(initialGuests);
  const [errors, setErrors] = useState({});
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const addButtonRef = useRef(null);
  const newGuestNameRef = useRef(null);
  const onGuestsChangeRef = useRef(onGuestsChange);

  // Update the ref when onGuestsChange changes
  useEffect(() => {
    onGuestsChangeRef.current = onGuestsChange;
  }, [onGuestsChange]);

  // Update local state when props change
  useEffect(() => {
    setGuests(initialGuests);
  }, [initialGuests]);

  // Helper function to notify parent of changes
  const notifyParent = React.useCallback((newGuests) => {
    if (onGuestsChangeRef.current) {
      onGuestsChangeRef.current(newGuests);
    }
  }, []);

  // Validation function
  const validateGuest = (guest, index) => {
    const newErrors = {};
    if (!guest.name.trim()) {
      newErrors[`${index}-name`] = "Name is required";
    }
    if (!guest.designation.trim()) {
      newErrors[`${index}-designation`] = "Designation is required";
    }
    return newErrors;
  };

  const handleAddGuest = React.useCallback(() => {
    setGuests(prevGuests => {
      const newGuest = { name: "", designation: "" };
      const newGuests = [...prevGuests, newGuest];
      notifyParent(newGuests);
      return newGuests;
    });
    setIsAddingGuest(true);
    // Focus on the new guest's name input after a short delay
    setTimeout(() => {
      if (newGuestNameRef.current) {
        newGuestNameRef.current.focus();
      }
    }, 100);
  }, [notifyParent]);

  const handleDeleteGuest = React.useCallback((index) => {
    setGuests(prevGuests => {
      const newGuests = prevGuests.filter((_, i) => i !== index);
      notifyParent(newGuests);
      return newGuests;
    });
    
    // Clear errors for deleted guest
    setErrors(prevErrors => {
      const newErrors = { ...prevErrors };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`${index}-`)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  }, [notifyParent]);

  const handleChange = React.useCallback((index, field, value) => {
    setGuests(prevGuests => {
      const updatedGuests = [...prevGuests];
      updatedGuests[index][field] = value;
      notifyParent(updatedGuests);
      return updatedGuests;
    });
    
    // Clear error for this field when user starts typing
    const errorKey = `${index}-${field}`;
    setErrors(prevErrors => {
      if (prevErrors[errorKey]) {
        const newErrors = { ...prevErrors };
        delete newErrors[errorKey];
        return newErrors;
      }
      return prevErrors;
    });
  }, [notifyParent]);

  // Handle keyboard shortcuts
  const handleKeyDown = React.useCallback((e, index) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setGuests(prevGuests => {
        if (prevGuests[index]?.name === "" && prevGuests[index]?.designation === "") {
          const newGuests = prevGuests.filter((_, i) => i !== index);
          notifyParent(newGuests);
          return newGuests;
        }
        return prevGuests;
      });
    }
  }, [notifyParent]);

  // Focus management for new guests
  useEffect(() => {
    if (isAddingGuest && newGuestNameRef.current) {
      newGuestNameRef.current.focus();
      setIsAddingGuest(false);
    }
  }, [guests.length, isAddingGuest]);

  // Validation function that can be called externally
  // eslint-disable-next-line no-unused-vars
  const validateAllGuests = React.useCallback(() => {
    setGuests(currentGuests => {
      const newErrors = {};
      currentGuests.forEach((guest, index) => {
        const guestErrors = validateGuest(guest, index);
        Object.assign(newErrors, guestErrors);
      });
      setErrors(newErrors);
      return currentGuests;
    });
    return Object.keys(errors).length === 0;
  }, [errors]);


  return (
    <div className="special-guests-wrapper">
      <div className="header">
        <div className="header-left">
          {title}
        </div>
        {isEditMode && (
          <button 
            ref={addButtonRef}
            className="add-guest-btn" 
            onClick={handleAddGuest} 
            aria-label="Add new guest"
            title="Add new guest"
          >
            + Add Guests
          </button>
        )}
      </div>
      <div className="guests-list-container">
        {guests.map((guest, index) => (
          <div key={index} className="guest-card">
            <div className="avatar-circle">
              {getInitials(guest.name)}
            </div>
            <div className="guest-info">
              {isEditMode ? (
                <>
                  <div className="input-field-container">
                    <input
                      ref={index === guests.length - 1 && guest.name === "" ? newGuestNameRef : null}
                      type="text"
                      className={`guest-name-input ${errors[`${index}-name`] ? 'error' : ''}`}
                      placeholder="Name..."
                      value={guest.name}
                      onChange={(e) => handleChange(index, "name", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      aria-label="Guest name"
                      aria-invalid={!!errors[`${index}-name`]}
                    />
                    {errors[`${index}-name`] && (
                      <div className="error-message">
                        {errors[`${index}-name`]}
                      </div>
                    )}
                  </div>
                  <div className="input-field-container">
                    <input
                      type="text"
                      className={`guest-designation-input ${errors[`${index}-designation`] ? 'error' : ''}`}
                      placeholder="Designation..."
                      value={guest.designation}
                      onChange={(e) => handleChange(index, "designation", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      aria-label="Guest designation"
                      aria-invalid={!!errors[`${index}-designation`]}
                    />
                    {errors[`${index}-designation`] && (
                      <div className="error-message">
                        {errors[`${index}-designation`]}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="guest-name-text">{guest.name || "Name..."}</p>
                  <p className="guest-designation-text">{guest.designation || "Designation..."}</p>
                </>
              )}
            </div>
            {isEditMode && (
              <button
                className="delete-guest-btn"
                onClick={() => handleDeleteGuest(index)}
                aria-label={`Delete guest ${guest.name || 'at position ' + (index + 1)}`}
                title="Delete guest (Escape if empty)"
              >
                ×
              </button>
            )}
          </div>
        ))}
        {isEditMode && (
          <div 
            className="guest-card placeholder-card" 
            onClick={handleAddGuest}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAddGuest();
              }
            }}
            aria-label="Click to add new guest"
            title="Click to add new guest"
          >
            <div className="placeholder-avatar">
              +
            </div>
            <div className="guest-info">
              <div className="placeholder-text-name">
                Click to add new guest...
              </div>
              <div className="placeholder-text-designation">
                Name and designation...
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default List;
