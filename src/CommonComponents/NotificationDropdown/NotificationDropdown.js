import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing, X, Check, Trash2, ExternalLink, AlertCircle, Settings } from 'lucide-react';
import { useNotification } from '../../Context/NotificationContext';
import './NotificationDropdown.css';

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    isFCMInitialized,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  } = useNotification();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      refreshNotifications();
    }
  };

  // Helper function to handle notification navigation
  const handleNotificationNavigation = (notification) => {
    if (notification.type === 'event_assigned' && notification.data?.eventId) {
      // Navigate to event detail page like Dashboard.js and Events.js
      navigate("/events/eventDetailPage", {
        state: {
          eventId: notification.data.eventId,
          mode: "view",
          eventData: {
            id: notification.data.eventId,
            eventName: notification.data.eventName,
            eventDate: notification.data.eventDate
          }
        }
      });
    } else if (notification.type === 'task_assigned' && notification.data?.taskId) {
      // Navigate to task detail page
      navigate('/events/eventDetailPage/tasks', { 
        state: { 
          taskId: notification.data.taskId, 
          mode: "view", 
          eventId: notification.data.eventId || null,
          eventName: notification.data.eventName || null
        } 
      });
    } else if (notification.url) {
      // For other notification types, use the provided URL
      // Check if it's an internal route or external URL
      if (notification.url.startsWith('/')) {
        navigate(notification.url);
      } else {
        window.open(notification.url, '_blank');
      }
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Close dropdown after clicking
    setIsOpen(false);
    
    // Navigate to the appropriate page
    handleNotificationNavigation(notification);
  };

  const handleMarkAsRead = async (e, notificationId) => {
    e.stopPropagation();
    await markAsRead(notificationId);
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    await markAllAsRead();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'event_assigned':
        return '📅';
      case 'task_assigned':
        return '✅';
      case 'system':
        return '🔔';
      default:
        return '📢';
    }
  };

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <div className="notification-bell" onClick={handleBellClick}>
        <BellRing size={22} className="bell-icon" />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>

      {isOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <div className="notification-title-section">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <span className="unread-count-badge">{unreadCount} unread</span>
              )}
            </div>
            <div className="notification-actions">
              {unreadCount > 0 && (
                <button 
                  className="mark-all-read-btn"
                  onClick={handleMarkAllAsRead}
                  title="Mark all as read"
                >
                  <Check size={16} />
                </button>
              )}
              <button 
                className="settings-btn"
                title="Notification settings"
              >
                <Settings size={16} />
              </button>
              <button 
                className="close-btn"
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="notification-content">
            {!isFCMInitialized && (
              <div className="notification-error">
                <AlertCircle size={16} />
                <span>Notifications not initialized</span>
              </div>
            )}

            {error && (
              <div className="notification-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="notification-loading">
                <div className="loading-spinner"></div>
                <span>Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <BellRing size={32} />
                <p>No notifications yet</p>
                <small>You'll see notifications here when you're assigned to events or tasks.</small>
              </div>
            ) : (
              <div className="notification-list">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-item-content">
                      <div className="notification-icon">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="notification-details">
                        <h4 className="notification-title">{notification.title}</h4>
                        <p className="notification-body">{notification.body}</p>
                        <div className="notification-meta">
                          <span className="notification-time">
                            {formatDate(notification.createdAt)}
                          </span>
                          {notification.category && (
                            <span className="notification-category">
                              {notification.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="notification-item-actions">
                      {!notification.isRead && (
                        <button
                          className="action-btn mark-read-btn"
                          onClick={(e) => handleMarkAsRead(e, notification.id)}
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        className="action-btn delete-btn"
                        onClick={(e) => handleDelete(e, notification.id)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                      {notification.url && (
                        <button
                          className="action-btn external-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNotificationNavigation(notification);
                          }}
                          title="Open"
                        >
                          <ExternalLink size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <button 
                className="view-all-btn"
                onClick={() => {
                  // Navigate to full notifications page if you have one
                  console.log('Navigate to notifications page');
                }}
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;

