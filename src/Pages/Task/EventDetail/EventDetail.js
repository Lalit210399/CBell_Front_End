import React, { useState, useEffect, useRef } from "react";
import TextEditor from "../../../CommonComponents/TextEditor/TextEditor";
import NewList from "../../../CommonComponents/List/NewList";
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
  const editorRef = useRef(initialDescription);

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
      title: item.designation || ""
    }));
  };

  useEffect(() => {
    if ((mode === "view" || mode === "edit")) {
      const transformedGuests = transformToNewFormat(guestsData);
      const transformedOrganizers = transformToNewFormat(organizersData);
      
      setGuests(transformedGuests);
      setOrganizers(transformedOrganizers);
    } else if (mode === "create") {
      setGuests([]);
      setOrganizers([]);
    }
  }, [mode, guestsData, organizersData]);


  // Handlers for NewList component
  const handleGuestsChange = React.useCallback((newGuests) => {
    setGuests(newGuests);
  }, []);

  const handleOrganizersChange = React.useCallback((newOrganizers) => {
    setOrganizers(newOrganizers);
  }, []);

  // Set up the save handler
  useEffect(() => {
    if (onSave) {
      onSave.current = () => {
        return {
          description: editorRef.current,
          location: "Pune",
          guests: transformToOldFormat(guests).filter(g => g.name && g.title),
          organizers: transformToOldFormat(organizers).filter(o => o.name && o.title),
        };
      };
    }
  }, [onSave]); // Remove guests and organizers from dependencies to prevent infinite loop

  return (
    <div className="detail_container">
      <div className="ED_Right_Section">
        <TextEditor
          initialContent={initialDescription}
          onContentChange={(val) => {
            editorRef.current = val;
          }}
          isFullWidth={true}
          mode={mode}
        />
      </div>
      <div className="ED_Left_Section">
        <div className="Special_Guest">
          <NewList 
            guests={guests}
            onGuestsChange={handleGuestsChange}
            isEditMode={mode === "edit" || mode === "create"}
            title="Special Guests (Dignitaries)"
          />
        </div>
        
        <div className="Event_Organizer">
          <NewList 
            guests={organizers}
            onGuestsChange={handleOrganizersChange}
            isEditMode={mode === "edit" || mode === "create"}
            title="Event Organizers"
          />
        </div>
      </div>
    </div>
  );
};

export default Detail;