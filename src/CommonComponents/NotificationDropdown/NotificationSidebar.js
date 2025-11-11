import React from 'react';
import { X, Bell, Check, Trash2, ExternalLink } from 'lucide-react';
import { useNotification } from '../../Context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import './NotificationSidebar.css';

const NotificationsSidebar = ({ isOpen, onClose }) => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotification();
  
  const navigate = useNavigate();

  const handleNotificationNavigation = (notification) => {
    if (notification.category === 'event' && notification.data?.eventId) {
      navigate("/events/eventDetailPage", {
        state: {
          eventId: notification.data.eventId,
          mode: "view",
          organizationId: notification.data.organizationId,
          eventData: {
            id: notification.data.eventId,
            eventName: notification.data.eventName,
            eventDate: notification.data.eventDate,
            organizationId: notification.data.organizationId
          }
        }
      });
    } else if ((notification.category === 'task') && notification.data?.taskId) {
      navigate('/events/eventDetailPage/tasks', {
        state: {
          taskId: notification.data.taskId,
          mode: "view",
          eventId: notification.data.eventId || null,
          eventName: notification.data.eventName || null,
          organizationId: notification.data.organizationId
        }
      });
    } else if (notification.url) {
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
    handleNotificationNavigation(notification);
    onClose(); // Close sidebar after navigation
  };

  const handleMarkAsRead = async (e, notificationId) => {
    e.stopPropagation();
    await markAsRead(notificationId);
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
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

  const getNotificationIcon = (category) => {
    switch (category) {
      case 'event':
        return '📅';
      case 'task':
        return '✅';
      case 'system':
        return '🔔';
      default:
        return '📢';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notifications-sidebar-overlay" onClick={onClose}>
      <div className="notifications-sidebar" onClick={(e) => e.stopPropagation()}>
        <div className="sidebar-header">
          <div className="sidebar-title">
            <Bell size={24} />
            <h2>All Notifications</h2>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </div>
          <div className="sidebar-actions">
            {unreadCount > 0 && (
              <button 
                className="mark-all-read-btn"
                onClick={markAllAsRead}
                title="Mark all as read"
              >
                <Check size={18} />
                Mark all read
              </button>
            )}
            <button 
              className="close-sidebar-btn"
              onClick={onClose}
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="sidebar-content">
          {notifications.length === 0 ? (
            <div className="empty-state">
              <Bell size={48} />
              <p>No notifications yet</p>
              <span>You're all caught up!</span>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-card ${notification.isRead ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-main">
                    <div className="notification-icon">
                      {getNotificationIcon(notification.category)}
                    </div>
                    <div className="notification-content">
                      <h4 className="notification-title" title={notification.title}>{notification.title}</h4>
                      <p className="notification-body" title={notification.body}>{notification.body}</p>
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
                  
                  <div className="notification-actions">
                    {!notification.isRead && (
                      <button
                        className="action-btn mark-read"
                        onClick={(e) => handleMarkAsRead(e, notification.id)}
                        title="Mark as read"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      className="action-btn delete"
                      onClick={(e) => handleDelete(e, notification.id)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                    {/* {notification.url && (
                      <button
                        className="action-btn external"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNotificationNavigation(notification);
                        }}
                        title="Open"
                      >
                        <ExternalLink size={16} />
                      </button>
                    )} */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsSidebar;