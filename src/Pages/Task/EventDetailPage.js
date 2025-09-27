import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { fetchWithRefresh } from "../../Context/RefereshToken";
import { useNavigate, useLocation } from "react-router-dom";
import TabMenu from "../../CommonComponents/TabMenu/TabMenu";
import Detail from "./EventDetail/EventDetail";
import Task from "./Tasks/Tasks";
import Publish from "./Publish/Publish";
import FileUploads from "./Files_Uploads/FilesUploads";
import Breadcrumb from "../../CommonComponents/Breadcrumb/Breadcrumb";
import TopSection from "../../CommonComponents/TaskTopSection/DetailTopSectionNew";
import PageSkeleton from "../../CommonComponents/SkeletonLoading/PageSkeleton";
import { useUser } from "../../Context/UserContext";
import { useMessages } from "../../Context/MessageContext";
import { useEventTypes } from "../../Hooks/useEventTypes";
import { getHierarchyUsers } from "../../Services/AuthN";
import useApi from "../../Hooks/useApi";
import { Building, Calendar, FileText } from "lucide-react";
import "./Tasks.css";

const EventDetail = () => {
  const [showEdit] = useState(true);
  const [fetchedEvent, setFetchedEvent] = useState(null);
  const [activeTab, setActiveTab] = useState("Details");
  const [mode, setMode] = useState("View");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [usersList, setUsersList] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const detailSaveRef = useRef(null);
  const { user, selectedOrganizationId, isViewingOwnOrganization, scopeChangeTrigger } = useUser();
  const { addMessage } = useMessages();
  const addMessageRef = useRef(addMessage);
  addMessageRef.current = addMessage;
  const { permissions: userPermissions } = useUser();
  const { eventTypes, getEventTypeById, getEventTypeByName, getActiveEventTypes } = useEventTypes();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    eventId,
    mode: initialMode,
    eventType,
    eventTypeId,
    formData,
    selectedDate: locationSelectedDate
  } = location.state || {};

  const selectedDate = React.useMemo(() => (
    locationSelectedDate ? new Date(locationSelectedDate) : null
  ), [locationSelectedDate]);

  // Only sync from navigation when initialMode changes; don't override local edits
  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  /** -------------------- API Functions -------------------- **/
  const fetchTasks = useCallback(async () => {
        const organizationId = selectedOrganizationId || user?.organizationId;
        
        const response = await fetchWithRefresh(`/apis/task/by-event/${eventId}?organizationId=${organizationId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "ngrok-skip-browser-warning": "1",
          },
        });

        if (response.status === 404) {
      return []; // Gracefully handle missing endpoint/data without throwing
        }

        if (response.status === 500) {
          console.error("Server error fetching tasks - likely backend data type mismatch");
          addMessageRef.current({
            text: "Unable to load tasks due to server error. Please try again later.",
            type: "error",
            duration: 5000,
          });
      return [];
        }

        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const data = await response.json();

        const safeArray = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        
        // Debug: Log the raw task data
        console.log("=== RAW TASK DATA DEBUG ===");
        console.log("Raw data:", data);
        console.log("Safe array:", safeArray);
        if (safeArray.length > 0) {
          console.log("First task:", safeArray[0]);
          console.log("First task assignedTo:", safeArray[0].assignedTo);
          console.log("First task assignedTo type:", typeof safeArray[0].assignedTo);
          console.log("First task assignedTo is array:", Array.isArray(safeArray[0].assignedTo));
        }
        
        const formattedTasks = safeArray.map((task) => ({
          id: task.id,
          creative_name: task.taskTitle,
          creative_type: task.creativeType,
          // Pass the complete assignedTo array with user objects for avatar display
          assigned_to: Array.isArray(task.assignedTo) ? task.assignedTo : [],
          due_date: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "",
          status: task.taskStatusName,
          // Pass the complete task data for any additional fields needed
          ...task
        }));
        
        console.log("Formatted tasks:", formattedTasks);

    return formattedTasks;
  }, [eventId, selectedOrganizationId, user?.organizationId]);

  const fetchEvent = useCallback(async () => {
    if (!eventId) {
      return null;
    }
    
        const organizationId = selectedOrganizationId || user?.organizationId;
        
        if (!organizationId) {
          throw new Error("No organization selected");
        }

        // Determine if we need to include X-Context-Organization header
    const isViewingOwnOrg = organizationId === user?.organizationId;
        
        // Prepare headers
        const headers = {
          "Content-Type": "application/json",
          Accept: "application/json",
          "ngrok-skip-browser-warning": "1",
        };

        // Only add X-Context-Organization header when viewing a different organization
    if (!isViewingOwnOrg) {
          headers["X-Context-Organization"] = organizationId;
        }

        // Use the new event details API endpoint
        const response = await fetchWithRefresh(
          `/apis/event/get_event/${eventId}?organizationId=${organizationId}&userId=${user?.userId}`,
          {
            method: "GET",
            headers,
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();
        const eventData = responseData.data || responseData;

        const transformedData = {
          ...eventData,
          coordinators: Array.isArray(eventData.coordinators)
            ? eventData.coordinators.map(coord => typeof coord === 'string' ? { name: coord, title: "Coordinator" } : coord)
            : [],
          specialGuests: Array.isArray(eventData.specialGuests)
            ? eventData.specialGuests.map(guest => typeof guest === 'string' ? { name: guest, title: "Guest" } : guest)
            : [],
          assignedUsers: Array.isArray(eventData.assignedUsers) ? eventData.assignedUsers : []
        };

    return transformedData;
  }, [eventId, selectedOrganizationId, user?.organizationId, user?.userId]);

  /** -------------------- Use API Hooks -------------------- **/
  const {
    data: tasksData,
    execute: executeFetchTasks
  } = useApi(fetchTasks, [eventId, selectedOrganizationId], false);

  const {
    data: eventData,
    loading: eventLoading,
    execute: executeFetchEvent
  } = useApi(fetchEvent, [eventId, selectedOrganizationId], false);

  // Execute tasks API when activeTab is "Task" and eventId is available
  useEffect(() => {
    if (activeTab === "Task" && eventId) {
      executeFetchTasks();
    }
  }, [activeTab, eventId, executeFetchTasks, scopeChangeTrigger]);

  // Execute event API when eventId is available and not in create mode
  useEffect(() => {
    if (eventId && mode !== "create") {
      executeFetchEvent();
    }
  }, [eventId, mode, executeFetchEvent, scopeChangeTrigger]);

  const fetchUsers = useCallback(async () => {
    const organizationId = selectedOrganizationId || user?.organizationId;
    
    if (!organizationId) {
      console.warn("No organizationId available for user fetch");
      return [];
    }

    const response = await getHierarchyUsers(organizationId);

    const formattedUsers = response.users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      fullName: `${user.firstName} ${user.lastName}`,
      organizationId: user.organizationId,
      organizationCode: user.organizationCode || "ORG001"
    }));

    return formattedUsers;
  }, [selectedOrganizationId, user?.organizationId]);

  const {
    data: usersData,
    loading: usersLoading,
    execute: executeFetchUsers
  } = useApi(fetchUsers, [selectedOrganizationId], false);

  // Execute users API when component mounts or scope changes
  useEffect(() => {
    executeFetchUsers();
  }, [executeFetchUsers, scopeChangeTrigger]);

  // Update usersList when usersData changes
  useEffect(() => {
    if (usersData) {
      setUsersList(usersData);
    }
  }, [usersData]);

  // Handle create mode and event data updates
  useEffect(() => {
    if (mode === "create") {
      const newEvent = {
        eventName: formData?.eventName || "",
        eventDate: selectedDate ? selectedDate.toISOString() : new Date().toISOString(),
        eventDescription: formData?.eventDescription || "",
        coordinators: [],
        specialGuests: [],
        organizationId: selectedOrganizationId || user?.organizationId,
        eventType: eventType || "",
        eventTypeId: eventTypeId || "",
        typeName: fetchedEvent?.typeName || "",
        location: formData?.location || "",
        assignedUsers: [],
      };

      setFetchedEvent(newEvent);
      return;
    }

    // Update fetchedEvent when eventData changes
    if (eventData) {
      setFetchedEvent(eventData);
        // Initialize assignedUsers from fetched data - pass full user objects instead of just IDs
        if (eventData.assignedUsers && Array.isArray(eventData.assignedUsers)) {
          setAssignedUsers(eventData.assignedUsers);
        }
    }
  }, [mode, formData, selectedDate, eventData, selectedOrganizationId, user?.organizationId, eventType, eventTypeId, fetchedEvent?.typeName]);

  const permissions = React.useMemo(() => {
    const userCanEdit = userPermissions?.permissions?.Events?.["Event Management"]?.includes("Update") ?? false;
    const userCanCreateTask = userPermissions?.permissions?.Tasks?.["Task Management"]?.includes("Create") ?? false;
    const eventAllowsCRUD = fetchedEvent?.canCRUD !== false;
    const isOwnOrg = isViewingOwnOrganization();
    
    return {
      // New Event: Only check organization scope (not canCRUD)
      canCreateEvent: isOwnOrg,
      // New Task: Check user permissions + canCRUD + organization scope
      canCreateTask: userCanCreateTask && eventAllowsCRUD && isOwnOrg,
      // Edit/Save: Check user permissions + canCRUD + organization scope
      canEdit: mode === "create" ? isOwnOrg : userCanEdit && eventAllowsCRUD && isOwnOrg,
      canSave: mode === "create" ? isOwnOrg : userCanEdit && eventAllowsCRUD && isOwnOrg,
    };
  }, [mode, userPermissions?.permissions?.Events, userPermissions?.permissions?.Tasks, fetchedEvent?.canCRUD, isViewingOwnOrganization]);

  const handleSaveEvent = async (topSectionData, detailData) => {
    setIsSubmitting(true);
    // Comprehensive validation for all required fields
    const errors = {};
    
    // Validate Event Name
    const titleValue = (topSectionData?.title || "").trim();
    if (!titleValue) {
      errors.title = "Event name is required";
    }
    
    // Validate Event Type
    const eventTypeValue = (topSectionData?.type || topSectionData?.typeName || "").trim();
    if (!eventTypeValue) {
      errors.eventType = "Event type is required";
    }
    
    // Validate Date
    if (!topSectionData?.date) {
      errors.date = "Event date is required";
    } else {
      // Additional validation: date should not be in the past
      const selectedDate = new Date(topSectionData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        errors.date = "Event date cannot be in the past";
      }
    }
    
    // Validate Time
    if (!topSectionData?.time) {
      errors.time = "Event time is required";
    }
    
    // Validate Description
    const descriptionValue = (detailData?.description || "").trim();
    if (!descriptionValue) {
      errors.description = "Event description is required";
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setIsSubmitting(false);
      addMessage({ text: "Please fix the highlighted fields", type: "error", duration: 2500 });
      return;
    }
    
    // Use provided detailData or fallback to defaults
    const finalDetailData = detailData || {
      description: "",
      location: "Pune",
      guests: [],
      organizers: []
    };
    
    console.log("EventDetailPage: handleSaveEvent called");
    console.log("EventDetailPage: topSectionData:", topSectionData);
    console.log("EventDetailPage: detailData received:", detailData);
    console.log("EventDetailPage: finalDetailData:", finalDetailData);

    // Prepare assignedUsers array - assignedUsers already contains full user objects
    const assignedUsersPayload = assignedUsers.map(assignedUser => {
      // If it's already a full object, use it directly
      if (assignedUser && typeof assignedUser === 'object' && assignedUser.userId) {
        return {
          userId: assignedUser.userId,
          userName: assignedUser.userName,
          orgCode: assignedUser.orgCode || "ORG001",
          assignedOn: assignedUser.assignedOn || new Date().toISOString()
        };
      }
      
      // Fallback: if it's just an ID, look it up in usersList
      const user = usersList.find(u => u.id === assignedUser);
      const currentDate = new Date().toISOString();
      return {
        userId: assignedUser,
        userName: user ? `${user.firstName} ${user.lastName}` : "Unknown User",
        orgCode: user?.organizationCode || "ORG001",
        assignedOn: currentDate
      };
    });

     const payload = {
       eventName: titleValue,
       organizationId: selectedOrganizationId || user?.organizationId,
       eventTypeId: topSectionData.eventTypeId || eventTypeId || fetchedEvent?.eventTypeId,
       eventTypeName: (topSectionData.typeName || topSectionData.type || fetchedEvent?.typeName || "").trim(),
       eventDescription: finalDetailData.description || "",
       locationDetails: finalDetailData.location || "Pune",
       coordinators: (finalDetailData.organizers || []).map(org => ({
         name: org.name,
         title: org.title || "Coordinator"
       })),
       specialGuests: (finalDetailData.guests || []).map(guest => ({
         name: guest.name,
         title: guest.title || "Guest"
       })),
       assignedUsers: assignedUsersPayload,
       // Expect topSectionData.date to be a datetime-local value; convert to ISO
       eventDate: topSectionData?.date
         ? new Date(topSectionData.date).toISOString()
         : (selectedDate ? selectedDate.toISOString() : new Date().toISOString()),
       createdBy: user?.userId,
       createdByName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.userName || "Unknown User" : "Unknown User",
       isPrivate: false,
       updatedBy: user?.userId
     };

    try {
      const url = mode === "create"
        ? "/apis/event/create_event"
        : `/apis/event/update/${eventId}?userId=${user?.userId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetchWithRefresh(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "ngrok-skip-browser-warning": "1",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      const result = await response.json();

      // For new events, get the ID from the response and update the state
      if (mode === "create" && result.id) {
        // Update the URL state to include the new event ID
        navigate(location.pathname, {
          state: {
            ...location.state,
            eventId: result.id,
            eventData: {
              ...payload,
              id: result.id,
              coordinators: payload.coordinators,
              specialGuests: payload.specialGuests,
              assignedUsers: payload.assignedUsers
            }
          },
          replace: true
        });
      }

      // Update the local state with the saved data
      const updatedEvent = {
        ...payload,
        id: mode === "create" ? result.id : eventId,
        coordinators: payload.coordinators,
        specialGuests: payload.specialGuests,
        assignedUsers: payload.assignedUsers
      };

      setFetchedEvent(updatedEvent);

      // Switch to view mode after successful save/create
      setMode("view");
      addMessageRef.current({
        text: `Event ${mode === "create" ? "created" : "updated"} successfully!`,
        type: "success",
        duration: 3000,
      });

    } catch (error) {
      console.error(`Error ${mode === "create" ? "creating" : "updating"} event:`, error);
      addMessageRef.current({
        text: `Failed to ${mode === "create" ? "create" : "update"} event.`,
        type: "error",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = useCallback(() => {
    addMessageRef.current({
      text: "Download functionality coming soon!",
      type: "info",
      duration: 3000,
    });
  }, []);

  const handleSendMail = useCallback(() => {
    addMessageRef.current({
      text: "Mail sending functionality coming soon!",
      type: "info",
      duration: 3000,
    });
  }, []);

  const handleBackClick = () => navigate(-1);

  const handleParticipantsChange = (participantIds) => {
    // Convert user IDs to full user objects
    const fullUserObjects = participantIds.map(userId => {
      const user = usersList.find(u => u.id === userId);
      return {
        userId: userId,
        userName: user ? `${user.firstName} ${user.lastName}` : "Unknown User",
        orgCode: user?.organizationCode || "ORG001",
        assignedOn: new Date().toISOString()
      };
    });
    setAssignedUsers(fullUserObjects);
  };

  const handleNewTaskClick = () => {
    navigate("/events/eventDetailPage/tasks", {
      state: {
        eventId,
        mode: "create",
        organizationId: selectedOrganizationId || user?.organizationId,
        eventDate: fetchedEvent?.eventDate || (selectedDate ? selectedDate.toISOString() : undefined),
        eventName: fetchedEvent?.eventName || "New Event",
      },
    });
  };

  const handleTabChange = (tab) => {
    // Keep current mode when switching tabs
    setActiveTab(tab);
  };

  const formatDateTimeLocal = (dateInput) => {
    if (!dateInput) return "";
    const d = new Date(dateInput);
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const HH = pad(d.getHours());
    const MM = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${HH}:${MM}`;
  };

  const participants = React.useMemo(() => [
    ...(fetchedEvent?.coordinators || []).map((coord, index) => ({
      id: `coordinator-${index}`,
      name: coord?.name || coord,
      // Use explicit avatar URL if provided; otherwise force fallback initials for consistent color
      src: coord?.avatarUrl && String(coord.avatarUrl).trim() !== '' ? coord.avatarUrl : null,
      size: "32px",
      shape: "circle"
    })),
    ...(fetchedEvent?.specialGuests || []).map((guest, index) => ({
      id: `guest-${index}`,
      name: guest?.name || guest,
      src: guest?.avatarUrl && String(guest.avatarUrl).trim() !== '' ? guest.avatarUrl : null,
      size: "32px",
      shape: "circle"
    })),
    // Add assigned users to participants
    ...(fetchedEvent?.assignedUsers || []).map((assignedUser, index) => ({
      id: assignedUser.userId || `assigned-${index}`,
      name: assignedUser.userName || "Unknown User",
      size: "32px",
      shape: "circle"
    })),
  ], [fetchedEvent?.coordinators, fetchedEvent?.specialGuests, fetchedEvent?.assignedUsers]);

  const topSectionData = React.useMemo(() => {
    // Get event type name from cached event types
    const eventTypeName = mode === "create" 
      ? (eventType || "")
      : (fetchedEvent?.typeName || getEventTypeById(fetchedEvent?.eventTypeId)?.name || "");

     return {
     title: mode === "create" ? formData?.eventName || "" : fetchedEvent?.eventName || "",
     date: mode === "create"
       ? selectedDate
         ? formatDateTimeLocal(selectedDate)
         : null
       : fetchedEvent?.eventDate
         ? formatDateTimeLocal(fetchedEvent.eventDate)
         : null,
       type: eventTypeName,
       typeName: eventTypeName,
       eventTypeId: mode === "create" ? eventTypeId : fetchedEvent?.eventTypeId,
     createdBy: mode === "create"
       ? (user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.userName || "Current User" : "Current User")
       : (fetchedEvent?.createdByName || `User ID ${fetchedEvent?.createdBy || ""}`),
     creatorAvatar: {
       id: 0,
       name: mode === "create" 
         ? (user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.userName || "Current User" : "Current User")
         : (fetchedEvent?.createdByName || `User ID ${fetchedEvent?.createdBy || ""}`),
       size: "24px",
       shape: "circle",
     },
     participants,
     };
  }, [mode, formData?.eventName, fetchedEvent?.eventName, selectedDate, fetchedEvent?.eventDate, fetchedEvent?.typeName, fetchedEvent?.eventTypeId, eventType, eventTypeId, user, fetchedEvent?.createdBy, fetchedEvent?.createdByName, participants, getEventTypeById]);

  const guestsData = React.useMemo(() =>
    mode === "create" ? [] : fetchedEvent?.specialGuests || [],
    [mode, fetchedEvent?.specialGuests]
  );
  const organizersData = React.useMemo(() =>
    mode === "create" ? [] : fetchedEvent?.coordinators || [],
    [mode, fetchedEvent?.coordinators]
  );

  const tabs = React.useMemo(() => [
    {
      label: "Details",
      component: (
        <Detail
          mode={mode}
          onSave={detailSaveRef}
          guestsData={guestsData}
          organizersData={organizersData}
          initialDescription={
            mode === "create" ? formData?.eventDescription || "" : fetchedEvent?.eventDescription || ""
          }
          initialLocation={
            mode === "create" ? formData?.location || "" : fetchedEvent?.locationDetails || ""
          }
          validationErrors={validationErrors}
          onClearError={(field) => setValidationErrors(prev => ({ ...prev, [field]: undefined }))}
        />
      ),
    },
    {
      label: "Task",
      component: <Task tasksData={tasksData || []} eventId={eventId} eventName={fetchedEvent?.eventName || ""} />,
    },
    {
      label: "Files & Uploads",
      component: (
        <FileUploads
          filesFromTasks={[]}
          eventId={eventId}
          organizationId={selectedOrganizationId || user?.organizationId}
        />
      ),
    },
    {
      label: "To Publish",
      component: (
        <Publish
          publishData={[]}
          eventId={eventId}
          onDownload={() => handleDownload()}
          onSendMail={() => handleSendMail()}
        />
      ),
    },
  ], [mode, detailSaveRef, guestsData, organizersData, formData?.eventDescription, fetchedEvent?.eventDescription, formData?.location, fetchedEvent?.locationDetails, tasksData, eventId, selectedOrganizationId, user?.organizationId, handleDownload, handleSendMail, fetchedEvent?.eventName, validationErrors]);

  const filteredTabs = React.useMemo(() =>
    mode === "create"
      ? tabs.filter(tab => tab.label === "Details")
      : tabs,
    [mode, tabs]
  );

  const breadcrumbItems = React.useMemo(() => [
    { label: user?.organization?.name || "Organization", href: "#", icon: Building },
    {
      label: "Events",
      href: "/events",
      icon: Calendar,
      onClick: () => navigate("/events"),
    },
    {
      label:
        mode === "create"
          ? "New Event"
          : fetchedEvent?.eventName || "Event Details",
      href: "#",
      icon: FileText,
      onClick: mode === "create" ? undefined : () => navigate("/events/eventDetailPage", {
        state: {
          eventId: eventId,
          mode: "view",
          eventData: fetchedEvent
        }
      }),
    },
  ], [user?.organization?.name, mode, navigate, eventId, fetchedEvent]);

  // Determine loading state
  const isLoading = useMemo(() => {
    if (mode === "create") return false;
    return eventLoading || usersLoading;
  }, [mode, eventLoading, usersLoading]);

  if (isLoading) {
    return <PageSkeleton type="event" />;
  }

  return (
    <div className="event-detail-module fade-in">
      <div className="BreadCrumb">
        <Breadcrumb items={breadcrumbItems} />
      </div>
      <div className="Top-Section">
        <TopSection
          mode={mode}
          onBackClick={handleBackClick}
          onNewTaskClick={permissions.canCreateTask ? handleNewTaskClick : undefined}
          onSaveClick={permissions.canSave ? ((topData) => {
            const detailData = detailSaveRef.current ? detailSaveRef.current() : null;
            handleSaveEvent(topData, detailData);
          }) : undefined}
          data={topSectionData}
          participants={participants}
          permissions={permissions}
          initialDate={selectedDate ? formatDateTimeLocal(selectedDate) : ""}
          isSubmitting={isSubmitting}
          errors={validationErrors}
          onClearError={(field) => setValidationErrors(prev => ({ ...prev, [field]: undefined }))}
          users={usersList}
          assignedTo={assignedUsers}
          onParticipantsChange={handleParticipantsChange}
          eventTypes={eventTypes}
          getEventTypeById={getEventTypeById}
          getEventTypeByName={getEventTypeByName}
          getActiveEventTypes={getActiveEventTypes}
        />
      </div>
      <div className="Inner-Content">
        <TabMenu
          tabs={filteredTabs}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          showEditButton={showEdit && mode === "view" && permissions.canEdit}
          isEditMode={mode === "edit"}
          onEditClick={() => {
            setMode("edit");
          }}
          onCancelClick={() => setMode("view")}
        />
      </div>
    </div>
  );
};

export default EventDetail;