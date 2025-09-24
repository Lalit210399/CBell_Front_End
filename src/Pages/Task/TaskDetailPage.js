<<<<<<< HEAD
import React, { useEffect, useState } from "react";
import MessageStrip from "../../CommonComponents/MessageStrip/MessageStrip";
=======
import React, { useEffect, useState, useCallback, useMemo } from "react";
>>>>>>> a3951b3e1e8c4af6b88d0d22f94bb6251b86cdd9
import { fetchWithRefresh } from "../../Context/RefereshToken";
import { useLocation, useNavigate } from "react-router-dom";
import TabMenu from "../../CommonComponents/TabMenu/TabMenu";
import CommentsPreview from "./Comments_Preview/CommentsPreview";
import TasksFiles from "./TaskFiles/TaskFiles";
import TaskDetail from "./TaskDetail/TaskDetail";
import TopSection from "../../CommonComponents/TaskTopSection/EditTopSection";
import Breadcrumb from "../../CommonComponents/Breadcrumb/Breadcrumb";
import List from "../../CommonComponents/List/List";
import { useUser } from "../../Context/UserContext";
import { useMessages } from "../../Context/MessageContext";
import { useTaskStatus } from "../../Hooks/useTaskStatus";
import { getHierarchyUsers } from "../../Services/AuthN";
import useApi from "../../Hooks/useApi";
import { Building, Calendar, Pencil } from "lucide-react";
import "./Tasks.css";

const TaskDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, permissions: userPermissions, scopeChangeTrigger } = useUser();
  const { addMessage } = useMessages();
  
  const { taskId, mode: initialMode = "view", eventId, organizationId, eventDate: navEventDate, eventName } = location.state || {};
  const eventDate = React.useMemo(() => navEventDate ? new Date(navEventDate) : null, [navEventDate]);
  
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
  const [validationErrors, setValidationErrors] = useState({});
<<<<<<< HEAD
=======
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // Use task status context
  const { loading: statusLoading, getActiveTaskStatuses } = useTaskStatus();
  
  const getDefaultColor = useCallback((statusValue) => {
    const colorMap = {
      "New": "gray",
      "Active": "blue", 
      "Under Review": "orange",
      "Approved": "green",
      "Published": "purple"
    };
    return colorMap[statusValue] || "gray";
  }, []);
  
  // Transform task statuses to the format expected by the component
  const statusOptions = React.useMemo(() => {
    const activeStatuses = getActiveTaskStatuses();
    const transformed = activeStatuses.map(status => ({
      id: status.id,
      label: status.statusName || status.name,
      value: status.statusName || status.name,
      color: status.color || getDefaultColor(status.statusName || status.name)
    }));
    console.log("Transformed status options:", transformed);
    return transformed;
  }, [getActiveTaskStatuses, getDefaultColor]);
>>>>>>> a3951b3e1e8c4af6b88d0d22f94bb6251b86cdd9

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
    canCRUD: false, // Add canCRUD field
  });

  const statusOptions = [
    { label: "New", value: "New", color: "gray" },
    { label: "Active", value: "Active", color: "blue" },
    { label: "Under Approval ", value: "Under Approval ", color: "orange" },
    { label: "Approval", value: "Approval", color: "yellow" },
    { label: "Approved", value: "Approved", color: "green" },
  ];

  const permissions = {
    canEdit: (userPermissions?.permissions?.Tasks?.["Task Management"]?.includes("Update") ?? false) && taskData.canCRUD,
    canSave: (userPermissions?.permissions?.Tasks?.["Task Management"]?.includes("Update") ?? false) && taskData.canCRUD,
    canChangeStatus: (userPermissions?.permissions?.Tasks?.["Task Management"]?.includes("Update") ?? false) && taskData.canCRUD,
    canAssignUsers: (userPermissions?.permissions?.Tasks?.["Task Management"]?.includes("Update") ?? false) && taskData.canCRUD,
  };

