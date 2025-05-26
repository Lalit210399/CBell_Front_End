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
  const [users, setUsers] = useState([]); // State to store the list of users
  const detailSaveRef = useRef(null);
  const { user } = useUser();
  const { addMessage } = useMessages();

  const permissions = {
    canEdit: true,      // Allow editing event details
    canCreateTask: true, // Allow creating new tasks
    canSave: true,      // Allow saving event
    // Add more as needed
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
  console.log("Event ID:", eventId);

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  // Fetch users when mode is "edit" or "create"
  useEffect(() => {
    if (mode === "edit" || mode === "create") {
      const fetchUsers = async () => {
        try {
          const response = await fetch(
            "/auth/api/auth/users",
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "ngrok-skip-browser-warning": "1",
              },
            }
          );
          if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
          const data = await response.json();
          setUsers(data); // Store the fetched users in state
        } catch (error) {
          console.error("Error fetching users:", error);
          addMessage({
            text: "Failed to load users. Please try again.",
            type: "Error",
            duration: 3000,
          });
        }
      };

      fetchUsers();
    }
  }, [mode]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(
          `/apis/task/by-event/${eventId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "ngrok-skip-browser-warning": "1",
            },
          }
        );
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const data = await response.json();

        const formattedTasks = data.map((task) => ({
          id: task.id,
          creative_name: task.taskTitle,
          creative_type: task.creativeType,
          assigned_to: `${task.assignedTo}`,
          due_date: new Date(task.dueDate).toLocaleDateString(),
          status: task.taskStatus,
        }));

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

    if (activeTab === "Task") {
      fetchTasks();
    }
  }, [activeTab, eventId]);

  useEffect(() => {
    if (mode === "create") {
      // Initialize with empty data in create mode
      setFetchedEvent({
        eventName: "",
        eventDate: selectedDate
          ? selectedDate.toISOString()
          : new Date().toISOString(),
        eventDescription: "",
        coordinators: [],
        specialGuests: [],
        organizationId: user?.organizationId || "asbb124",
      });
      return;
    }

    const fetchEvent = async () => {
      if (!eventId) return;
      try {
        const response = await fetch(
          `/apis/event/get_event/${eventId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "ngrok-skip-browser-warning": "1",
            },
          }
        );
        if (!response.ok)
          throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        setFetchedEvent(data);
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

  const handleSaveEvent = async (topSectionData, detailData) => {
    const payload = {
      eventName: topSectionData.title,
      OrganizationId: fetchedEvent?.organizationId || "asbb124",
      eventTypeId: eventTypeId || fetchedEvent?.eventTypeId,
      eventTypeDesc: eventTypeDesc || fetchedEvent?.eventTypeDesc,
      eventDescription: detailData.description,
      locationDetails: detailData.location || "Pune",
      coordinators: detailData.organizers.map((o) => o.name),
      specialGuests: detailData.guests.map((g) => g.name),
      eventDate: topSectionData.date,
      AssignedTo: topSectionData.userIds,
    };

    try {
      const url =
        mode === "create"
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
      console.error(
        `Error ${mode === "create" ? "creating" : "updating"} event:`,
        error
      );
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
      setMode("view"); // Reset to view mode when changing tabs
    }
    setActiveTab(tab);
  };

  const participants = [
    {
      id: 1,
      name: "Alice Johnson",
      src: "https://i.pravatar.cc/40",
      size: "24px",
      shape: "circle",
    },
    {
      id: 2,
      name: "Bob Smith",
      src: "https://i.pravatar.cc/41",
      size: "24px",
      shape: "circle",
    },
  ];

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const topSectionData = {
    title:
      mode === "create" ? "" : fetchedEvent?.eventName || "",
    date:
      mode === "create"
        ? selectedDate
          ? formatDateForInput(selectedDate)
          : formatDateForInput(new Date())
        : fetchedEvent?.eventDate
          ? formatDateForInput(fetchedEvent.eventDate)
          : formatDateForInput(new Date()),
    createdBy:
      mode === "create"
        ? "User ID 0"
        : `User ID ${fetchedEvent?.createdBy || ""}`,
    creatorAvatar: {
      id: 0,
      name: "Creator",
      src: "https://i.pravatar.cc/40",
      size: "24px",
      shape: "circle",
    },
    participants,
  };

  const guestsData =
    mode === "create"
      ? []
      : fetchedEvent?.specialGuests?.map((name, index) => ({
        id: index,
        name,
        title: "Guest",
      })) || [];

  const organizersData =
    mode === "create"
      ? []
      : fetchedEvent?.coordinators?.map((name, index) => ({
        id: index + 100,
        name,
        title: "Coordinator",
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
            mode === "create" ? "" : fetchedEvent?.eventDescription
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
          onDownload={handleDownload}
          onSendMail={handleSendMail}
        />
      ),
    },
  ];

  // Filter tabs when in create mode to show only Details
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
          data={topSectionData}
          participants={topSectionData.participants}
          users={users}
          onBackClick={handleBackClick}
          onNewTaskClick={handleNewTaskClick}
          onSaveClick={(updatedData) => {
            if (detailSaveRef.current) {
              const detailData = detailSaveRef.current();
              handleSaveEvent(updatedData, detailData);
            }
          }}
          permissions={permissions}
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