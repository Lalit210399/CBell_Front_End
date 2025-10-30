import React, { useState, useEffect, useCallback } from "react";
import ConversationModule from "../ConversationModule/ConversationModule";
import { useUser } from "../../Context/UserContext";
import "./ChatLayout.css";

const WhatsAppLayout = ({ tasks, eventId }) => {
  const { user } = useUser();
  const [selectedTask, setSelectedTask] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const getInitials = useCallback((title) => {
    if (!title) return "??";
    const nameParts = title.trim().split(/\s+/);
    if (nameParts.length >= 2) {
      return (
        nameParts[0][0] + nameParts[nameParts.length - 1][0]
      ).toUpperCase();
    } else if (nameParts.length === 1) {
      const name = nameParts[0];
      return (name[0] + (name[1] || name[0])).toUpperCase();
    }
    return "??";
  }, []);

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

  const getLastMessagePreview = useCallback(() => "No messages yet", []);
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
        </div>
        <div className="tasks-list">
          {loadingTasks ? (
            <div className="loading-tasks">Loading tasks...</div>
          ) : tasks && tasks.length > 0 ? (
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
                    <div className="task-time">
                      {formatDueDate(task.dueDate)}
                    </div>
                  </div>
                  <div className="task-event-row">
                    <span className="event-name">{task.eventName}</span>
                  </div>
                  <div className="task-details">
                    <span
                      className={`status-tag status-${task.taskStatusName.toLowerCase()}`}
                    >
                      {task.taskStatusName}
                    </span>
                    <span className="assigned-users">
                      {task.assignedToNames?.join(", ")}
                    </span>
                  </div>
                </div>
                {getUnreadCount(task.id) > 0 && (
                  <div className="task-badge">{getUnreadCount(task.id)}</div>
                )}
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
            <ConversationModule
              currentUser={getCurrentUser()}
              taskId={selectedTask.id}
              eventId={eventId}
              isActive={true}
              users={selectedTask.assignedToNames || []}
            />
          </div>
        ) : (
          <div className="empty-chat-state">
            <div className="empty-chat-icon">💬</div>
            <h3>WhatsApp-style Chat</h3>
            <p>Select a task from the list to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppLayout;