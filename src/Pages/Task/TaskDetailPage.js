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
import { Building, Calendar, Pencil } from "lucide-react";
import "./Tasks.css";

// Hardcoded status IDs from backend data - moved outside component to prevent re-creation
const HARDCODED_STATUS_IDS = {
  "New": "68baab0b9a31a52d62646ca1",
  "Active": "68bee09b522caf6ac9f65bdc", 
  "Under Approval": "68bee0b1522caf6ac9f65bdd",
  "Under Review": "68bee0b1522caf6ac9f65bdd", // Use same ID as Under Approval
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
  console.log("TaskDetailPage - isDesigner:", isDesigner, "user roles:", user?.roles);
  
  const { taskId, mode: initialMode = "view", eventId, organizationId, eventDate: navEventDate, eventName } = location.state || {};
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
  
  // Use task status context
  const { loading: statusLoading } = useTaskStatus();

  const getDefaultColor = useCallback((statusValue) => {
    const colorMap = {
      "New": "gray",
      "Active": "blue", 
      "Under Approval": "orange",
      "Under Review": "orange", // Map Under Review to orange color
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
        id: HARDCODED_STATUS_IDS["Under Approval"], // Use same ID as Under Approval
        label: "Under Review",
        value: "Under Review", 
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
  });

  // No default status options - only use API data

  // Mode-based permissions - no complex permission system needed
  const canSave = mode === "edit" || mode === "create";

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
      eventId: eventId || "",
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
    });
    setTaskTitle("");
    setCreatedBy(user ? `${user.firstName} ${user.lastName}` : "User");
  }, [eventId, user, organizationId]);


  // Initialize status when statusOptions are loaded and we're in create mode
  useEffect(() => {
    if (mode === "create" && statusOptions.length > 0) {
      // Find the "New" status specifically
      const newStatus = statusOptions.find(status => status.value === "New");
      console.log("Setting default status for create mode:", newStatus);
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

  // Execute users API when component mounts or scope changes
  const executeFetchUsers = useCallback(async () => {
    if ((mode === "edit" || mode === "create") && !isFetchingUsersRef.current) {
      console.log("Executing fetchUsers for TaskDetailPage with:", { mode, currentOrgId });
      
      isFetchingUsersRef.current = true;
      setUsersLoading(true);
      setUsersError(null);
      
      try {
        const data = await fetchUsers();
        setUsersData(data);
      } catch (err) {
        console.error("Error fetching users for TaskDetailPage:", err);
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
      console.log("Executing fetchTask for TaskDetailPage with:", { taskId, mode });
      
      isFetchingTaskRef.current = true;
      setTaskLoading(true);
      setTaskError(null);
      
      try {
        const data = await fetchTask();
        setTaskDataFromAPI(data);
      } catch (err) {
        console.error("Error fetching task for TaskDetailPage:", err);
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
      
      // Special handling for "Under Review" - map to "Under Approval" if not found
      if (!matchedStatus && (apiStatusName.toLowerCase() === "under review" || apiStatusName.toLowerCase() === "underapproval")) {
        matchedStatus = currentStatusOptions.find(opt => opt.value === "Under Review");
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
        console.log("No matching status found, created fallback:", matchedStatus);
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
      };
      
      console.log("Setting taskData with assignedTo:", data.assignedTo);
      
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
        text: "Cannot save in current mode",
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
      console.error("Date validation error:", error);
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
      
      // Ensure we have a valid status ID using hardcoded mapping
      let statusId = taskStatus?.id;
      if (!statusId || statusId === "" || statusId === null) {
        // Use hardcoded status ID mapping
        statusId = HARDCODED_STATUS_IDS[taskStatus?.value] || null;
        console.log("Using hardcoded status ID:", statusId, "for status:", taskStatus?.value);
      }

      const payload = {
        EventId: mode === "edit" ? currentFormData.eventId : eventId,
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

      console.log("Save payload with status ID:", {
        taskStatusId: payload.taskStatusId,
        statusValue: taskStatus?.value,
        statusLabel: taskStatus?.label,
        fullStatus: taskStatus,
        assignedUsers: selectedParticipantIds,
        hasAssignees: selectedParticipantIds.length > 0,
        mode: mode,
        statusOptions: statusOptions,
        statusOptionsLength: statusOptions.length
      });


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

  const handleFileSelect = useCallback((file, isSelected) => {
    setSelectedFiles(prev =>
      isSelected
        ? [...prev, file]
        : prev.filter(f => f.documentId !== file.documentId)
    );
  }, []);

  // Handle status change from buttons
  const handleStatusChange = async (newStatus) => {
    // Prevent multiple clicks while updating
    if (isUpdatingStatus) {
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
          console.log("Using hardcoded status ID for update:", statusId, "for status:", newStatus.value);
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
                console.error(`Failed to approve file ${selectedFiles[index].documentId}:`, result.reason);
              }
            });
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
            eventId={eventId}
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
            eventId={eventId || taskData.eventId}
            organizationId={organizationId || taskData.organizationId}
            selectedFiles={selectedFiles}
            onFileSelect={handleFileSelect}
          />
        ),
        disabled: mode === "create",
      },
    ];

    if (mode === "create" || mode === "edit") {
      return allTabs.filter(tab => tab.label === "Details");
    }
    return allTabs;
  }, [mode, taskData, formData, handleFormFieldUpdate, eventDate, validationErrors, taskId, eventId, fileData.uploadedFiles, setFileData, organizationId, selectedFiles, handleFileSelect, activeTab]);

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
        />
      </div>

      <div className="Inner-Content">
        <TabMenu
          tabs={tabs}
          showEditButton={mode === "view" && taskStatus.value !== "Approved" && !isDesigner} // Show edit button only in view mode, when status is not Approved, and user is not a Designer
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