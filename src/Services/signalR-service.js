//signalRservice
import * as signalR from "@microsoft/signalr";

class SignalRService {
  constructor() {
    this.connection = null;
    this.messageHandlers = {
      onMessageReceived: [],
      onUserJoined: [],
      onUserLeft: [],
      onUserTyping: [],
      onOnlineUsers: [],
      onError: [],
    };
  }

async startConnection() {
  // 🧩 If already connected or connecting — skip
  if (this.connection && (
    this.connection.state === signalR.HubConnectionState.Connected ||
    this.connection.state === signalR.HubConnectionState.Connecting ||
    this.connection.state === signalR.HubConnectionState.Reconnecting
  )) {
    //console.info('[SignalR] Connection already active or connecting, skipping new connection.');
    return true;
  }

  try {
    //console.info('[SignalR] Starting new connection...');

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`/apis/chatHub`, {
        withCredentials: true,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: retryContext => {
          const delays = [0, 2000, 5000, 10000, 30000];
          return delays[retryContext.previousRetryCount] || 30000;
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Lifecycle logs only — no manual reconnect
    this.connection.onreconnecting(error => {
      //console.warn('[SignalR] Reconnecting...', error?.message);
    });

    this.connection.onreconnected(id => {
      //console.info('[SignalR] Reconnected. Connection ID:', id);
    });

    this.connection.onclose(error => {
      //console.warn('[SignalR] Connection closed:', error?.message);
      // ❌ Removed manual restart here — automatic reconnect handles it
    });

    this.setupChatHandlers();

    // Timeout safety
    const connectionPromise = this.connection.start();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000)
    );

    await Promise.race([connectionPromise, timeoutPromise]);
    //console.info('✅ [SignalR] Successfully connected:', this.connection.connectionId);
    return true;
  } catch (err) {
    //console.error('❌ [SignalR] Connection Error:', err);
    return false;
  }
}
 

  setupChatHandlers() {
    if (!this.connection) return;

    this.connection.on("MessageReceived", (message) => {
      //console.debug("[SignalR] 📨 Message Received:", message);
      (this.messageHandlers.onMessageReceived || []).forEach((h) => {
        try {
          h(message);
        } catch (e) {
          //console.error("[SignalR] handler error onMessageReceived", e);
        }
      });
    });

    this.connection.on("UserJoinedTask", (data) => {
      //console.info("[SignalR] 👤 User Joined Task:", data);
      (this.messageHandlers.onUserJoined || []).forEach((h) => {
        try {
          h(data);
        } catch (e) {
          //console.error("[SignalR] handler error onUserJoined", e);
        }
      });
    });

    this.connection.on("UserLeftTask", (data) => {
      //console.info("[SignalR] 👋 User Left Task:", data);
      (this.messageHandlers.onUserLeft || []).forEach((h) => {
        try {
          h(data);
        } catch (e) {
          //console.error("[SignalR] handler error onUserLeft", e);
        }
      });
    });

    this.connection.on("UserTyping", (typingInfo) => {
      //console.debug("[SignalR] ⌨️ User Typing:", typingInfo);
      (this.messageHandlers.onUserTyping || []).forEach((h) => {
        try {
          h(typingInfo);
        } catch (e) {
          //console.error("[SignalR] handler error onUserTyping", e);
        }
      });
    });

    this.connection.on("OnlineUsers", (data) => {
      //console.debug("[SignalR] 👥 Online Users:", data);
      (this.messageHandlers.onOnlineUsers || []).forEach((h) => {
        try {
          h(data);
        } catch (e) {
          //console.error("[SignalR] handler error onOnlineUsers", e);
        }
      });
    });

    this.connection.on("Error", (error) => {
      //console.error("❌ [SignalR] Error:", error);
      (this.messageHandlers.onError || []).forEach((h) => {
        try {
          h(error);
        } catch (e) {
          //console.error("[SignalR] handler error onError", e);
        }
      });
    });
  }

  async stopConnection() {
    if (!this.connection) {
      //console.debug("[SignalR] No active connection to stop");
      return;
    }
    try {
      //console.info("[SignalR] Stopping SignalR connection...");
      await this.connection.stop();
      //console.info("[SignalR] SignalR Connection successfully stopped");
      this.connection = null;
    } catch (err) {
      //console.warn("[SignalR] Error while stopping SignalR connection:", err);
      this.connection = null;
    }
  }

  registerMessageHandlers(handlers) {
    // handlers can contain one or more of the supported handler keys.
    // We store multiple handlers per event and return an unsubscribe function.
    const added = [];
    Object.keys(handlers || {}).forEach((key) => {
      if (!this.messageHandlers[key]) this.messageHandlers[key] = [];
      const fn = handlers[key];
      if (typeof fn === "function") {
        this.messageHandlers[key].push(fn);
        added.push({ key, fn });
      }
    });

    // Return an unsubscribe function for the caller to remove these handlers
    return () => {
      added.forEach(({ key, fn }) => {
        this.messageHandlers[key] = (this.messageHandlers[key] || []).filter(
          (h) => h !== fn
        );
      });
    };
  }

  async joinTaskChat(taskId, organizationId, eventId) {
    if (!this.connection) return false;
    try {
      await this.connection.invoke(
        "JoinTaskChat",
        taskId,
        organizationId,
        eventId
      );
      //console.info(`[SignalR] Joined task chat: ${taskId}`);
      return true;
    } catch (err) {
      //console.error(`[SignalR] Error joining task chat ${taskId}:`, err);
      throw err;
    }
  }

  async sendMessage(taskId, message, documentIds = []) {
    if (!this.connection) throw new Error("No SignalR connection");
    try {
      await this.connection.invoke("SendMessage", taskId, message, documentIds);
      //console.debug("[SignalR] Message sent successfully");
      return true;
    } catch (err) {
      //console.error("[SignalR] Error sending message:", err);
      throw err;
    }
  }

  async getOnlineUsers(taskId) {
    if (!this.connection) return [];
    try {
      await this.connection.invoke("GetOnlineUsers", taskId);
    } catch (err) {
      //console.error("[SignalR] Error getting online users:", err);
    }
  }

  async leaveTaskChat(taskId) {
    if (!this.connection) return;
    try {
      await this.connection.invoke("LeaveTaskChat", taskId);
      //console.info(`[SignalR] Left task chat: ${taskId}`);
    } catch (err) {
      //console.error(`[SignalR] Error leaving task chat ${taskId}:`, err);
      throw err;
    }
  }

  async startTyping(taskId) {
    if (!this.connection) return;
    try {
      await this.connection.invoke("StartTyping", taskId);
    } catch (err) {
      //console.error("[SignalR] Error starting typing:", err);
    }
  }

  async stopTyping(taskId) {
    if (!this.connection) return;
    try {
      await this.connection.invoke("StopTyping", taskId);
    } catch (err) {
      //console.error("[SignalR] Error stopping typing:", err);
    }
  }

  isConnected() {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  getConnectionState() {
    if (!this.connection) return "Not Initialized";
    const states = {
      [signalR.HubConnectionState.Connected]: "Connected",
      [signalR.HubConnectionState.Connecting]: "Connecting",
      [signalR.HubConnectionState.Disconnected]: "Disconnected",
      [signalR.HubConnectionState.Disconnecting]: "Disconnecting",
      [signalR.HubConnectionState.Reconnecting]: "Reconnecting",
    };
    return states[this.connection.state] || "Unknown";
  }
}

const signalRService = new SignalRService();
export default signalRService;
