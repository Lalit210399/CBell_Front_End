import { getToken, onMessage } from "firebase/messaging";
import { messaging, vapidKey } from "./firebase-config";

class FCMService {
  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.isInitialized = false;
  }

  // Generate or retrieve device ID
  getOrCreateDeviceId() {
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      localStorage.setItem("deviceId", deviceId);
    }
    return deviceId;
  }

  // Request notification permission
  async requestPermission() {
    try {
      if (!("Notification" in window)) {
        throw new Error("This browser does not support notifications");
      }

      // Check current permission status
      if (Notification.permission === "granted") {
        return true;
      }

      if (Notification.permission === "denied") {
        throw new Error(
          "Notification permission denied. Please enable notifications in your browser settings."
        );
      }

      // Only request permission if it's 'default'
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
      }

      return false;
    } catch (error) {
      console.error("Permission request failed:", error);
      return false;
    }
  }

  // Get FCM token from Firebase
  async getFCMToken() {
    try {
      const token = await getToken(messaging, { vapidKey });
      if (!token)
        throw new Error(
          "No FCM token returned. Check your VAPID key and Firebase setup."
        );
      console.log("✅ FCM Token retrieved:", token);
      return token;
    } catch (error) {
      if (error.code === "messaging/permission-blocked") {
        console.warn("🚫 Notifications are blocked. Ask user to enable them.");
      } else if (error.code === "messaging/unsupported-browser") {
        console.warn("⚠️ This browser does not support push notifications.");
      } else {
        console.error("🔥 Error getting FCM token:", error);
      }
      return null;
    }
  }

  // Register FCM token with backend
  async registerToken() {
    try {
      // 1. Request permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error("Notification permission denied");
      }

      // 2. Get FCM token
      const fcmToken = await this.getFCMToken();
      if (!fcmToken) {
        throw new Error("Failed to get FCM token");
      }

      // 3. Register with backend
      const response = await fetch("/apis/fcm/register-token", {
        method: "POST",
        credentials: "include", // Important for cookie authentication
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: fcmToken,
          platform: "web",
          deviceId: this.deviceId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to register FCM token");
      }

      const result = await response.json();
      console.log("FCM token registered:", result);

      // Set up message listener for foreground notifications
      this.setupMessageListener();

      this.isInitialized = true;
      return result;
    } catch (error) {
      console.error("FCM registration failed:", error);
      throw error;
    }
  }

  // Set up listener for foreground messages
  setupMessageListener() {
    onMessage(messaging, (payload) => {
      console.log("Message received in foreground:", payload);

      // Show notification in foreground
      if (payload.notification) {
        const notification = new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          data: payload.data,
        });

        // Handle notification click
        notification.onclick = () => {
          window.focus();
          if (payload.data?.url) {
            window.location.href = payload.data.url;
          }
          notification.close();
        };
      }
    });
  }

  // Get user notifications
  async getNotifications(
    page = 1,
    pageSize = 20,
    category = null,
    unreadOnly = false
  ) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(category && { category }),
        ...(unreadOnly && { unreadOnly: "true" }),
      });

      const response = await fetch(`/apis/notifications/user?${params}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const response = await fetch("/apis/notifications/mark-read", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1",
        },
        body: JSON.stringify({ notificationId }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      return await response.json();
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await fetch("/apis/notifications/mark-all-read", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }

      return await response.json();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      const response = await fetch(`/apis/notifications/${notificationId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete notification");
      }

      return await response.json();
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  }

  // Get unread count
  async getUnreadCount() {
    try {
      const response = await fetch("/apis/notifications/unread-count", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to get unread count");
      }

      const result = await response.json();
      return result.unreadCount;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }

  // Check if FCM is initialized
  isFCMInitialized() {
    return this.isInitialized;
  }
}

export const fcmService = new FCMService();
