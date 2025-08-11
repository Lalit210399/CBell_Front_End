import React, { useEffect, useState } from "react";
import { fetchWithRefresh } from "../../Context/RefereshToken";
import { useLocation, useNavigate } from "react-router-dom";
import TabMenu from "../../CommonComponents/TabMenu/TabMenu";
import CommentsPreview from "./Comments_Preview/CommentsPreview";
import TasksFiles from "./TaskFiles/TaskFiles";
import TaskDetail from "./TaskDetail/TaskDetail";
import TopSection from "../../CommonComponents/TaskTopSection/EditTopSection";
import Breadcrumb from "../../CommonComponents/Breadcrumb/Breadcrumb";
import { useUser } from "../../Context/UserContext";
import { Building, Calendar, Pencil } from "lucide-react";
import "./Tasks.css";

const TaskDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, permissions: userPermissions } = useUser();
  
  const { taskId, mode: initialMode = "view", eventId, organizationId } = location.state || {};
  
  console.log("Location state:", location.state); // Debug log
  console.log("TaskId from state:", taskId); // Debug log
  
  const [taskTitle, setTaskTitle] = useState("");
  const [taskStatus, setTaskStatus] = useState({
    label: "New",
    value: "New",
    color: "gray",
  });
  const [activeTab, setActiveTab] = useState("Details");
  const [fileData, setFileData] = useState({ links: [], uploadedFiles: [] });
  const [mode, setMode] = useState(initialMode);
  const [createdBy, setCreatedBy] = useState(
    user ? `${user.firstName} ${user.lastName}` : "User"
  );
  const [usersList, setUsersList] = useState([]);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [taskData, setTaskData] = useState({
    id: "",
    eventId: "",
    taskTitle: "",
    taskStatus: "New",
    assignedTo: [],
    createdBy: "",
    updatedBy: "",
    type: "",
    date: new Date().toISOString().split("T")[0],
    quantity: 1,
    description: "",
    checklist: [{ text: "", checked: false, isPlaceholder: false }],
    organizationId: "",
  });

  const statusOptions = [
    { label: "New", value: "New", color: "gray" },
    { label: "Active", value: "Active", color: "blue" },
    { label: "Under Review", value: "Under Review", color: "orange" },
    { label: "Approval", value: "Approval", color: "yellow" },
    { label: "Approved", value: "Approved", color: "green" },
  ];

  const permissions = {
    canEdit: userPermissions?.permissions?.Tasks?.["Task Management"]?.includes("Update") ?? false,
    canSave: userPermissions?.permissions?.Tasks?.["Task Management"]?.includes("Update") ?? false,
    canChangeStatus: userPermissions?.permissions?.Tasks?.["Task Management"]?.includes("Update") ?? false,
    canAssignUsers: userPermissions?.permissions?.Tasks?.["Task Management"]?.includes("Update") ?? false,
  };

  const initializeCreateMode = () => {
    setTaskData({
      id: "",
      eventId: eventId || "",
      taskTitle: "",
      taskStatus: "New",
      assignedTo: [],
      createdBy: user ? `${user.firstName} ${user.lastName}` : "User",
      updatedBy: "",
      type: "",
      date: new Date().toISOString().split("T")[0],
      quantity: 1,
      description: "",
      checklist: [{ text: "", checked: false, isPlaceholder: false }],
      organizationId: organizationId || "",
    });
    setTaskTitle("");
    setTaskStatus(statusOptions[0]);
    setCreatedBy(user ? `${user.firstName} ${user.lastName}` : "User");
    setIsLoading(false);
  };

  useEffect(() => {
  const fetchUsers = async () => {
    try {
      // Only fetch users in edit or create mode
      if (mode !== "edit" && mode !== "create") {
        // In view mode, we don't need to fetch users, so we can stop loading
        // The task fetch will handle the loading state
        return;
      }

      const orgId = user?.organizationId || organizationId;
      if (!orgId) {
        throw new Error("No organizationId available for user fetch");
      }
      
      const response = await fetchWithRefresh(`/apis/auth/users?organizationId=${orgId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      
      const { data: usersData } = await response.json();
      
      const formattedUsers = usersData.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`,
        organizationId: user.organizationId
      }));
      
      setUsersList(formattedUsers);
      
      if (mode === "create") {
        initializeCreateMode();
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users list");
      setIsLoading(false);
    }
  };

  fetchUsers();
}, [user?.organizationId, organizationId, mode]); // Added mode to dependencies
  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId || mode === "create") {
        // If no taskId in view mode, stop loading
        if (mode === "view" && !taskId) {
          setIsLoading(false);
        }
        return;
      }
      
      try {
        setIsLoading(true);
        const response = await fetchWithRefresh(`/apis/task/get_task/${taskId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "1",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch task");
        }

        const responseData = await response.json();
        
        console.log("Task data received:", responseData); // Debug log
        
        // Handle case where API returns an array instead of a single object
        const data = Array.isArray(responseData) ? responseData[0] : responseData;
        
        if (!data) {
          throw new Error("No task data found");
        }
        
        setTaskTitle(data.taskTitle || "");
        setCreatedBy(data.createdBy || (user ? `${user.firstName} ${user.lastName}` : "User"));
        
        const matchedStatus = statusOptions.find(
          opt => opt.value.toLowerCase() === (data.taskStatus || "New").toLowerCase()
        ) || statusOptions[0];
        setTaskStatus(matchedStatus);

        const formattedChecklist = Array.isArray(data.checklistDetails) 
          ? data.checklistDetails.map(item => ({
              text: item?.text?.toString() || "",
              checked: Boolean(item?.checked),
              isPlaceholder: Boolean(item?.isPlaceholder)
            }))
          : [{ text: "", checked: false, isPlaceholder: false }];

        console.log("Setting task data with assignedTo:", data.assignedTo); // Debug log
        
        setTaskData({
          id: data.id || "",
          eventId: data.eventId || "",
          taskTitle: data.taskTitle || "",
          taskStatus: matchedStatus.value,
          assignedTo: data.assignedTo || [],
          createdBy: data.createdBy || "",
          updatedBy: data.updatedBy || "",
          type: data.creativeType || "",
          date: data.dueDate ? data.dueDate.split("T")[0] : new Date().toISOString().split("T")[0],
          quantity: data.creativeNumbers || 1,
          checklist: formattedChecklist,
          description: data.description || "",
          organizationId: data.organizationId || organizationId || "",
        });

      } catch (err) {
        console.error("Error loading task:", err);
        setError("Failed to load task details");
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch task immediately in view mode, or wait for users list in edit mode
    if (mode === "view" || (usersList.length > 0 && mode !== "create")) {
      console.log("Fetching task with mode:", mode, "taskId:", taskId); // Debug log
      fetchTask();
    }
  }, [taskId, mode, organizationId, user, eventId]);

  useEffect(() => {
    if (Array.isArray(taskData.assignedTo)) {
      console.log("Processing assignedTo:", taskData.assignedTo); // Debug log
      // In view mode, we can use the assignedTo data directly from the API
      // In edit mode, we need to convert it to the format expected by the dropdown
      if (mode === "view") {
        setSelectedParticipantIds(taskData.assignedTo);
      } else if (usersList.length > 0) {
        // For edit mode, ensure we have the full user objects
        const fullUserObjects = taskData.assignedTo.map(assignedUser => {
          const fullUser = usersList.find(user => user.id === assignedUser.id);
          return fullUser || assignedUser;
        });
        setSelectedParticipantIds(fullUserObjects);
      }
    }
  }, [usersList, taskData.assignedTo, mode]);

  const updateTaskDetail = (field, value) => {
    setTaskData(prev => {
      if (field === 'checklist') {
        return {
          ...prev,
          checklist: value.map(item => ({
            text: item?.text?.toString().trim() || "",
            checked: Boolean(item?.checked),
            isPlaceholder: Boolean(item?.isPlaceholder)
          })).filter(item => item.text)
        };
      }
      return { ...prev, [field]: value };
    });
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
      if (selectedFiles.length > 0 && activeTab === "Files & Uploads") {
        try {
          const approvalResults = await Promise.allSettled(
            selectedFiles.map(async (file) => {
              const response = await fetchWithRefresh(`/apis/document/approve/${file.documentId}`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "ngrok-skip-browser-warning": "1",
                },
              });
              
              if (!response.ok) {
                throw new Error(`Failed to approve file ${file.documentId}`);
              }
              return response.json();
            })
          );
          
          approvalResults.forEach((result, index) => {
            if (result.status === "rejected") {
              console.error(`Failed to approve file ${selectedFiles[index].documentId}:`, result.reason);
            }
          });
        } catch (fileError) {
          console.error("Error in file approval process:", fileError);
        }
      }

      const formattedChecklist = Array.isArray(taskData.checklist)
        ? taskData.checklist.map(item => ({
            text: item.text,
            checked: item.checked,
            isPlaceholder: item.isPlaceholder
          }))
        : [];

      const payload = {
        EventId: mode === "edit" ? taskData.eventId : eventId,
        TaskTitle: taskTitle,
        TaskStatus: taskStatus.value,
        AssignedTo: selectedParticipantIds,
        CreatedBy: user?.id || 0,
        UpdatedBy: user?.id || 0,
        CreativeType: taskData.type,
        DueDate: new Date(taskData.date).toISOString(),
        CreativeNumbers: taskData.quantity,
        checklistDetails: formattedChecklist,
        Description: taskData.description,
        OrganizationId: organizationId || taskData.organizationId
      };

      const url = mode === "edit" 
        ? `/apis/task/update/${taskId}`
        : `/apis/task/create_task`;
      
      const method = mode === "edit" ? "PUT" : "POST";

      const response = await fetchWithRefresh(url, {
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
        navigate(location.pathname, {
          state: { ...location.state, taskId: result.taskId, mode: "view" },
          replace: true
        });
      } else {
        setMode("view");
      }
    } catch (error) {
      console.error("Save failed:", error);
      setError(`Save failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    if (mode === "edit") {
      setMode("view");
    }
    setActiveTab(tab);
  };

  const handleFileSelect = (file, isSelected) => {
    setSelectedFiles(prev =>
      isSelected
        ? [...prev, file]
        : prev.filter(f => f.documentId !== file.documentId)
    );
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
      component: mode === "create" ? (
        <div className="create-mode-message">
          Save the task first to access comments and preview
        </div>
      ) : (
        <CommentsPreview
          mode={mode}
          taskId={taskId}
          eventId={eventId}
          isActive={activeTab === "Comments and Preview"}
          permissions={permissions}
        />
      ),
      disabled: mode === "create",
    },
    {
      label: "Files & Uploads",
      component: mode === "create" ? (
        <div className="create-mode-message">
          Save the task first to upload files
        </div>
      ) : (
        <TasksFiles
          files={fileData.uploadedFiles}
          onFilesChange={setFileData}
          mode={mode}
          taskId={taskId || taskData.id}
          eventId={eventId || taskData.eventId}
          organizationId={organizationId || taskData.organizationId}
          selectedFiles={selectedFiles}
          onFileSelect={handleFileSelect}
        />
      ),
      disabled: mode === "create",
    },
  ];

  const breadcrumbItems = [
    { label: user?.organization?.name, href: "#", icon: Building },
    { label: "Events", href: "/events", icon: Calendar },
    { label: taskTitle || "New Task", href: "#", icon: Pencil },
  ];

  if (isLoading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="task-creation-module">
      <div className="BreadCrumb">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className="Top-Section">
        {console.log("Rendering TopSection with assignedTo:", selectedParticipantIds)} {/* Debug log */}
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
          // For display, pass the original assignedTo with names when available,
          // but selection/change emits only IDs which we keep in selectedParticipantIds
          assignedTo={
            Array.isArray(taskData.assignedTo) && taskData.assignedTo.length > 0
              ? taskData.assignedTo
              : selectedParticipantIds
          }
          permissions={permissions}
        />
      </div>

      <div className="Inner-Content">
        <TabMenu
          tabs={tabs}
          showEditButton={mode === "view" && permissions.canEdit && taskStatus.value !== "Approved"}
          isEditMode={mode === "edit"}
          onEditClick={() => setMode("edit")}
          onCancelClick={() => setMode("view")}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          disabledTabs={mode === "create" ? tabs.filter(t => t.disabled).map(t => t.label) : []}
        />
      </div>
    </div>
  );
};

export default TaskDetailPage;