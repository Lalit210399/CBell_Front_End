import React, { useEffect, useState, useRef, useMemo } from "react";
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
import { Building, Calendar, FileText } from "lucide-react";
import "./Tasks.css";

const EventDetail = () => {
  const [showEdit, setShowEdit] = useState(true);
  const [fetchedEvent, setFetchedEvent] = useState(null);
  const [tasksData, setTasksData] = useState([]);
  const [activeTab, setActiveTab] = useState("Details");
  const [mode, setMode] = useState("view");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const detailSaveRef = useRef(null);
  const { user } = useUser();
  const { addMessage } = useMessages();
  const { permissions: userPermissions } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    eventId,
    mode: initialMode,
    eventType,
    eventTypeId,
    eventTypeDesc,
    eventData,
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

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetchWithRefresh(`/apis/task/by-event/${eventId}?organizationId=${user?.organizationId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "ngrok-skip-browser-warning": "1",
          },
        });
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const data = await response.json();

        const formattedTasks = data.map((task) => ({
          id: task.id,
          creative_name: task.taskTitle,
          creative_type: task.creativeType,
          assigned_to: task.assignedTo.length > 0
            ? task.assignedTo.map(user => user.name).join(", ")
            : "Unassigned",
          due_date: new Date(task.dueDate).toLocaleDateString(),
          status: task.taskStatus,
        }));

        setTasksData(formattedTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        addMessage({
          text: "Failed to load tasks. Please try again.",
          type: "error",
          duration: 3000,
        });
      }
    };

    if (activeTab === "Task" && eventId) {
      fetchTasks();
    }
  }, [activeTab, eventId, user?.organizationId]);

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
          : []
      };

      setFetchedEvent(transformedEvent);
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
        };

        setFetchedEvent(transformedData);
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

  const permissions = React.useMemo(() => ({
    canEdit: mode === "create" ? true : userPermissions?.permissions?.Events?.["Event Management"]?.includes("Update") ?? false,
    canCreateTask: userPermissions?.permissions?.Tasks?.["Task Management"]?.includes("Create") ?? false,
    canSave: mode === "create" ? true : userPermissions?.permissions?.Events?.["Event Management"]?.includes("Update") ?? false,
  }), [mode, userPermissions?.permissions?.Events, userPermissions?.permissions?.Tasks]);

  const handleSaveEvent = async (topSectionData, getDetailData) => {
    setIsSubmitting(true);
    const detailData = getDetailData ? getDetailData() : {
      description: "",
      location: "Pune",
      guests: [],
      organizers: []
    };

    const payload = {
      eventName: topSectionData?.title || "",
      organizationId: user?.organizationId,
      eventTypeId: eventTypeId || fetchedEvent?.eventTypeId,
      eventType: eventType || fetchedEvent?.eventType,
      eventTypeDesc: eventTypeDesc || fetchedEvent?.eventTypeDesc,
      eventDescription: detailData.description || "",
      locationDetails: detailData.location || "Pune",
      coordinators: (detailData.organizers || []).map(org => ({
        name: org.name,
        title: org.title || "Coordinator"
      })),
      specialGuests: (detailData.guests || []).map(guest => ({
        name: guest.name,
        title: guest.title || "Guest"
      })),
      // Expect topSectionData.date to be a datetime-local value; convert to ISO
      eventDate: topSectionData?.date
        ? new Date(topSectionData.date).toISOString()
        : (selectedDate ? selectedDate.toISOString() : new Date().toISOString()),
      createdBy: user?.id || 1
    };

    try {
      const url = mode === "create"
        ? "/apis/event/create_event"
        : `/apis/event/update/${eventId}`;
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
              specialGuests: payload.specialGuests
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
        specialGuests: payload.specialGuests
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

  const handleDownload = () => {
    addMessage({
      text: "Download functionality coming soon!",
      type: "info",
      duration: 3000,
    });
  };

  const handleSendMail = () => {
    addMessage({
      text: "Mail sending functionality coming soon!",
      type: "info",
      duration: 3000,
    });
  };

  const handleBackClick = () => navigate(-1);

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
  ], [fetchedEvent?.coordinators, fetchedEvent?.specialGuests]);

  const topSectionData = React.useMemo(() => ({
    title: mode === "create" ? formData?.eventName || "" : fetchedEvent?.eventName || "",
    date: mode === "create"
      ? selectedDate
        ? formatDateTimeLocal(selectedDate)
        : formatDateTimeLocal(new Date())
      : fetchedEvent?.eventDate
        ? formatDateTimeLocal(fetchedEvent.eventDate)
        : formatDateTimeLocal(new Date()),
    type: fetchedEvent?.typeName || eventType || "",
    typeDesc: fetchedEvent?.eventTypeDesc || eventTypeDesc || "",
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
  }), [mode, formData?.eventName, fetchedEvent?.eventName, selectedDate, fetchedEvent?.eventDate, fetchedEvent?.typeName, eventType, fetchedEvent?.eventTypeDesc, eventTypeDesc, user?.firstName, fetchedEvent?.createdBy, participants]);

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
      component: <Task tasksData={tasksData} eventId={eventId} />,
    },
    {
      label: "Files & Uploads",
      component: <FileUploads
        filesFromTasks={[]}
        eventId={eventId}
        organizationId={user?.organizationId}
      />,
    },
    {
      label: "To Publish",
      component: (
        <Publish
          publishData={[]}
          eventId={eventId}
          onDownload={handleDownload}
          onSendMail={handleSendMail}
        />
      ),
    },
  ], [mode, detailSaveRef, guestsData, organizersData, formData?.eventDescription, fetchedEvent?.eventDescription, formData?.location, fetchedEvent?.locationDetails, tasksData, eventId, user?.organizationId, handleDownload, handleSendMail]);

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
  ], [user?.organization?.name, mode, fetchedEvent?.eventName, navigate]);

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
            handleSaveEvent(topData, () => detailData);
          }) : undefined}
          data={topSectionData}
          participants={participants}
          permissions={permissions}
          initialDate={selectedDate ? formatDateTimeLocal(selectedDate) : ""}
          isSubmitting={isSubmitting}
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
            debugger;
            setMode("edit");
          }}
          onCancelClick={() => setMode("view")}
        />
      </div>
    </div>
  );
};

export default EventDetail;