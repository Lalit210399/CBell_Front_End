import React, { useState } from "react";
import "./List.css";

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

const List = ({ isEditMode = false }) => {
  const [guests, setGuests] = useState([
    { name: "Mrs. Saloni Mishra", designation: "AI Researcher, Google" },
  ]);

  const handleAddGuest = () => {
    setGuests([...guests, { name: "", designation: "" }]);
  };

  const handleDeleteGuest = (index) => {
    setGuests(guests.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const updatedGuests = [...guests];
    updatedGuests[index][field] = value;
    setGuests(updatedGuests);
  };

  return (
    <div className="special-guests-wrapper" style={{ border: "1px solid #ccc", borderRadius: "8px", backgroundColor: "#fff", padding: "10px", maxHeight: "300px", overflowY: "auto" }}>
      <div className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div className="header-left" style={{ fontWeight: "bold", fontSize: "16px" }}>Special Guests (Dignitaries)</div>
        {isEditMode && (
          <button className="add-guest-btn" onClick={handleAddGuest} style={{ background: "none", border: "none", color: "#000", fontWeight: "bold", cursor: "pointer" }}>
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
                  <input
                    type="text"
                    className="guest-name-input"
                    placeholder="Name..."
                    value={guest.name}
                    onChange={(e) => handleChange(index, "name", e.target.value)}
                    style={{ width: "100%", border: "none", borderBottom: "1px solid #ccc", outline: "none", fontSize: "14px", marginBottom: "4px" }}
                  />
                  <input
                    type="text"
                    className="guest-designation-input"
                    placeholder="Designation..."
                    value={guest.designation}
                    onChange={(e) =>
                      handleChange(index, "designation", e.target.value)
                    }
                    style={{ width: "100%", border: "none", borderBottom: "1px solid #ccc", outline: "none", fontSize: "12px", color: "#666" }}
                  />
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
                aria-label="Delete guest"
                style={{ background: "none", border: "none", color: "#888", fontSize: "20px", cursor: "pointer", marginLeft: "8px" }}
              >
                ×
              </button>
            )}
          </div>
        ))}
        {isEditMode && (
          <div className="guest-card placeholder-card" style={{ display: "flex", alignItems: "center", borderRadius: "8px", border: "1px solid #eee", padding: "8px", backgroundColor: "#fff" }}>
            <div className="avatar-circle" style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#004d61", color: "#fff", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold", fontSize: "14px", marginRight: "12px" }}>
              --
            </div>
            <div className="guest-info" style={{ flex: 1 }}>
              <input
                type="text"
                className="guest-name-input"
                placeholder="Name..."
                value=""
                readOnly
                style={{ width: "100%", border: "none", borderBottom: "1px solid #ccc", outline: "none", fontSize: "14px", marginBottom: "4px" }}
              />
              <input
                type="text"
                className="guest-designation-input"
                placeholder="Designation..."
                value=""
                readOnly
                style={{ width: "100%", border: "none", borderBottom: "1px solid #ccc", outline: "none", fontSize: "12px", color: "#666" }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default List;
