import React, { useState, useEffect, useRef } from "react";
import PropTypes from 'prop-types';
import TextEditor from "../../../CommonComponents/TextEditor/TextEditor";
import NewList from "../../../CommonComponents/List/NewList";
import "./EventDetail.css";

const EventDetail = ({
  guestsData = [],
  organizersData = [],
  mode,
  onSave,
  initialDescription = "",
  validationErrors = {},
  onClearError,
  location = "Pune",
}) => {
  const [guests, setGuests] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const editorRef = useRef(initialDescription);

  // Transform data between old format (name/title) and new format (name/designation)
  const transformToNewFormat = (data) => {
    if (!Array.isArray(data)) {
      console.warn('transformToNewFormat: Expected array, got', typeof data);
      return [];
    }
    
    return data.map(item => {
      if (!item || typeof item !== 'object') {
        console.warn('transformToNewFormat: Invalid item', item);
        return { name: "", designation: "" };
      }
      
      return {
        name: String(item.name || "").trim(),
        designation: String(item.title || item.designation || "").trim()
      };
    });
  };

  const transformToOldFormat = (data) => {
    if (!Array.isArray(data)) {
      console.warn('transformToOldFormat: Expected array, got', typeof data);
      return [];
    }
    
    return data.map(item => {
      if (!item || typeof item !== 'object') {
        console.warn('transformToOldFormat: Invalid item', item);
        return { name: "", title: "" };
      }
      
      return {
        name: String(item.name || "").trim(),
        title: String(item.designation || item.title || "").trim()
      };
    });
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

  // Helper function to check if description has actual content
  const hasValidDescription = (description) => {
    if (!description) return false;
    
    // Remove HTML tags and check if there's actual text content
    const textContent = description.replace(/<[^>]*>/g, '').trim();
    return textContent.length > 0;
  };

  // Set up the save handler
  useEffect(() => {
    if (onSave) {
      onSave.current = () => {
        const transformedGuests = transformToOldFormat(guests).filter(g => g.name && g.name.trim());
        const transformedOrganizers = transformToOldFormat(organizers).filter(o => o.name && o.name.trim());
        
        // Normalize description: trim whitespace and handle empty content
        const rawDescription = editorRef.current || "";
        const trimmedDescription = rawDescription.trim();
        // If description is empty or only contains HTML tags with no text, set to empty string
        const textContent = trimmedDescription.replace(/<[^>]*>/g, '').trim();
        const normalizedDescription = textContent ? trimmedDescription : "";

        return {
          description: normalizedDescription,
          location: location,
          guests: transformedGuests,
          organizers: transformedOrganizers,
        };
      };
    }
  }, [onSave, guests, organizers, location]); // Include location in dependencies

  return (
    <div className="event-detail-container">
      <div className="event-detail-right-section">
        <TextEditor
          initialContent={initialDescription}
          onContentChange={(val) => {
            editorRef.current = val;
            // Clear description error when user adds valid content
            if (validationErrors.description && onClearError && hasValidDescription(val)) {
              onClearError('description');
            }
          }}
          isFullWidth={true}
          mode={mode}
          hasError={!!validationErrors.description}
          errorMessage={validationErrors.description}
          showRequiredAsterisk={mode === "create" || mode === "edit"}
        />
      </div>
      <div className="event-detail-left-section">
        <div className="special-guest-section">
          <NewList 
            guests={guests}
            onGuestsChange={handleGuestsChange}
            isEditMode={mode === "edit" || mode === "create"}
            title="Special Guests (Dignitaries)"
          />
        </div>
        
        <div className="event-organizer-section">
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

EventDetail.propTypes = {
  guestsData: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    title: PropTypes.string,
    designation: PropTypes.string,
  })),
  organizersData: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    title: PropTypes.string,
    designation: PropTypes.string,
  })),
  mode: PropTypes.oneOf(['view', 'edit', 'create']).isRequired,
  onSave: PropTypes.object,
  initialDescription: PropTypes.string,
  validationErrors: PropTypes.object,
  onClearError: PropTypes.func,
  location: PropTypes.string,
};

export default EventDetail;