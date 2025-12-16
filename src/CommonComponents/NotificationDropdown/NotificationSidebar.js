import React from 'react';
import { X, Bell, Check, Trash2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [expandedNotifications, setExpandedNotifications] = React.useState({});
  const [, setHoveredNotificationId] = React.useState(null);

  const toggleExpanded = (e, notificationId) => {
    e.stopPropagation();
    setExpandedNotifications(prev => ({
      ...prev,
      [notificationId]: !prev[notificationId]
    }));
  };

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

  // Helper function to parse notification body and highlight event/task names
  const renderHighlightedBody = (body, category, notificationData) => {
    if (!body) return null;

    // Patterns to match event/task names in quotes
    // Matches text like: 'assigned to "Event Name"' or 'task "Task Name"'
    const patterns = [
      /"([^"]+)"/g,  // Matches text in double quotes
      /'([^']+)'/g   // Matches text in single quotes
    ];

    let parts = [];
    let lastIndex = 0;

    // Extract quoted names and their positions
    const matches = [];
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(body)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          name: match[1],
          fullMatch: match[0]
        });
      }
    });

    // Also look for event and task names from data object if they exist in the body
    if (notificationData?.eventName && body.includes(notificationData.eventName)) {
      const index = body.indexOf(notificationData.eventName);
      if (index !== -1) {
        matches.push({
          start: index,
          end: index + notificationData.eventName.length,
          name: notificationData.eventName,
          fullMatch: notificationData.eventName
        });
      }
    }

    if (notificationData?.taskName && body.includes(notificationData.taskName)) {
      const index = body.indexOf(notificationData.taskName);
      if (index !== -1) {
        matches.push({
          start: index,
          end: index + notificationData.taskName.length,
          name: notificationData.taskName,
          fullMatch: notificationData.taskName
        });
      }
    }

    // Remove duplicates and sort matches by start position
    const uniqueMatches = Array.from(new Map(
      matches.map(m => [m.start + '-' + m.end, m])
    ).values());
    uniqueMatches.sort((a, b) => a.start - b.start);

    // Build JSX with highlighted sections
    uniqueMatches.forEach(match => {
      if (lastIndex < match.start) {
        parts.push(body.substring(lastIndex, match.start));
      }
      parts.push(
        <span key={`highlight-${match.start}-${match.end}`} className="highlighted-name">
          {match.fullMatch}
        </span>
      );
      lastIndex = match.end;
    });

    // Add remaining text
    if (lastIndex < body.length) {
      parts.push(body.substring(lastIndex));
    }

    return parts.length > 0 ? parts : body;
  };

  if (!isOpen) return null;

  return (
    <div className="notifications-sidebar-overlay" onClick={onClose}>
      <div className="notifications-sidebar" onClick={(e) => e.stopPropagation()}>
        <div className="notification-sidebar-header">
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
                  onMouseEnter={() => setHoveredNotificationId(notification.id)}
                  onMouseLeave={() => setHoveredNotificationId(null)}
                >
                  <div className="notification-main">
                    <div className="notification-icon">
                      {getNotificationIcon(notification.category)}
                    </div>
                    <div className="notification-content">
                      <h4 className="notification-title" title={notification.title}>{notification.title}</h4>
                      <p className={`notification-body ${expandedNotifications[notification.id] ? 'expanded' : ''}`} title={notification.body}>
                        {notification.body}
                      </p>
                      {notification.body && notification.body.length > 60 && (
                        <button
                          className="show-more-btn"
                          onClick={(e) => toggleExpanded(e, notification.id)}
                        >
                          {expandedNotifications[notification.id] ? 'Show less' : 'Show more'}
                        </button>
                      )}
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