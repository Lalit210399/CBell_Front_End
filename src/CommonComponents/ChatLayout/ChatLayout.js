//chatLayout
import React, { useState, useCallback, useMemo, useEffect } from "react";
import ConversationModule from "../ConversationModule/ConversationModule";
import TaskFilesPanel from "./TaskFilesPanel";
import { useUser } from "../../Context/UserContext";
import { Calendar, CalendarCheck, ListChecks, Users, Search, FolderOpen } from 'lucide-react';
import { fetchWithRefresh } from "../../Context/RefereshToken";
import "./ChatLayout.css";

const ChatLayout = ({ events, organizationId }) => {
  const { user } = useUser();
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [eventsWithTasks, setEventsWithTasks] = useState({});
  const [loadingTasks, setLoadingTasks] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilePanelOpen, setIsFilePanelOpen] = useState(false);
  const [taskFiles, setTaskFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // --- Debounce search query ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // --- Fetch tasks for a specific event ---
  const fetchEventTasks = async (eventId, eventOrgId) => {
    if (eventsWithTasks[eventId]) {
      return;
    }

    setLoadingTasks(prev => ({ ...prev, [eventId]: true }));

    // Use event's organization ID if available, otherwise fall back to the global organizationId
    const orgIdToUse = eventOrgId || organizationId;

    try {
      const response = await fetch(
        `/apis/task/by-event/${eventId}?organizationId=${orgIdToUse}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': '1',
          },
        }
      );

      if (response.ok) {
        const tasks = await response.json();
        setEventsWithTasks(prev => ({
          ...prev,
          [eventId]: tasks || []
        }));
      } else {
        console.error('Failed to fetch tasks for event:', eventId);
        setEventsWithTasks(prev => ({
          ...prev,
          [eventId]: []
        }));
      }
    } catch (error) {
      console.error('Error fetching tasks for event:', eventId, error);
      setEventsWithTasks(prev => ({
        ...prev,
        [eventId]: []
      }));
    } finally {
      setLoadingTasks(prev => ({ ...prev, [eventId]: false }));
    }
  };

  // --- Toggle event expand ---
  const handleEventClick = async (eventId, event) => {
    if (expandedEventId === eventId) {
      setExpandedEventId(null);
    } else {
      if (!eventsWithTasks[eventId]) {
        // Pass the event's organization ID to the fetch function
        const eventOrgId = event.organizationId || event.orgId;
        await fetchEventTasks(eventId, eventOrgId);
      }
      setExpandedEventId(eventId);
    }
  };

  // --- Fetch task files ---
  const fetchTaskFiles = useCallback(async (taskId, eventId) => {
    setLoadingFiles(true);
    try {
      const response = await fetchWithRefresh(
        `/apis/document-details/task/${taskId}`,
        {
          headers: { 'ngrok-skip-browser-warning': '1' },
        }
      );

      if (response.ok) {
        const allTaskFiles = await response.json();
        
        // Filter to show only work submission files (uploaded by designers/creatives)
        const workSubmissionFiles = allTaskFiles.filter(doc => {
          if (doc.userInfo && doc.userInfo.roles) {
            return doc.userInfo.roles.some(role => 
              role.name?.toLowerCase().includes('designer') || 
              role.displayName?.toLowerCase().includes('designer') ||
              role.name?.toLowerCase().includes('creative') ||
              role.displayName?.toLowerCase().includes('creative')
            );
          }
          return false;
        });

        const getFileTypeFromMime = (mime, filename = '') => {
          if (mime && mime !== 'application/octet-stream') {
            if (mime.startsWith('image')) return 'image';
            if (mime.startsWith('video')) return 'video';
            if (mime.startsWith('audio')) return 'audio';
            if (mime === 'application/pdf') return 'pdf';
          }
          const extension = filename.toLowerCase().split('.').pop();
          const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
          const videoExtensions = ['mp4', 'avi', 'mov', 'wmv'];
          const audioExtensions = ['mp3', 'wav', 'ogg'];
          if (imageExtensions.includes(extension)) return 'image';
          if (videoExtensions.includes(extension)) return 'video';
          if (audioExtensions.includes(extension)) return 'audio';
          if (extension === 'pdf') return 'pdf';
          return 'file';
        };

        const processedFiles = workSubmissionFiles.map((doc) => {
          const type = getFileTypeFromMime(doc.contentType, doc.filename);
          const src = `/apis/document/view/${doc.documentId}`;

          return {
            name: doc.filename,
            type,
            documentId: doc.documentId,
            description: doc.description,
            src,
            status: doc.status || 'Pending',
            uploadDate: doc.uploadDate,
            size: doc.fileSize || doc.size,
            userInfo: doc.userInfo,
            contentType: doc.contentType,
          };
        });

        setTaskFiles(processedFiles);
      } else {
        console.error('Failed to fetch task files');
        setTaskFiles([]);
      }
    } catch (error) {
      console.error('Error fetching task files:', error);
      setTaskFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  // --- Fetch files when task is selected ---
  useEffect(() => {
    if (selectedTask?.id && selectedTask?.eventId) {
      fetchTaskFiles(selectedTask.id, selectedTask.eventId);
    }
  }, [selectedTask?.id, selectedTask?.eventId, fetchTaskFiles]);

  // --- Toggle file panel ---
  const toggleFilePanel = () => {
    setIsFilePanelOpen(!isFilePanelOpen);
  };

  // --- Current user helper ---
  const getCurrentUser = useCallback(() => {
    const first = user?.firstName?.[0] || "";
    const last = user?.lastName?.[0] || "";
    return {
      id: user?.userId,
      firstName: user?.firstName,
      lastName: user?.lastName,
      avatar: (first + last).toUpperCase(),
      organizationId: user?.organizationId,
    };
  }, [user]);

  // --- Filter events based on search query (events only, not tasks) ---
  const filteredEvents = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return events;
    }

    const query = debouncedSearchQuery.toLowerCase();
    return events.filter(event => {
      // Only check if event name matches
      return event.eventName.toLowerCase().includes(query);
    });
  }, [events, debouncedSearchQuery]);

  // --- Show all tasks within an event (no filtering by search) ---
  const filterTasksForEvent = useCallback((eventId) => {
    return eventsWithTasks[eventId] || [];
  }, [eventsWithTasks]);

  // --- Format task data for ConversationModule ---
  const formatTaskForConversation = (task, event) => {
    return {
      ...task,
      id: task.id,
      eventId: task.eventId || event.id,
      taskTitle: task.taskTitle,
      taskStatusName: task.taskStatusName,
      assignedToNames: task.assignedTo?.map(user => user.name) || [],
      eventName: event.eventName || ''
    };
  };

  return (
    <div className="whatsapp-layout-container">
      {/* ---------- LEFT SIDEBAR ---------- */}
      <div className="whatsapp-sidebar">
        <div className="sidebar-header">
          <div className="header-top-row">
            <div className="header-text">
              <h3>Event & Task Conversations</h3>
              <p className="sidebar-subtitle">
                {events.length} event{events.length === 1 ? "" : "s"}
              </p>
            </div>
            <button 
              className={`search-toggle-btn ${isSearchOpen ? 'active' : ''}`}
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Toggle search"
            >
              <Search size={18} />
            </button>
          </div>
          {isSearchOpen && (
            <div className="search-bar-container">
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                  autoFocus
                />
                {searchQuery && (
                  <button 
                    className="search-clear-btn"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="tasks-list">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => {
              const filteredTasksInEvent = filterTasksForEvent(event.id);
              return (
              <div key={event.id} className="event-section">
                {/* --- Event Header --- */}
                <div
                  className={`event-header ${
                    expandedEventId === event.id ? "expanded" : ""
                  }`}
                  onClick={() => handleEventClick(event.id, event)}
                >
                  <div className="event-header-title">
                    <span className="event-icon">
                      {expandedEventId === event.id ? <CalendarCheck /> : <Calendar />}
                    </span>
                    <span className="event-name-text">{event.eventName}</span>
                  </div>
                  {/* Task count badge - commented out for now */}
                  {/* <span className="task-count-badge">
                    {event.tasks?.length || 0} Tasks
                  </span> */}
                </div>

                {/* --- Task List under Event --- */}
                {expandedEventId === event.id && (
                  <div className="event-task-list">
                    {loadingTasks[event.id] ? (
                      <div className="tasks-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading tasks...</p>
                      </div>
                    ) : filteredTasksInEvent.length > 0 ? (
                      filteredTasksInEvent.map((task) => (
                        <div
                          key={task.id}
                          className={`task-item ${
                            selectedTask?.id === task.id ? "active" : ""
                          }`}
                          onClick={() => setSelectedTask(formatTaskForConversation(task, event))}
                        >
                          <div className="task-info">
                            <div className="task-title-row">
                              <div className="task-title-status">
                                <div className="task-title">
                                  <ListChecks size={16} className="task-icon" />
                                  {task.taskTitle}
                                </div>
                                <span
                                  className={`status-tag status_${task.taskStatusName.toLowerCase()}`}
                                >
                                  {task.taskStatusName}
                                </span>
                              </div>
                              {/* Unread count badge - commented out for now */}
                              {/* {getUnreadCount(task.id) > 0 && (
                                <div className="task-badge">{getUnreadCount(task.id)}</div>
                              )} */}
                            </div>

                            {task.assignedTo?.length > 0 && (
                              <div className="assigned-users-row">
                                <span className="assigned-users">
                                  <Users size={12}/> 
                                  {task.assignedTo.map(user => user.name).join(" | ")}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : debouncedSearchQuery ? (
                      <div className="empty-tasks-in-event">
                        <p>No tasks available for this event</p>
                      </div>
                    ) : (
                      <div className="empty-tasks-in-event">
                        <p>No tasks available for this event</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              );
            })
          ) : debouncedSearchQuery ? (
            <div className="empty-tasks">
              <p>No events match your search</p>
            </div>
          ) : (
            <div className="empty-tasks">
              <p>No events available</p>
            </div>
          )}
        </div>
      </div>

      {/* ---------- RIGHT CHAT AREA ---------- */}
      <div className="whatsapp-chat-area">
        {selectedTask ? (
          <div className="chat-container">
            <div className="chat-header">
              <div className="chat-header-content">
                <div className="chat-header-left">
                  <div className="chat-header-info">
                    <div className="chat-header-row-1">
                      <h3 className="chat-header-title">{selectedTask.taskTitle}</h3>
                      <span
                        className={`chat-header-status status-${selectedTask.taskStatusName.toLowerCase()}`}
                      >
                        {selectedTask.taskStatusName}
                      </span>
                    </div>
                    <div className="chat-header-row-2">
                      <div className="chat-header-row-2-left">
                        {selectedTask.assignedToNames?.length > 0 && (
                          <span className="chat-header-assigned">
                            <span className="assigned-label"><Users size={14}/></span>
                            <span className="assigned-names">
                              {selectedTask.assignedToNames.join(" | ")}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="chat-header-actions">
                  <button 
                    className={`files-toggle-btn ${isFilePanelOpen ? 'active' : ''}`}
                    onClick={toggleFilePanel}
                    title="Toggle work files"
                  >
                    <FolderOpen size={20} />
                    {taskFiles.length > 0 && (
                      <span className="files-count-badge">{taskFiles.length}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="chat-content">
              <div className="chat-content-main">
                <ConversationModule
                  currentUser={getCurrentUser()}
                  taskId={selectedTask.id}
                  eventId={selectedTask.eventId}
                  isActive={true}
                  users={selectedTask.assignedToNames || []}
                />
              </div>
              {isFilePanelOpen && (
                <TaskFilesPanel 
                  files={taskFiles}
                  loading={loadingFiles}
                  onClose={() => setIsFilePanelOpen(false)}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="empty-chat-state">
            <div className="empty-chat-icon">💬</div>
            <h3>Select a Task to Chat</h3>
            <p>Choose a task from the list to start a conversation with your team</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatLayout;
