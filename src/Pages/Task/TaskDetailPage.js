import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
import { useTaskStatus } from "../../Hooks/useTaskStatus";
import { getHierarchyUsers } from "../../Services/AuthN";
import { Building, Calendar, Pencil, FileText } from "lucide-react";
import "./Tasks.css";

// Hardcoded status IDs from backend data - moved outside component to prevent re-creation
const HARDCODED_STATUS_IDS = {
  "New": "68baab0b9a31a52d62646ca1",
  "Active": "68bee09b522caf6ac9f65bdc", 
  "Under Approval": "68bee0b1522caf6ac9f65bdd",
  "Approved": "68bee0c2522caf6ac9f65bde",
  "Published": "68bee0d1522caf6ac9f65bdf"
};

const TaskDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, scopeChangeTrigger } = useUser();
  const { addMessage } = useMessages();
  
  // Check if user is a Designer
  const isDesigner = user?.roles?.some(role => role.name === "Designer" || role.displayName === "Designer");
  
  const { taskId, mode: initialMode = "view", eventId: locationEventId, organizationId, eventDate: navEventDate, eventName } = location.state || {};
  const eventDate = React.useMemo(() => navEventDate ? new Date(navEventDate) : null, [navEventDate]);

  
  const [taskTitle, setTaskTitle] = useState("");
  const [taskStatus, setTaskStatus] = useState({
    id: null,
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
    date: "", // Empty date by default
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
  const [validationErrors, setValidationErrors] = useState({});
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [apiEventId, setApiEventId] = useState(locationEventId); // Store eventId from API response
  
  // Use task status context
  const { loading: statusLoading } = useTaskStatus();

  const getDefaultColor = useCallback((statusValue) => {
    const colorMap = {
      "New": "gray",
      "Active": "blue", 
      "Under Approval": "orange",
      "Approved": "green",
      "Published": "purple"
    };
    return colorMap[statusValue] || "gray";
  }, []);
  
  // Use hardcoded status options instead of API data
  const statusOptions = React.useMemo(() => {
    return [
      {
        id: HARDCODED_STATUS_IDS["New"],
        label: "New",
        value: "New",
        color: "gray"
      },
      {
        id: HARDCODED_STATUS_IDS["Active"],
        label: "Active", 
        value: "Active",
        color: "blue"
      },
      {
        id: HARDCODED_STATUS_IDS["Under Approval"],
        label: "Under Approval",
        value: "Under Approval", 
        color: "orange"
      },
      {
        id: HARDCODED_STATUS_IDS["Approved"],
        label: "Approved",
        value: "Approved",
        color: "green"
      },
      {
        id: HARDCODED_STATUS_IDS["Published"],
        label: "Published",
        value: "Published",
        color: "purple"
      }
    ];
  }, []);

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
    canCRUD: true, // Default to true for new tasks
    accessLevel: "FULL_ACCESS", // Default to full access for new tasks
  });

  // No default status options - only use API data

  // Enhanced permissions based on task data and user role
  const canEdit = React.useMemo(() => {
    // Debug logging to help troubleshoot
    console.log("Permission Check:", {
      canCRUD: taskData.canCRUD,
      accessLevel: taskData.accessLevel,
      isDesigner,
      taskStatus: taskStatus?.value,
      taskId: taskData.id
    });
    
    // If task has canCRUD: false or accessLevel: "READ_ONLY", user cannot edit
    if (taskData.canCRUD === false || taskData.accessLevel === "READ_ONLY") {
      console.log("Edit blocked: canCRUD or accessLevel restriction");
      return false;
    }
    
    // If task status is Approved, it cannot be edited
    if (taskStatus?.value === "Approved") {
      console.log("Edit blocked: Task is Approved");
      return false;
    }
    
    // Otherwise, allow editing (Designers can now edit tasks)
    console.log("Edit allowed: All conditions passed");
    return true;
  }, [taskData.canCRUD, taskData.accessLevel, taskStatus?.value, isDesigner, taskData.id]);

  const canSave = React.useMemo(() => {
    // In create mode, always allow saving
    if (mode === "create") {
      return true;
    }
    
    // In edit mode, check if user has edit permissions
    if (mode === "edit") {
      return canEdit;
    }
    
    // In view mode, no saving allowed
    return false;
  }, [mode, canEdit]);

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
      return [];
    }
    
    try {
      const response = await getHierarchyUsers(currentOrgId);
      
      const formattedUsers = response.users.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`,
        organizationId: user.organizationId,
        organizationCode: user.organizationCode || "ORG001",
        role: user.role || user.roles?.[0]?.name || ""
      }));
      
      return formattedUsers;
    } catch (error) {
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
      addMessage({
        text: `Failed to load task details: ${err.message}`,
        type: "error",
        duration: 3000
      });
      throw err;
    }
  }, [taskId, mode, organizationId, user?.organizationId, addMessage]);

  // State Management
  const [usersData, setUsersData] = useState(null);
  const [taskDataFromAPI, setTaskDataFromAPI] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [taskError, setTaskError] = useState(null);
  const isFetchingUsersRef = useRef(false);
  const isFetchingTaskRef = useRef(false);

  const initializeCreateMode = React.useCallback(() => {
    setTaskData({
      id: "",
      eventId: apiEventId || "",
      taskTitle: "",
      taskStatus: "New",
      taskStatusId: "",
      assignedTo: [],
      createdBy: user ? `${user.firstName} ${user.lastName}` : "User",
      updatedBy: "",
      type: "",
      date: "", // Empty date for create mode
      quantity: 1,
      description: "",
      checklist: [{ text: "", checked: false, isPlaceholder: false }],
      organizationId: organizationId || "",
      canCRUD: true, // Default to true for new tasks
      accessLevel: "FULL_ACCESS", // Default to full access for new tasks
    });
    setTaskTitle("");
    setCreatedBy(user ? `${user.firstName} ${user.lastName}` : "User");
  }, [apiEventId, user, organizationId]);


  // Initialize status when statusOptions are loaded and we're in create mode
  useEffect(() => {
    if (mode === "create" && statusOptions.length > 0) {
      // Find the "New" status specifically
      const newStatus = statusOptions.find(status => status.value === "New");
      if (newStatus) {
        setTaskStatus(newStatus);
      }
    }
  }, [statusOptions, mode]);

  // Auto-update status based on user assignments (only for New status)
  useEffect(() => {
    if (statusOptions.length > 0) {
      if (selectedParticipantIds.length > 0) {
        // Users are assigned - set to Active (only if currently New)
        const activeStatus = statusOptions.find(status => status.value === "Active");
        if (activeStatus && taskStatus?.value === "New") {
          setTaskStatus(activeStatus);
        }
      } else if (selectedParticipantIds.length === 0 && taskStatus?.value === "Active") {
        // No users assigned and currently Active - set back to New
        const newStatus = statusOptions.find(status => status.value === "New");
        if (newStatus) {
          setTaskStatus(newStatus);
        }
      }
    }
  }, [selectedParticipantIds, statusOptions, taskStatus?.value]);

  // Execute users API when component mounts or scope changes
  const executeFetchUsers = useCallback(async () => {
    if ((mode === "edit" || mode === "create") && !isFetchingUsersRef.current) {
      
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
  }, [mode, currentOrgId, fetchUsers]);

  // Execute task API when taskId is available and not in create mode
  const executeFetchTask = useCallback(async () => {
    if (taskId && mode !== "create" && !isFetchingTaskRef.current) {
      
      isFetchingTaskRef.current = true;
      setTaskLoading(true);
      setTaskError(null);
      
      try {
        const data = await fetchTask();
        setTaskDataFromAPI(data);
      } catch (err) {
        setTaskError(err.message);
      } finally {
        setTaskLoading(false);
        isFetchingTaskRef.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, mode, fetchTask]);

  useEffect(() => {
    executeFetchUsers();
  }, [executeFetchUsers, scopeChangeTrigger]);

  useEffect(() => {
    executeFetchTask();
  }, [executeFetchTask, scopeChangeTrigger]);

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
      // Use the actual creator's name from API response, only fallback to current user for new tasks
      setCreatedBy(data.createdByName || "Unknown User");
      
      const currentStatusOptions = statusOptions;
      const apiStatusName = data.taskStatusName || data.taskStatus || "New";
      
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
      
      
      // If still not found, create a fallback status with hardcoded ID
      if (!matchedStatus) {
        const hardcodedId = HARDCODED_STATUS_IDS[apiStatusName] || "";
        matchedStatus = {
          id: hardcodedId,
          label: apiStatusName,
          value: apiStatusName,
          color: getDefaultColor(apiStatusName)
        };
      }
      
      setTaskStatus(matchedStatus);

      // Update eventId from API response
      if (data.eventId) {
        setApiEventId(data.eventId);
      }

      const formattedChecklist = Array.isArray(data.checklistDetails) 
        ? data.checklistDetails.map(item => ({
            text: item?.text?.toString() || "",
            checked: Boolean(item?.checked),
            isPlaceholder: Boolean(item?.isPlaceholder)
          }))
        : [{ text: "", checked: false, isPlaceholder: false }];
      
      
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
        canCRUD: data.canCRUD, // Include permission fields
        accessLevel: data.accessLevel, // Include access level
      };
      
      
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

  useEffect(() => {
    if (Array.isArray(taskData.assignedTo)) {
      const idsOnly = taskData.assignedTo
        .map((assigned) => (typeof assigned === "object" ? assigned?.id : assigned))
        .filter(Boolean);
      setSelectedParticipantIds(idsOnly);
    }
  }, [taskData.assignedTo]);

  // Handle title updates separately to prevent interference
  const handleTitleUpdate = React.useCallback((newTitle) => {
    setTaskTitle(newTitle);
    setFormData(prev => ({ ...prev, title: newTitle }));
    setTaskData(prev => ({ ...prev, taskTitle: newTitle }));
    
    // Clear title validation error
    setValidationErrors(prev => {
      if (prev.title) {
        const newErrors = { ...prev };
        delete newErrors.title;
        return newErrors;
      }
      return prev;
    });
  }, []);

  // Handle form field updates with better isolation
  const handleFormFieldUpdate = React.useCallback((field, value) => {
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
    setValidationErrors(prev => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, []);


  const handleBackClick = () => {
    navigate(-1);
  };

  const handleSaveClick = async () => {
    
    if (!canSave) {
      addMessage({
        text: "You don't have permission to save this task",
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
    // Validate status using hardcoded status options
    if (statusOptions.length > 0) {
      if (!taskStatus?.id || taskStatus.id === "" || taskStatus.id === null) {
        errors.status = "Please select a valid task status";
      }
    } else if (mode === "create") {
      // For create mode, ensure we have a valid status
      if (!taskStatus?.id || taskStatus.id === "" || taskStatus.id === null) {
        errors.status = "Task status is not properly initialized";
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
      if (!currentFormData.date) {
        addMessage({ text: "Please select a due date and time.", type: "error", duration: 3000 });
        return;
      }
      
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
      
      if (eventDate && selected > new Date(eventDate)) {
        addMessage({ text: "Task date cannot be after the event date.", type: "error", duration: 3000 });
        return;
      }
    } catch (error) {
      addMessage({ text: "Invalid date format.", type: "error", duration: 3000 });
      return;
    }

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
            }
          });
        } catch (fileError) {
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
      
      // Ensure we have a valid status ID using hardcoded mapping
      let statusId = taskStatus?.id;
      if (!statusId || statusId === "" || statusId === null) {
        // Use hardcoded status ID mapping
        statusId = HARDCODED_STATUS_IDS[taskStatus?.value] || null;
      }

      const payload = {
        EventId: mode === "edit" ? currentFormData.eventId : apiEventId,
        TaskTitle: taskTitle,
        taskStatusId: statusId, // Use the validated status ID
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
        // Handle both possible response formats: result.taskId or result.id
        const newTaskId = result.taskId || result.id;
        
        if (!newTaskId) {
          throw new Error("No task ID returned from server");
        }
        
        setMode("view");
        setTaskData(prev => ({ ...prev, id: newTaskId }));
        navigate(location.pathname, {
          state: { ...location.state, taskId: newTaskId, mode: "view" },
          replace: true
        });
        
        // Switch to Files & Uploads tab to encourage file upload
        setActiveTab("Files & Uploads");
        
        addMessage({
          text: "Task created successfully! You can now add files and comments.",
          type: "success",
          duration: 4000
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

  const handleFileSelect = useCallback((file, isSelected) => {
    setSelectedFiles(prev => {
      if (isSelected) {
        // For radio button behavior, replace the entire selection with the new file
        return [file];
      } else {
        // Remove the file if deselected
        return prev.filter(f => f.documentId !== file.documentId);
      }
    });
  }, []);

  // Handle status change from buttons
  const handleStatusChange = async (newStatus) => {
    // Prevent multiple clicks while updating
    if (isUpdatingStatus) {
      return;
    }
    
    // Check if user has permission to change status
    if (!canEdit) {
      addMessage({
        text: "You don't have permission to change the status of this task",
        type: "error",
        duration: 3000
      });
      return;
    }
    
    // Special validation for Under Approval status - must have files uploaded
    if (newStatus.value === "Under Approval") {
      try {
        // Check if there are any documents uploaded for this task
        const response = await fetch(`/apis/document-details/task/${taskId}`, {
          headers: { 'ngrok-skip-browser-warning': '1' }
        });
        
        if (!response.ok) {
          throw new Error('Failed to check task documents');
        }
        
        const documents = await response.json();
        
        if (!documents || documents.length === 0) {
          addMessage({
            text: "You must upload at least one file before submitting for approval.",
            type: "error",
            duration: 5000
          });
          setActiveTab("Files & Uploads");
          return;
        }
      } catch (error) {
        addMessage({
          text: "Failed to verify task documents. Please try again.",
          type: "error",
          duration: 3000
        });
        return;
      }
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
        
        // Ensure we have a valid status ID for the new status using hardcoded mapping
        let statusId = newStatus.id;
        if (!statusId || statusId === "" || statusId === null) {
          // Use hardcoded status ID mapping
          statusId = HARDCODED_STATUS_IDS[newStatus.value] || null;
        }

        // Prepare payload for status update
        const payload = {
          EventId: currentFormData.eventId,
          TaskTitle: taskTitle,
          taskStatusId: statusId, // Use the validated status ID
          AssignedTo: (selectedParticipantIds || []).map((item) =>
            typeof item === "object" ? item?.id : item
          ),
          CreatedBy: userId,
          UpdatedBy: userId,
          CreativeType: currentFormData.type,
          DueDate: currentFormData.date ? new Date(currentFormData.date).toISOString() : new Date().toISOString(),
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


        // If approving task, first approve the selected files
        if (newStatus.value === "Approved" && selectedFiles.length > 0) {
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
              }
            });
          } catch (fileError) {
            addMessage({
              text: "Error approving files. Please try again.",
              type: "error",
              duration: 3000
            });
            return;
          }
        }

        // Make API call to update task
        // debugger;
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

        await response.json();
        
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

  // Filter tabs based on mode - only show Details tab in create and edit modes
  const tabs = useMemo(() => {
    // Define all tabs inside useMemo to avoid dependency issues
    const allTabs = [
      {
        label: "Details",
        component: (
          <TaskDetail
            taskData={taskData}
            formData={formData}
            onUpdate={handleFormFieldUpdate}
            mode={mode}
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
            eventId={apiEventId}
            isActive={activeTab === "Comments and Preview"}
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
            eventId={apiEventId || taskData.eventId}
            organizationId={organizationId || taskData.organizationId}
            selectedFiles={selectedFiles}
            onFileSelect={handleFileSelect}
            taskStatus={taskStatus}
          />
        ),
        disabled: mode === "create",
      },
    ];

    if (mode === "create") {
      return allTabs.filter(tab => tab.label === "Details");
    }
    return allTabs;
  }, [mode, taskData, formData, handleFormFieldUpdate, eventDate, validationErrors, taskId, apiEventId, fileData.uploadedFiles, setFileData, organizationId, selectedFiles, handleFileSelect, activeTab, taskStatus]);

  const breadcrumbItems = React.useMemo(() => {
    // Ensure we have valid data before creating breadcrumb items
    const organizationName = user?.organization?.name || user?.organizationName || "Organization";
    const taskName = taskTitle || (mode === "create" ? "New Task" : "Task Details");
    
    const items = [
      { 
        label: organizationName, 
        href: "#", 
        icon: Building 
      },
      { 
        label: "Events", 
        href: "/events", 
        icon: Calendar,
        onClick: () => navigate("/events")
      }
    ];
    
    // Add event name if available
    if (eventName) {
      items.push({ 
        label: eventName, 
        href: "#", 
        icon: FileText,
        onClick: () => {
          // Only navigate if we have valid event ID
          if (apiEventId) {
            navigate("/events/eventDetailPage", {
              state: {
                eventId: apiEventId,
                mode: "view"
              }
            });
          }
        }
      });
    }
    
    // Add task name
    items.push({ 
      label: taskName, 
      href: "#", 
      icon: Pencil 
    });
    
    return items;
  }, [user?.organization?.name, user?.organizationName, eventName, apiEventId, taskTitle, mode, navigate]);

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
          onClearError={(field) => setValidationErrors(prev => ({ ...prev, [field]: undefined }))}
          onStatusChange={handleStatusChange}
          isUpdatingStatus={isUpdatingStatus}
          user={user}
          taskId={taskId}
        />
      </div>

      <div className="Inner-Content">
        <TabMenu
          tabs={tabs}
          showEditButton={mode === "view" && canEdit} // Show edit button only in view mode and when user has edit permissions
          isEditMode={mode === "edit"}
          onEditClick={() => {
            setMode("edit");
          }}
          onCancelClick={() => {
            setMode("view");
          }}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
        />
      </div>
    </div>
  );
};

export default TaskDetailPage;