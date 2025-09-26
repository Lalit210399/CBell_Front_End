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
      console.log(`NewList: Field ${field} changed for index ${index}:`, value);
      console.log("NewList: Updated guests:", updatedGuests);
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
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleAddGuest();
    } else if (e.key === 'Escape') {
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
  }, [handleAddGuest, notifyParent]);

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

  // Add keyboard shortcut hint
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'Enter' && isEditMode) {
        e.preventDefault();
        handleAddGuest();
      }
    };

    if (isEditMode) {
      document.addEventListener('keydown', handleGlobalKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isEditMode, handleAddGuest]);

  return (
    <div className="special-guests-wrapper" style={{ border: "1px solid #ccc", borderRadius: "8px", backgroundColor: "#fff", padding: "10px", maxHeight: "300px", overflowY: "auto" }}>
      <div className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div className="header-left" style={{ fontWeight: "bold", fontSize: "16px" }}>
          {title}
          {isEditMode && (
            <span style={{ fontSize: "12px", color: "#666", fontWeight: "normal", marginLeft: "8px" }}>
              (Ctrl+Enter to add)
            </span>
          )}
        </div>
        {isEditMode && (
          <button 
            ref={addButtonRef}
            className="add-guest-btn" 
            onClick={handleAddGuest} 
            style={{ background: "none", border: "none", color: "#000", fontWeight: "bold", cursor: "pointer" }}
            aria-label="Add new guest (Ctrl+Enter)"
            title="Add new guest (Ctrl+Enter)"
          >
            + Add Guests
          </button>
        )}
      </div>
      <div className="guests-list-container" style={{ maxHeight: "240px", overflowY: "auto", scrollbarColor: "#ccc transparent", scrollbarWidth: "thin" }}>
        {guests.map((guest, index) => (
          <div key={index} className="guest-card" style={{ display: "flex", alignItems: "center", borderRadius: "8px", border: "1px solid #eee", padding: "8px", marginBottom: "8px", backgroundColor: "#fff" }}>
            <div className="avatar-circle" style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#004d61", color: "#fff", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold", fontSize: "14px", marginRight: "12px" }}>
              {getInitials(guest.name)}
            </div>
            <div className="guest-info" style={{ flex: 1 }}>
              {isEditMode ? (
                <>
                  <div style={{ position: "relative" }}>
                    <input
                      ref={index === guests.length - 1 && guest.name === "" ? newGuestNameRef : null}
                      type="text"
                      className={`guest-name-input ${errors[`${index}-name`] ? 'error' : ''}`}
                      placeholder="Name..."
                      value={guest.name}
                      onChange={(e) => handleChange(index, "name", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      style={{ 
                        width: "100%", 
                        border: "none", 
                        borderBottom: errors[`${index}-name`] ? "1px solid #d32f2f" : "1px solid #ccc", 
                        outline: "none", 
                        fontSize: "14px", 
                        marginBottom: "4px" 
                      }}
                      aria-label="Guest name"
                      aria-invalid={!!errors[`${index}-name`]}
                    />
                    {errors[`${index}-name`] && (
                      <div className="error-message" style={{ color: "#d32f2f", fontSize: "12px", marginTop: "2px" }}>
                        {errors[`${index}-name`]}
                      </div>
                    )}
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      className={`guest-designation-input ${errors[`${index}-designation`] ? 'error' : ''}`}
                      placeholder="Designation..."
                      value={guest.designation}
                      onChange={(e) => handleChange(index, "designation", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      style={{ 
                        width: "100%", 
                        border: "none", 
                        borderBottom: errors[`${index}-designation`] ? "1px solid #d32f2f" : "1px solid #ccc", 
                        outline: "none", 
                        fontSize: "12px", 
                        color: "#666" 
                      }}
                      aria-label="Guest designation"
                      aria-invalid={!!errors[`${index}-designation`]}
                    />
                    {errors[`${index}-designation`] && (
                      <div className="error-message" style={{ color: "#d32f2f", fontSize: "12px", marginTop: "2px" }}>
                        {errors[`${index}-designation`]}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="guest-name-text" style={{ margin: 0, fontWeight: "bold", fontSize: "14px", color: "#000" }}>{guest.name || "Name..."}</p>
                  <p className="guest-designation-text" style={{ margin: 0, fontSize: "12px", color: "#888" }}>{guest.designation || "Designation..."}</p>
                </>
              )}
            </div>
            {isEditMode && (
              <button
                className="delete-guest-btn"
                onClick={() => handleDeleteGuest(index)}
                aria-label={`Delete guest ${guest.name || 'at position ' + (index + 1)}`}
                title="Delete guest (Escape if empty)"
                style={{ background: "none", border: "none", color: "#888", fontSize: "20px", cursor: "pointer", marginLeft: "8px" }}
              >
                ×
              </button>
            )}
          </div>
        ))}
        {isEditMode && (
          <div 
            className="guest-card placeholder-card" 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              borderRadius: "8px", 
              border: "2px dashed #ccc", 
              padding: "8px", 
              backgroundColor: "#f8f9fa",
              opacity: 0.7,
              cursor: "pointer"
            }}
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
            title="Click to add new guest (Ctrl+Enter)"
          >
            <div className="avatar-circle" style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#6c757d", color: "#fff", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold", fontSize: "14px", marginRight: "12px" }}>
              +
            </div>
            <div className="guest-info" style={{ flex: 1 }}>
              <div style={{ width: "100%", border: "none", borderBottom: "1px dashed #ccc", outline: "none", fontSize: "14px", marginBottom: "4px", color: "#6c757d", fontStyle: "italic" }}>
                Click to add new guest...
              </div>
              <div style={{ width: "100%", border: "none", borderBottom: "1px dashed #ccc", outline: "none", fontSize: "12px", color: "#6c757d", fontStyle: "italic" }}>
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
