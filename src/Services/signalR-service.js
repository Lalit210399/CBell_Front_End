import * as signalR from "@microsoft/signalr";

class SignalRService {
  constructor() {
    this.connection = null;
    this.messageHandlers = {
      onMessageReceived: null,
      onUserJoined: null,
      onUserLeft: null,
      onUserTyping: null,
      onOnlineUsers: null,
      onError: null,
    };
  }

  async startConnection() {
    if (this.connection) {
      console.log("SignalR: Cleaning up existing connection before starting new one");
      await this.stopConnection();
    }

    try {
      console.log("SignalR: Starting new connection...");

      /** ---------------------------
       * Option 1: Through Gateway (Recommended)
       * --------------------------- */
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`/apis/chatHub`, {
          withCredentials: true, // ensure cookies are sent
          // ❌ Removed skipNegotiation
          // skipNegotiation: true,
          // ❌ Removed hard WebSocket lock — let SignalR negotiate fallback
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            const delays = [0, 2000, 5000, 10000, 30000];
            return retryContext.previousRetryCount < delays.length
              ? delays[retryContext.previousRetryCount]
              : 30000;
          },
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Connection event handlers
      this.connection.onreconnecting((error) => {
        console.warn("SignalR Connection lost. Attempting to reconnect...", error);
      });

      this.connection.onreconnected((connectionId) => {
        console.log("SignalR Connection reestablished. Connection ID:", connectionId);
      });

      this.connection.onclose((error) => {
        console.error("SignalR Connection closed", error);
        if (error) {
          setTimeout(() => this.startConnection(), 5000);
        }
      });

      // Setup chat event handlers
      this.setupChatHandlers();

      // Add connection timeout
      const connectionPromise = this.connection.start();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Connection timeout after 30 seconds")), 30000)
      );

      await Promise.race([connectionPromise, timeoutPromise]);
      console.log("✅ SignalR: Successfully connected!");
      console.log("SignalR: Connection ID:", this.connection.connectionId);

      return true;
    } catch (err) {
      console.error("❌ SignalR Connection Error:", err);

      // Handle token refresh for 401 errors
      if (err.statusCode === 401 || err.message?.includes("401")) {
        try {
          const { fetchWithRefresh } = await import("../Context/RefereshToken");
          await fetchWithRefresh("/apis/auth/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          console.log("SignalR: Token refreshed, retrying connection...");
          await new Promise((res) => setTimeout(res, 1000));
          return this.startConnection();
        } catch (refreshError) {
          console.error("SignalR: Token refresh failed:", refreshError);
        }
      }

      /** ---------------------------
       * Option 2: Direct Connection Fallback (Bypass Gateway)
       * --------------------------- */
      // const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
      try {
        console.warn("SignalR: Gateway connection failed, trying direct backend...");

        this.connection = new signalR.HubConnectionBuilder()
          .withUrl(`/apis/chatHub`, {
            withCredentials: true,
            transport: signalR.HttpTransportType.WebSockets,
          })
          .withAutomaticReconnect({
            nextRetryDelayInMilliseconds: () => 5000,
          })
          .configureLogging(signalR.LogLevel.Information)
          .build();

        this.setupChatHandlers();
        await this.connection.start();
        console.log("✅ SignalR: Connected directly to backend!");
        return true;
      } catch (fallbackError) {
        console.error("SignalR: Direct backend connection also failed:", fallbackError);
      }

      return false;
    }
  }

  setupChatHandlers() {
    if (!this.connection) return;

    this.connection.on("MessageReceived", (message) => {
      console.log("📨 Message Received:", message);
      this.messageHandlers.onMessageReceived?.(message);
    });

    this.connection.on("UserJoinedTask", (data) => {
      console.log("👤 User Joined Task:", data);
      this.messageHandlers.onUserJoined?.(data);
    });

    this.connection.on("UserLeftTask", (data) => {
      console.log("👋 User Left Task:", data);
      this.messageHandlers.onUserLeft?.(data);
    });

    this.connection.on("UserTyping", (typingInfo) => {
      console.log("⌨️ User Typing:", typingInfo);
      this.messageHandlers.onUserTyping?.(typingInfo);
    });

    this.connection.on("OnlineUsers", (data) => {
      console.log("👥 Online Users:", data);
      this.messageHandlers.onOnlineUsers?.(data);
    });

    this.connection.on("Error", (error) => {
      console.error("❌ SignalR Error:", error);
      this.messageHandlers.onError?.(error);
    });
  }

  async stopConnection() {
    if (!this.connection) {
      console.log("SignalR: No active connection to stop");
      return;
    }
    try {
      console.log("Stopping SignalR connection...");
      await this.connection.stop();
      console.log("SignalR Connection successfully stopped");
      this.connection = null;
    } catch (err) {
      console.warn("Error while stopping SignalR connection:", err);
      this.connection = null;
    }
  }

  registerMessageHandlers(handlers) {
    this.messageHandlers = { ...this.messageHandlers, ...handlers };
  }

  async joinTaskChat(taskId, organizationId, eventId) {
    if (!this.connection) return false;
    try {
      await this.connection.invoke("JoinTaskChat", taskId, organizationId, eventId);
      console.log(`Joined task chat: ${taskId}`);
      return true;
    } catch (err) {
      console.error(`Error joining task chat ${taskId}:`, err);
      throw err;
    }
  }

  async sendMessage(taskId, message, documentIds = []) {
    if (!this.connection) throw new Error("No SignalR connection");
    try {
      await this.connection.invoke("SendMessage", taskId, message, documentIds);
      console.log("Message sent successfully");
      return true;
    } catch (err) {
      console.error("Error sending message:", err);
      throw err;
    }
  }

  async getOnlineUsers(taskId) {
    if (!this.connection) return [];
    try {
      await this.connection.invoke("GetOnlineUsers", taskId);
    } catch (err) {
      console.error("Error getting online users:", err);
    }
  }

  async leaveTaskChat(taskId) {
    if (!this.connection) return;
    try {
      await this.connection.invoke("LeaveTaskChat", taskId);
      console.log(`Left task chat: ${taskId}`);
    } catch (err) {
      console.error(`Error leaving task chat ${taskId}:`, err);
      throw err;
    }
  }

  async startTyping(taskId) {
    if (!this.connection) return;
    try {
      await this.connection.invoke("StartTyping", taskId);
    } catch (err) {
      console.error("Error starting typing:", err);
    }
  }

  async stopTyping(taskId) {
    if (!this.connection) return;
    try {
      await this.connection.invoke("StopTyping", taskId);
    } catch (err) {
      console.error("Error stopping typing:", err);
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
