import React, { useEffect, useState, useRef } from "react";
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
  const detailSaveRef = useRef(null);
  const { user } = useUser();
  const { addMessage } = useMessages();
  const { permissions: userPermissions } = useUser();

  const permissions = {
    canEdit: mode === "create" ? true : userPermissions?.permissions?.Events?.["Event Management"]?.includes("Update") ?? false,
    canCreateTask: userPermissions?.permissions?.Tasks?.["Task Management"]?.includes("Create") ?? false,
    canSave: mode === "create" ? true : userPermissions?.permissions?.Events?.["Event Management"]?.includes("Update") ?? false,
  };

  const navigate = useNavigate();
  const location = useLocation();
  const {
    eventId,
    mode: initialMode,
    eventType,
    eventTypeId,
    eventTypeDesc,
  } = location.state || {};
  const selectedDate = location.state?.selectedDate
    ? new Date(location.state.selectedDate)
    : null;

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`/apis/task/by-event/${eventId}`, {
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

        //console.log("Formated Task", formattedTasks);

        setTasksData(formattedTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        addMessage({
          text: "Failed to load tasks. Please try again.",
          type: "Error",
          duration: 3000,
        });
      }
    };

    if (activeTab === "Task" && eventId) {
      fetchTasks();
    }
  }, [activeTab, eventId]);

  useEffect(() => {
    if (mode === "create") {
      const newEvent = {
        eventName: "",
        eventDate: selectedDate
          ? selectedDate.toISOString()
          : new Date().toISOString(),
        eventDescription: "",
        coordinators: [],
        specialGuests: [],
        organizationId: user?.organizationId || "asbb124",
      };
      // Only update if different to avoid infinite loop
      if (JSON.stringify(fetchedEvent) !== JSON.stringify(newEvent)) {
        setFetchedEvent(newEvent);
      }
      return;
    }

    const fetchEvent = async () => {
      if (!eventId) return;
      try {
        const response = await fetch(`/apis/event/get_event/${eventId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "ngrok-skip-browser-warning": "1",
          },
        });
        if (!response.ok)
          throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();

        // Transform coordinators and specialGuests to ensure they have name and title
        const transformedData = {
          ...data,
          coordinators: Array.isArray(data.coordinators)
            ? data.coordinators.map(coord => typeof coord === 'string' ? { name: coord, title: "Coordinator" } : coord)
            : [],
          specialGuests: Array.isArray(data.specialGuests)
            ? data.specialGuests.map(guest => typeof guest === 'string' ? { name: guest, title: "Guest" } : guest)
            : []
        };

        setFetchedEvent(transformedData);
      } catch (error) {
        console.error("Error fetching event:", error);
        addMessage({
          text: "Failed to load event. Please try again.",
          type: "Error",
          duration: 3000,
        });
      }
    };

    fetchEvent();
  }, [eventId, mode, selectedDate]);

  const handleSaveEvent = async (topSectionData, getDetailData) => {
    const detailData = getDetailData ? getDetailData() : {
      description: "",
      location: "Pune",
      guests: [],
      organizers: []
    };

    const payload = {
      eventName: topSectionData?.title || "",
      OrganizationId: fetchedEvent?.organizationId || "asbb124",
      eventTypeId: eventTypeId || fetchedEvent?.eventTypeId,
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
      eventDate: topSectionData?.date || (selectedDate ? selectedDate.toISOString() : new Date().toISOString()),
      createdBy: user?.id || 1
    };

    //console.log("Sending payload:", payload);

    try {
      const url = mode === "create"
        ? "/apis/event/create_event"
        : `/apis/event/update/${eventId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
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
      alert(`Event ${mode === "create" ? "created" : "updated"} successfully!`);
      navigate("/events", { state: { refresh: true } });
    } catch (error) {
      console.error(`Error ${mode === "create" ? "creating" : "updating"} event:`, error);
      addMessage({
        text: `Failed to ${mode === "create" ? "create" : "update"} event.`,
        type: "Error",
        duration: 3000,
      });
    }

    setMode("view");
  };


  const handleDownload = () => {
    alert("Download functionality not implemented yet.");
  };

  const handleSendMail = () => {
    alert("Mail sending functionality not implemented yet.");
  };

  const handleBackClick = () => navigate(-1);

  const handleNewTaskClick = () => {
    const organizationId = fetchedEvent?.organizationId;
    navigate("/events/eventDetailPage/tasks", {
      state: {
        eventId,
        mode: "create",
        organizationId,
      },
    });
  };

  const handleTabChange = (tab) => {
    if (mode === "edit") {
      setMode("view");
    }
    setActiveTab(tab);
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const participants = [
    ...(fetchedEvent?.coordinators?.map((coord, index) => ({
      id: `coordinator-${index}`,
      name: coord?.name || coord,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(coord?.name || coord)}&background=random`,
    })) || []),
    ...(fetchedEvent?.specialGuests?.map((guest, index) => ({
      id: `guest-${index}`,
      name: guest?.name || guest,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(guest?.name || guest)}&background=random`,
    })) || []),
  ];

  const topSectionData = {
    title: mode === "create" ? "" : fetchedEvent?.eventName || "",
    date: mode === "create"
      ? selectedDate
        ? formatDateForInput(selectedDate)
        : formatDateForInput(new Date())
      : fetchedEvent?.eventDate
        ? formatDateForInput(fetchedEvent.eventDate)
        : formatDateForInput(new Date()),
    createdBy: mode === "create"
      ? "User ID 0"
      : `User ID ${fetchedEvent?.createdBy || ""}`,
    creatorAvatar: {
      id: 0,
      name: user?.firstName || "User",
      size: "24px",
      shape: "circle",
    },
    participants,
  };

  const guestsData = mode === "create"
    ? []
    : fetchedEvent?.specialGuests?.map((guest, index) => ({
      id: index,
      name: guest?.name || guest,
      title: guest?.title || "Guest",
    })) || [];

  const organizersData = mode === "create"
    ? []
    : fetchedEvent?.coordinators?.map((coord, index) => ({
      id: index + 100,
      name: coord?.name || coord,
      title: coord?.title || "Coordinator",
    })) || [];

  const tabs = [
    {
      label: "Details",
      component: (
        <Detail
          mode={mode}
          onSave={detailSaveRef}
          guestsData={guestsData}
          organizersData={organizersData}
          initialDescription={
            mode === "create" ? "" : fetchedEvent?.eventDescription || ""
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
        organizationId={fetchedEvent?.organizationId}
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
  ];

  const filteredTabs = mode === "create"
    ? tabs.filter(tab => tab.label === "Details")
    : tabs;

  const breadcrumbItems = [
    { label: "AISSMS COP", href: "#", icon: Building },
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
  ];

  return (
    <div className="event-detail-module">
      <div className="BreadCrumb">
        <Breadcrumb items={breadcrumbItems} />
      </div>
      <div className="Top-Section">
        <TopSection
          mode={mode}
          onBackClick={handleBackClick}
          onNewTaskClick={handleNewTaskClick}
          onSaveClick={(topData) => {
            const detailData = detailSaveRef.current ? detailSaveRef.current() : null;
            handleSaveEvent(topData, () => detailData);
          }}
          data={topSectionData}
          participants={participants}
          permissions={permissions}
          initialDate={selectedDate ? formatDateForInput(selectedDate) : ""}
        />
      </div>
      <div className="Inner-Content">
        <TabMenu
          tabs={filteredTabs}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          showEditButton={showEdit && mode === "view" && permissions.canEdit}
          isEditMode={mode === "edit"}
          onEditClick={() => setMode("edit")}
          onCancelClick={() => setMode("view")}
        />
      </div>
    </div>
  );
};

export default EventDetail;