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
import { useDepartments } from "../../Hooks/useDepartments";
import { DepartmentProvider } from "../../Context/DepartmentContext";
import { getHierarchyUsers } from "../../Services/AuthN";
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
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [eventJustCreated, setEventJustCreated] = useState(false);
  const detailSaveRef = useRef(null);
  const { user, selectedOrganizationId, isViewingOwnOrganization, scopeChangeTrigger } = useUser();
  const { addMessage } = useMessages();
  const addMessageRef = useRef(addMessage);
  addMessageRef.current = addMessage;
  const { permissions: userPermissions } = useUser();
  const { eventTypes, getEventTypeById, getEventTypeByName, getActiveEventTypes } = useEventTypes();
  const { departments, getDepartmentById, getDepartmentByName, getActiveDepartments } = useDepartments();
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

  // Initialize currentEventId from location state or use eventId
  React.useEffect(() => {
    if (eventId) {
      setCurrentEventId(eventId);
    }
  }, [eventId]);

  // Only sync from navigation when initialMode changes; don't override local edits
  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  /** -------------------- API Functions -------------------- **/
  const fetchTasks = useCallback(async () => {
        // Use event's organization ID if available, otherwise fall back to current scope organization
        const eventOrgId = fetchedEvent?.organizationId || location.state?.eventData?.organizationId;
        const organizationId = eventOrgId || selectedOrganizationId || user?.organizationId;
        const taskEventId = currentEventId || eventId;
        
        if (!taskEventId) {
          return [];
        }
        
        const response = await fetchWithRefresh(`/apis/task/by-event/${taskEventId}?organizationId=${organizationId}`, {
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
        

    return formattedTasks;
  }, [currentEventId, eventId, selectedOrganizationId, user?.organizationId, fetchedEvent?.organizationId, location.state?.eventData?.organizationId]);

  const fetchEvent = useCallback(async () => {
    const eventIdToUse = currentEventId || eventId;
    if (!eventIdToUse) {
      return null;
    }
    
        // Use event's organization ID if available, otherwise fall back to current scope organization
        const eventOrgId = location.state?.eventData?.organizationId;
        const organizationId = eventOrgId || selectedOrganizationId || user?.organizationId;
        
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
          `/apis/event/get_event/${eventIdToUse}?organizationId=${organizationId}&userId=${user?.userId}`,
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
          assignedUsers: Array.isArray(eventData.assignedUsers) ? eventData.assignedUsers : [],
        departmentIds: Array.isArray(eventData.departmentIds) ? eventData.departmentIds : []
        };

    return transformedData;
  }, [currentEventId, eventId, selectedOrganizationId, user?.organizationId, user?.userId, location.state?.eventData?.organizationId]);

  /** -------------------- State Management -------------------- **/
  const [tasksData, setTasksData] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [eventLoading, setEventLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [eventError, setEventError] = useState(null);
  const [tasksError, setTasksError] = useState(null);
  const isFetchingEventRef = useRef(false);
  const isFetchingTasksRef = useRef(false);

  // Execute tasks API when activeTab is "Task" and eventId is available
  const executeFetchTasks = useCallback(async () => {
    const taskEventId = currentEventId || eventId;
    if (activeTab === "Task" && taskEventId && !isFetchingTasksRef.current) {
      
      isFetchingTasksRef.current = true;
      setTasksLoading(true);
      setTasksError(null);
      
      try {
        const data = await fetchTasks();
        setTasksData(data);
      } catch (err) {
        setTasksError(err.message);
      } finally {
        setTasksLoading(false);
        isFetchingTasksRef.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentEventId, eventId, fetchTasks]);

  // Execute event API when eventId is available and not in create mode
  const executeFetchEvent = useCallback(async () => {
    const taskEventId = currentEventId || eventId;
    if (taskEventId && mode !== "create" && !isFetchingEventRef.current) {
      
      isFetchingEventRef.current = true;
      setEventLoading(true);
      setEventError(null);
      
      try {
        const data = await fetchEvent();
        setEventData(data);
      } catch (err) {
        setEventError(err.message);
      } finally {
        setEventLoading(false);
        isFetchingEventRef.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEventId, eventId, mode, fetchEvent]);

  useEffect(() => {
    executeFetchTasks();
  }, [executeFetchTasks, scopeChangeTrigger]);

  useEffect(() => {
    executeFetchEvent();
  }, [executeFetchEvent, scopeChangeTrigger]);

  const fetchUsers = useCallback(async () => {
    // Use event's organization ID if available, otherwise fall back to current scope organization
    const eventOrgId = fetchedEvent?.organizationId || location.state?.eventData?.organizationId;
    const organizationId = eventOrgId || selectedOrganizationId || user?.organizationId;
    
    if (!organizationId) {
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
  }, [selectedOrganizationId, user?.organizationId, fetchedEvent?.organizationId, location.state?.eventData?.organizationId]);

  const [usersData, setUsersData] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const isFetchingUsersRef = useRef(false);

  // Execute users API when component mounts or scope changes
  const executeFetchUsers = useCallback(async () => {
    // Use event's organization ID if available, otherwise fall back to current scope organization
    const eventOrgId = fetchedEvent?.organizationId || location.state?.eventData?.organizationId;
    const organizationId = eventOrgId || selectedOrganizationId || user?.organizationId;
    if (organizationId && !isFetchingUsersRef.current) {
      
      isFetchingUsersRef.current = true;
      setUsersLoading(true);
      setUsersError(null);
      
      try {
        const data = await fetchUsers();
        setUsersData(data);
      } catch (err) {
        setUsersError(err.message);
      } finally {
        setUsersLoading(false);
        isFetchingUsersRef.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrganizationId, user?.organizationId, fetchUsers, fetchedEvent?.organizationId, location.state?.eventData?.organizationId]);

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
        departmentIds: [],
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
        // Initialize selectedDepartments from fetched data
        if (eventData.departmentIds && Array.isArray(eventData.departmentIds)) {
          setSelectedDepartments(eventData.departmentIds);
        }
    }
  }, [mode, formData, selectedDate, eventData, selectedOrganizationId, user?.organizationId, eventType, eventTypeId, fetchedEvent?.typeName]);

  const permissions = React.useMemo(() => {
    // Determine if the current user is a Designer role
    const isDesigner = user?.roles?.some(role => role?.name === "Designer" || role?.displayName === "Designer");
    const userCanEdit = userPermissions?.permissions?.Events?.["Event Management"]?.includes("Update") ?? false;
    const userCanCreateTask = userPermissions?.permissions?.Tasks?.["Task Management"]?.includes("Create") ?? false;
    const eventAllowsCRUD = fetchedEvent?.canCRUD !== false;
    const isOwnOrg = isViewingOwnOrganization();
    
    // Check if user is assigned to this event with robust ID normalization
    const currentUserId = String(user?.userId || user?.id || user?.userID || "");
    const assignedUserIds = Array.isArray(fetchedEvent?.assignedUsers)
      ? fetchedEvent.assignedUsers.map(u => {
          if (typeof u === "string" || typeof u === "number") {
            return String(u);
          }
          const possibleId = u?.userId ?? u?.id ?? u?.userID ?? u?.user?.id ?? u?.user?.userId;
          return possibleId != null ? String(possibleId) : "";
        }).filter(Boolean)
      : [];
    const isAssignedToEvent = currentUserId && assignedUserIds.includes(currentUserId);
    
    
    // Event creator should also be allowed to publish even if not in assignedUsers
    const creatorId = String(fetchedEvent?.createdBy ?? fetchedEvent?.createdById ?? "");
    const currentUserIdForCreatorCheck = String(user?.userId || user?.id || user?.userID || "");
    const isCreator = creatorId && currentUserIdForCreatorCheck && creatorId === currentUserIdForCreatorCheck;
    // Only assigned users or creator can access publish actions, and Designers are explicitly blocked
    const canPublish = (isAssignedToEvent || isCreator) && !isDesigner;
    // Other actions may continue to consider org or assignment
    const canPerformActions = isOwnOrg || isAssignedToEvent;
    
    const permissionsResult = {
      // New Event: Only check organization scope (not canCRUD)
      canCreateEvent: isOwnOrg,
      // New Task: Check user permissions + canCRUD + (own org OR assigned to event)
      canCreateTask: userCanCreateTask && eventAllowsCRUD && canPerformActions,
      // Edit/Save: Check user permissions + canCRUD + (own org OR assigned to event)
      canEdit: mode === "create" ? isOwnOrg : userCanEdit && eventAllowsCRUD && canPerformActions,
      canSave: mode === "create" ? isOwnOrg : userCanEdit && eventAllowsCRUD && canPerformActions,
      // Publish: strictly require assignment to this event
      canPublish: canPublish,
    };
    
    // Debug logging
    console.log("EventDetailPage permissions:", {
      isOwnOrg,
      isAssignedToEvent,
      canPerformActions,
      canPublish: permissionsResult.canPublish,
      user: user?.userId,
      assignedUsers: fetchedEvent?.assignedUsers
    });
    
    return permissionsResult;
  }, [mode, userPermissions?.permissions?.Events, userPermissions?.permissions?.Tasks, fetchedEvent?.canCRUD, isViewingOwnOrganization, fetchedEvent?.assignedUsers, fetchedEvent?.createdBy, fetchedEvent?.createdById, user?.userId, user?.id, user?.roles]);

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
    
    // Get department IDs from topSectionData
    const departmentIds = topSectionData?.departmentIds || selectedDepartments;
    

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

     // Use event's organization ID if available, otherwise fall back to current scope organization
     const eventOrgId = fetchedEvent?.organizationId || location.state?.eventData?.organizationId;
     const organizationId = eventOrgId || selectedOrganizationId || user?.organizationId;
     
     const payload = {
       eventName: titleValue,
       organizationId: organizationId,
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
       departmentIds: departmentIds,
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
      // Handle both possible response formats: result.id or result.eventId
      const newEventId = result.eventId || result.id;
      if (mode === "create" && newEventId) {
        // Update the current event ID state
        setCurrentEventId(newEventId);
        // Mark that event was just created
        setEventJustCreated(true);
        
        // Update the URL state to include the new event ID
        navigate(location.pathname, {
          state: {
            ...location.state,
            eventId: newEventId,
            eventData: {
              ...payload,
              id: newEventId,
              coordinators: payload.coordinators,
              specialGuests: payload.specialGuests,
              assignedUsers: payload.assignedUsers,
              departmentIds: payload.departmentIds
            }
          },
          replace: true
        });
      }

      // Update the local state with the saved data
      const updatedEvent = {
        ...payload,
        id: mode === "create" ? newEventId : eventId,
        coordinators: payload.coordinators,
        specialGuests: payload.specialGuests,
        assignedUsers: payload.assignedUsers,
        departmentIds: payload.departmentIds
      };

      setFetchedEvent(updatedEvent);

      // Switch to view mode after successful save/create
      setMode("view");
      addMessageRef.current({
        text: mode === "create" 
          ? "Event created successfully! You can now create tasks for this event." 
          : "Event updated successfully!",
        type: "success",
        duration: 4000,
      });

      // Reset the eventJustCreated flag after a delay
      if (mode === "create") {
        setTimeout(() => {
          setEventJustCreated(false);
        }, 10000); // Reset after 10 seconds
      }

    } catch (error) {
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

  const handleDepartmentsChange = (departmentIds) => {
    setSelectedDepartments(departmentIds);
  };

  const handleNewTaskClick = () => {
    // Use currentEventId if available, otherwise fall back to eventId from location state
    const taskEventId = currentEventId || eventId;
    
    if (!taskEventId) {
      addMessageRef.current({
        text: "Event ID not available. Please save the event first.",
        type: "error",
        duration: 3000,
      });
      return;
    }
    
    navigate("/events/eventDetailPage/tasks", {
      state: {
        eventId: taskEventId,
        mode: "create",
        organizationId: fetchedEvent?.organizationId || location.state?.eventData?.organizationId || selectedOrganizationId || user?.organizationId,
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

  const tabs = React.useMemo(() => {
    const baseTabs = [
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
        component: <Task tasksData={tasksData || []} eventId={currentEventId || eventId} eventName={fetchedEvent?.eventName || ""} />,
      },
      {
        label: "Files & Uploads",
        component: (
          <FileUploads
            filesFromTasks={[]}
            eventId={currentEventId || eventId}
            organizationId={fetchedEvent?.organizationId || location.state?.eventData?.organizationId || selectedOrganizationId || user?.organizationId}
          />
        ),
      }
    ];

    if (permissions.canPublish) {
      baseTabs.push({
        label: "To Publish",
        component: (
          <Publish
            publishData={[]}
            eventId={currentEventId || eventId}
            onDownload={() => handleDownload()}
            onSendMail={() => handleSendMail()}
            canPublish={permissions.canPublish}
            user={user}
          />
        ),
      });
    }

    return baseTabs;
  }, [mode, detailSaveRef, guestsData, organizersData, formData?.eventDescription, fetchedEvent?.eventDescription, formData?.location, fetchedEvent?.locationDetails, tasksData, currentEventId, eventId, selectedOrganizationId, user?.organizationId, handleDownload, handleSendMail, fetchedEvent?.eventName, validationErrors, permissions.canPublish, user, fetchedEvent?.organizationId, location.state?.eventData?.organizationId]);

  const filteredTabs = React.useMemo(() => {
    if (mode === "create") {
      return tabs.filter(tab => tab.label === "Details");
    }
    return tabs;
  }, [mode, tabs]);

  // If user cannot publish and the active tab is "To Publish", redirect to Details
  useEffect(() => {
    if (!permissions.canPublish && activeTab === "To Publish") {
      setActiveTab("Details");
    }
  }, [permissions.canPublish, activeTab]);

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
          eventId: currentEventId || eventId,
          mode: "view",
          eventData: fetchedEvent
        }
      }),
    },
  ], [user?.organization?.name, mode, navigate, currentEventId, eventId, fetchedEvent]);

  // Determine loading state
  const isLoading = useMemo(() => {
    if (mode === "create") return false;
    return eventLoading || usersLoading;
  }, [mode, eventLoading, usersLoading]);

  if (isLoading) {
    return <PageSkeleton type="event" />;
  }

  // Get event organization ID for department context
  // Priority: 1) Event data organization ID, 2) Location state organization ID, 3) Current scope organization ID
  const eventOrgId = fetchedEvent?.organizationId || 
                     location.state?.eventData?.organizationId || 
                     selectedOrganizationId || 
                     user?.organizationId;

  return (
    <DepartmentProvider eventOrganizationId={eventOrgId}>
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
            eventJustCreated={eventJustCreated}
            departments={departments}
            getDepartmentById={getDepartmentById}
            getDepartmentByName={getDepartmentByName}
            getActiveDepartments={getActiveDepartments}
            selectedDepartments={selectedDepartments}
            onDepartmentsChange={handleDepartmentsChange}
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
    </DepartmentProvider>
  );
};

export default EventDetail;