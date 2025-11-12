//chatLayout
import React, { useState, useCallback } from "react";
import ConversationModule from "../ConversationModule/ConversationModule";
import { useUser } from "../../Context/UserContext";
import { Calendar, CalendarCheck, ListChecks, Users, Loader2 } from 'lucide-react';
import "./ChatLayout.css";

const ChatLayout = ({ events, organizationId }) => {
  const { user } = useUser();
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [eventsWithTasks, setEventsWithTasks] = useState({});
  const [loadingTasks, setLoadingTasks] = useState({});

  // --- Fetch tasks for a specific event ---
  const fetchEventTasks = async (eventId) => {
    if (eventsWithTasks[eventId]) {
      return;
    }

    setLoadingTasks(prev => ({ ...prev, [eventId]: true }));

    try {
      const response = await fetch(
        `apis/task/by-event/${eventId}?organizationId=${organizationId}`,
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
          [eventId]: {
            ...events.find(event => event.id === eventId),
            tasks: tasks || []
          }
        }));
      } else {
        console.error('Failed to fetch tasks for event:', eventId);
        setEventsWithTasks(prev => ({
          ...prev,
          [eventId]: {
            ...events.find(event => event.id === eventId),
            tasks: []
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching tasks for event:', eventId, error);
      setEventsWithTasks(prev => ({
        ...prev,
        [eventId]: {
          ...events.find(event => event.id === eventId),
          tasks: []
        }
      }));
    } finally {
      setLoadingTasks(prev => ({ ...prev, [eventId]: false }));
    }
  };

  // --- Toggle event expand and fetch tasks if needed ---
  const handleEventClick = async (eventId) => {
    if (expandedEventId === eventId) {
      setExpandedEventId(null);
    } else {
      if (!eventsWithTasks[eventId]) {
        await fetchEventTasks(eventId);
      }
      setExpandedEventId(eventId);
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

  const getUnreadCount = useCallback(() => 0, []);

  // --- Format task data for ConversationModule ---
  const formatTaskForConversation = (task) => {
    return {
      ...task,
      taskTitle: task.taskTitle,
      taskStatusName: task.taskStatusName,
      assignedToNames: task.assignedTo?.map(user => user.name) || [],
      eventName: eventsWithTasks[task.eventId]?.eventName || ''
    };
  };

  return (
    <div className="whatsapp-layout-container">
      {/* ---------- LEFT SIDEBAR ---------- */}
      <div className="whatsapp-sidebar">
        <div className="sidebar-header">
          <h3>Event & Task Conversations</h3>
          <p className="sidebar-subtitle">
            {events.length} event{events.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="tasks-list">
          {events.length > 0 ? (
            events.map((event) => (
              <div key={event.id} className="event-section">
                {/* --- Event Header --- */}
                <div
                  className={`event-header ${
                    expandedEventId === event.id ? "expanded" : ""
                  }`}
                  onClick={() => handleEventClick(event.id)}
                >
                  <div className="event-header-title">
                    <span className="event-icon">
                      {expandedEventId === event.id ? <CalendarCheck /> : <Calendar />}
                    </span>
                    <span className="event-name-text">{event.eventName}</span>
                  </div>
                  {/* Task count badge - commented out for now */}
                  {/* <span className="task-count-badge">
                    {loadingTasks[event.id] ? (
                      <Loader2 size={14} className="spinner-icon" />
                    ) : (
                      `${eventsWithTasks[event.id]?.tasks?.length || 0} Tasks`
                    )}
                  </span> */}
                </div>

                {/* --- Task List under Event --- */}
                {expandedEventId === event.id && (
                  <div className="event-task-list">
                    {loadingTasks[event.id] ? (
                      <div className="tasks-loading">
                        <Loader2 size={20} className="spinner-icon" />
                        <p>Loading tasks...</p>
                      </div>
                    ) : eventsWithTasks[event.id]?.tasks?.length > 0 ? (
                      eventsWithTasks[event.id].tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`task-item ${
                            selectedTask?.id === task.id ? "active" : ""
                          }`}
                          onClick={() => setSelectedTask(formatTaskForConversation(task))}
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
                    ) : (
                      <div className="empty-tasks-in-event">
                        <p>No tasks available for this event</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
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
              </div>
            </div>

            <div className="chat-content">
              <ConversationModule
                currentUser={getCurrentUser()}
                taskId={selectedTask.id}
                eventId={selectedTask.eventId}
                isActive={true}
                users={selectedTask.assignedToNames || []}
              />
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
