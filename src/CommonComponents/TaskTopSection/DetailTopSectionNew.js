import React, { useState, useEffect, useMemo, useRef } from "react";
import { ArrowLeft, Save, Users } from "lucide-react";
import CustomDropdown from "../Dropdown/CustomDropdown";
import MultiSelectDropdown from "../Dropdown/MultiSelectDropdown";
import UserDropdown from "../UserDropdown";
import AvatarList from "../Avatar/index";
import { useUser } from "../../Context/UserContext";
import { useEventTypes } from "../../Hooks/useEventTypes";
import { useDepartments } from "../../Hooks/useDepartments";
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
  departments: propDepartments,
  getDepartmentById: propGetDepartmentById,
  getDepartmentByName: propGetDepartmentByName,
  getActiveDepartments: propGetActiveDepartments,
  selectedDepartments = [],
  onDepartmentsChange,
}) => {
  const { user, scope, selectedOrganizationId } = useUser();
  const { eventTypes: contextEventTypes, getEventTypeByName: contextGetEventTypeByName } = useEventTypes();
  const { departments: contextDepartments } = useDepartments();
  
  // Check if user is a Designer based on the roles array
  const isDesigner = user?.roles?.some(role => role.name === "Designer" || role.displayName === "Designer");
  const [editableTitle, setEditableTitle] = useState(data?.title || "");
  const [editableDate, setEditableDate] = useState("");
  const [editableTime, setEditableTime] = useState("");
  const [selectedEventType, setSelectedEventType] = useState(data?.type || "");
  const [selectedEventTypeId, setSelectedEventTypeId] = useState(data?.eventTypeId || "");
  const [selectedTypeName, setSelectedTypeName] = useState(data?.typeName || "");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [assignedIds, setAssignedIds] = useState([]);
  const [fetchedUsers, setFetchedUsers] = useState([]);
  const hasFetchedUsersRef = useRef(false);

  // Use event types from props or context
  const eventTypes = useMemo(() => {
    return propEventTypes || contextEventTypes || [];
  }, [propEventTypes, contextEventTypes]);

  const getEventTypeByName = useMemo(() => {
    return propGetEventTypeByName || contextGetEventTypeByName;
  }, [propGetEventTypeByName, contextGetEventTypeByName]);

  // Use departments from props or context
  const departments = useMemo(() => {
    return propDepartments || contextDepartments || [];
  }, [propDepartments, contextDepartments]);


  // Helper function to determine if organization supports departments
  const organizationSupportsDepartments = useMemo(() => {
    // Get current organization info from scope
    const currentOrg = scope?.accessibleOrganizations?.find(org => org.id === selectedOrganizationId);
    const orgCode = currentOrg?.data?.organizationCode?.toLowerCase();
    
    // Business logic: Only colleges have departments, institutes don't
    // You can extend this logic for other business types in the future
    if (orgCode?.includes('college') || orgCode?.includes('university')) {
      return true;
    } else if (orgCode?.includes('institute') || orgCode?.includes('school')) {
      return false;
    }
    
    // Default behavior for unknown organization types
    // You can change this to true/false based on your business requirements
    return true; // Default to supporting departments
  }, [scope?.accessibleOrganizations, selectedOrganizationId]);

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
  }, [assignedTo]); // Remove assignedIds from dependencies to prevent infinite loop

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
        hasFetchedUsersRef.current = true;
      } catch (error) {
        console.error("Error fetching users:", error);
        setFetchedUsers([]);
      }
    };

    if ((mode === "edit" || mode === "create") && !hasFetchedUsersRef.current) {
      fetchUsers();
    } else if (users && users.length > 0) {
      // Only set users from props if they actually contain data
      setFetchedUsers(users);
    }
    // If hasFetchedUsersRef.current is true and users prop is empty, keep the fetched users
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
      const userName = assignedUser.userName || assignedUser.name || "Unknown User";
      const firstName = assignedUser.firstName || "";
      const lastName = assignedUser.lastName || "";
      
      // Create proper initials from firstName and lastName if available, otherwise use userName
      let initials = "?";
      if (firstName && lastName) {
        initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
      } else if (userName && userName !== "Unknown User") {
        const nameParts = userName.split(" ");
        if (nameParts.length >= 2) {
          initials = (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
        } else {
          initials = userName.charAt(0).toUpperCase();
        }
      }
      
      return {
        id: assignedUser.userId || assignedUser.id,
        name: userName,
        fallback: initials,
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
      departmentIds: selectedDepartments,
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
      const options = eventTypes.map(event => ({ value: event.name, label: event.name }));
      return options;
    } else {
      // No fallback - return empty array if no event types available
      return [];
    }
  }, [eventTypes]);

  const departmentOptions = useMemo(() => {
    if (departments && departments.length > 0) {
      return departments.map(dept => ({ value: dept.id, label: dept.name }));
    } else {
      // No fallback - return empty array if no departments available
      return [];
    }
  }, [departments]);

  return (
    <div className="detail-top-section-new-container">
      <div className="top-row">
        <button className="back-button" onClick={onBackClick}>
          <ArrowLeft size={18} />
        </button>
        {mode === "view" ? (
          <div className="event-title-display">
            {editableTitle || "Untitled Event"}
          </div>
        ) : (
          <input
            type="text"
            className={`editable-title-input-new ${errors && errors.title ? "error" : ""}`}
            value={editableTitle}
            onChange={handleTitleChange}
            placeholder="Enter event name ..."
            autoFocus={mode === "create"}
          />
        )}
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
        </div>
      </div>

      <div className="bottom-row">
        <div className="left_section">
          <div className="team-section">
            <span className="label">Team:</span>
            <div className="avatar-group-new">
              {hasAssignedUsers ? (
                <AvatarList 
                  avatars={selectedParticipants} 
                  maxVisible={2} 
                  showTooltip={true}
                  tooltipPosition="top"
                />
              ) : (
                <div className="no-assigned-users-placeholder">
                  <Users size={14} className="placeholder-icon" />
                  <span className="placeholder-text">No assigned users</span>
                </div>
              )}
              {(mode === "edit" || mode === "create") && (
                <div className="add-participant-section-new">
                  {permissions?.canEdit && (
                    <button
                      className="team-avatar-add"
                      onClick={handleAddButtonClick}
                    >
                      +
                    </button>
                  )}
                  <UserDropdown
                    isOpen={isDropdownOpen}
                    onClose={() => setIsDropdownOpen(false)}
                    users={fetchedUsers}
                    selectedUserIds={assignedIds}
                    onUserSelectionChange={(newIds) => {
                      setAssignedIds(newIds);
                      if (onParticipantsChange) {
                        // Pass both IDs and user objects for better data handling
                        const selectedUsers = newIds.map(id => {
                          const user = fetchedUsers.find(u => u.id === id);
                          return user ? {
                            userId: user.id,
                            userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown User',
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.email,
                            orgCode: user.organizationCode || "ORG001",
                            assignedOn: new Date().toISOString()
                          } : {
                            userId: id,
                            userName: "Unknown User",
                            orgCode: "ORG001",
                            assignedOn: new Date().toISOString()
                          };
                        });
                        onParticipantsChange(newIds, selectedUsers);
                      }
                    }}
                    placeholder="Search by name, email, org, or role..."
                    className="detail-top-user-dropdown-wrapper"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="right_section">
          <div className="type-section">
            <label className="label">Type:</label>
            {mode === "view" ? (
              <div className="event-type-display">
                {selectedEventType ? (
                  <span>{selectedEventType}</span>
                ) : (
                  <span className="no-event-type">No event type selected</span>
                )}
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
                }}
                disabled={mode === "view"}
              />
            )}
          </div>

          {organizationSupportsDepartments && (
            // In view mode, only show department section if there are assigned departments
            // In edit/create mode, always show the section
            (mode !== "view" || selectedDepartments.length > 0) && (
              <div className="department-section">
                <label className="label">Department:</label>
                {mode === "view" ? (
                  <div className="department-display">
                    <div className="department-list">
                      {selectedDepartments.map((deptId, index) => {
                        const department = departments.find(dept => dept.id === deptId);
                        return (
                          <span key={deptId} className="department-tag">
                            {department ? department.name : deptId}
                            {index < selectedDepartments.length - 1 && ", "}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  departmentOptions.length > 0 ? (
                    <MultiSelectDropdown
                      options={departmentOptions}
                      selectedValues={selectedDepartments}
                      onSelect={(option) => {
                        if (option.clearAll) {
                          // Clear all departments
                          onDepartmentsChange && onDepartmentsChange([]);
                        } else {
                          // Toggle individual department
                          const newSelectedDepartments = selectedDepartments.includes(option.value)
                            ? selectedDepartments.filter(id => id !== option.value)
                            : [...selectedDepartments, option.value];
                          onDepartmentsChange && onDepartmentsChange(newSelectedDepartments);
                        }
                      }}
                      disabled={mode === "view"}
                      placeholder="Select departments"
                      maxDisplayItems={2}
                    />
                  ) : (
                    <div className="no-departments-available">
                      <span className="no-departments-text">No departments available for this organization</span>
                    </div>
                  )
                )}
              </div>
            )
          )}

          <div className="date-section">
            <label htmlFor="date-input" className="label">Date:</label>
            {mode === "view" ? (
              <div className="date-display">
                {editableDate ? (
                  <span>{new Date(editableDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}</span>
                ) : (
                  <span className="no-date">No date selected</span>
                )}
              </div>
            ) : (
              <input
                id="date-input"
                type="date"
                className={`date-input-new ${errors && errors.date ? "error" : ""}`}
                value={editableDate}
                onChange={handleDateChange}
                min={new Date().toISOString().slice(0, 10)}
              />
            )}
          </div>

          <div className="time-section">
            <label htmlFor="time-input" className="label">Time:</label>
            {mode === "view" ? (
              <div className="time-display">
                {editableTime ? (
                  <span>{new Date(`2000-01-01T${editableTime}`).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })}</span>
                ) : (
                  <span className="no-time">No time selected</span>
                )}
              </div>
            ) : (
              <input
                id="time-input"
                type="time"
                className="time-input-new"
                value={editableTime}
                onChange={handleTimeChange}
              />
            )}
          </div>

          <div className="save-button-section" style={{ display: "flex", gap: "8px" }}>
            {/* Show New Task button in view mode, but hide for Designers and if user doesn't have permission */}
            {(mode === "view") && !isDesigner && permissions?.canCreateTask && (
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
