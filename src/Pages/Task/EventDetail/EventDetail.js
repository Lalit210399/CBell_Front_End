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
  const [guestForm, setGuestForm] = useState({ name: "", title: "" });
  const [organizerForm, setOrganizerForm] = useState({ name: "", title: "" });
  const editorRef = useRef(initialDescription);

<<<<<<< HEAD
=======
  // Transform data between old format (name/title) and new format (name/designation)
  const transformToNewFormat = (data) => {
    return data.map(item => ({
      name: item.name || "",
      designation: item.title || item.designation || ""
    }));
  };

  const transformToOldFormat = (data) => {
    return data.map(item => ({
      name: item.name || "",
      title: item.designation || item.title || ""
    }));
  };

>>>>>>> a3951b3e1e8c4af6b88d0d22f94bb6251b86cdd9
  useEffect(() => {
  if ((mode === "view" || mode === "edit")) {
    if (JSON.stringify(guests) !== JSON.stringify(guestsData)) {
      setGuests(guestsData);
    }
    if (JSON.stringify(organizers) !== JSON.stringify(organizersData)) {
      setOrganizers(organizersData);
    }
  } else if (mode === "create") {
    if (guests.length !== 0) setGuests([]);
    if (organizers.length !== 0) setOrganizers([]);
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
    if (guestForm.name && guestForm.title) {
      setGuests((prev) => [...prev, guestForm]);
      setGuestForm({ name: "", title: "" });
    }
  };

  const handleAddOrganizer = () => {
    if (organizerForm.name && organizerForm.title) {
      setOrganizers((prev) => [...prev, organizerForm]);
      setOrganizerForm({ name: "", title: "" });
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

  // Set up the save handler
  useEffect(() => {
    if (onSave) {
      onSave.current = () => {
        const transformedGuests = transformToOldFormat(guests).filter(g => g.name && g.name.trim());
        const transformedOrganizers = transformToOldFormat(organizers).filter(o => o.name && o.name.trim());
        
        console.log("EventDetail: Save handler called");
        console.log("EventDetail: Raw guests:", guests);
        console.log("EventDetail: Raw organizers:", organizers);
        console.log("EventDetail: Transformed guests:", transformedGuests);
        console.log("EventDetail: Transformed organizers:", transformedOrganizers);
        
        return {
          description: editorRef.current,
          location: "Pune",
<<<<<<< HEAD
          guests: [...guests].filter(g => g.name && g.title),
          organizers: [...organizers].filter(o => o.name && o.title),
        };
      };
    }
  }, [guests, organizers, onSave]);
=======
          guests: transformedGuests,
          organizers: transformedOrganizers,
        };
      };
    }
  }, [onSave, guests, organizers]); // Include guests and organizers to update when data changes
>>>>>>> a3951b3e1e8c4af6b88d0d22f94bb6251b86cdd9

  return (
    <div className="detail_container">
      <div className="Right_Section Section">
        <TextEditor
          initialContent={initialDescription}
          onContentChange={(val) => {
            editorRef.current = val;
          }}
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
                    name="title"
                    value={guestForm.title}
                    onChange={handleGuestChange}
                    placeholder="Title"
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
                    value={guest.title}
                    onChange={(e) =>
                      handleGuestEdit(index, "title", e.target.value)
                    }
                    placeholder="Title"
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
                    name="title"
                    value={organizerForm.title}
                    onChange={handleOrganizerChange}
                    placeholder="Title"
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
                    value={org.title}
                    onChange={(e) =>
                      handleOrganizerEdit(index, "title", e.target.value)
                    }
                    placeholder="Title"
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