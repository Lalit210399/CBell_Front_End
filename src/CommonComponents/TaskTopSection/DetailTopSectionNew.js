import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Save, Users } from "lucide-react";
import AvatarList from "../Avatar/index";
import CustomDropdown from "../Dropdown/CustomDropdown";
import { useUser } from "../../Context/UserContext";
import { useEventTypes } from "../../Hooks/useEventTypes";
import "./DetailTopSectionNew.css";

function formatDateTimeLocal(date) {
  if (!date) return { date: "", time: "" };
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` };
}

const DetailTopSectionNew = ({
  mode,
  onBackClick,
  onSaveClick,
  onNewTaskClick,
  data = {},
  participants = [],
  permissions = {},
  errors = {},
  onClearError,
  users = [],
  assignedTo = [],
  onParticipantsChange,
  eventTypes: propEventTypes,
  getEventTypeById: propGetEventTypeById,
  getEventTypeByName: propGetEventTypeByName,
  getActiveEventTypes: propGetActiveEventTypes,
}) => {
  const { user } = useUser();
  const { eventTypes: contextEventTypes, getEventTypeByName: contextGetEventTypeByName } = useEventTypes();
  
  // Check if user is a Designer based on the roles array
  const isDesigner = user?.roles?.some(role => role.name === "Designer" || role.displayName === "Designer");
  const [editableTitle, setEditableTitle] = useState(data?.title || "");
  const [editableDate, setEditableDate] = useState("");
  const [editableTime, setEditableTime] = useState("");
  const [selectedEventType, setSelectedEventType] = useState(data?.type || "");
  const [selectedEventTypeId, setSelectedEventTypeId] = useState(data?.eventTypeId || "");
  const [selectedTypeName, setSelectedTypeName] = useState(data?.typeName || "");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [assignedIds, setAssignedIds] = useState([]);
  const [fetchedUsers, setFetchedUsers] = useState([]);

  // Use event types from props or context
  const eventTypes = useMemo(() => {
    return propEventTypes || contextEventTypes || [];
  }, [propEventTypes, contextEventTypes]);

  const getEventTypeByName = useMemo(() => {
    return propGetEventTypeByName || contextGetEventTypeByName;
  }, [propGetEventTypeByName, contextGetEventTypeByName]);

  useEffect(() => {
    setEditableTitle(data?.title || "");
    
    // Only set date/time if data exists and has a valid date
    if (data?.date && data.date !== "") {
      const dt = formatDateTimeLocal(data.date);
      setEditableDate(dt.date);
      setEditableTime(dt.time);
    } else {
      // Set empty values for create mode or when no date is available
      setEditableDate("");
      setEditableTime("");
    }
    
    setSelectedEventType(data?.type || "");
    setSelectedEventTypeId(data?.eventTypeId || "");
    setSelectedTypeName(data?.typeName || "");
  }, [data]);

  useEffect(() => {
    const ids = (assignedTo || [])
      .map((item) => {
        // Handle both string/number IDs and full user objects
        if (typeof item === "string" || typeof item === "number") {
          return item;
        } else if (item && typeof item === "object") {
          // For assigned user objects, use userId field
          return item.userId || item.id;
        }
        return null;
      })
      .filter(Boolean);
    
    // Only update if the IDs have actually changed
    const currentIds = assignedIds.sort();
    const newIds = ids.sort();
    if (JSON.stringify(currentIds) !== JSON.stringify(newIds)) {
      setAssignedIds(ids);
    }
  }, [assignedTo, assignedIds]);

  // Event types are now provided via props or context - no need to fetch

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`/apis/auth/assignment-users/${user?.organizationId}`, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "ngrok-skip-browser-warning": "1",
          },
        });

        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const data = await response.json();
        setFetchedUsers(data.users || []);
      } catch (error) {
        console.error("Error fetching users:", error);
        setFetchedUsers([]);
      }
    };

    if (mode === "edit" || mode === "create") {
      fetchUsers();
    } else {
      setFetchedUsers(users);
    }
  }, [mode, users, user?.organizationId]);

  const handleTitleChange = (e) => {
    setEditableTitle(e.target.value);
    if (errors && errors.title && onClearError) onClearError("title");
  };

  const handleDateChange = (e) => {
    setEditableDate(e.target.value);
    if (errors && errors.date && onClearError) onClearError("date");
  };

  const handleTimeChange = (e) => {
    setEditableTime(e.target.value);
    if (errors && errors.time && onClearError) onClearError("time");
  };



  const selectedParticipants = assignedIds.map((assignedId) => {
    // First try to find in the full assigned user data (from API)
    const assignedUser = assignedTo.find((u) => (u.userId || u.id) === assignedId);
    
    if (assignedUser) {
      // Use the assigned user data directly
      return {
        id: assignedUser.userId || assignedUser.id,
        name: assignedUser.userName || assignedUser.name,
        fallback: (assignedUser.userName || assignedUser.name || "?").charAt(0).toUpperCase(),
        size: "20px",
        shape: "circle",
      };
    }
    
    // Fallback to fetched users if not found in assigned data
    const fullUser = fetchedUsers.find((u) => u.id === assignedId);
    const firstName = fullUser?.firstName || "User";
    const lastName = fullUser?.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();

    return {
      id: assignedId,
      name: fullName,
      fallback: (firstName?.charAt(0) || "?").toUpperCase(),
      size: "20px",
      shape: "circle",
    };
  });

  const hasAssignedUsers = selectedParticipants && selectedParticipants.length > 0;

  const filteredUsers = React.useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return fetchedUsers;
    return fetchedUsers.filter((u) =>
      `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase().includes(q)
    );
  }, [fetchedUsers, userSearch]);

  const isUserSelected = (id) => assignedIds.includes(id);

  const toggleUserSelection = (id) => {
    const next = isUserSelected(id)
      ? assignedIds.filter((x) => x !== id)
      : [...assignedIds, id];
    setAssignedIds(next);
    if (onParticipantsChange) {
      onParticipantsChange(next);
    }
  };

  const handleAddButtonClick = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleSaveClick = () => {
    // Combine date and time into ISO string
    let combinedDateTime = null;
    if (editableDate && editableTime) {
      combinedDateTime = new Date(`${editableDate}T${editableTime}`).toISOString();
    }
    const payload = {
      title: editableTitle,
      date: combinedDateTime,
      time: editableTime || "", // Include time separately for validation, empty string if not set
      type: selectedEventType,
      typeName: selectedTypeName.trim(),
      eventTypeId: selectedEventTypeId,
    };
    onSaveClick(payload);
  };

  const getUserInitials = (firstName = "", lastName = "") => {
    const a = (firstName[0] || "").toUpperCase();
    const b = (lastName[0] || "").toUpperCase();
    return (a + b) || "?";
  };

  const eventTypeOptions = useMemo(() => {
    if (eventTypes && eventTypes.length > 0) {
      return eventTypes.map(event => ({ value: event.name, label: event.name }));
    } else {
      // Fallback options if no event types are available
      return [
        { value: 'Conference', label: 'Conference' },
        { value: 'Workshop', label: 'Workshop' },
        { value: 'Meeting', label: 'Meeting' },
        { value: 'Training', label: 'Training' },
        { value: 'Seminar', label: 'Seminar' }
      ];
    }
  }, [eventTypes]);

  return (
    <div className="detail-top-section-new-container">
      <div className="top-row">
        <button className="back-button" onClick={onBackClick}>
          <ArrowLeft size={18} />
        </button>
        <div className="title-input-container">
          <input
            type="text"
            className={`editable-title-input-new ${errors && errors.title ? "error" : ""}`}
            value={editableTitle}
            onChange={handleTitleChange}
            placeholder="Enter event name ..."
            autoFocus={mode === "create"}
            readOnly={mode === "view"}
          />
          {(mode === "create" || mode === "edit") && <span className="required-asterisk">*</span>}
        </div>
        <div className="created-by">
          <span className="creator-name">{data.createdBy}</span>
          <div className="creator-avatar-new">
            {data.createdBy ? (
              <div className="avatar-initials">
                {getUserInitials(data.createdBy.split(' ')[0] || '', data.createdBy.split(' ')[1] || '')}
              </div>
            ) : (
              <Users size={20} />
            )}
          </div>
          <span ></span>
        </div>
      </div>

      <div className="bottom-row">
        <div className="left_section">
          <div className="team-section">
            <span className="label">Team:</span>
            <div className="avatar-group-new">
              {hasAssignedUsers ? (
                <AvatarList avatars={selectedParticipants} maxVisible={2} />
              ) : (
                <div className="no-assigned-users-placeholder">
                  <Users size={14} className="placeholder-icon" />
                  <span className="placeholder-text">No assigned users</span>
                </div>
              )}
              {(mode === "edit" || mode === "create") && (
                <div className="add-participant-section-new">
                  <button
                    className="avatar-add-button-new"
                    onClick={handleAddButtonClick}
                  >
                    +
                  </button>
                  {isDropdownOpen && (
                    <div className="inline-dropdown-new">
                      <div className="user-dropdown-new">
                        <div className="user-dropdown-header-new">
                          <input
                            type="text"
                            className="user-search-new"
                            placeholder="Search users..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                          />
                          <button
                            className="user-done-new"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            Done
                          </button>
                        </div>
                        <div className="user-dropdown-list-new">
                          {filteredUsers.length === 0 ? (
                            <div className="user-empty-new">No users found</div>
                          ) : (
                            filteredUsers.map((u) => (
                              <label
                                key={u.id}
                                className={`user-item-new ${isUserSelected(u.id) ? "selected" : ""}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isUserSelected(u.id)}
                                  onChange={() => toggleUserSelection(u.id)}
                                />
                                <span className="user-avatar-new">
                                  {getUserInitials(u.firstName, u.lastName)}
                                </span>
                                <span className="user-name-new">{`${u.firstName || "User"} ${u.lastName || ""}`}</span>
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="right_section">
          <div className="type-section">
            <label className="label">
              Type: {(mode === "create" || mode === "edit") && <span className="required-asterisk">*</span>}
            </label>
            {mode === "view" ? (
              <div className="event-type-badge">
                {selectedEventType || "No Type Selected"}
              </div>
            ) : (
              <CustomDropdown
                options={eventTypeOptions}
                defaultLabel={
                  eventTypeOptions.find((opt) => opt.value === selectedEventType)?.label ||
                  "Select Event Type"
                }
            onSelect={(option) => {
              const selectedEvent = getEventTypeByName ? getEventTypeByName(option.value) : eventTypes.find(et => et.name === option.value);
              setSelectedEventType(option.value);
              setSelectedEventTypeId(selectedEvent?.id || "");
              setSelectedTypeName(option.value.trim());
              if (errors && errors.eventType && onClearError) onClearError("eventType");
            }}
              />
            )}
            {errors && errors.eventType && (
              <div className="field-error-message">{errors.eventType}</div>
            )}
          </div>

          <div className="date-section">
            <label htmlFor="date-input" className="label">
              Date: {(mode === "create" || mode === "edit") && <span className="required-asterisk">*</span>}
              {/* <span className="date-hint">(Today or future dates only)</span> */}
            </label>
            <input
              id="date-input"
              type="date"
              className={`date-input-new ${errors && errors.date ? "error" : ""}`}
              value={editableDate}
              onChange={handleDateChange}
              min={new Date().toISOString().slice(0, 10)}
              placeholder="Select date"
            />
            {errors && errors.date && (
              <div className="field-error-message">{errors.date}</div>
            )}
          </div>

          <div className="time-section">
            <label htmlFor="time-input" className="label">
              Time: {(mode === "create" || mode === "edit") && <span className="required-asterisk">*</span>}
            </label>
            <input
              id="time-input"
              type="time"
              className={`time-input-new ${errors && errors.time ? "error" : ""}`}
              value={editableTime}
              onChange={handleTimeChange}
              placeholder="Select time"
            />
            {errors && errors.time && (
              <div className="field-error-message">{errors.time}</div>
            )}
          </div>

          <div className="save-button-section" style={{ display: "flex", gap: "8px" }}>
            {/* Show New Task button in view mode, but hide for Designers */}
            {(mode === "view") && !isDesigner && (
              <button className="btn-new" onClick={onNewTaskClick}>
                New Task
              </button>
            )}
            {/* Show Save button only in edit or create mode */}
            {(mode === "edit" || mode === "create") && (
              <button className="btn-new" onClick={handleSaveClick}>
                <Save size={16} />
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailTopSectionNew;
