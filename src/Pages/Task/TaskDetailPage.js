import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import ReactDOM from "react-dom";
import { fetchWithRefresh } from "../../Context/RefereshToken";
import { useLocation, useNavigate } from "react-router-dom";
import TabMenu from "../../CommonComponents/TabMenu/TabMenu";
import CommentsPreview from "./Comments_Preview/CommentsPreview";
import TasksFiles from "./TaskFiles/TaskFiles";
import TaskDetail from "./TaskDetail/TaskDetail";
import TopSection from "../../CommonComponents/TaskTopSection/EditTopSection";
import Breadcrumb from "../../CommonComponents/Breadcrumb/Breadcrumb";
import PageSkeleton from "../../CommonComponents/SkeletonLoading/PageSkeleton";
import GuestInviteModal from "../../CommonComponents/GuestInviteModal/GuestInviteModal";
import { useUser } from "../../Context/UserContext";
import { useMessages } from "../../Context/MessageContext";
import { useTaskStatus } from "../../Hooks/useTaskStatus";
import { useSignalR } from "../../Context/SignalRContext";
import { getHierarchyUsers } from "../../Services/AuthN";
import { Building, Calendar, Pencil, FileText } from "lucide-react";
import { FaInstagram, FaFacebook, FaEnvelope, FaYoutube } from "react-icons/fa";
import FileShareModel from "../../CommonComponents/FileShareModal/FileShareModel";
import "./Tasks.css";
import "../Task/Publish/Publish.css"; // Import for post link modal styles

