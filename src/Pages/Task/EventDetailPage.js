import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { fetchWithRefresh } from "../../Context/RefereshToken";
import { useNavigate, useLocation } from "react-router-dom";
import TabMenu from "../../CommonComponents/TabMenu/TabMenu";
import Detail from "./EventDetail/EventDetail";
import Task from "./Tasks/Tasks";
import Publish from "./Publish/Publish";
import FileUploads from "./Files_Uploads/FilesUploads";
import Breadcrumb from "../../CommonComponents/Breadcrumb/Breadcrumb";
import TopSection from "../../CommonComponents/TaskTopSection/DetailTopSection";
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
  const [mode, setMode] = useState("view");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [usersList, setUsersList] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const detailSaveRef = useRef(null);
<<<<<<< HEAD
  const { user } = useUser();
=======
  const { user, selectedOrganizationId, isViewingOwnOrganization, scopeChangeTrigger } = useUser();
>>>>>>> a3951b3e1e8c4af6b88d0d22f94bb6251b86cdd9
  const { addMessage } = useMessages();
  const { permissions: userPermissions } = useUser();
  const { eventTypes, getEventTypeById, getEventTypeByName, getActiveEventTypes } = useEventTypes();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    eventId,
    mode: initialMode,
    eventType,
    eventTypeId,
<<<<<<< HEAD
    eventTypeDesc,
    eventData,
=======
>>>>>>> a3951b3e1e8c4af6b88d0d22f94bb6251b86cdd9
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