<<<<<<< HEAD
  const initializeCreateMode = () => {
=======
  // Log permissions for debugging
  console.log("TaskDetailPage: Permissions calculation:", {
    userHasUpdatePermission: userPermissions?.permissions?.Tasks?.["Task Management"]?.includes("Update") ?? false,
    taskCanCRUD: taskData.canCRUD,
    finalPermissions: permissions
  });

  // Memoize the organization ID to prevent unnecessary re-renders
  const currentOrgId = useMemo(() => {
    return user?.organizationId || organizationId;
  }, [user?.organizationId, organizationId]);

  // API Functions
  const fetchUsers = useCallback(async () => {
    if (mode !== "edit" && mode !== "create") {
      return [];
    }

    if (!currentOrgId) {
      console.warn("No organizationId available for user fetch");
      return [];
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
      
      return formattedUsers;
    } catch (error) {
      console.error("Error fetching hierarchy users:", error);
      addMessage({
        text: "Failed to load users list",
        type: "error",
        duration: 3000
      });
      return [];
    }
  }, [mode, currentOrgId, addMessage]);

  const fetchTask = useCallback(async () => {
    if (!taskId || mode === "create") {
      return null;
    }
    
    try {
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
        return null;
      }

      if (response.status === 500) {
        console.error("Server error fetching task - likely backend data type mismatch");
        addMessage({
          text: "Unable to load task due to server error. Please try again later.",
          type: "error",
          duration: 5000,
        });
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();
      const data = Array.isArray(responseData) ? responseData[0] : responseData;
      
      if (!data) {
        throw new Error("No task data found");
      }

      return data;
    } catch (err) {
      console.error("Error loading task:", err);
      addMessage({
        text: `Failed to load task details: ${err.message}`,
        type: "error",
        duration: 3000
      });
      throw err;
    }
  }, [taskId, mode, organizationId, user?.organizationId, addMessage]);

  // Use API Hooks
  const {
    data: usersData,
    loading: usersLoading,
    execute: executeFetchUsers
  } = useApi(fetchUsers, [mode, currentOrgId], false);

  const {
    data: taskDataFromAPI,
    loading: taskLoading,
    execute: executeFetchTask
  } = useApi(fetchTask, [taskId, mode], false);

  const initializeCreateMode = React.useCallback(() => {
>>>>>>> a3951b3e1e8c4af6b88d0d22f94bb6251b86cdd9
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
<<<<<<< HEAD
    setIsLoading(false);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (mode !== "edit" && mode !== "create") {
          return;
        }

        const orgId = user?.organizationId || organizationId;
        if (!orgId) {
          throw new Error("No organizationId available for user fetch");
        }
        
        try {
          const response = await getHierarchyUsers(orgId);
          
          const formattedUsers = response.users.map(user => ({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            fullName: `${user.firstName} ${user.lastName}`,
            organizationId: user.organizationId
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
  }, [user?.organizationId, organizationId, mode]);
=======
  }, [eventId, user, organizationId]);


  // Initialize status when statusOptions are loaded and we're in create mode
  useEffect(() => {
    if (mode === "create" && statusOptions.length > 0) {
      // Find the "New" status specifically, or use the first one as fallback
      const newStatus = statusOptions.find(status => status.value === "New") || statusOptions[0];
      console.log("Setting default status for create mode:", newStatus);
      setTaskStatus(newStatus);
    }
  }, [statusOptions, mode]);

  // Auto-update status based on user assignments (only for New status)
  useEffect(() => {
    if (statusOptions.length > 0) {
      if (selectedParticipantIds.length > 0) {
        // Users are assigned - set to Active (only if currently New)
        const activeStatus = statusOptions.find(status => status.value === "Active");
        if (activeStatus && taskStatus?.value === "New") {
          console.log("Users assigned to New task - changing status to Active:", activeStatus);
          setTaskStatus(activeStatus);
        }
      } else if (selectedParticipantIds.length === 0 && taskStatus?.value === "Active") {
        // No users assigned and currently Active - set back to New
        const newStatus = statusOptions.find(status => status.value === "New");
        if (newStatus) {
          console.log("No users assigned - changing status back to New:", newStatus);
          setTaskStatus(newStatus);
        }
      }
    }
  }, [selectedParticipantIds, statusOptions, taskStatus?.value]);
>>>>>>> a3951b3e1e8c4af6b88d0d22f94bb6251b86cdd9

  // Execute users API when component mounts or scope changes
  useEffect(() => {
    if (mode === "edit" || mode === "create") {
      executeFetchUsers();
    }
  }, [executeFetchUsers, mode, scopeChangeTrigger]);

  // Execute task API when taskId is available and not in create mode
  useEffect(() => {
    if (taskId && mode !== "create") {
      executeFetchTask();
    }
  }, [executeFetchTask, taskId, mode, scopeChangeTrigger]);

  // Update usersList when usersData changes
  useEffect(() => {
    if (usersData) {
      setUsersList(usersData);
    }
  }, [usersData]);

  // Handle task data when it's fetched
  useEffect(() => {
    if (taskDataFromAPI) {
      const data = taskDataFromAPI;
      
      setTaskTitle(data.taskTitle || "");
      setCreatedBy(data.createdByName || data.createdBy || (user ? `${user.firstName} ${user.lastName}` : "User"));
      
      const currentStatusOptions = statusOptions;
      const apiStatusName = data.taskStatusName || data.taskStatus || "New";
      console.log("API Status Data:", { 
        taskStatusName: data.taskStatusName, 
        taskStatusId: data.taskStatusId,
        apiStatusName,
        statusOptions: currentStatusOptions,
        statusOptionsValues: currentStatusOptions.map(opt => ({ value: opt.value, label: opt.label }))
      });
      
      // Try multiple matching strategies
      let matchedStatus = currentStatusOptions.find(
        opt => opt.value.toLowerCase() === apiStatusName.toLowerCase()
      );
      
      // If not found, try matching by label
      if (!matchedStatus) {
        matchedStatus = currentStatusOptions.find(
          opt => opt.label.toLowerCase() === apiStatusName.toLowerCase()
        );
      }
      
<<<<<<< HEAD
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
        addMessage({
          text: "Failed to load task details",
          type: "error",
          duration: 3000
        });
      } finally {
        setIsLoading(false);
=======
      // If still not found, create a fallback status
      if (!matchedStatus) {
        matchedStatus = {
          id: data.taskStatusId || "",
          label: apiStatusName,
          value: apiStatusName,
          color: getDefaultColor(apiStatusName)
        };
        console.log("No matching status found, created fallback:", matchedStatus);
>>>>>>> a3951b3e1e8c4af6b88d0d22f94bb6251b86cdd9
      }
      
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
        canCRUD: data.canCRUD || false, // Include canCRUD from API response
      };
      
      console.log("TaskDetailPage: Setting taskData:", newTaskData);
      console.log("TaskDetailPage: canCRUD from API:", data.canCRUD);
      console.log("TaskDetailPage: accessLevel from API:", data.accessLevel);
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
    }
<<<<<<< HEAD
  }, [taskId, mode, organizationId, user, eventId]);
=======
  }, [taskDataFromAPI, statusOptions, user, organizationId, getDefaultColor]);

  // Reset users list when organization changes
  useEffect(() => {
    setUsersList([]);
  }, [currentOrgId]);

  // Initialize create mode when users are loaded and we're in create mode
  useEffect(() => {
    if (mode === "create" && usersData && usersData.length > 0) {
      initializeCreateMode();
    }
  }, [mode, usersData, initializeCreateMode]);