// Utility function to convert text to title case
const toTitleCase = (str) => {
  if (!str) return str;
  return str
    .trim()
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const TaskDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, scopeChangeTrigger } = useUser();
  const { addMessage } = useMessages();

  // Check if user is a Designer
  const isDesigner = user?.roles?.some(
    (role) => role.name === "Designer" || role.displayName === "Designer"
  );

  const {
    taskId,
    mode: initialMode = "view",
    eventId: locationEventId,
    organizationId,
    eventDate: navEventDate,
    eventName,
  } = location.state || {};
  const eventDate = React.useMemo(
    () => (navEventDate ? new Date(navEventDate) : null),
    [navEventDate]
  );

  // Keep a local event name state so breadcrumbs can show the event name
  // even when navigation state doesn't include it (eg. from notifications).
  const [navEventName, setNavEventName] = useState(eventName || null);

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

  const isDocumentPublishable = (doc) => {
    if (!doc) return false;
    return doc.status === "Approved" || doc.status === "Published";
  };

  const showPublishedBadgeOnly = useCallback(() => {
    setTaskStatus({
      id: "published-ui-only",
      label: "Published",
      value: "Published",
      color: "purple",
    });
  }, []);

  const [createdBy, setCreatedBy] = useState(
    user ? `${user.firstName} ${user.lastName}` : "User"
  );
  const [usersList, setUsersList] = useState([]);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [apiEventId, setApiEventId] = useState(locationEventId); // Store eventId from API response
  const [hasWorkSubmissionFiles, setHasWorkSubmissionFiles] = useState(false); // Track work submission files
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [showPostLinkModal, setShowPostLinkModal] = useState(false);
  const [postLinkData, setPostLinkData] = useState(null);
  const [selectedPlatformIndex, setSelectedPlatformIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [fileDetail, setFileDetail] = useState(null);
  const [documentId, setDocumentId] = useState("");
  const [description, setDescription] = useState("");

  // Use task status context
  const {
    taskStatuses,
    loading: statusLoading,
    fetchTaskStatuses,
  } = useTaskStatus();

  const getDefaultColor = useCallback((statusValue) => {
    const colorMap = {
      New: "gray",
      Active: "blue",
      "Under Approval": "orange",
      Approved: "green",
      Published: "purple",
    };
    return colorMap[statusValue] || "gray";
  }, []);

  // Use task statuses from context instead of hardcoded values
  const statusOptions = React.useMemo(() => {
    return taskStatuses.map((status) => ({
      id: status.id,
      label: status.statusName || status.name,
      value: status.statusName || status.name,
      color: status.color || getDefaultColor(status.statusName || status.name),
    }));
  }, [taskStatuses, getDefaultColor]);

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

  const guestTaskPayload = useMemo(() => {
    if (mode === "create") {
      return null;
    }

    const resolvedTaskId = taskId || taskData.id;
    if (!resolvedTaskId) {
      return null;
    }

    const resolvedEventId = apiEventId || taskData.eventId || locationEventId;
    const resolvedOrgId =
      taskData.organizationId || organizationId || user?.organizationId;

    return {
      id: resolvedTaskId,
      title: taskTitle || taskData.taskTitle || taskData.title || "Task",
      eventId: resolvedEventId,
      eventName: navEventName || eventName || taskData.eventName,
      orgId: resolvedOrgId,
      orgName:
        taskData.organizationName ||
        user?.organization?.name ||
        user?.organizationName ||
        "Organization",
    };
  }, [
    mode,
    taskId,
    taskData,
    apiEventId,
    locationEventId,
    organizationId,
    user?.organizationId,
    user?.organization?.name,
    user?.organizationName,
    taskTitle,
    navEventName,
    eventName,
  ]);

  // No default status options - only use API data

  // Enhanced permissions based on task data and user role
  const canEdit = React.useMemo(() => {
    // If task has canCRUD: false or accessLevel: "READ_ONLY", user cannot edit
    if (taskData.canCRUD === false || taskData.accessLevel === "READ_ONLY") {
      return false;
    }

    // If task status is Approved or Published, it cannot be edited
    if (taskStatus?.value === "Approved" || taskStatus?.value === "Published") {
      return false;
    }

    // Otherwise, allow editing (Designers can now edit tasks)
    return true;
  }, [taskData.canCRUD, taskData.accessLevel, taskStatus?.value]);

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

  // Ensure task statuses are loaded when this page mounts or organization/user changes.
  // If statuses are empty, request them from context once (context handles caching and refresh logic).
  useEffect(() => {
    const needLoad = !Array.isArray(taskStatuses) || taskStatuses.length === 0;
    const orgId = currentOrgId || user?.organizationId;
    if (needLoad && orgId) {
      // don't force refresh; let context decide whether refresh is needed
      fetchTaskStatuses().catch((err) =>
        console.error("Failed to load task statuses:", err)
      );
    }
  }, [taskStatuses, currentOrgId, user?.organizationId, fetchTaskStatuses]);

  // API Functions
  const fetchUsers = useCallback(async () => {
    // Always fetch via parent once; children read via props. Avoid redundant calls.
    if (!currentOrgId) {
      return [];
    }
    try {
      const response = await getHierarchyUsers(currentOrgId);
      const formattedUsers = response.users.map((user) => {
        // Use the roles array that's already present in each user object
        const userRoles = Array.isArray(user.roles) ? user.roles : [];

        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          fullName: `${user.firstName} ${user.lastName}`,
          organizationId: user.organizationId,
          organizationCode: user.organizationCode || "ORG001",
          roles: userRoles, // Provide roles array for UserDropdown
          role: userRoles[0]?.name || userRoles[0]?.displayName || "", // Keep backward compatibility
        };
      });
      return formattedUsers;
    } catch (error) {
      addMessage({
        text: "Failed to load users list",
        type: "error",
        duration: 3000,
      });
      return [];
    }
  }, [currentOrgId, addMessage]);

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

      const response = await fetchWithRefresh(
        `/apis/task/get_task/${taskId}?organizationId=${orgId}`,
        {
          method: "GET",
          headers,
        }
      );

      if (response.status === 404) {
        addMessage({
          text: "Task not found",
          type: "error",
          duration: 3000,
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
        duration: 3000,
      });
      throw err;
    }
  }, [taskId, mode, organizationId, user?.organizationId, addMessage]);

  // Fetch a minimal event payload to get the event name when it's not
  // available via navigation state (useful for notification redirects).
  const fetchEventName = useCallback(
    async (evtId) => {
      if (!evtId) return null;
      try {
        const orgId = organizationId || user?.organizationId;
        if (!orgId) return null;

        const headers = {
          "Content-Type": "application/json",
          Accept: "application/json",
          "ngrok-skip-browser-warning": "1",
        };

        if (orgId !== user?.organizationId) {
          headers["X-Context-Organization"] = orgId;
        }

        const res = await fetchWithRefresh(
          `/apis/event/get_event/${evtId}?organizationId=${orgId}&userId=${user?.userId}`,
          {
            method: "GET",
            headers,
          }
        );
        if (!res.ok) return null;
        const payload = await res.json();
        const data = payload?.data || payload;
        return data?.eventName || data?.name || null;
      } catch (err) {
        return null;
      }
    },
    [organizationId, user?.organizationId, user?.userId]
  );

  // If we don't have an event name from navigation, try fetching it using
  // the event ID (either passed via location state or from task API).
  useEffect(() => {
    const evtId = locationEventId || apiEventId;
    if (!navEventName && evtId) {
      let mounted = true;
      fetchEventName(evtId)
        .then((name) => {
          if (mounted && name) setNavEventName(name);
        })
        .catch(() => {});
      return () => {
        mounted = false;
      };
    }
  }, [navEventName, locationEventId, apiEventId, fetchEventName]);

  // State Management
  const [usersData, setUsersData] = useState(null);
  const [taskDataFromAPI, setTaskDataFromAPI] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);
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
      // Only set status if it's not already set or doesn't have an ID
      if (!taskStatus?.id || taskStatus.id === "") {
        const newStatus = statusOptions.find(
          (status) => status.value === "New"
        );
        if (newStatus) {
          setTaskStatus(newStatus);
          // Also update taskData with the status ID
          setTaskData((prev) => ({
            ...prev,
            taskStatusId: newStatus.id,
            taskStatus: newStatus.value,
          }));
        }
      }
    }
  }, [statusOptions, mode, taskStatus?.id]);

  // Auto-update status based on user assignments (only for New status)
  useEffect(() => {
    if (statusOptions.length > 0 && mode === "create") {
      if (selectedParticipantIds.length > 0) {
        // Users are assigned - set to Active (only if currently New)
        const activeStatus = statusOptions.find(
          (status) => status.value === "Active"
        );
        if (activeStatus && taskStatus?.value === "New") {
          setTaskStatus(activeStatus);
          // Also update taskData
          setTaskData((prev) => ({
            ...prev,
            taskStatusId: activeStatus.id,
            taskStatus: activeStatus.value,
          }));
        }
      } else if (
        selectedParticipantIds.length === 0 &&
        taskStatus?.value === "Active"
      ) {
        // No users assigned and currently Active - set back to New
        const newStatus = statusOptions.find(
          (status) => status.value === "New"
        );
        if (newStatus) {
          setTaskStatus(newStatus);
          // Also update taskData
          setTaskData((prev) => ({
            ...prev,
            taskStatusId: newStatus.id,
            taskStatus: newStatus.value,
          }));
        }
      }
    }
  }, [selectedParticipantIds, statusOptions, taskStatus?.value, mode]);

  // Store the fetch functions in refs to avoid dependency issues
  const fetchUsersRef = useRef(fetchUsers);
  const fetchTaskRef = useRef(fetchTask);

  // Update refs when functions change
  useEffect(() => {
    fetchUsersRef.current = fetchUsers;
  }, [fetchUsers]);

  useEffect(() => {
    fetchTaskRef.current = fetchTask;
  }, [fetchTask]);

  // Execute users API when component mounts or scope changes - only once per mount
  const executeFetchUsers = useCallback(async () => {
    if (isFetchingUsersRef.current) return;
    isFetchingUsersRef.current = true;
    setUsersLoading(true);
    try {
      const data = await fetchUsersRef.current();
      setUsersData(data);
    } catch (err) {
      console.error("Error fetching users:", err.message);
    } finally {
      setUsersLoading(false);
      isFetchingUsersRef.current = false;
    }
  }, []); // No dependencies to prevent recreation

  // Execute task API when taskId is available and not in create mode - only once per taskId
  const executeFetchTask = useCallback(async () => {
    if (taskId && mode !== "create" && !isFetchingTaskRef.current) {
      isFetchingTaskRef.current = true;
      setTaskLoading(true);

      try {
        const data = await fetchTaskRef.current();
        setTaskDataFromAPI(data);
      } catch (err) {
        console.error("Error fetching task:", err.message);
      } finally {
        setTaskLoading(false);
        isFetchingTaskRef.current = false;
      }
    }
  }, [taskId, mode]); // Only depend on taskId and mode

  // Track if we've already fetched users to prevent duplicate calls
  const hasFetchedUsersRef = useRef(false);
  const hasFetchedTaskRef = useRef(false);
  const lastTaskIdRef = useRef(null);
  const lastModeRef = useRef(null);

  // Only fetch users once on mount, not on every scope change
  useEffect(() => {
    if (!hasFetchedUsersRef.current) {
      executeFetchUsers();
      hasFetchedUsersRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Only fetch task when taskId changes or mode changes, not on every scope change
  useEffect(() => {
    const taskIdChanged = lastTaskIdRef.current !== taskId;
    const modeChanged = lastModeRef.current !== mode;

    if (
      (taskIdChanged || modeChanged) &&
      taskId &&
      mode !== "create" &&
      !hasFetchedTaskRef.current
    ) {
      executeFetchTask();
      hasFetchedTaskRef.current = true;
      lastTaskIdRef.current = taskId;
      lastModeRef.current = mode;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, mode]); // Only depend on taskId and mode, not the function

  // Handle scope changes - reset refs and refetch only when organization actually changes
  useEffect(() => {
    // Reset the refs when scope changes to allow refetching
    isFetchingUsersRef.current = false;
    isFetchingTaskRef.current = false;
    hasFetchedUsersRef.current = false;
    hasFetchedTaskRef.current = false;

    // Only refetch if we have a valid organization and are not in create mode
    if (currentOrgId && mode !== "create") {
      executeFetchUsers();
      executeFetchTask();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeChangeTrigger, currentOrgId, mode]); // Remove function dependencies

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
        (opt) => opt.value.toLowerCase() === apiStatusName.toLowerCase()
      );

      // If not found, try matching by label
      if (!matchedStatus) {
        matchedStatus = currentStatusOptions.find(
          (opt) => opt.label.toLowerCase() === apiStatusName.toLowerCase()
        );
      }

      // If still not found but we have the status ID from API, try to find by ID
      if (!matchedStatus && data.taskStatusId) {
        matchedStatus = currentStatusOptions.find(
          (opt) => opt.id === data.taskStatusId
        );
      }

      // If still not found, create a fallback status but preserve the API's taskStatusId
      if (!matchedStatus) {
        matchedStatus = {
          id: data.taskStatusId || "",
          label: apiStatusName,
          value: apiStatusName,
          color: getDefaultColor(apiStatusName),
        };
      } else if (!matchedStatus.id && data.taskStatusId) {
        // If matched but no ID, use the API's taskStatusId
        matchedStatus = { ...matchedStatus, id: data.taskStatusId };
      }

      setTaskStatus(matchedStatus);

      // Update eventId from API response
      if (data.eventId) {
        setApiEventId(data.eventId);
      }

      const formattedChecklist = Array.isArray(data.checklistDetails)
        ? data.checklistDetails.map((item) => ({
            text: item?.text?.toString() || "",
            checked: Boolean(item?.checked),
            isPlaceholder: Boolean(item?.isPlaceholder),
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
      setFormData((prev) => ({
        ...prev,
        type: data.creativeType || "",
        date: data.dueDate
          ? data.dueDate.split("T")[0]
          : new Date().toISOString().split("T")[0],
        quantity: data.creativeNumbers || 1,
        checklist: formattedChecklist,
        description: data.description || "",
      }));
    }
  }, [taskDataFromAPI, statusOptions, user, organizationId, getDefaultColor]);

  // Track previous organization ID to detect actual changes
  const prevOrgIdRef = useRef(currentOrgId);

  // Reset users list when organization changes - but don't clear if we're just updating
  useEffect(() => {
    // Only clear users list if we're switching to a different organization
    // Don't clear during task updates within the same organization
    if (prevOrgIdRef.current !== currentOrgId) {
      setUsersList([]);
      prevOrgIdRef.current = currentOrgId;
    }
  }, [currentOrgId]);

  // Initialize create mode when users are loaded and we're in create mode
  useEffect(() => {
    if (mode === "create" && usersData && usersData.length > 0) {
      initializeCreateMode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, usersData]); // Remove initializeCreateMode dependency

  useEffect(() => {
    if (Array.isArray(taskData.assignedTo)) {
      const idsOnly = taskData.assignedTo
        .map((assigned) =>
          typeof assigned === "object" ? assigned?.id : assigned
        )
        .filter(Boolean);
      setSelectedParticipantIds(idsOnly);
    }
  }, [taskData.assignedTo]);

  // Handle title updates separately to prevent interference
  const handleTitleUpdate = React.useCallback((newTitle) => {
    setTaskTitle(newTitle);
    setFormData((prev) => ({ ...prev, title: newTitle }));
    setTaskData((prev) => ({ ...prev, taskTitle: newTitle }));

    // Clear title validation error
    setValidationErrors((prev) => {
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
    setFormData((prev) => {
      if (field === "checklist") {
        return {
          ...prev,
          checklist: value
            .map((item) => ({
              text: item?.text?.toString() || "",
              checked: Boolean(item?.checked),
              isPlaceholder: Boolean(item?.isPlaceholder),
            }))
            .filter((item) => item.text),
        };
      }
      return { ...prev, [field]: value };
    });

    // Also update taskData for consistency
    setTaskData((prev) => {
      if (field === "checklist") {
        const newData = {
          ...prev,
          checklist: value
            .map((item) => ({
              text: item?.text?.toString() || "",
              checked: Boolean(item?.checked),
              isPlaceholder: Boolean(item?.isPlaceholder),
            }))
            .filter((item) => item.text),
        };
        return newData;
      }
      const newData = { ...prev, [field]: value };
      return newData;
    });

    // Clear validation error for this field when user starts typing
    setValidationErrors((prev) => {
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
        duration: 3000,
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
      errors.time = "Due time is required";
    }

    // Description required (strip HTML and whitespace)
    const currentDescription = (
      formData?.description ||
      taskData?.description ||
      ""
    ).toString();
    const descriptionText = currentDescription.replace(/<[^>]*>/g, "").trim();
    if (!descriptionText) {
      errors.description = "Description is required";
    }

    // Specification required (at least one non-empty checklist item)
    const checklistArray = Array.isArray(
      formData?.checklist || taskData?.checklist
    )
      ? (formData?.checklist || taskData?.checklist).filter((item) =>
          (item?.text || "").toString().trim()
        )
      : [];
    if (checklistArray.length === 0) {
      errors.specification = "At least one specification item is required";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);

      // Create specific error message showing which fields are missing
      const missingFields = Object.keys(errors).map((field) => {
        switch (field) {
          case "title":
            return "Task Title";
          case "type":
            return "Creative Type";
          case "date":
            return "Due Date";
          case "status":
            return "Task Status";
          default:
            return field;
        }
      });

      const errorMessage = `Please fill the following required fields: ${missingFields.join(
        ", "
      )}`;
      addMessage({ text: errorMessage, type: "error", duration: 5000 });
      setActiveTab("Details");
      return;
    }

    // Validation: If status is Approved, at least one file must be selected
    if (taskStatus.value === "Approved" && selectedFiles.length === 0) {
      addMessage({
        text: "You must select at least one file to approve the task.",
        type: "error",
        duration: 3000,
      });
      setActiveTab("Files & Uploads");
      return;
    }

    // Use current form data for validation
    const currentFormData = { ...taskData, ...formData };

    // Validate task date and time
    try {
      if (!currentFormData.date) {
        addMessage({
          text: "Please select a due date and time.",
          type: "error",
          duration: 3000,
        });
        return;
      }

      const now = new Date();
      const selected = new Date(currentFormData.date);
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

      if (selected < now) {
        addMessage({
          text: "Task date must be today or later.",
          type: "error",
          duration: 3000,
        });
        return;
      }

      if (selected < oneHourLater) {
        addMessage({
          text: "Task due time must be at least 1 hour from now.",
          type: "error",
          duration: 3000,
        });
        return;
      }

      if (eventDate && selected > new Date(eventDate)) {
        addMessage({
          text: "Task date cannot be after the event date.",
          type: "error",
          duration: 3000,
        });
        return;
      }
    } catch (error) {
      addMessage({
        text: "Invalid date format.",
        type: "error",
        duration: 3000,
      });
      return;
    }

    try {
      // If navigation state explicitly included an eventId (i.e. user came from an event view),
      // require that we have a valid event id when creating a task. Dashboard/task-list flows
      // typically omit eventId (or pass null) and should be allowed to create standalone tasks.
      const navigatedEventIdPresent =
        typeof location?.state?.eventId !== "undefined" &&
        location?.state?.eventId !== null;
      if (mode === "create" && navigatedEventIdPresent && !apiEventId) {
        addMessage({
          text: "Event ID is required when creating a task from an event. Please save the event first.",
          type: "error",
          duration: 4000,
        });
        return;
      }

      if (selectedFiles.length > 0 && activeTab === "Files & Uploads") {
        try {
          const approvalResults = await Promise.allSettled(
            selectedFiles.map(async (file) => {
              const response = await fetchWithRefresh(
                `/apis/document/approve/${file.documentId}`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "1",
                  },
                }
              );

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
          // Update local fileData so UI reflects approved files immediately
          try {
            const approvedIds = (selectedFiles || []).map((f) => f.documentId);
            setFileData((prev) => ({
              ...prev,
              uploadedFiles: (prev.uploadedFiles || []).map((f) =>
                approvedIds.includes(f.documentId)
                  ? { ...f, status: "Approved", isApproved: true }
                  : f
              ),
            }));
          } catch (e) {
            console.error("Failed to update local fileData after approval", e);
          }
        } catch (fileError) {
          addMessage({
            text: "Error approving files",
            type: "error",
            duration: 3000,
          });
        }
      }

      // currentFormData already defined above

      const formattedChecklist = Array.isArray(currentFormData.checklist)
        ? currentFormData.checklist.map((item) => ({
            text: item.text,
            checked: item.checked,
            isPlaceholder: item.isPlaceholder,
          }))
        : [];

      // Try to get user ID from various possible field names
      const userId = user.userId;

      // Validate that we have a valid user ID
      if (!userId) {
        addMessage({
          text: "User information not available. Please log in again.",
          type: "error",
          duration: 3000,
        });
        return;
      }

      // Ensure we have a valid status ID from statusOptions
      let statusId = taskStatus?.id;

      // If no status ID, try multiple strategies to find it
      if (!statusId || statusId === "" || statusId === null) {
        // First try to find in statusOptions by value/label
        const statusOption = statusOptions.find(
          (opt) =>
            opt.value === taskStatus?.value ||
            opt.label === taskStatus?.label ||
            opt.value === taskStatus?.label ||
            opt.label === taskStatus?.value
        );
        statusId = statusOption?.id;
      }

      // If still no status ID, try to get it from taskData
      if (!statusId || statusId === "" || statusId === null) {
        statusId = taskData.taskStatusId;
      }

      // For create mode, try to get "New" status as final fallback
      if (
        (!statusId || statusId === "" || statusId === null) &&
        mode === "create"
      ) {
        const newStatus = statusOptions.find(
          (opt) => opt.value === "New" || opt.label === "New"
        );
        statusId = newStatus?.id;
      }

      // Final validation - if still no status ID, show helpful error
      if (!statusId || statusId === "" || statusId === null) {
        console.error("Status validation failed:", {
          taskStatus,
          statusOptions,
          taskDataStatusId: taskData.taskStatusId,
        });
        addMessage({
          text: "Task status is not available. Please wait a moment and try again.",
          type: "error",
          duration: 3000,
        });
        return;
      }

      const payload = {
        TaskTitle: toTitleCase(taskTitle),
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
        OrganizationId: organizationId || currentFormData.organizationId,
      };

      // Only include EventId when editing (use the form value) or when we have a valid apiEventId.
      if (mode === "edit") {
        payload.EventId = currentFormData.eventId;
      } else if (apiEventId) {
        payload.EventId = apiEventId;
      }

      const url =
        mode === "edit"
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
        setTaskData((prev) => ({ ...prev, id: newTaskId }));
        navigate(location.pathname, {
          state: { ...location.state, taskId: newTaskId, mode: "view" },
          replace: true,
        });

        // Switch to Files & Uploads tab to encourage file upload
        setActiveTab("Files & Uploads");

        addMessage({
          text: "Task created successfully! You can now add files and comments.",
          type: "success",
          duration: 4000,
        });
      } else {
        setMode("view");
        addMessage({
          text: "Task updated successfully",
          type: "success",
          duration: 3000,
        });
      }
    } catch (error) {
      addMessage({
        text: `Save failed: ${error.message}`,
        type: "error",
        duration: 3000,
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
    setSelectedFiles((prev) => {
      if (isSelected) {
        // For radio button behavior, replace the entire selection with the new file
        return [file];
      } else {
        // Remove the file if deselected
        return prev.filter((f) => f.documentId !== file.documentId);
      }
    });
  }, []);

  // Wrap setFileData in useCallback to prevent unnecessary re-renders
  const handleFilesChange = useCallback((data) => {
    // If a file was deleted, we need to refresh the files from the backend
    if (data.refreshFiles || data.deletedFileId) {
      // Trigger a refresh of the files by updating the fileData
      // This will cause the TaskFiles component to re-fetch files
      setFileData((prev) => ({
        ...prev,
        refreshTrigger: (prev.refreshTrigger || 0) + 1,
      }));
    } else {
      setFileData(data);
    }
  }, []);

  // Handle work submission file changes
  const handleWorkSubmissionFilesChange = useCallback((hasWorkFiles) => {
    setHasWorkSubmissionFiles(hasWorkFiles);
  }, []);

  // Fetch published links for the task
  const fetchPublishedLinks = async (taskIdParam) => {
    try {
      const response = await fetch(
        `/apis/socialmedia/post-links/task/${taskIdParam}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "1",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch published links");
      }

      const data = await response.json();

      // Group links by platform to avoid duplicates
      const platformMap = new Map();

      data.forEach((item) => {
        if (item.links && Array.isArray(item.links)) {
          item.links.forEach((link) => {
            const platform = link.platform;
            if (!platformMap.has(platform)) {
              platformMap.set(platform, link);
            }
          });
        }
      });

      // Convert map to array
      return Array.from(platformMap.values());
    } catch (err) {
      console.error("Error fetching published links:", err);
      return [];
    }
  };

  // Handle view links button click
  const handleViewLinks = async () => {
    if (!taskId) {
      addMessage({
        text: "Task ID not available",
        type: "error",
        duration: 2000,
      });
      return;
    }

    const links = await fetchPublishedLinks(taskId);
    if (links.length > 0) {
      setPostLinkData({ links, viewMode: true });
      setSelectedPlatformIndex(0);
      setShowPostLinkModal(true);
    } else {
      addMessage({
        text: "No published links found for this task",
        type: "info",
        duration: 2000,
      });
    }
  };

  // Handle publish button click - fetch documents, switch to Files tab, and open FileShareModel if files exist
  const handlePublish = async () => {
    if (!taskId && !taskData?.id) {
      addMessage({
        text: "Task ID not available",
        type: "error",
        duration: 2000,
      });
      return;
    }

    const resolvedTaskId = taskId || taskData?.id;

    try {
      const orgId =
        taskData?.organizationId || organizationId || user?.organizationId;
      const headers = {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "1",
      };

      if (orgId && orgId !== user?.organizationId) {
        headers["X-Context-Organization"] = orgId;
      }

      const res = await fetchWithRefresh(
        `/apis/document-details/task/${resolvedTaskId}`,
        {
          method: "GET",
          headers,
        }
      );

      if (!res.ok) {
        addMessage({
          text: "Failed to fetch files for publishing",
          type: "error",
          duration: 3000,
        });
        setActiveTab("Files & Uploads");
        return;
      }

      const data = await res.json();
      const normalizedData =
        Array.isArray(data) && data.length === 1 && data[0]?.message
          ? []
          : data;

      const mappedFiles = (normalizedData || []).map((doc) => ({
        name: doc.filename,
        type: doc.contentType,
        documentId: doc.documentId,
        description: doc.description,
        src: `/apis/document/view/${doc.documentId}`,
        status: doc.status || "Pending",
        publishedTo: doc.publishedTo || [],
        uploadDate: doc.uploadDate,
        size: doc.fileSize || doc.size,
        userInfo: doc.userInfo,
        isApproved: doc.status === "Approved" || doc.status === "Published",
        contentType: doc.contentType,
      }));

      // ✅ FILTER ONLY APPROVED / PUBLISHED FILES
      const publishableFiles = mappedFiles.filter(isDocumentPublishable);

      if (publishableFiles.length === 0) {
        addMessage({
          text: "Only Approved or Published documents can be published. Please approve a document first.",
          type: "error",
          duration: 4000,
        });
        setActiveTab("Files & Uploads");
        return;
      }

      setFileData({ uploadedFiles: mappedFiles, links: [] });
      setActiveTab("Files & Uploads");

      const file = publishableFiles[0];
      setDescription(file.description || file.name || "");
      setDocumentId(file.documentId);
      setFileDetail({ ...file, fullTask: taskData });
      setShowShareModal(true);
    } catch (err) {
      addMessage({
        text: `Failed to fetch files: ${err.message}`,
        type: "error",
        duration: 4000,
      });
    }
  };

  // Function to refresh files after publishing to show updated document status
  const refreshFilesAfterPublish = async () => {
    if (!taskId && !taskData?.id) {
      return;
    }

    const resolvedTaskId = taskId || taskData?.id;

    try {
      const orgId =
        taskData?.organizationId || organizationId || user?.organizationId;
      const headers = {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "1",
      };

      if (orgId && orgId !== user?.organizationId) {
        headers["X-Context-Organization"] = orgId;
      }

      const res = await fetchWithRefresh(
        `/apis/document-details/task/${resolvedTaskId}`,
        {
          method: "GET",
          headers,
        }
      );

      if (!res.ok) {
        console.error("Failed to refresh files after publish");
        return;
      }

      const data = await res.json();
      const normalizedData =
        Array.isArray(data) && data.length === 1 && data[0]?.message
          ? []
          : data;

      const mappedFiles = (normalizedData || []).map((doc) => ({
        name: doc.filename,
        type: doc.contentType,
        documentId: doc.documentId,
        description: doc.description,
        src: `/apis/document/view/${doc.documentId}`,
        status: doc.status || "Pending",
        publishedTo: doc.publishedTo || [],
        uploadDate: doc.uploadDate,
        size: doc.fileSize || doc.size,
        userInfo: doc.userInfo,
        isApproved: doc.status === "Approved" || doc.status === "Published",
        contentType: doc.contentType,
      }));

      // Update the file data to refresh the UI
      setFileData({ uploadedFiles: mappedFiles, links: [] });
    } catch (err) {
      console.error("Error refreshing files after publish:", err);
    }
  };

  // Handle platform publish from FileShareModel
  const handlePlatformPublish = async (docId, platform, publishData = {}) => {
    // ✅ FINAL SAFETY CHECK
    if (!fileDetail || !isDocumentPublishable(fileDetail)) {
      addMessage({
        text: "This document is not approved for publishing. Only Approved or Published files can be published.",
        type: "error",
        duration: 4000,
      });
      return;
    }

    const organizationId = user?.organizationId;
    const taskIdParam = taskId;

    if (platform === "email") {
      // Email publishing is handled elsewhere; just record and notify
      await handlePublishRecord(docId, platform);
      showPublishedBadgeOnly();
      
      // Refresh the files list to show updated document status
      await refreshFilesAfterPublish();
      
      addMessage({
        text: "Email published successfully!",
        type: "success",
        duration: 3000,
      });
      // Refresh Files & Uploads tab files list
      setFileData((prev) => ({
        ...prev,
        refreshTrigger: (prev.refreshTrigger || 0) + 1,
      }));
      return;
    }

    // Handle Facebook/Instagram/YouTube publishing by calling the respective endpoints
    if (platform === "facebook" || platform === "instagram" || platform === "youtube") {
      const orgId = user?.organizationId;
      const taskIdForPayload = taskIdParam || taskData?.id;

      let endpoint = "";
      let payload = {};

      if (platform === "youtube") {
        endpoint = "/apis/youtube/upload";
        payload = {
          organizationId: orgId,
          documentId: docId,
          taskId: taskIdForPayload,
          title: publishData.title || fileDetail?.name || "Video",
          description: publishData.description || "",
          tags: publishData.tags || [],
          privacyStatus: publishData.privacyStatus || "public",
        };
      } else {
        endpoint = platform === "instagram" ? "/apis/socialmedia/post/instagram" : "/apis/socialmedia/post/facebook";
        payload = {
          organizationId: orgId,
          documentId: docId,
          taskId: taskIdForPayload,
          caption: publishData.caption || fileDetail?.description || fileDetail?.name || "",
        };
      }

      try {
        const response = await fetchWithRefresh(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "1",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          // Try to read response body for better error message
          let errMsg = `Failed to post to ${platform}`;
          try {
            const errJson = await response.json();
            errMsg = errJson.message || errMsg;
          } catch (e) {
            try {
              const txt = await response.text();
              if (txt) errMsg = txt;
            } catch (e2) {}
          }
          throw new Error(errMsg);
        }

        const result = await response.json();

        // If the API returned a public post URL, persist it to our post-links endpoint
        if (result && (result.postUrl || result.success)) {
          const postId = result.postId || result.id || "";
          const postUrl = result.postUrl || result.url || "";
          if (postUrl) {
            await saveSocialMediaPostLink(docId, platform, { postId, postUrl });
            // Mirror Publish.js: show the post link modal to the user
            setPostLinkData({
              platform: platform.charAt(0).toUpperCase() + platform.slice(1),
              postUrl,
              postId,
            });
            setShowPostLinkModal(true);
          }
        }

        // Record publish and update UI
        await handlePublishRecord(docId, platform);
        showPublishedBadgeOnly();
        addMessage({
          text: `${platform.charAt(0).toUpperCase() + platform.slice(1)} published successfully!`,
          type: "success",
          duration: 3000,
        });
        // Refresh Files & Uploads tab files list so UI reflects published status
        setFileData((prev) => ({
          ...prev,
          refreshTrigger: (prev.refreshTrigger || 0) + 1,
        }));
      } catch (err) {
        addMessage({ text: err.message || `Failed to publish to ${platform}`, type: "error", duration: 5000 });
      }

      return;
    }

    // ---- existing logic unchanged below ----
  };

  const saveSocialMediaPostLink = async (docId, platform, postData) => {
    const organizationId = user?.organizationId;
    const taskIdParam = taskId;

    const payload = {
      organizationId,
      eventId: apiEventId,
      taskId: taskIdParam,
      documentId: docId,
      links: [
        {
          platform: platform.charAt(0).toUpperCase() + platform.slice(1),
          url: postData.postUrl || "",
          postId: postData.postId || "",
          postedAt: new Date().toISOString(),
        },
      ],
    };

    try {
      const response = await fetch("/apis/socialmedia/post-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to save social media post link"
        );
      }

      const result = await response.json();
      return result;
    } catch (err) {
      console.error("Error saving social media post link:", err);
    }
  };

  const handlePublishRecord = async (docId, platform) => {
    const userId =
      user?.id ||
      user?._id ||
      user?.userId ||
      user?.user_id ||
      user?.uid ||
      user?.userID;
    const userName = user
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
      : "";

    if (!userId) {
      console.error("User ID not available for publish record");
      return;
    }

    const payload = {
      platforms: [platform],
      userId,
      userName,
    };

    try {
      const response = await fetch(`/apis/document/publish-record/${docId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to record publish");
    } catch (err) {
      console.error("Error recording publish:", err);
    }
  };

  // Memoize selectedFiles to prevent unnecessary re-renders
  const memoizedSelectedFiles = useMemo(() => selectedFiles, [selectedFiles]);

  // New API function for updating task status using single endpoint
  const updateTaskStatus = async (taskId, statusId) => {
    try {
      const response = await fetchWithRefresh(
        `/apis/task/update-status/${taskId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "1",
          },
          body: JSON.stringify({
            taskStatusId: statusId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Status update failed");
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to update task status: ${error.message}`);
    }
  };

  // API function for updating only the checklist
  const updateChecklistOnly = React.useCallback(
    async (taskId, checklistData) => {
      try {
        const userId = user.userId;

        if (!userId) {
          throw new Error(
            "User information not available. Please log in again."
          );
        }

        const formattedChecklist = Array.isArray(checklistData)
          ? checklistData.map((item) => ({
              text: item.text,
              checked: item.checked,
              isPlaceholder: item.isPlaceholder,
            }))
          : [];

        const payload = {
          EventId: taskData.eventId,
          TaskTitle: taskData.taskTitle,
          taskStatusId: taskData.taskStatusId,
          AssignedTo: (taskData.assignedTo || []).map((item) =>
            typeof item === "object" ? item?.id : item
          ),
          CreatedBy: taskData.createdBy,
          UpdatedBy: userId,
          CreativeType: taskData.type,
          DueDate: taskData.date,
          CreativeNumbers: taskData.quantity,
          checklistDetails: formattedChecklist,
          Description: taskData.description,
          OrganizationId: taskData.organizationId,
        };

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
          throw new Error(errorData.message || "Checklist update failed");
        }

        const result = await response.json();

        // Show success message
        addMessage({
          text: "Checklist updated successfully",
          type: "success",
          duration: 3000,
        });

        return result;
      } catch (error) {
        // Show error message
        addMessage({
          text: `Failed to update checklist: ${error.message}`,
          type: "error",
          duration: 3000,
        });
        throw error;
      }
    },
    [user.userId, taskData, addMessage]
  );

  // SignalR for sending chat messages when needed (e.g., revert reason)
  const { sendMessage: sendChatMessage } = useSignalR();

  // Handle status change from buttons
  const handleStatusChange = async (newStatus, revertReason) => {
    // Prevent multiple clicks while updating
    if (isUpdatingStatus) {
      return;
    }

    // Check if user has permission to change status
    if (!canEdit) {
      addMessage({
        text: "You don't have permission to change the status of this task",
        type: "error",
        duration: 3000,
      });
      return;
    }

    // Special validation for Under Approval status - must have work submission files
    if (newStatus.value === "Under Approval") {
      // Check if there are work submission files available
      if (!hasWorkSubmissionFiles) {
        addMessage({
          text: "You must upload at least one work submission file before submitting for approval.",
          type: "error",
          duration: 5000,
        });
        setActiveTab("Files & Uploads");
        return;
      }
    }

    // Special validation for Approved status - must have files selected
    if (newStatus.value === "Approved") {
      // Ensure specification checklist items (non-empty) are all checked before approving
      try {
        const checklistSource = Array.isArray(formData?.checklist)
          ? formData.checklist
          : Array.isArray(taskData?.checklist)
          ? taskData.checklist
          : [];

        const specItems = checklistSource.filter((item) =>
          (item?.text || "").toString().trim()
        );

        const hasUnchecked =
          specItems.length > 0 && specItems.some((item) => !item.checked);

        if (hasUnchecked) {
          addMessage({
            text: "All specification items must be marked completed before approving the task.",
            type: "error",
            duration: 4000,
          });
          setActiveTab("Details");
          return;
        }
      } catch (e) {
        addMessage({
          text: "Unable to verify specifications before approval.",
          type: "error",
          duration: 3000,
        });
        return;
      }

      // Existing file-selection validation (keep previous behavior)
      if (selectedFiles.length === 0) {
        addMessage({
          text: "You must select at least one file from 'Files & Uploads' section to approve the task.",
          type: "error",
          duration: 5000,
        });
        setActiveTab("Files & Uploads");
        return;
      }
    }

    // Special validation for Active status (revert) - no additional requirements
    if (newStatus.value === "Active") {
      // No special validation needed for reverting to Active
      // This allows reverting from Under Approval back to Active
    }

    // Update local state immediately for UI feedback
    setTaskStatus(newStatus);

    // Only make API call if we have a taskId (not in create mode)
    if (taskId) {
      setIsUpdatingStatus(true);
      try {
        // Ensure we have a valid status ID from statusOptions
        let statusId = newStatus.id;
        if (!statusId || statusId === "" || statusId === null) {
          // Try to find the status in statusOptions with multiple matching strategies
          const statusOption = statusOptions.find(
            (opt) =>
              opt.value === newStatus.value ||
              opt.label === newStatus.label ||
              opt.value === newStatus.label ||
              opt.label === newStatus.value
          );
          statusId = statusOption?.id || null;
        }

        // If we don't have a statusId, try a short local wait for statusOptions to populate
        if (!statusId || statusId === "" || statusId === null) {
          const maxAttempts = 6;
          let attempt = 0;
          while (
            attempt < maxAttempts &&
            (!statusOptions || statusOptions.length === 0)
          ) {
            // wait 200ms
            // eslint-disable-next-line no-await-in-loop
            await new Promise((res) => setTimeout(res, 200));
            attempt += 1;
          }

          if (statusOptions && statusOptions.length > 0) {
            const statusOption = statusOptions.find(
              (opt) =>
                opt.value === newStatus.value ||
                opt.label === newStatus.label ||
                opt.value === newStatus.label ||
                opt.label === newStatus.value
            );
            statusId = statusOption?.id || null;
          }
        }

        // Final validation - ensure we have a status ID
        if (!statusId || statusId === "" || statusId === null) {
          addMessage({
            text: "Task status is not available yet. Please wait a moment and try again.",
            type: "error",
            duration: 3000,
          });
          setIsUpdatingStatus(false);
          return;
        }

        // If approving task, first approve the selected files
        if (newStatus.value === "Approved" && selectedFiles.length > 0) {
          try {
            const approvalResults = await Promise.allSettled(
              selectedFiles.map(async (file) => {
                const response = await fetchWithRefresh(
                  `/apis/document/approve/${file.documentId}`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "ngrok-skip-browser-warning": "1",
                    },
                  }
                );

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
            // Update local fileData so UI reflects approved files immediately
            try {
              const approvedIds = (selectedFiles || []).map(
                (f) => f.documentId
              );
              setFileData((prev) => ({
                ...prev,
                uploadedFiles: (prev.uploadedFiles || []).map((f) =>
                  approvedIds.includes(f.documentId)
                    ? { ...f, status: "Approved", isApproved: true }
                    : f
                ),
              }));
            } catch (e) {
              console.error(
                "Failed to update local fileData after approval",
                e
              );
            }
          } catch (fileError) {
            addMessage({
              text: "Error approving files. Please try again.",
              type: "error",
              duration: 3000,
            });
            return;
          }
        }

        // Use the new single API endpoint for status update
        await updateTaskStatus(taskId, statusId);

        // Show success message with file approval info if applicable
        const successMessage =
          newStatus.value === "Approved" && selectedFiles.length > 0
            ? `Task approved successfully! ${selectedFiles.length} file(s) approved.`
            : newStatus.value === "Active" &&
              taskStatus?.value === "Under Approval"
            ? `Task reverted to Active status successfully.`
            : `Task status updated to ${newStatus.label}`;

        addMessage({
          text: successMessage,
          type: "success",
          duration: 4000,
        });

        // After status update succeeds, send revert reason to chat if provided
        if (
          newStatus.value === "Active" &&
          revertReason &&
          (taskId || taskData.id)
        ) {
          try {
            const messageText = `Task reverted to Active. Reason: ${revertReason}`;
            if (typeof sendChatMessage === "function") {
              // Fire-and-forget; log errors but don't block UI
              // Send with messageType 2 for system notification
              sendChatMessage(taskId || taskData.id, messageText, [], 2).catch(
                (err) => {
                  console.error(
                    "Failed to send revert reason message to chat:",
                    err
                  );
                }
              );
            }
          } catch (err) {
            console.error("Error sending revert message:", err);
          }
        }
      } catch (error) {
        // Revert status change on error
        const originalStatus = statusOptions.find(
          (opt) => opt.value === taskStatus.value
        );
        if (originalStatus) {
          setTaskStatus(originalStatus);
        }

        addMessage({
          text: `Failed to update status: ${error.message}`,
          type: "error",
          duration: 3000,
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
            onClearError={(field) =>
              setValidationErrors((prev) => ({ ...prev, [field]: undefined }))
            }
            onChecklistUpdate={updateChecklistOnly}
            taskId={taskId}
          />
        ),
      },
      {
        label: "Comments and Preview",
        component:
          mode === "create" ? (
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
        component:
          mode === "create" ? (
            <div className="create-mode-message">
              Save the task first to upload files
            </div>
          ) : (
            <TasksFiles
              files={fileData.uploadedFiles}
              onFilesChange={handleFilesChange}
              mode={mode}
              taskId={taskId || taskData.id}
              eventId={apiEventId || taskData.eventId}
              organizationId={organizationId || taskData.organizationId}
              selectedFiles={memoizedSelectedFiles}
              onFileSelect={handleFileSelect}
              taskStatus={taskStatus}
              onWorkSubmissionFilesChange={handleWorkSubmissionFilesChange}
            />
          ),
        disabled: mode === "create",
      },
    ];

    if (mode === "create") {
      return allTabs.filter((tab) => tab.label === "Details");
    }
    return allTabs;
  }, [
    mode,
    taskData,
    formData,
    handleFormFieldUpdate,
    eventDate,
    validationErrors,
    taskId,
    apiEventId,
    fileData.uploadedFiles,
    handleFilesChange,
    organizationId,
    memoizedSelectedFiles,
    handleFileSelect,
    activeTab,
    taskStatus,
    updateChecklistOnly,
    handleWorkSubmissionFilesChange,
  ]);

  const breadcrumbItems = React.useMemo(() => {
    // Ensure we have valid data before creating breadcrumb items
    const organizationName =
      user?.organization?.name || user?.organizationName || "Organization";
    const taskName = taskTitle
      ? toTitleCase(taskTitle)
      : mode === "create"
      ? "New Task"
      : "Task Details";
    const effectiveEventName = navEventName || eventName;

    const items = [
      {
        label: organizationName,
        href: "#",
        icon: Building,
      },
      {
        label: "Events",
        href: "/events",
        icon: Calendar,
        onClick: () => navigate("/events"),
      },
    ];

    // Add event name if available (either from navigation state, local fetched name or API)
    if (effectiveEventName) {
      items.push({
        label: toTitleCase(effectiveEventName),
        href: "#",
        icon: FileText,
        onClick: () => {
          // Only navigate if we have valid event ID
          if (apiEventId) {
            navigate("/events/eventDetailPage", {
              state: {
                eventId: apiEventId,
                mode: "view",
                organizationId:
                  taskData.organizationId ||
                  organizationId ||
                  user?.organizationId,
              },
            });
          }
        },
      });
    }

    // Add task name
    items.push({
      label: taskName,
      href: "#",
      icon: Pencil,
    });

    return items;
  }, [
    user?.organization?.name,
    user?.organizationName,
    eventName,
    navEventName,
    apiEventId,
    taskTitle,
    mode,
    navigate,
    user?.organizationId,
    organizationId,
    taskData.organizationId,
  ]);

  // Determine loading state
  const isLoading = useMemo(() => {
    if (mode === "create") {
      return usersLoading || statusLoading;
    }
    return taskLoading || usersLoading || statusLoading;
  }, [mode, taskLoading, usersLoading, statusLoading]);

  const canInviteGuests = Boolean(guestTaskPayload);

  if (!user) {
    return <PageSkeleton type="task" />;
  }

  if (isLoading) {
    return <PageSkeleton type="task" />;
  }

  return (
    <div className="task-creation-module fade-in">
      <div
        className="BreadCrumb"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Breadcrumb items={breadcrumbItems} />
        {canInviteGuests &&
          !isDesigner &&
          (taskStatus?.value === "Under Approval" ||
            taskStatus?.label === "Under Approval") && (
            <button className="primary" onClick={() => setGuestModalOpen(true)}>
              Add Guests
            </button>
          )}
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
          onClearError={(field) =>
            setValidationErrors((prev) => ({ ...prev, [field]: undefined }))
          }
          onStatusChange={handleStatusChange}
          isUpdatingStatus={isUpdatingStatus}
          user={user}
          taskId={taskId}
          hasWorkSubmissionFiles={hasWorkSubmissionFiles}
          onTabChange={handleTabChange}
          eventDate={eventDate}
          onPublish={handlePublish}
          onViewLinks={handleViewLinks}
        />
      </div>

      <div className="Inner-Content">
        <TabMenu
          tabs={tabs}
          showEditButton={mode === "view" && canEdit && !isDesigner} // Show edit button only in view mode, when user has edit permissions, and user is not a Designer
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
      {guestModalOpen && guestTaskPayload && (
        <GuestInviteModal
          isOpen={guestModalOpen}
          onClose={() => setGuestModalOpen(false)}
          tasks={[
            {
              id: guestTaskPayload.id,
              title: guestTaskPayload.title,
              eventId: guestTaskPayload.eventId,
              orgId: guestTaskPayload.orgId,
            },
          ]}
          events={
            guestTaskPayload.eventId
              ? [
                  {
                    id: guestTaskPayload.eventId,
                    name: guestTaskPayload.eventName || "Current Event",
                  },
                ]
              : []
          }
          orgs={
            guestTaskPayload.orgId
              ? [{ id: guestTaskPayload.orgId, name: guestTaskPayload.orgName }]
              : []
          }
          lockedTask={guestTaskPayload}
          onCreated={() => {
            setGuestModalOpen(false);
            addMessage({
              text: "Guest invite created",
              type: "success",
              duration: 2500,
            });
          }}
        />
      )}

      {/* Post Link Modal */}
      {showPostLinkModal &&
        postLinkData &&
        ReactDOM.createPortal(
          <div
            className="post-link-modal-overlay"
            onClick={() => setShowPostLinkModal(false)}
          >
            <div
              className="post-link-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="post-link-header">
                <h3>{postLinkData.viewMode ? 'Published Links' : 'Post Published Successfully!'}</h3>
                <button
                  className="close-btn"
                  onClick={() => setShowPostLinkModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="post-link-body">
                {postLinkData.viewMode ? (
                  // View mode: Show all published links
                  <>
                    <div className="platform-icons-header">
                      {postLinkData.links?.map((link, idx) => {
                        const platformName = link.platform?.toLowerCase();
                        return (
                          <button
                            key={idx}
                            className={`platform-icon-btn ${
                              selectedPlatformIndex === idx ? "active" : ""
                            }`}
                            onClick={() => setSelectedPlatformIndex(idx)}
                            title={`View ${link.platform} post`}
                          >
                            {platformName === "facebook" && (
                              <FaFacebook size={24} color="#4267B2" />
                            )}
                            {platformName === "instagram" && (
                              <FaInstagram size={24} color="#E1306C" />
                            )}
                            {platformName === "youtube" && (
                              <FaYoutube size={24} color="#FF0000" />
                            )}
                            {platformName === "mail" && (
                              <FaEnvelope size={24} color="#0072C6" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {postLinkData.links?.[selectedPlatformIndex] && (
                      <div className="post-link-info">
                        <div className="platform-badge">
                          {postLinkData.links[
                            selectedPlatformIndex
                          ].platform?.toLowerCase() === "facebook" && (
                            <FaFacebook size={20} color="#4267B2" />
                          )}
                          {postLinkData.links[
                            selectedPlatformIndex
                          ].platform?.toLowerCase() === "instagram" && (
                            <FaInstagram size={20} color="#E1306C" />
                          )}
                          {postLinkData.links[
                            selectedPlatformIndex
                          ].platform?.toLowerCase() === "youtube" && (
                            <FaYoutube size={20} color="#FF0000" />
                          )}
                          {postLinkData.links[
                            selectedPlatformIndex
                          ].platform?.toLowerCase() === "mail" && (
                            <FaEnvelope size={20} color="#0072C6" />
                          )}
                          <span>
                            {postLinkData.links[selectedPlatformIndex].platform}
                          </span>
                        </div>
                        <div className="post-link-details">
                          <label>Post URL:</label>
                          <div className="link-container">
                            <input
                              type="text"
                              value={postLinkData.links[selectedPlatformIndex].url}
                              readOnly
                              className="link-input"
                            />
                            <button
                              className="copy-btn"
                              onClick={() => {
                                navigator.clipboard
                                  .writeText(
                                    postLinkData.links[selectedPlatformIndex].url
                                  )
                                  .then(() => {
                                    addMessage({
                                      text: "Link copied to clipboard!",
                                      type: "success",
                                      duration: 2000,
                                    });
                                  })
                                  .catch(() => {
                                    addMessage({
                                      text: "Failed to copy link",
                                      type: "error",
                                      duration: 2000,
                                    });
                                  });
                              }}
                              title="Copy link"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <rect
                                  x="9"
                                  y="9"
                                  width="13"
                                  height="13"
                                  rx="2"
                                  ry="2"
                                ></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                              </svg>
                              Copy
                            </button>
                          </div>
                        </div>
                        <div className="post-link-actions">
                          <a
                            href={postLinkData.links[selectedPlatformIndex].url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="view-post-btn"
                          >
                            View Post
                          </a>
                          <button
                            className="done-btn"
                            onClick={() => setShowPostLinkModal(false)}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // Single publish mode
                  <>
                    <div className="post-link-info">
                      <div className="platform-badge">
                        {postLinkData.platform === 'Facebook' && <FaFacebook size={20} color="#4267B2" />}
                        {postLinkData.platform === 'Instagram' && <FaInstagram size={20} color="#E1306C" />}
                        {postLinkData.platform === 'Youtube' && <FaYoutube size={20} color="#FF0000" />}
                        <span>{postLinkData.platform}</span>
                      </div>
                      <div className="post-link-details">
                        <label>Post URL:</label>
                        <div className="link-container">
                          <input 
                            type="text" 
                            value={postLinkData.postUrl} 
                            readOnly 
                            className="link-input"
                          />
                          <button className="copy-btn" onClick={() => {
                            navigator.clipboard.writeText(postLinkData.postUrl)
                              .then(() => {
                                addMessage({
                                  text: "Link copied to clipboard!",
                                  type: "success",
                                  duration: 2000,
                                });
                              })
                              .catch(() => {
                                addMessage({
                                  text: "Failed to copy link",
                                  type: "error",
                                  duration: 2000,
                                });
                              });
                          }} title="Copy link">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="post-link-actions">
                      <a 
                        href={postLinkData.postUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="view-post-btn"
                      >
                        View Post
                      </a>
                      <button className="done-btn" onClick={() => setShowPostLinkModal(false)}>
                        Done
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* FileShareModel for Publishing */}
      {showShareModal && (
        <FileShareModel
          onClose={() => setShowShareModal(false)}
          fileDetail={fileDetail}
          documentId={documentId}
          description={description}
          taskId={taskId}
          onPlatformPublish={handlePlatformPublish}
          documents={fileDetail ? [fileDetail] : []}
        />
      )}
    </div>
  );
};

export default TaskDetailPage;
