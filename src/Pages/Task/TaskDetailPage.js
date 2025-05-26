import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TabMenu from "../../CommonComponents/TabMenu/TabMenu";
import CommentsPreview from "./Comments_Preview/CommentsPreview";
import TasksFiles from "./TaskFiles/TaskFiles";
import TaskDetail from "./TaskDetail/TaskDetail";
import TopSection from "../../CommonComponents/TaskTopSection/EditTopSection";
import Breadcrumb from "../../CommonComponents/Breadcrumb/Breadcrumb";
import { Building, Calendar, Pencil } from "lucide-react";
import "./Tasks.css";

const TaskDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { taskId, mode: initialMode = "view", eventId, organizationId } = location.state || {}; 
  const [taskTitle, setTaskTitle] = useState("");
  const [taskStatus, setTaskStatus] = useState({
    label: "New",
    value: "1",
    color: "gray",
  });
  const [activeTab, setActiveTab] = useState("Details");
  const [conversationFiles, setConversationFiles] = useState({
    files: [],
    description: "",
  });
  const [fileData, setFileData] = useState({ links: [], uploadedFiles: [] });
  const [mode, setMode] = useState(initialMode);
  const [createdBy, setCreatedBy] = useState("User 3");
  const [usersList, setUsersList] = useState([]);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Permissions configuration
  const permissions = {
    canEdit: true,
    canSave: true,
    canChangeStatus: true,
    canAssignUsers: true,
  };

  const [taskData, setTaskData] = useState({
    type: "",
    date: new Date().toISOString().split("T")[0],
    quantity: 1,
    description: "",
    checklist: [{
      text: "",
      checked: false,
      isPlaceholder: false
    }],
  });

  const statusOptions = [
    { label: "New", value: "1", color: "gray" },
    { label: "Active", value: "2", color: "blue" },
    { label: "Under Review", value: "3", color: "orange" },
    { label: "Approval", value: "4", color: "yellow" },
    { label: "Approved", value: "5", color: "green" },
    { label: "Published", value: "6", color: "purple" },
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersResponse = await fetch("/apis/auth/users", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "1",
          },
        });
        if (!usersResponse.ok) throw new Error("Failed to fetch users list");
        const users = await usersResponse.json();
        setUsersList(users);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await fetch(`/apis/task/get_task/${taskId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "1",
          },
        });

        if (!res.ok) throw new Error("Failed to fetch task");
        const data = await res.json();

        setTaskTitle(data.taskTitle || "");
        setCreatedBy(`User ${data.createdBy}` || "User 3");

        const apiStatusValue = data.taskStatus || "1";
        const matchedStatus = statusOptions.find(
          (opt) =>
            opt.label.toLowerCase() === apiStatusValue.toLowerCase() ||
            opt.value === apiStatusValue
        ) || statusOptions[0];
        setTaskStatus(matchedStatus);

        // Format checklist data safely
        const formattedChecklist = Array.isArray(data.checklistDetails) 
          ? data.checklistDetails.map(item => ({
              text: item?.text?.toString() || "",
              checked: Boolean(item?.checked),
              isPlaceholder: Boolean(item?.isPlaceholder)
            }))
          : [{ text: "", checked: false, isPlaceholder: false }];

        setTaskData({
          id: data.id || "",
          eventId: data.eventId || "",
          taskTitle: data.taskTitle || "",
          taskStatus: matchedStatus.value,
          assignedTo: data.assignedTo || [],
          createdBy: data.createdBy || "",
          updatedBy: data.updatedBy || "",
          type: data.creativeType || "",
          date: data.dueDate
            ? data.dueDate.split("T")[0]
            : new Date().toISOString().split("T")[0],
          createdOn: data.createdOn || "",
          updatedOn: data.updatedOn || "",
          quantity: data.creativeNumbers || 1,
          checklist: formattedChecklist,
          description: data.description || "",
          organizationId: data.organizationId || "",
          isDeleted: data.isDeleted || false,
          deletedOn: data.deletedOn || null,
        });
      } catch (err) {
        console.error("Error loading task:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (usersList.length && mode !== "create" && taskId) {
      fetchTask();
    } else if (mode === "create") {
      setIsLoading(false);
    }
  }, [usersList, taskId, mode]);

  useEffect(() => {
    if (usersList.length > 0 && Array.isArray(taskData.assignedTo)) {
      const participantIds = usersList
        .filter((user) =>
          taskData.assignedTo.includes(`${user.firstName} ${user.lastName}`)
        )
        .map((user) => user.id);
  
      const isSame =
        participantIds.length === selectedParticipantIds.length &&
        participantIds.every((id) => selectedParticipantIds.includes(id));
  
      if (!isSame) {
        setSelectedParticipantIds(participantIds);
      }
    }
  }, [usersList, taskData.assignedTo]);

  const updateTaskDetail = (field, value) => {
    if (field === 'checklist') {
      setTaskData(prev => ({
        ...prev,
        checklist: value.map(item => ({
          text: item?.text?.toString().trim() || "",
          checked: Boolean(item?.checked),
          isPlaceholder: Boolean(item?.isPlaceholder)
        })).filter(item => item.text) // Remove empty items
      }));
    } else {
      setTaskData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleSaveClick = async () => {
    if (!permissions.canSave) {
      alert("You don't have permission to save tasks");
      return;
    }

    setIsLoading(true);
    try {
      // Format checklist items safely
      const formattedChecklist = Array.isArray(taskData.checklist)
        ? taskData.checklist.map(item => ({
            text: item?.text?.toString().trim() || "",
            checked: Boolean(item?.checked),
            isPlaceholder: Boolean(item?.isPlaceholder)
          })).filter(item => item.text) // Remove empty items
        : [];

      const payload = {
        EventId: mode === "edit" ? taskData.eventId : eventId,
        TaskTitle: taskTitle,
        TaskStatus: taskStatus.value,
        AssignedTo: selectedParticipantIds,
        CreatedBy: 3,
        UpdatedBy: mode === "edit" ? 4 : 3,
        CreativeType: taskData.type,
        DueDate: new Date(taskData.date).toISOString(),
        CreativeNumbers: taskData.quantity,
        checklistDetails: formattedChecklist,
        Description: taskData.description,
        OrganizationId: organizationId || taskData.organizationId
      };

      console.log("Sending payload:", payload); // Debugging

      const url = mode === "edit"
        ? `/apis/task/update/${taskId}`
        : `/apis/task/create_task`;

      const method = mode === "edit" ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Save failed");
      }

      const result = await response.json();

      if (mode === "create") {
        setMode("view");
        setTaskData(prev => ({ ...prev, id: result.taskId }));
        // Update navigation state with new task ID
        navigate(location.pathname, {
          state: { ...location.state, taskId: result.taskId, mode: "view" },
          replace: true
        });
      } else {
        setMode("view");
      }
    } catch (error) {
      console.error("Save failed:", error);
      alert(`Save failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    {
      label: "Details",
      component: (
        <TaskDetail
          taskData={taskData}
          onUpdate={updateTaskDetail}
          mode={mode}
          permissions={permissions}
        />
      ),
    },
    {
      label: "Comments and Preview",
      component: (
        <CommentsPreview
          onFilesChange={setConversationFiles}
          mode={mode}
          taskId={taskId}
          eventId={eventId}
          isActive={activeTab === "Comments and Preview"}
          permissions={permissions}
        />
      ),
    },
    {
      label: "Files & Uploads",
      component: (
        <TasksFiles
          files={fileData.uploadedFiles}
          onFilesChange={setFileData}
          mode={mode}
          taskId={taskId || taskData.id}
          eventId={eventId || taskData.eventId}
          organizationId={organizationId || taskData.organizationId}
          permissions={permissions}
        />
      ),
    },
  ];

  // Add this handler function
  const handleTabChange = (tab) => {
    if (mode === "edit") {
      setMode("view"); // Reset to view mode when changing tabs
    }
    setActiveTab(tab);
  };

  // Filter tabs based on mode
  const filteredTabs = mode === "create" 
    ? tabs.filter(tab => tab.label === "Details")
    : tabs;

  const breadcrumbItems = [
    { label: "AISSMS COP", href: "#", icon: Building },
    { label: "Events", href: "#", icon: Calendar },
    { label: taskTitle || "New Task", href: "#", icon: Pencil },
  ];

  if (isLoading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="task-creation-module">
      <div className="BreadCrumb">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className="Top-Section">
        <TopSection
          title={taskTitle}
          setTitle={setTaskTitle}
          status={taskStatus}
          setStatus={setTaskStatus}
          statusOptions={statusOptions}
          createdBy={createdBy}
          onBackClick={handleBackClick}
          onSaveClick={handleSaveClick}
          mode={mode}
          users={usersList}
          onParticipantsChange={setSelectedParticipantIds}
          assignedTo={taskData.assignedTo || []}
          permissions={permissions}
        />
      </div>

      <div className="Inner-Content">
        <TabMenu
          tabs={filteredTabs}
          showEditButton={mode === "view" && permissions.canEdit}
          isEditMode={mode === "edit"}
          onEditClick={() => setMode("edit")}
          onCancelClick={() => setMode("view")}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
        />
      </div>
    </div>
  );
};

export default TaskDetailPage;