>>>>>>> a3951b3e1e8c4af6b88d0d22f94bb6251b86cdd9

  useEffect(() => {
    if (Array.isArray(taskData.assignedTo)) {
      const idsOnly = taskData.assignedTo
        .map((assigned) => (typeof assigned === "object" ? assigned?.id : assigned))
        .filter(Boolean);
      setSelectedParticipantIds(idsOnly);
    }
  }, [taskData.assignedTo]);

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
    if (!taskData?.type || !taskData.type.toString().trim()) {
      errors.type = "Creative type is required";
    }
    if (!taskData?.date) {
      errors.date = "Due date is required";
    }
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      addMessage({ text: "Please fill all required fields", type: "error", duration: 2500 });
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

    // Validate task date between now and event date (if provided)
    try {
      const now = new Date();
      const selected = new Date(taskData.date);
      if (selected <= now) {
        addMessage({ text: "Task date must be later than today.", type: "error", duration: 3000 });
        return;
      }
      if (eventDate && selected >= new Date(eventDate)) {
        addMessage({ text: "Task date must be earlier than the event date.", type: "error", duration: 3000 });
        return;
      }
    } catch {}

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
<<<<<<< HEAD
        TaskStatus: taskStatus.value,
=======
        taskStatusId: taskStatus?.id || null, // Use the actual status ID from the selected status
>>>>>>> a3951b3e1e8c4af6b88d0d22f94bb6251b86cdd9
        AssignedTo: (selectedParticipantIds || []).map((item) =>
          typeof item === "object" ? item?.id : item
        ),
        CreatedBy: user?.id || 0,
        UpdatedBy: user?.id || 0,
        CreativeType: taskData.type,
        DueDate: new Date(taskData.date).toISOString(),
        CreativeNumbers: taskData.quantity,
        checklistDetails: formattedChecklist,
        Description: taskData.description,
        OrganizationId: organizationId || taskData.organizationId
      };

<<<<<<< HEAD
=======
      console.log("Save payload with status ID:", {
        taskStatusId: payload.taskStatusId,
        statusValue: taskStatus?.value,
        statusLabel: taskStatus?.label,
        fullStatus: taskStatus,
        assignedUsers: selectedParticipantIds,
        hasAssignees: selectedParticipantIds.length > 0,
        mode: mode
      });


