import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fcmService } from '../Services/fcm-service';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isFCMInitialized, setIsFCMInitialized] = useState(false);
  const [error, setError] = useState(null);

  // Initialize FCM
  const initializeFCM = useCallback(async () => {
    try {
      setError(null);
      await fcmService.registerToken();
      setIsFCMInitialized(true);
      console.log('FCM initialized successfully');
    } catch (error) {
      console.error('FCM initialization failed:', error);
      setError(error.message);
      setIsFCMInitialized(false);
    }
  }, []);

  // Load notifications
  const loadNotifications = useCallback(async (page = 1, pageSize = 20, category = null, unreadOnly = false) => {
    setLoading(true);
    try {
      const data = await fcmService.getNotifications(page, pageSize, category, unreadOnly);
      setNotifications(data.notifications || []);
      setError(null);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await fcmService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await fcmService.markAsRead(notificationId);
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
      setError(error.message);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await fcmService.markAllAsRead();
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      setError(error.message);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await fcmService.deleteNotification(notificationId);
      // Update local state
      const notificationToDelete = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
      if (notificationToDelete && !notificationToDelete.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      setError(error.message);
    }
  }, [notifications]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await Promise.all([
      loadNotifications(),
      loadUnreadCount()
    ]);
  }, [loadNotifications, loadUnreadCount]);

  // Initialize on mount
  useEffect(() => {
    initializeFCM();
  }, [initializeFCM]);

  // Listen for service worker messages (background notification clicks)
  useEffect(() => {
    const handleServiceWorkerMessage = (event) => {
      if (event.data?.type === 'NOTIFICATION_CLICK') {
        const { notificationType, eventId, taskId, url } = event.data.data;
        
        // Import navigate function dynamically to avoid circular dependency
        import('react-router-dom').then(({ useNavigate }) => {
          // This will be handled by the component that uses this context
          console.log('Service worker notification click:', { notificationType, eventId, taskId, url });
        });
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);
    
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    if (isFCMInitialized) {
      refreshNotifications();
      
      const interval = setInterval(() => {
        refreshNotifications();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [isFCMInitialized, refreshNotifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    isFCMInitialized,
    error,
    initializeFCM,
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

