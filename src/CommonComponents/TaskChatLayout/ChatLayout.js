import React, { useState, useCallback } from "react";
import ConversationModule from "../ConversationModule/ConversationModule";
import { useUser } from "../../Context/UserContext";
import "./ChatLayout.css";

const WhatsAppLayout = ({ tasks, eventId }) => {
  const { user } = useUser();
  const [selectedTask, setSelectedTask] = useState(null);

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

  // Improved formatting function for due dates
  const formatDueDate = useCallback((timestamp) => {
    if (!timestamp) return "No due date";
    
    const dueDate = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    
    const diffTime = dueDay - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let dateString = "";
    
    if (diffDays === 0) {
      dateString = "Today";
    } else if (diffDays === 1) {
      dateString = "Tomorrow";
    } else if (diffDays === -1) {
      dateString = "Yesterday";
    } else if (diffDays > 1 && diffDays < 7) {
      dateString = dueDate.toLocaleDateString([], { weekday: 'long' });
    } else if (diffDays >= -7 && diffDays <= 7) {
      dateString = `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} ${diffDays < 0 ? 'ago' : 'left'}`;
    } else {
      dateString = dueDate.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        year: dueDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
    
    const timeString = dueDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
    
    return `${dateString} at ${timeString}`;
  }, []);

  return (
    <div className="whatsapp-layout-container">
      <div className="whatsapp-sidebar">
        <div className="sidebar-header">
          <h3>Task Conversations</h3>
          <p className="sidebar-subtitle">{tasks?.length || 0} {tasks?.length === 1 ? 'task' : 'tasks'}</p>
        </div>
        <div className="tasks-list">
          {tasks && tasks.length > 0 ? (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`task-item ${
                  selectedTask?.id === task.id ? "active" : ""
                }`}
                onClick={() => setSelectedTask(task)}
              >
                <div className="task-info">
                  <div className="task-title-row">
                    <div className="task-title">{task.taskTitle}</div>
                    {getUnreadCount(task.id) > 0 && (
                      <div className="task-badge">{getUnreadCount(task.id)}</div>
                    )}
                  </div>
                  <div className="task-event-row">
                    <span className="event-name">{task.eventName}</span>
                  </div>
                  <div className="task-details">
                    <span
                      className={`status-tag status_${task.taskStatusName.toLowerCase()}`}
                    >
                      {task.taskStatusName}
                    </span>
                    {/* <span className="task-time">
                      {formatDueDate(task.dueDate)}
                    </span> */}
                  </div>
                  {task.assignedToNames && task.assignedToNames.length > 0 && (
                    <div className="assigned-users-row">
                      <span className="assigned-users">
                        👥 {task.assignedToNames.join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-tasks">
              <p>No tasks available</p>
            </div>
          )}
        </div>
      </div>
      <div className="whatsapp-chat-area">
        {selectedTask ? (
          <div className="chat-container">
            <div className="chat-header">
              <div className="chat-header-content">
                <div className="chat-header-left">
                  <div className="chat-header-info">
                    <div className="chat-header-row-1">
                      <h3 className="chat-header-title">{selectedTask.taskTitle}</h3>
                      <span className="chat-header-event">{selectedTask.eventName}</span>
                    </div>
                    <div className="chat-header-row-2">
                      <div className="chat-header-row-2-left">
                        <span
                          className={`chat-header-status status-${selectedTask.taskStatusName.toLowerCase()}`}
                        >
                          {selectedTask.taskStatusName}
                        </span>
                        {selectedTask.assignedToNames && selectedTask.assignedToNames.length > 0 && (
                          <>
                            <span className="chat-header-divider">•</span>
                            <span className="chat-header-assigned">
                              <span className="assigned-label">Assigned to:</span>
                              <span className="assigned-names">
                                {selectedTask.assignedToNames.join(", ")}
                              </span>
                            </span>
                          </>
                        )}
                      </div>
                      {/* {selectedTask.dueDate && (
                        <span className="chat-header-due">
                          {formatDueDate(selectedTask.dueDate)}
                        </span>
                      )} */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="chat-content">
              <ConversationModule
                currentUser={getCurrentUser()}
                taskId={selectedTask.id}
                eventId={eventId}
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

export default WhatsAppLayout;