<<<<<<< HEAD
  useEffect(() => {
    const abortController = new AbortController();
    const fetchTasks = async () => {
      try {
        const response = await fetchWithRefresh(`/apis/task/by-event/${eventId}?organizationId=${user?.organizationId}`, {
=======
  /** -------------------- API Functions -------------------- **/
  const fetchTasks = useCallback(async () => {
        const organizationId = selectedOrganizationId || user?.organizationId;
        
        const response = await fetchWithRefresh(`/apis/task/by-event/${eventId}?organizationId=${organizationId}`, {
>>>>>>> a3951b3e1e8c4af6b88d0d22f94bb6251b86cdd9
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

<<<<<<< HEAD
=======
        if (response.status === 500) {
          console.error("Server error fetching tasks - likely backend data type mismatch");
          addMessageRef.current({
            text: "Unable to load tasks due to server error. Please try again later.",
            type: "error",
            duration: 5000,
          });
      return [];
        }

>>>>>>> a3951b3e1e8c4af6b88d0d22f94bb6251b86cdd9
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const data = await response.json();

        const safeArray = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        const formattedTasks = safeArray.map((task) => ({
          id: task.id,
          creative_name: task.taskTitle,
          creative_type: task.creativeType,
          assigned_to: Array.isArray(task.assignedTo) && task.assignedTo.length > 0
            ? task.assignedTo.map(user => user.name).join(", ")
            : "Unassigned",
          due_date: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "",
          status: task.taskStatus,
        }));

<<<<<<< HEAD
        setTasksData(formattedTasks);
      } catch (error) {
        if (error.name === 'AbortError') return;
        console.error("Error fetching tasks:", error);
        addMessage({
          text: "Failed to load tasks. Please try again.",
          type: "error",
          duration: 3000,
        });
      }
    };
=======
    return formattedTasks;
  }, [eventId, selectedOrganizationId, user?.organizationId]);
>>>>>>> a3951b3e1e8c4af6b88d0d22f94bb6251b86cdd9

  const fetchEvent = useCallback(async () => {
    if (!eventId) {
      return null;
    }
<<<<<<< HEAD

    return () => abortController.abort();
  }, [activeTab, eventId, user?.organizationId, addMessage]);

  useEffect(() => {
    fetchUsers();
  }, [user?.organizationId]);

  useEffect(() => {
    if (mode === "create") {
      const newEvent = {
        eventName: formData?.eventName || "",
        eventDate: selectedDate ? selectedDate.toISOString() : new Date().toISOString(),
        eventDescription: formData?.eventDescription || "",
        coordinators: [],
        specialGuests: [],
        organizationId: user?.organizationId,
        eventType: eventType || "",
        eventTypeId: eventTypeId || "",
        eventTypeDesc: eventTypeDesc || "",
        location: formData?.location || "",
        assignedUsers: [],
      };

      setFetchedEvent(newEvent);
      return;
    }

    if (eventData) {
      const transformedEvent = {
        ...eventData,
        eventType: eventType || eventData.eventType,
        eventTypeId: eventTypeId || eventData.eventTypeId,
        eventTypeDesc: eventTypeDesc || eventData.eventTypeDesc,
        coordinators: Array.isArray(eventData.coordinators)
          ? eventData.coordinators.map(coord => typeof coord === 'string' ? { name: coord, title: "Coordinator" } : coord)
          : [],
        specialGuests: Array.isArray(eventData.specialGuests)
          ? eventData.specialGuests.map(guest => typeof guest === 'string' ? { name: guest, title: "Guest" } : guest)
          : [],
        assignedUsers: Array.isArray(eventData.assignedUsers) ? eventData.assignedUsers : []
      };

      setFetchedEvent(transformedEvent);
      // Initialize assignedUsers from eventData if available
      if (eventData.assignedUsers) {
        setAssignedUsers(eventData.assignedUsers.map(user => user.userId));
      }
      return;
    }

    const fetchEvent = async () => {
      if (!eventId) return;
      try {
        const response = await fetchWithRefresh(`/apis/task/get_tasks_only?organizationId=${user?.organizationId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "ngrok-skip-browser-warning": "1",
          },
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
=======
    
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

>>>>>>> a3951b3e1e8c4af6b88d0d22f94bb6251b86cdd9
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

<<<<<<< HEAD
        setFetchedEvent(transformedData);
        // Initialize assignedUsers from fetched data
        if (eventData.assignedUsers) {
          setAssignedUsers(eventData.assignedUsers.map(user => user.userId));
        }
      } catch (error) {
        console.error("Error fetching event:", error);
        addMessage({
          text: "Failed to load event. Please try again.",
          type: "error",
          duration: 3000,
        });
      }
    };

    fetchEvent();
  }, [eventId, mode, selectedDate, eventData, user?.organizationId, formData, eventType, eventTypeId, eventTypeDesc, addMessage]);
=======
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
>>>>>>> a3951b3e1e8c4af6b88d0d22f94bb6251b86cdd9

  const permissions = React.useMemo(() => ({
    canEdit: mode === "create" ? true : userPermissions?.permissions?.Events?.["Event Management"]?.includes("Update") ?? false,
    canCreateTask: userPermissions?.permissions?.Tasks?.["Task Management"]?.includes("Create") ?? false,
    canSave: mode === "create" ? true : userPermissions?.permissions?.Events?.["Event Management"]?.includes("Update") ?? false,
  }), [mode, userPermissions?.permissions?.Events, userPermissions?.permissions?.Tasks]);

  const handleSaveEvent = async (topSectionData, detailData) => {
    setIsSubmitting(true);
    // Basic validation for required fields: name/title and date
    const errors = {};
    const titleValue = (topSectionData?.title || "").trim();
    if (!titleValue) {
      errors.title = "Event name is required";
    }
    if (!topSectionData?.date) {
      errors.date = "Event date is required";
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

    // Prepare assignedUsers array from selected user IDs
    const assignedUsersPayload = assignedUsers.map(userId => {
      const user = usersList.find(u => u.id === userId);
      const currentDate = new Date().toISOString();
      return {
        userId: userId,
        userName: user ? `${user.firstName} ${user.lastName}` : "Unknown User",
        orgCode: user?.organizationCode || "ORG001",
        assignedOn: currentDate
      };
    });

    const payload = {
      eventName: titleValue,
<<<<<<< HEAD
      organizationId: user?.organizationId,
      eventTypeId: eventTypeId || fetchedEvent?.eventTypeId,
      eventType: eventType || fetchedEvent?.eventType,
      eventTypeDesc: eventTypeDesc || fetchedEvent?.eventTypeDesc,
      eventDescription: detailData.description || "",
      locationDetails: detailData.location || "Pune",
      coordinators: (detailData.organizers || []).map(org => ({
=======
      organizationId: selectedOrganizationId || user?.organizationId,
      eventTypeId: topSectionData.eventTypeId || eventTypeId || fetchedEvent?.eventTypeId,
      eventTypeName: (topSectionData.typeName || fetchedEvent?.typeName || "").trim(),
      eventDescription: finalDetailData.description || "",
      locationDetails: finalDetailData.location || "Pune",
      coordinators: (finalDetailData.organizers || []).map(org => ({
>>>>>>> a3951b3e1e8c4af6b88d0d22f94bb6251b86cdd9
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
      isPrivate: true,
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
      addMessage({
        text: `Event ${mode === "create" ? "created" : "updated"} successfully!`,
        type: "success",
        duration: 3000,
      });

    } catch (error) {
      console.error(`Error ${mode === "create" ? "creating" : "updating"} event:`, error);
      addMessage({
        text: `Failed to ${mode === "create" ? "create" : "update"} event.`,
        type: "error",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = useCallback(() => {
    addMessage({
      text: "Download functionality coming soon!",
      type: "info",
      duration: 3000,
    });
  }, [addMessage]);

  const handleSendMail = useCallback(() => {
    addMessage({
      text: "Mail sending functionality coming soon!",
      type: "info",
      duration: 3000,
    });
  }, [addMessage]);

  const fetchUsers = async () => {
    try {
      if (!user?.organizationId) {
        console.warn("No organizationId available for user fetch");
        return;
      }
      
      const response = await getHierarchyUsers(user.organizationId);
      
      const formattedUsers = response.users.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`,
        organizationId: user.organizationId,
        organizationCode: user.organizationCode || "ORG001"
      }));
      
      setUsersList(formattedUsers);
    } catch (error) {
      console.error("Error fetching hierarchy users:", error);
      addMessage({
        text: "Failed to load users list",
        type: "error",
        duration: 3000
      });
    }
  };

  const handleBackClick = () => navigate(-1);

  const handleParticipantsChange = (participantIds) => {
    setAssignedUsers(participantIds);
  };

  const handleNewTaskClick = () => {
    navigate("/events/eventDetailPage/tasks", {
      state: {
        eventId,
        mode: "create",
        organizationId: user?.organizationId,
        eventDate: fetchedEvent?.eventDate || (selectedDate ? selectedDate.toISOString() : undefined),
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
    ...assignedUsers.map((userId) => {
      const user = usersList.find(u => u.id === userId);
      return {
        id: userId,
        name: user ? `${user.firstName} ${user.lastName}` : "Unknown User",
        size: "32px",
        shape: "circle"
      };
    }),
  ], [fetchedEvent?.coordinators, fetchedEvent?.specialGuests, assignedUsers, usersList]);

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
        : formatDateTimeLocal(new Date())
      : fetchedEvent?.eventDate
        ? formatDateTimeLocal(fetchedEvent.eventDate)
        : formatDateTimeLocal(new Date()),
<<<<<<< HEAD
    type: fetchedEvent?.typeName || eventType || "",
    typeDesc: fetchedEvent?.eventTypeDesc || eventTypeDesc || "",
=======
      type: eventTypeName,
      typeDesc: eventTypeName,
>>>>>>> a3951b3e1e8c4af6b88d0d22f94bb6251b86cdd9
    createdBy: mode === "create"
      ? user?.firstName || "User"
      : `User ID ${fetchedEvent?.createdBy || ""}`,
    creatorAvatar: {
      id: 0,
      name: user?.firstName || "User",
      size: "24px",
      shape: "circle",
    },
    participants,
<<<<<<< HEAD
  }), [mode, formData?.eventName, fetchedEvent?.eventName, selectedDate, fetchedEvent?.eventDate, fetchedEvent?.typeName, eventType, fetchedEvent?.eventTypeDesc, eventTypeDesc, user?.firstName, fetchedEvent?.createdBy, participants]);
=======
    };
  }, [mode, formData?.eventName, fetchedEvent?.eventName, selectedDate, fetchedEvent?.eventDate, fetchedEvent?.typeName, fetchedEvent?.eventTypeId, eventType, user, fetchedEvent?.createdBy, fetchedEvent?.createdByName, participants, getEventTypeById]);
>>>>>>> a3951b3e1e8c4af6b88d0d22f94bb6251b86cdd9

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
          organizationId={user?.organizationId}
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
<<<<<<< HEAD
  ], [mode, detailSaveRef, guestsData, organizersData, formData?.eventDescription, fetchedEvent?.eventDescription, formData?.location, fetchedEvent?.locationDetails, tasksData, eventId, user?.organizationId, handleDownload, handleSendMail]);
=======
  ], [mode, detailSaveRef, guestsData, organizersData, formData?.eventDescription, fetchedEvent?.eventDescription, formData?.location, fetchedEvent?.locationDetails, tasksData, eventId, selectedOrganizationId, user?.organizationId, handleDownload, handleSendMail, fetchedEvent?.eventName]);
>>>>>>> a3951b3e1e8c4af6b88d0d22f94bb6251b86cdd9

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
    },
<<<<<<< HEAD
  ], [user?.organization?.name, mode, fetchedEvent?.eventName, navigate]);
=======
  ], [user?.organization?.name, mode, navigate, eventId, fetchedEvent]);

  // Determine loading state
  const isLoading = useMemo(() => {
    if (mode === "create") return false;
    return eventLoading || usersLoading;
  }, [mode, eventLoading, usersLoading]);

  if (isLoading) {
    return <PageSkeleton type="event" />;
  }
>>>>>>> a3951b3e1e8c4af6b88d0d22f94bb6251b86cdd9

  return (
    <div className="event-detail-module">
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