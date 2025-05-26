import React, { useState, useEffect, useRef } from "react";
import TextEditor from "../../../CommonComponents/TextEditor/TextEditor";
import List from "../../../CommonComponents/List/List";
import "./EventDetail.css";

const Detail = ({
  guestsData = [],
  organizersData = [],
  mode,
    onSave,
  initialDescription = "",
}) => {
  const [guests, setGuests] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [guestForm, setGuestForm] = useState({ name: "", designation: "" });
  const [organizerForm, setOrganizerForm] = useState({
    name: "",
    designation: "",
  });
  const editorRef = useRef(initialDescription);

  useEffect(() => {
    if (mode === "view" || mode === "edit") {
      setGuests(
        guestsData.map((g) => ({ name: g.name, designation: g.title }))
      );
      setOrganizers(
        organizersData.map((o) => ({ name: o.name, designation: o.title }))
      );
    } else if (mode === "create") {
      setGuests([]);
      setOrganizers([]);
    }
  }, [mode, guestsData, organizersData]);

  const handleGuestChange = (e) => {
    const { name, value } = e.target;
    setGuestForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleOrganizerChange = (e) => {
    const { name, value } = e.target;
    setOrganizerForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddGuest = () => {
    if (guestForm.name && guestForm.designation) {
      setGuests((prev) => [...prev, guestForm]);
      setGuestForm({ name: "", designation: "" });
    }
  };

  const handleAddOrganizer = () => {
    if (organizerForm.name && organizerForm.designation) {
      setOrganizers((prev) => [...prev, organizerForm]);
      setOrganizerForm({ name: "", designation: "" });
    }
  };

  const handleGuestEdit = (index, field, value) => {
    setGuests((prev) =>
      prev.map((guest, i) =>
        i === index ? { ...guest, [field]: value } : guest
      )
    );
  };

  const handleOrganizerEdit = (index, field, value) => {
    setOrganizers((prev) =>
      prev.map((organizer, i) =>
        i === index ? { ...organizer, [field]: value } : organizer
      )
    );
  };

  // Notify parent of Save
  useEffect(() => {
    if (onSave) {
      onSave.current = () => ({
        description: editorRef.current,
        guests: guests.map((g) => ({ name: g.name, title: g.designation })),
        organizers: organizers.map((o) => ({
          name: o.name,
          title: o.designation,
        })),
      });
    }
  }, [guests, organizers, onSave]);

  return (
    <div className="detail_container">
      <div className="Right_Section Section">
        <TextEditor
          initialContent={initialDescription}
          onContentChange={(val) => (editorRef.current = val)}
          isFullWidth={true}
          mode={mode}
        />
      </div>
      <div className="Left_Section Section">
        {mode === "edit" || mode === "create" ? (
          <>
            <div className="Special_Guest Form">
              <h3>Special Guest (Dignitaries)</h3>
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="form-row">
                  <input
                    className="guest-input"
                    type="text"
                    name="name"
                    value={guestForm.name}
                    onChange={handleGuestChange}
                    placeholder="Name"
                  />
                  <input
                    className="guest-input"
                    type="text"
                    name="designation"
                    value={guestForm.designation}
                    onChange={handleGuestChange}
                    placeholder="Designation"
                  />
                </div>
                <button
                  type="button"
                  className="guest-button"
                  onClick={handleAddGuest}
                >
                  Add Guest
                </button>
              </form>

              {guests.map((guest, index) => (
                <div key={index} className="editable-entry">
                  <input
                    className="guest-input"
                    type="text"
                    value={guest.name}
                    onChange={(e) =>
                      handleGuestEdit(index, "name", e.target.value)
                    }
                    placeholder="Name"
                  />
                  <input
                    className="guest-input"
                    type="text"
                    value={guest.designation}
                    onChange={(e) =>
                      handleGuestEdit(index, "designation", e.target.value)
                    }
                    placeholder="Designation"
                  />
                </div>
              ))}
            </div>

            <div className="Event_Organizer Form">
              <h3>Event Organizer</h3>
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="form-row">
                  <input
                    className="guest-input"
                    type="text"
                    name="name"
                    value={organizerForm.name}
                    onChange={handleOrganizerChange}
                    placeholder="Name"
                  />
                  <input
                    className="guest-input"
                    type="text"
                    name="designation"
                    value={organizerForm.designation}
                    onChange={handleOrganizerChange}
                    placeholder="Designation"
                  />
                </div>
                <button
                  type="button"
                  className="guest-button"
                  onClick={handleAddOrganizer}
                >
                  Add Organizer
                </button>
              </form>

              {organizers.map((org, index) => (
                <div key={index} className="editable-entry">
                  <input
                    className="guest-input"
                    type="text"
                    value={org.name}
                    onChange={(e) =>
                      handleOrganizerEdit(index, "name", e.target.value)
                    }
                    placeholder="Name"
                  />
                  <input
                    className="guest-input"
                    type="text"
                    value={org.designation}
                    onChange={(e) =>
                      handleOrganizerEdit(index, "designation", e.target.value)
                    }
                    placeholder="Designation"
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="Special_Guest List">
              <List title="Special Guest (Dignitaries)" guests={guestsData} />
            </div>
            <div className="Event_Organizer List">
              <List title="Event Organizer" guests={organizersData} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Detail;
