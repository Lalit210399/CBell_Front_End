import React, { useEffect, useState } from "react";
import { fetchWithRefresh } from "../../Context/RefereshToken";
import { useLocation, useNavigate } from "react-router-dom";
import TabMenu from "../../CommonComponents/TabMenu/TabMenu";
import CommentsPreview from "./Comments_Preview/CommentsPreview";
import TasksFiles from "./TaskFiles/TaskFiles";
import TaskDetail from "./TaskDetail/TaskDetail";
import TopSection from "../../CommonComponents/TaskTopSection/EditTopSection";
import Breadcrumb from "../../CommonComponents/Breadcrumb/Breadcrumb";
import PageSkeleton from "../../CommonComponents/SkeletonLoading/PageSkeleton";
import { useUser } from "../../Context/UserContext";
import { useMessages } from "../../Context/MessageContext";
import { getHierarchyUsers } from "../../Services/AuthN";
import { Building, Calendar, Pencil } from "lucide-react";
import "./Tasks.css";

const TaskDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, permissions: userPermissions } = useUser();
  const { addMessage } = useMessages();
  
  const { taskId, mode: initialMode = "view", eventId, organizationId, eventDate: navEventDate, eventName } = location.state || {};
  const eventDate = React.useMemo(() => navEventDate ? new Date(navEventDate) : null, [navEventDate]);

  
  const [taskTitle, setTaskTitle] = useState("");
  const [taskStatus, setTaskStatus] = useState({
    id: "",
    label: "New",
    value: "New",
    color: "gray",
  });
  const [activeTab, setActiveTab] = useState("Details");
  const [fileData, setFileData] = useState({ links: [], uploadedFiles: [] });
  const [mode, setMode] = useState(initialMode);
  
  // Separate state for form fields to prevent cross-field interference
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    date: new Date().toISOString().split("T")[0],
    quantity: 1,
    description: "",
    checklist: [{ text: "", checked: false, isPlaceholder: false }],
  });

  const [createdBy, setCreatedBy] = useState(
    user ? `${user.firstName} ${user.lastName}` : "User"
  );
  const [usersList, setUsersList] = useState([]);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});
  const [statusOptions, setStatusOptions] = useState([]);
  const [hasFetchedUsers, setHasFetchedUsers] = useState(false);

  const [taskData, setTaskData] = useState({
    id: "",
    eventId: "",
    taskTitle: "",
    taskStatus: "New",
    taskStatusId: "",
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

  // No default status options - only use API data

  const permissions = {
    canEdit: userPermissions?.permissions?.Tasks?.["Task Management"]?.includes("Update") ?? false,
    canSave: userPermissions?.permissions?.Tasks?.["Task Management"]?.includes("Update") ?? false,
    canChangeStatus: userPermissions?.permissions?.Tasks?.["Task Management"]?.includes("Update") ?? false,
    canAssignUsers: userPermissions?.permissions?.Tasks?.["Task Management"]?.includes("Update") ?? false,
  };

  const getDefaultColor = (statusValue) => {
    const colorMap = {
      "New": "gray",
      "Active": "blue", 
      "Under Review": "orange",
      "Approved": "green",
      "Published": "purple"
    };
    return colorMap[statusValue] || "gray";
  };

  const fetchStatusOptions = React.useCallback(async () => {
    try {
      const response = await fetch('/apis/taskstatus/get-all', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: "application/json",
          "ngrok-skip-browser-warning": "1",
        },
        credentials: 'include',
      });

      if (response.status === 404) {
        setStatusOptions([]);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch task status options: ${response.status}`);
      }

      const responseData = await response.json();
      
      // Extract data array from response
      const data = responseData.data || responseData;
      
      // Transform API response to match expected format
      const formattedOptions = Array.isArray(data) 
        ? data.map(status => ({
            id: status.id,
            label: status.statusName || status.name || status.label || status,
            value: status.statusName || status.name || status.value || status,
            color: getDefaultColor(status.statusName || status.name || status.value || status)
          }))
        : [];
      
      setStatusOptions(formattedOptions);
      console.log("Status options loaded:", formattedOptions);
      
      // If we're in create mode, set the first status as default (only if we have real options)
      if (mode === "create" && formattedOptions.length > 0) {
        setTaskStatus(formattedOptions[0]);
      }
    } catch (error) {
      console.error("Error fetching status options:", error);
      addMessage({
        text: "Failed to load status options",
        type: "error",
        duration: 3000
      });
      setStatusOptions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove dependencies to prevent infinite loop

  const initializeCreateMode = React.useCallback(() => {
    setTaskData({
      id: "",
      eventId: eventId || "",
      taskTitle: "",
      taskStatus: "New",
      taskStatusId: "",
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
    setCreatedBy(user ? `${user.firstName} ${user.lastName}` : "User");
    setIsLoading(false);
  }, [eventId, user, organizationId]);

  // Fetch status options on component mount - only once
  useEffect(() => {
    fetchStatusOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once

  // Initialize status when statusOptions are loaded and we're in create mode
  useEffect(() => {
    if (mode === "create" && statusOptions.length > 0) {
      setTaskStatus(statusOptions[0]);
    }
  }, [statusOptions, mode]);


  // Memoize the organization ID to prevent unnecessary re-renders
  const currentOrgId = React.useMemo(() => {
    return user?.organizationId || organizationId;
  }, [user?.organizationId, organizationId]);

  // Reset users list when organization changes
  useEffect(() => {
    setUsersList([]);
    setHasFetchedUsers(false);
  }, [currentOrgId]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (mode !== "edit" && mode !== "create") {
          return;
        }

        if (!currentOrgId) {
          console.warn("No organizationId available for user fetch");
          return;
        }
        
        // Check if we already have users for this organization
        if (hasFetchedUsers) {
          console.log("Users already loaded for this organization");
          if (mode === "create") {
            initializeCreateMode();
          }
          return;
        }
        
        try {
          console.log("Fetching users for organization:", currentOrgId);
          const response = await getHierarchyUsers(currentOrgId);
          
          const formattedUsers = response.users.map(user => ({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            fullName: `${user.firstName} ${user.lastName}`,
            organizationId: user.organizationId
          }));
          
          setUsersList(formattedUsers);
          setHasFetchedUsers(true);
        } catch (error) {
          console.error("Error fetching hierarchy users:", error);
          addMessage({
            text: "Failed to load users list",
            type: "error",
            duration: 3000
          });
        }
        
        if (mode === "create") {
          initializeCreateMode();
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        addMessage({
          text: "Failed to load users list",
          type: "error",
          duration: 3000
        });
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [currentOrgId, mode, addMessage, initializeCreateMode, hasFetchedUsers]);

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId || mode === "create") {
        if (mode === "view" && !taskId) {
          setIsLoading(false);
        }
        return;
      }
      
      try {
        setIsLoading(true);
        const orgId = user?.organizationId || organizationId;
        
        if (!orgId) {
          throw new Error("No organization selected");
        }

        // Prepare headers similar to EventDetailPage
        const headers = {
          "Content-Type": "application/json",
          Accept: "application/json",
          "ngrok-skip-browser-warning": "1",
        };

        // Add organization context if needed
        if (orgId !== user?.organizationId) {
          headers["X-Context-Organization"] = orgId;
        }

        const response = await fetchWithRefresh(`/apis/task/get_task/${taskId}?organizationId=${orgId}`, {
          method: "GET",
          headers,
        });

        if (response.status === 404) {
          addMessage({
            text: "Task not found",
            type: "error",
            duration: 3000
          });
          setIsLoading(false);
          return;
        }

        if (response.status === 500) {
          console.error("Server error fetching task - likely backend data type mismatch");
          addMessage({
            text: "Unable to load task due to server error. Please try again later.",
            type: "error",
            duration: 5000,
          });
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();
        const data = Array.isArray(responseData) ? responseData[0] : responseData;
        
        if (!data) {
          throw new Error("No task data found");
        }
        
        setTaskTitle(data.taskTitle || "");
        setCreatedBy(data.createdByName || data.createdBy || (user ? `${user.firstName} ${user.lastName}` : "User"));
        
        const currentStatusOptions = statusOptions;
        const apiStatusName = data.taskStatusName || data.taskStatus || "New";
        console.log("API Status Data:", { 
          taskStatusName: data.taskStatusName, 
          taskStatusId: data.taskStatusId,
          apiStatusName,
          statusOptions: currentStatusOptions 
        });
        
        const matchedStatus = currentStatusOptions.find(
          opt => opt.value.toLowerCase() === apiStatusName.toLowerCase()
        ) || (currentStatusOptions.length > 0 ? currentStatusOptions[0] : {
          id: data.taskStatusId || "",
          label: apiStatusName,
          value: apiStatusName,
          color: getDefaultColor(apiStatusName)
        });
        
        console.log("Matched Status:", matchedStatus);
        setTaskStatus(matchedStatus);

        const formattedChecklist = Array.isArray(data.checklistDetails) 
          ? data.checklistDetails.map(item => ({
              text: item?.text?.toString() || "",
              checked: Boolean(item?.checked),
              isPlaceholder: Boolean(item?.isPlaceholder)
            }))
          : [{ text: "", checked: false, isPlaceholder: false }];
        
        console.log("TaskDetailPage: Raw API data:", data);
        console.log("TaskDetailPage: Formatted checklist:", formattedChecklist);
        console.log("TaskDetailPage: Description:", data.description);
        
        const newTaskData = {
          id: data.id || "",
          eventId: data.eventId || "",
          taskTitle: data.taskTitle || "",
          taskStatus: matchedStatus.value,
          taskStatusId: data.taskStatusId || matchedStatus.id,
          assignedTo: data.assignedTo || [],
          createdBy: data.createdByName || data.createdBy || "",
          updatedBy: data.updatedByName || data.updatedBy || "",
          type: data.creativeType || "",
          date: data.dueDate ? data.dueDate : new Date().toISOString(),
          quantity: data.creativeNumbers || 1,
          checklist: formattedChecklist,
          description: data.description || "",
          organizationId: data.organizationId || organizationId || "",
        };
        
        console.log("TaskDetailPage: Setting taskData:", newTaskData);
        setTaskData(newTaskData);
        
        // Also update formData to ensure consistency
        setFormData(prev => ({
          ...prev,
          type: data.creativeType || "",
          date: data.dueDate ? data.dueDate.split("T")[0] : new Date().toISOString().split("T")[0],
          quantity: data.creativeNumbers || 1,
          checklist: formattedChecklist,
          description: data.description || "",
        }));

      } catch (err) {
        console.error("Error loading task:", err);
        addMessage({
          text: `Failed to load task details: ${err.message}`,
          type: "error",
          duration: 3000
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (mode === "view" || (usersList.length > 0 && mode !== "create")) {
      fetchTask();
    }
  }, [taskId, mode, organizationId, user, eventId, addMessage, statusOptions, usersList.length]);

  useEffect(() => {
    if (Array.isArray(taskData.assignedTo)) {
      const idsOnly = taskData.assignedTo
        .map((assigned) => (typeof assigned === "object" ? assigned?.id : assigned))
        .filter(Boolean);
      setSelectedParticipantIds(idsOnly);
    }
  }, [taskData.assignedTo]);

  // Handle title updates separately to prevent interference
  const handleTitleUpdate = (newTitle) => {
    setTaskTitle(newTitle);
    setFormData(prev => ({ ...prev, title: newTitle }));
    setTaskData(prev => ({ ...prev, taskTitle: newTitle }));
    
    // Clear title validation error
    if (validationErrors.title) {
      setValidationErrors(prev => ({ ...prev, title: undefined }));
    }
  };

  // Handle form field updates with better isolation
  const handleFormFieldUpdate = (field, value) => {
    // Update formData for immediate UI updates
    setFormData(prev => {
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
    
    // Also update taskData for consistency
    setTaskData(prev => {
      if (field === 'checklist') {
        const newData = {
          ...prev,
          checklist: value.map(item => ({
            text: item?.text?.toString().trim() || "",
            checked: Boolean(item?.checked),
            isPlaceholder: Boolean(item?.isPlaceholder)
          })).filter(item => item.text)
        };
        return newData;
      }
      const newData = { ...prev, [field]: value };
      return newData;
    });
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };


  const handleBackClick = () => {
    navigate(-1);
  };

  const handleSaveClick = async () => {
    
    if (!permissions.canSave) {
      addMessage({
        text: "You don't have permission to save tasks",
        type: "error",
        duration: 3000
      });
      return;
    }

    // Required field validations
    const errors = {};
    
    if (!taskTitle || !taskTitle.toString().trim()) {
      errors.title = "Title is required";
    }
    
    // Check both taskData and formData for type field
    const currentType = formData?.type || taskData?.type;
    if (!currentType || !currentType.toString().trim()) {
      errors.type = "Creative type is required";
    }
    
    // Check both taskData and formData for date field
    const currentDate = formData?.date || taskData?.date;
    if (!currentDate) {
      errors.date = "Due date is required";
    }
    // Only validate status if status options are available from API
    if (statusOptions.length > 0) {
      if (!taskStatus?.id || taskStatus.id === "") {
        errors.status = "Please select a valid task status";
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      
      // Create specific error message showing which fields are missing
      const missingFields = Object.keys(errors).map(field => {
        switch(field) {
          case 'title': return 'Task Title';
          case 'type': return 'Creative Type';
          case 'date': return 'Due Date';
          case 'status': return 'Task Status';
          default: return field;
        }
      });
      
      const errorMessage = `Please fill the following required fields: ${missingFields.join(', ')}`;
      addMessage({ text: errorMessage, type: "error", duration: 5000 });
      setActiveTab("Details");
      return;
    }
    

    // Validation: If status is Approved, at least one file must be selected
    if (taskStatus.value === "Approved" && selectedFiles.length === 0) {
      addMessage({
        text: "You must select at least one file to approve the task.",
        type: "error",
        duration: 3000
      });
      setActiveTab("Files & Uploads");
      return;
    }

    // Use current form data for validation
    const currentFormData = { ...taskData, ...formData };
    
    // Validate task date and time
    try {
      const now = new Date();
      const selected = new Date(currentFormData.date);
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      
      if (selected < now) {
        addMessage({ text: "Task date must be today or later.", type: "error", duration: 3000 });
        return;
      }
      
      if (selected < oneHourLater) {
        addMessage({ 
          text: "Task due time must be at least 1 hour from now.", 
          type: "error", 
          duration: 3000 
        });
        return;
      }
      
      if (eventDate && selected >= new Date(eventDate)) {
        addMessage({ text: "Task date must be earlier than the event date.", type: "error", duration: 3000 });
        return;
      }
    } catch (error) {
      console.error("Date validation error:", error);
      addMessage({ text: "Invalid date format.", type: "error", duration: 3000 });
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
          addMessage({
            text: "Error approving files",
            type: "error",
            duration: 3000
          });
        }
      }

      // currentFormData already defined above
      
      const formattedChecklist = Array.isArray(currentFormData.checklist)
        ? currentFormData.checklist.map(item => ({
            text: item.text,
            checked: item.checked,
            isPlaceholder: item.isPlaceholder
          }))
        : [];

      // Try to get user ID from various possible field names
      const userId = user?.id || user?._id || user?.userId || user?.user_id || user?.uid;
      
      // Validate that we have a valid user ID
      if (!userId) {
        addMessage({
          text: "User information not available. Please log in again.",
          type: "error",
          duration: 3000
        });
        return;
      }
      
      const payload = {
        EventId: mode === "edit" ? currentFormData.eventId : eventId,
        TaskTitle: taskTitle,
        taskStatusId: statusOptions.length > 0 ? taskStatus.id : null,
        AssignedTo: (selectedParticipantIds || []).map((item) =>
          typeof item === "object" ? item?.id : item
        ),
        CreatedBy: userId,
        UpdatedBy: userId,
        CreativeType: currentFormData.type,
        DueDate: new Date(currentFormData.date).toISOString(),
        CreativeNumbers: currentFormData.quantity,
        checklistDetails: formattedChecklist,
        Description: currentFormData.description,
        OrganizationId: organizationId || currentFormData.organizationId
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
        addMessage({
          text: "Task created successfully",
          type: "success",
          duration: 3000
        });
      } else {
        setMode("view");
        addMessage({
          text: "Task updated successfully",
          type: "success",
          duration: 3000
        });
      }
    } catch (error) {
      console.error("Save failed:", error);
      addMessage({
        text: `Save failed: ${error.message}`,
        type: "error",
        duration: 3000
      });
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
          formData={formData}
          onUpdate={handleFormFieldUpdate}
          mode={mode}
          permissions={permissions}
          eventDate={eventDate}
          errors={validationErrors}
          onClearError={(field) => setValidationErrors(prev => ({ ...prev, [field]: undefined }))}
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
    { 
      label: "Events", 
      href: "/events", 
      icon: Calendar,
      onClick: () => navigate("/events")
    },
    eventName ? { 
      label: eventName, 
      href: "#", 
      icon: Calendar,
      onClick: () => navigate("/events/eventDetailPage", {
        state: {
          eventId: eventId,
          mode: "view"
        }
      })
    } : null,
    { label: taskTitle || "New Task", href: "#", icon: Pencil },
  ].filter(Boolean);


  if (!user) {
    return <PageSkeleton type="task" />;
  }

  if (isLoading) {
    return <PageSkeleton type="task" />;
  }

  return (
    <div className="task-creation-module fade-in">
      <div className="BreadCrumb">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className="Top-Section">
        <TopSection
          title={taskTitle}
          setTitle={handleTitleUpdate}
          status={taskStatus}
          setStatus={setTaskStatus}
          statusOptions={statusOptions}
          createdBy={createdBy}
          onBackClick={handleBackClick}
          onSaveClick={handleSaveClick}
          mode={mode}
          users={usersList}
          onParticipantsChange={setSelectedParticipantIds}
          assignedTo={
            Array.isArray(taskData.assignedTo) && taskData.assignedTo.length > 0
              ? taskData.assignedTo
              : selectedParticipantIds
          }
          permissions={permissions}
          onClearError={(field) => setValidationErrors(prev => ({ ...prev, [field]: undefined }))}
        />
      </div>

      <div className="Inner-Content">
        <TabMenu
          tabs={tabs}
          showEditButton={mode === "view" && permissions.canEdit && taskStatus.value !== "Approved"}
          isEditMode={mode === "edit"}
          onEditClick={() => {
            setMode("edit");
          }}
          onCancelClick={() => {
            setMode("view");
          }}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          disabledTabs={mode === "create" ? tabs.filter(t => t.disabled).map(t => t.label) : []}
        />
      </div>
    </div>
  );
};

export default TaskDetailPage;