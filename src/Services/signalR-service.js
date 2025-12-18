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

  // Try to read auth token from cookie or localStorage.user.accessToken
  _readAccessToken() {
    try {
      // cookie helper
      const match = document.cookie.match(new RegExp('(^| )auth_token=([^;]+)'));
      if (match && match[2]) return decodeURIComponent(match[2]);

      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        const u = JSON.parse(userRaw);
        return u?.accessToken || u?.token || u?.authToken || null;
      }
    } catch (e) {
      // ignore
    }
    return null;
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
        accessTokenFactory: () => this._readAccessToken() || "",
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
    // Debug: log successful connection
    try {
      console.debug('[SignalR] ✅ Connected, id=', this.connection.connectionId);
    } catch (e) {}
    return true;
  } catch (err) {
    //console.error('❌ [SignalR] Connection Error:', err);
    return false;
  }
}
 

  setupChatHandlers() {
    if (!this.connection) return;

    this.connection.on("MessageReceived", (message) => {
      console.debug("[SignalR] 📨 MessageReceived:", message);
      (this.messageHandlers.onMessageReceived || []).forEach((h) => {
        try {
          h(message);
        } catch (e) {
          //console.error("[SignalR] handler error onMessageReceived", e);
        }
      });
    });

    this.connection.on("UserJoinedTask", (data) => {
      //console.log("[SignalR] 👤 User Joined Task payload:", data);
      (this.messageHandlers.onUserJoined || []).forEach((h) => {
        try {
          h(data);
        } catch (e) {
          //console.error("[SignalR] handler error onUserJoined", e);
        }
      });
    });

    this.connection.on("UserJoinedEvent", (data) => {
      (this.messageHandlers.onUserJoined || []).forEach((h) => {
        try {
          h(data);
        } catch (e) {
          // ignore
        }
      });
    });

    this.connection.on("UserLeftTask", (data) => {
      //console.log("[SignalR] 👋 User Left Task payload:", data);
      (this.messageHandlers.onUserLeft || []).forEach((h) => {
        try {
          h(data);
        } catch (e) {
          //console.error("[SignalR] handler error onUserLeft", e);
        }
      });
    });

    this.connection.on("UserLeftEvent", (data) => {
      (this.messageHandlers.onUserLeft || []).forEach((h) => {
        try {
          h(data);
        } catch (e) {
          // ignore
        }
      });
    });

    this.connection.on("UserTyping", (typingInfo) => {
      //console.log("[SignalR] ⌨️ User Typing payload:", typingInfo);
      (this.messageHandlers.onUserTyping || []).forEach((h) => {
        try {
          h(typingInfo);
        } catch (e) {
          //console.error("[SignalR] handler error onUserTyping", e);
        }
      });
    });

    this.connection.on("OnlineUsers", (data) => {
      //console.log("[SignalR] 👥 Online Users payload:", data);
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
      console.debug('[SignalR] -> JoinTaskChat invoke', { taskId, organizationId, eventId, connectionId: this.connection?.connectionId });
      await this.connection.invoke(
        "JoinTaskChat",
        taskId,
        organizationId,
        eventId
      );
      console.debug(`[SignalR] ✅ Joined task chat: ${taskId} (event:${eventId})`);
      return true;
    } catch (err) {
      console.warn(`[SignalR] ❌ Error joining task chat ${taskId}:`, err && err.message ? err.message : err);
      throw err;
    }
  }

  async joinEventChat(eventId, organizationId) {
    // Backend expects JoinTaskChat with empty taskId and eventId param
    return this.joinTaskChat('', organizationId, eventId);
  }

  async sendMessage(taskId, message, documentIds = [], messageType = 1, organizationId, eventId, userId, userName) {
    if (!this.connection) throw new Error("No SignalR connection");
    try {
      const tId = taskId || "";
      // If sending a task-level message, do not include eventId (server expects empty)
      const eId = tId ? "" : (eventId || "");
      console.debug('[SignalR] -> SendMessage invoke', { tId, eId, message, documentIds, organizationId, userId });
      await this.connection.invoke(
        "SendMessage",
        tId,
        message,
        documentIds,
        messageType,
        organizationId,
        eId,
        userId,
        userName
      );
      console.debug('[SignalR] ✅ SendMessage completed');
      return true;
    } catch (err) {
      console.warn('[SignalR] ❌ Error sending message:', err && err.message ? err.message : err);
      throw err;
    }
  }

  async getOnlineUsers(taskId) {
    if (!this.connection) return [];
    try {
      // Some server implementations expect two args; always send a second arg (empty when unknown)
      await this.connection.invoke("GetOnlineUsers", taskId || "", "");
    } catch (err) {
      //console.error("[SignalR] Error getting online users:", err);
    }
  }
  
  async leaveEventChat(eventId, organizationId) {
    // Leave by calling LeaveTaskChat with empty taskId and eventId
    return this.leaveTaskChat('', eventId);
  }

  async leaveTaskChat(taskId, eventId) {
    if (!this.connection) return;
    try {
      // Always invoke LeaveTaskChat with two args to satisfy hub signature
      const tId = taskId || "";
      const eId = typeof eventId !== 'undefined' ? (eventId || "") : "";
      await this.connection.invoke('LeaveTaskChat', tId, eId);
      //console.info(`[SignalR] Left chat: ${taskId || eventId}`);
    } catch (err) {
      //console.error(`[SignalR] Error leaving chat ${taskId || eventId}:`, err);
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

  async startTypingEvent(eventId) {
    if (!this.connection) return;
    try {
      // Backend uses StartTyping with empty taskId and eventId
      await this.connection.invoke('StartTyping', '', eventId);
    } catch (err) {
      // ignore
    }
  }

  async stopTypingEvent(eventId) {
    if (!this.connection) return;
    try {
      await this.connection.invoke('StopTyping', '', eventId);
    } catch (err) {
      // ignore
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
