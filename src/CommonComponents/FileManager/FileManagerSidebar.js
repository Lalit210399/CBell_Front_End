import React, { useState } from 'react';
import { useFileManager } from '../../Context/FileManagerContext';
import { ChevronRight, ChevronDown, Folder, FileText } from 'lucide-react';
import './FileManagerSidebar.css';

const FileManagerSidebar = () => {
  const {
    currentUser,
    events,
    tasks,
    selectedEvent,
    selectedTask,
    handleEventClick,
    handleTaskClick
  } = useFileManager();

  const [expandedEvents, setExpandedEvents] = useState({});

  const toggleEventExpand = (eventId) => {
    setExpandedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  const getTasksForEvent = (eventId) => {
    return tasks.filter(task => task.eventId === eventId);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed': return 'fm-status-completed';
      case 'in-progress': return 'fm-status-progress';
      case 'pending': return 'fm-status-pending';
      default: return '';
    }
  };

  return (
    <div className="fm-sidebar">
      <div className="fm-sidebar-header">
        <h3 className="fm-sidebar-title">
          {currentUser.role === 'designer' ? 'My Tasks' : 'Events & Tasks'}
        </h3>
        <span className={`fm-role-badge fm-role-${currentUser.role}`}>
          {currentUser.role}
        </span>
      </div>

      <div className="fm-sidebar-content">
        {currentUser.role === 'designer' ? (
          <div className="fm-tasks-list">
            {tasks.length === 0 ? (
              <div className="fm-empty-state">No tasks assigned</div>
            ) : (
              tasks.map(task => (
                <div
                  key={task.id}
                  className={`fm-task-item ${selectedTask?.id === task.id ? 'fm-active' : ''}`}
                  onClick={() => handleTaskClick(task)}
                >
                  <FileText size={16} className="fm-task-icon" />
                  <div className="fm-task-info">
                    <div className="fm-task-name">{task.name}</div>
                    <div className="fm-task-meta">
                      <span className={`fm-task-status ${getStatusClass(task.status)}`}>
                        {task.status.replace('-', ' ')}
                      </span>
                      <span className="fm-file-count">{task.files.length} files</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="fm-events-list">
            {events.length === 0 ? (
              <div className="fm-empty-state">No events available</div>
            ) : (
              events.map(event => {
                const eventTasks = getTasksForEvent(event.id);
                const isExpanded = expandedEvents[event.id];

                return (
                  <div key={event.id} className="fm-event-group">
                    <div
                      className={`fm-event-item ${selectedEvent?.id === event.id && !selectedTask ? 'fm-active' : ''}`}
                      onClick={() => {
                        handleEventClick(event);
                        toggleEventExpand(event.id);
                      }}
                    >
                      <Folder size={18} className="fm-event-icon" />
                      <div className="fm-event-info">
                        <div className="fm-event-name">{event.name}</div>
                        <div className="fm-event-meta">{eventTasks.length} tasks</div>
                      </div>
                      {isExpanded ? 
                        <ChevronDown size={16} className="fm-expand-icon" /> : 
                        <ChevronRight size={16} className="fm-expand-icon" />
                      }
                    </div>

                    {isExpanded && eventTasks.length > 0 && (
                      <div className="fm-tasks-list fm-nested">
                        {eventTasks.map(task => (
                          <div
                            key={task.id}
                            className={`fm-task-item ${selectedTask?.id === task.id ? 'fm-active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskClick(task);
                            }}
                          >
                            <FileText size={14} className="fm-task-icon" />
                            <div className="fm-task-info">
                              <div className="fm-task-name">{task.name}</div>
                              <div className="fm-task-meta">
                                <span className={`fm-task-status ${getStatusClass(task.status)}`}>
                                  {task.status.replace('-', ' ')}
                                </span>
                                <span className="fm-file-count">{task.files.length} files</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileManagerSidebar;
