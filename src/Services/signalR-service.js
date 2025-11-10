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
      console.log(
        "SignalR: Cleaning up existing connection before starting new one"
      );
      await this.stopConnection();
    }

    try {
      // console.log("SignalR: Starting new connection...");

      // const token = localStorage.getItem("token");
      // if (!token) {
      //   console.error("SignalR: No authentication token available");
      //   return false;
      // }

      // this.connection = new signalR.HubConnectionBuilder()
      //   .withUrl(`/apis/chathub`, {
      //     withCredentials: true,
      //     skipNegotiation: true,
      //     transport: signalR.HttpTransportType.WebSockets,
      //   })
      console.log("SignalR: Starting new connection...");

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`/apis/chathub`, {
          withCredentials: true, // ensures cookies are sent
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        })

        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            const delays = [0, 2000, 5000, 10000];
            return delays[retryContext.previousRetryCount] || null;
          },
        })
        .configureLogging(signalR.LogLevel.Debug)
        .build();

      // Connection event handlers
      this.connection.onreconnecting((error) => {
        console.warn(
          "SignalR Connection lost. Attempting to reconnect...",
          error
        );
      });

      this.connection.onreconnected((connectionId) => {
        console.log(
          "SignalR Connection reestablished. Connection ID:",
          connectionId
        );
      });

      this.connection.onclose((error) => {
        console.error("SignalR Connection closed", error);
      });

      // Setup chat event handlers
      this.setupChatHandlers();

      await this.connection.start();
      console.log("SignalR: Successfully connected!");

      console.log(
        "SignalR: Using transport:",
        this.connection.connection.transport.name
      );
      console.log("SignalR: Connection ID:", this.connection.connectionId);

      return true;
    } catch (err) {
      console.error("SignalR Connection Error:", err);

      // Handle token refresh for 401 errors
      if (err.statusCode === 401) {
        try {
          const { fetchWithRefresh } = await import("../Context/RefereshToken");
          await fetchWithRefresh("/apis/auth/refresh", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });
          console.log("SignalR: Token refreshed, retrying connection...");
          return this.startConnection();
        } catch (refreshError) {
          console.error("SignalR: Token refresh failed:", refreshError);
        }
      }

      return false;
    }
  }

  setupChatHandlers() {
    if (!this.connection) return;

    // Chat-specific event handlers
    this.connection.on("MessageReceived", (message) => {
      console.log("📨 Message Received:", message);
      if (this.messageHandlers.onMessageReceived) {
        this.messageHandlers.onMessageReceived(message);
      }
    });

    this.connection.on("UserJoinedTask", (data) => {
      console.log("👤 User Joined Task:", data);
      if (this.messageHandlers.onUserJoined) {
        this.messageHandlers.onUserJoined(data);
      }
    });

    this.connection.on("UserLeftTask", (data) => {
      console.log("👋 User Left Task:", data);
      if (this.messageHandlers.onUserLeft) {
        this.messageHandlers.onUserLeft(data);
      }
    });

    this.connection.on("UserTyping", (typingInfo) => {
      console.log("⌨️ User Typing:", typingInfo);
      if (this.messageHandlers.onUserTyping) {
        this.messageHandlers.onUserTyping(typingInfo);
      }
    });

    this.connection.on("OnlineUsers", (data) => {
      console.log("👥 Online Users:", data);
      if (this.messageHandlers.onOnlineUsers) {
        this.messageHandlers.onOnlineUsers(data);
      }
    });

    this.connection.on("Error", (error) => {
      console.error("❌ SignalR Error:", error);
      if (this.messageHandlers.onError) {
        this.messageHandlers.onError(error);
      }
    });
  }

  // In your SignalRService class
  async leaveTaskChat(taskId) {
    if (!this.connection) {
      console.error("Cannot leave task chat: No SignalR connection");
      return;
    }
    try {
      console.log(`Attempting to leave task chat: ${taskId}`);
      await this.connection.invoke("LeaveTaskChat", taskId);
      console.log(`Successfully left task chat: ${taskId}`);
    } catch (err) {
      console.error(`Error leaving task chat ${taskId}:`, err);
      throw err;
    }
  }

  // Register message handlers
  registerMessageHandlers(handlers) {
    this.messageHandlers = { ...this.messageHandlers, ...handlers };
  }

  // Remove all handlers
  removeHandlers() {
    if (!this.connection) {
      console.warn("Cannot remove handlers: No SignalR connection");
      return;
    }

    console.log("Removing all SignalR event handlers");
    this.connection.off("MessageReceived");
    this.connection.off("UserJoinedTask");
    this.connection.off("UserLeftTask");
    this.connection.off("UserTyping");
    this.connection.off("OnlineUsers");
    this.connection.off("Error");

    // Reset message handlers
    this.messageHandlers = {
      onMessageReceived: null,
      onUserJoined: null,
      onUserLeft: null,
      onUserTyping: null,
      onOnlineUsers: null,
      onError: null,
    };

    console.log("All handlers removed");
  }

  // Enhanced join task chat with organization and event context
  async joinTaskChat(taskId, organizationId, eventId) {
    if (!this.connection) {
      console.error("Cannot join task chat: No SignalR connection");
      return false;
    }
    try {
      console.log(
        `Joining task chat: ${taskId}, Org: ${organizationId}, Event: ${eventId}`
      );
      await this.connection.invoke(
        "JoinTaskChat",
        taskId,
        organizationId,
        eventId
      );
      console.log(`Successfully joined task chat: ${taskId}`);
      return true;
    } catch (err) {
      console.error(`Error joining task chat ${taskId}:`, err);
      throw err;
    }
  }

  // Enhanced send message with document support
  async sendMessage(taskId, message, documentIds = []) {
    if (!this.connection) {
      console.error("Cannot send message: No SignalR connection");
      throw new Error("No SignalR connection available");
    }
    try {
      console.log("Sending message:", { taskId, message, documentIds });
      await this.connection.invoke("SendMessage", taskId, message, documentIds);
      console.log("Message sent successfully");
      return true;
    } catch (err) {
      console.error("Error sending message:", err);
      throw err;
    }
  }

  // Typing indicators
  async startTyping(taskId) {
    if (!this.connection) return;
    try {
      await this.connection.invoke("StartTyping", taskId);
    } catch (err) {
      console.error("Error starting typing indicator:", err);
    }
  }

  async stopTyping(taskId) {
    if (!this.connection) return;
    try {
      await this.connection.invoke("StopTyping", taskId);
    } catch (err) {
      console.error("Error stopping typing indicator:", err);
    }
  }

  // Get online users
  async getOnlineUsers(taskId) {
    if (!this.connection) {
      console.error("Cannot get online users: No SignalR connection");
      return [];
    }
    try {
      await this.connection.invoke("GetOnlineUsers", taskId);
    } catch (err) {
      console.error("Error getting online users:", err);
    }
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

  isConnected() {
    const connected =
      this.connection?.state === signalR.HubConnectionState.Connected;
    return connected;
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