>>>>>>> a3951b3e1e8c4af6b88d0d22f94bb6251b86cdd9
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

  // Handle status change from buttons
  const handleStatusChange = async (newStatus) => {
    console.log("Status change requested:", newStatus);
    
    // Prevent multiple clicks while updating
    if (isUpdatingStatus) {
      console.log("Status update already in progress, ignoring click");
      return;
    }
    
    // Special validation for Approved status - must have files selected
    if (newStatus.value === "Approved") {
      if (selectedFiles.length === 0) {
        addMessage({
          text: "You must select at least one file from 'Files & Uploads' section to approve the task.",
          type: "error",
          duration: 5000
        });
        setActiveTab("Files & Uploads");
        return;
      }
      
      console.log("Files selected for approval:", selectedFiles.length, "files");
    }
    
    // Update local state immediately for UI feedback
    setTaskStatus(newStatus);
    
    // Only make API call if we have a taskId (not in create mode)
    if (taskId) {
      setIsUpdatingStatus(true);
      try {
        // Get current form data
        const currentFormData = { ...taskData, ...formData };
        
        // Get user ID
        const userId = user?.id || user?._id || user?.userId || user?.user_id || user?.uid;
        
        if (!userId) {
          addMessage({
            text: "User information not available. Please log in again.",
            type: "error",
            duration: 3000
          });
          return;
        }
        
        // Prepare payload for status update
        const payload = {
          EventId: currentFormData.eventId,
          TaskTitle: taskTitle,
          taskStatusId: newStatus.id, // Use the new status ID
          AssignedTo: (selectedParticipantIds || []).map((item) =>
            typeof item === "object" ? item?.id : item
          ),
          CreatedBy: userId,
          UpdatedBy: userId,
          CreativeType: currentFormData.type,
          DueDate: new Date(currentFormData.date).toISOString(),
          CreativeNumbers: currentFormData.quantity,
          checklistDetails: Array.isArray(currentFormData.checklist)
            ? currentFormData.checklist.map(item => ({
                text: item.text,
                checked: item.checked,
                isPlaceholder: item.isPlaceholder
              }))
            : [],
          Description: currentFormData.description,
          OrganizationId: organizationId || currentFormData.organizationId
        };

        console.log("Updating task status via API:", {
          taskId,
          newStatusId: newStatus.id,
          newStatusValue: newStatus.value,
          payload,
          selectedFiles: selectedFiles.length
        });

        // If approving task, first approve the selected files
        if (newStatus.value === "Approved" && selectedFiles.length > 0) {
          try {
            console.log("Approving files before task approval:", selectedFiles);
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
            
            console.log("File approval completed");
          } catch (fileError) {
            console.error("Error in file approval process:", fileError);
            addMessage({
              text: "Error approving files. Please try again.",
              type: "error",
              duration: 3000
            });
            return;
          }
        }

        // Make API call to update task
        const response = await fetchWithRefresh(`/apis/task/update/${taskId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "1",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Status update failed");
        }

        const result = await response.json();
        console.log("Status update successful:", result);
        
        // Show success message with file approval info if applicable
        const successMessage = newStatus.value === "Approved" && selectedFiles.length > 0
          ? `Task approved successfully! ${selectedFiles.length} file(s) approved.`
          : `Task status updated to ${newStatus.label}`;
          
        addMessage({
          text: successMessage,
          type: "success",
          duration: 4000
        });

      } catch (error) {
        console.error("Status update failed:", error);
        
        // Revert status change on error
        const originalStatus = statusOptions.find(opt => opt.value === taskStatus.value);
        if (originalStatus) {
          setTaskStatus(originalStatus);
        }
        
        addMessage({
          text: `Failed to update status: ${error.message}`,
          type: "error",
          duration: 3000
        });
      } finally {
        setIsUpdatingStatus(false);
      }
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
    { label: "Events", href: "/events", icon: Calendar },
    eventName ? { label: eventName, href: "#", icon: Calendar } : null,
    { label: taskTitle || "New Task", href: "#", icon: Pencil },
  ].filter(Boolean);

<<<<<<< HEAD
=======
  // Determine loading state
  const isLoading = useMemo(() => {
    if (mode === "create") {
      return usersLoading || statusLoading;
    }
    return taskLoading || usersLoading || statusLoading;
  }, [mode, taskLoading, usersLoading, statusLoading]);

  if (!user) {
    return <PageSkeleton type="task" />;
  }

>>>>>>> a3951b3e1e8c4af6b88d0d22f94bb6251b86cdd9
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
          assignedTo={
            Array.isArray(taskData.assignedTo) && taskData.assignedTo.length > 0
              ? taskData.assignedTo
              : selectedParticipantIds
          }
          permissions={permissions}
<<<<<<< HEAD
=======
          onClearError={(field) => setValidationErrors(prev => ({ ...prev, [field]: undefined }))}
          onStatusChange={handleStatusChange}
          isUpdatingStatus={isUpdatingStatus}
>>>>>>> a3951b3e1e8c4af6b88d0d22f94bb6251b86cdd9
        />
      </div>

      <div className="Inner-Content">
        <TabMenu
          tabs={tabs}
          showEditButton={mode === "view" && permissions.canEdit && taskStatus.value !== "Approved" && taskData.canCRUD} // Show edit button only if user has permission AND task allows CRUD operations
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