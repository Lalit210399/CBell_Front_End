//ChatLayout.js
import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import ConversationModule from "../ConversationModule/ConversationModule";
import TaskFilesPanel from "./TaskFilesPanel";
import { useUser } from "../../Context/UserContext";
import { Calendar, CalendarCheck, ListChecks, Users, Search, FolderOpen, MessageCircle } from 'lucide-react';
import { fetchWithRefresh } from "../../Context/RefereshToken";
import "./ChatLayout.css";

const ChatLayout = ({ events, organizationId }) => {
  const { user } = useUser();
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null); // Add selected event for event chat
  const [eventsWithTasks, setEventsWithTasks] = useState({});
  const [loadingTasks, setLoadingTasks] = useState({});
  const [failedTasks, setFailedTasks] = useState({}); // Track failed task fetches
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilePanelOpen, setIsFilePanelOpen] = useState(false);
  const [taskFiles, setTaskFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const latestFilesRequestIdRef = useRef(0);

  // --- Debounce search query ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // --- Fetch tasks for a specific event ---
  const fetchEventTasks = async (eventId, eventOrgId) => {
    // Don't fetch if already loaded or currently loading
    if (eventsWithTasks[eventId] !== undefined || loadingTasks[eventId]) {
      return;
    }

    setLoadingTasks(prev => ({ ...prev, [eventId]: true }));
    setFailedTasks(prev => ({ ...prev, [eventId]: false })); // Reset failed state

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
        setFailedTasks(prev => ({ ...prev, [eventId]: false }));
      } else {
        console.error('Failed to fetch tasks for event:', eventId);
        setEventsWithTasks(prev => ({
          ...prev,
          [eventId]: []
        }));
        setFailedTasks(prev => ({ ...prev, [eventId]: true }));
      }
    } catch (error) {
      console.error('Error fetching tasks for event:', eventId, error);
      setEventsWithTasks(prev => ({
        ...prev,
        [eventId]: []
      }));
      setFailedTasks(prev => ({ ...prev, [eventId]: true }));
    } finally {
      setLoadingTasks(prev => ({ ...prev, [eventId]: false }));
    }
  };

  // --- Retry failed task fetch ---
  const retryFetchTasks = async (eventId, event) => {
    const eventOrgId = event.organizationId || event.orgId;
    await fetchEventTasks(eventId, eventOrgId);
  };

  // --- Handle event expansion (show/hide tasks) ---
  const handleEventClick = async (eventId, event) => {
    if (expandedEventId === eventId) {
      setExpandedEventId(null);
    } else {
      // Fetch if not loaded yet (undefined) or if previously failed
      if (eventsWithTasks[eventId] === undefined || failedTasks[eventId]) {
        // Pass the event's organization ID to the fetch function
        const eventOrgId = event.organizationId || event.orgId;
        await fetchEventTasks(eventId, eventOrgId);
      }
      setExpandedEventId(eventId);
    }
  };

  // --- Handle event chat selection ---
  const handleEventChatClick = (event) => {
    setSelectedEvent(event);
    setSelectedTask(null); // Clear task selection when selecting event chat
  };

  // --- Handle task selection ---
  const handleTaskClick = (task, event) => {
    setSelectedTask(formatTaskForConversation(task, event));
    setSelectedEvent(null); // Clear event selection when selecting task
    setIsFilePanelOpen(false);
  };

  // --- Fetch task files ---
  const fetchTaskFiles = useCallback(async (taskId) => {
    if (!taskId) return;

    const requestId = ++latestFilesRequestIdRef.current;
    setLoadingFiles(true);
    setTaskFiles([]);

    try {
      const response = await fetchWithRefresh(
        `/apis/document-details/task/${taskId}`,
        {
          headers: { 'ngrok-skip-browser-warning': '1' },
        }
      );

      if (response.ok) {
        const allTaskFiles = await response.json();

        // Normalize backend response like [{ message: 'No documents found for the given TaskId.' }]
        const normalizedTaskFiles = (Array.isArray(allTaskFiles) && allTaskFiles.length === 1 && allTaskFiles[0] && typeof allTaskFiles[0].message === 'string')
          ? []
          : allTaskFiles;

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

        const isDesignerOrCreative = (userInfo) => {
          if (userInfo && userInfo.roles) {
            return userInfo.roles.some(role => 
              role.name?.toLowerCase().includes('designer') || 
              role.displayName?.toLowerCase().includes('designer') ||
              role.name?.toLowerCase().includes('creative') ||
              role.displayName?.toLowerCase().includes('creative')
            );
          }
          return false;
        };

        const processedFiles = (normalizedTaskFiles || []).map((doc) => {
          const type = getFileTypeFromMime(doc.contentType, doc.filename);
          const src = `/apis/document/view/${doc.documentId}`;
          const category = isDesignerOrCreative(doc.userInfo) ? 'Work Submission' : 'Reference';

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
            category,
          };
        });

        if (latestFilesRequestIdRef.current === requestId) {
          setTaskFiles(processedFiles);
        }
      } else {
        console.error('Failed to fetch task files');
        if (latestFilesRequestIdRef.current === requestId) {
          setTaskFiles([]);
        }
      }
    } catch (error) {
      console.error('Error fetching task files:', error);
      if (latestFilesRequestIdRef.current === requestId) {
        setTaskFiles([]);
      }
    } finally {
      if (latestFilesRequestIdRef.current === requestId) {
        setLoadingFiles(false);
      }
    }
  }, []);

  // Clear files when changing tasks / deselecting task
  useEffect(() => {
    setTaskFiles([]);
  }, [selectedTask?.id]);

  // --- Toggle file panel ---
  const toggleFilePanel = () => {
    const willOpen = !isFilePanelOpen;
    setIsFilePanelOpen(willOpen);
    if (willOpen && selectedTask?.id) {
      fetchTaskFiles(selectedTask.id);
    }
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
                    <span className="event-name">{event.eventName}</span>
                  </div>
                  <div className="event-actions">
                    <button
                      className={`event-chat-btn ${selectedEvent?.id === event.id ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent event expansion
                        handleEventChatClick(event);
                      }}
                      title="Chat about this event"
                    >
                      <MessageCircle />
                    </button>
                  </div>
                </div>

                {/* --- Task List under Event --- */}
                {expandedEventId === event.id && (
                  <div className="event-task-list">
                    {loadingTasks[event.id] ? (
                      <div className="page-loading">
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
                          onClick={() => handleTaskClick(task, event)}
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
                    ) : failedTasks[event.id] ? (
                      <div className="empty-tasks-in-event error-state">
                        <p>Failed to load tasks</p>
                        <button 
                          className="retry-button"
                          onClick={() => retryFetchTasks(event.id, event)}
                          disabled={loadingTasks[event.id]}
                        >
                          {loadingTasks[event.id] ? 'Loading...' : 'Retry'}
                        </button>
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
        {selectedTask || selectedEvent ? (
          <div className="chat-container">
            <div className="chat-header">
              <div className="chat-header-content">
                <div className="chat-header-left">
                  <div className="chat-header-info">
                    <div className="chat-header-row-1">
                      <h3 className="chat-header-title">
                        {selectedTask ? selectedTask.taskTitle : `Event: ${selectedEvent.eventName}`}
                      </h3>
                      <span className="chat-type-badge">
                        {selectedTask ? 'Task Chat' : 'Event Chat'}
                      </span>
                    </div>
                    <div className="chat-header-row-2">
                      <div className="chat-header-row-2-left">
                        {selectedTask && selectedTask.assignedToNames?.length > 0 && (
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
                  {selectedTask && (
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
                  )}
                </div>
              </div>
            </div>

            <div className="chat-content">
              <div className="chat-content-main">
                <ConversationModule
                  currentUser={getCurrentUser()}
                  taskId={selectedTask?.id}
                  eventId={selectedTask?.eventId || selectedEvent?.id}
                  isActive={true}
                  users={selectedTask?.assignedToNames || []}
                />
              </div>
              {selectedTask && isFilePanelOpen && (
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
            <h3>Select a Task or Event to Chat</h3>
            <p>Choose a task to chat with your team, or click the chat icon 💬 next to an event to discuss the event</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatLayout;
