import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Users } from "lucide-react";
import AvatarList from "../Avatar/index";
import CustomDropdown from "../Dropdown/CustomDropdown";
import { useUser } from "../../Context/UserContext";
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
}) => {
  const { user } = useUser();
  const [editableTitle, setEditableTitle] = useState(data?.title || "");
  const [editableDate, setEditableDate] = useState("");
  const [editableTime, setEditableTime] = useState("");
  const [selectedEventType, setSelectedEventType] = useState(data?.type || "");
  const [selectedEventTypeId, setSelectedEventTypeId] = useState(data?.eventTypeId || "");
  const [selectedEventTypeDesc, setSelectedEventTypeDesc] = useState(data?.eventTypeDesc || "");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [assignedIds, setAssignedIds] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [fetchedUsers, setFetchedUsers] = useState([]);

  useEffect(() => {
    setEditableTitle(data?.title || "");
    const dt = formatDateTimeLocal(data?.date || new Date());
    setEditableDate(dt.date);
    setEditableTime(dt.time);
    setSelectedEventType(data?.type || "");
    setSelectedEventTypeId(data?.eventTypeId || "");
    setSelectedEventTypeDesc(data?.eventTypeDesc || "");
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

  useEffect(() => {
    const fetchEventTypes = async () => {
      try {
        const response = await fetch("/apis/eventtype/get_all_event-types", {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "ngrok-skip-browser-warning": "1",
          },
        });

        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const data = await response.json();
        const formattedEventTypes = data.map((event) => ({
          id: event?.id || event?._id || null,
          name: event.typeName,
          desc: event.typeDescription,
        }));

        setEventTypes(formattedEventTypes);
      } catch (error) {
        console.error("Error fetching event types:", error);
      }
    };

    fetchEventTypes();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`/apis/auth/hierarchy-users/${user?.organizationId}`, {
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
  }, [mode, users]);

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
      type: selectedEventType,
      eventTypeId: selectedEventTypeId,
      eventTypeDesc: selectedEventTypeDesc,
    };
    onSaveClick(payload);
  };

  const getUserInitials = (firstName = "", lastName = "") => {
    const a = (firstName[0] || "").toUpperCase();
    const b = (lastName[0] || "").toUpperCase();
    return (a + b) || "?";
  };

  const eventTypeOptions = eventTypes.map(event => ({ value: event.name, label: event.name }));

  return (
    <div className="detail-top-section-new-container">
      <div className="top-row">
        <button className="back-button" onClick={onBackClick}>
          <ArrowLeft size={18} />
        </button>
        <input
          type="text"
          className={`editable-title-input-new ${errors && errors.title ? "error" : ""}`}
          value={editableTitle}
          onChange={handleTitleChange}
          placeholder="Enter event name ..."
          autoFocus={mode === "create"}
        />
        <div className="created-by">
          <span>Created By</span>
          <div className="creator-avatar-new">
            {data.creatorAvatar ? (
              <div className="avatar-initials">
                {getUserInitials(data.creatorAvatar.firstName, data.creatorAvatar.lastName)}
              </div>
            ) : (
              <Users size={20} />
            )}
          </div>
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
            <label className="label">Type:</label>
          <CustomDropdown
            options={eventTypeOptions}
            defaultLabel={
              eventTypeOptions.find((opt) => opt.value === selectedEventType)?.label ||
              "Select Event Type"
            }
            onSelect={(option) => {
              const selectedEvent = eventTypes.find(et => et.name === option.value);
              setSelectedEventType(option.value);
              setSelectedEventTypeId(selectedEvent?.id || "");
              setSelectedEventTypeDesc(selectedEvent?.desc || "");
            }}
            disabled={mode === "view" || mode === "edit"}
          />
          </div>

          <div className="date-section">
            <label htmlFor="date-input" className="label">Date:</label>
            <input
              id="date-input"
              type="date"
              className={`date-input-new ${errors && errors.date ? "error" : ""}`}
              value={editableDate}
              onChange={handleDateChange}
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>

          <div className="time-section">
            <label htmlFor="time-input" className="label">Time:</label>
            <input
              id="time-input"
              type="time"
              className="time-input-new"
              value={editableTime}
              onChange={handleTimeChange}
            />
          </div>

          <div className="save-button-section" style={{ display: "flex", gap: "8px" }}>
            {/* Show New Task button in view, edit, or create mode */}
            <button className="btn-new" onClick={onNewTaskClick}>
              New Task
            </button>
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
