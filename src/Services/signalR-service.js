import * as signalR from "@microsoft/signalr";
import { fetchWithRefresh } from "../Context/RefereshToken";

class SignalRService {
  constructor() {
    this.connection = null;
    // In development, use the proxied URL
    // this.baseUrl = process.env.NODE_ENV === 'development' ? '' : 'https://cbell.ai/apis';
    // console.log('SignalR Service initialized with base URL:', this.baseUrl || 'using proxy');
  }

  async startConnection() {
    // If there's already a connection, stop it first
    if (this.connection) {
      console.log(
        "SignalR: Cleaning up existing connection before starting new one"
      );
      await this.stopConnection();
    }

    try {
      console.log("SignalR: Starting new connection...");

      console.log("SignalR: Creating connection to:", `/apis/chathub`);

      // Get the authentication token
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("SignalR: No authentication token available");
        return false;
      }

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`/apis/chathub`, {
          withCredentials: true, // ✅ allow cookies to be sent
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        })

        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            const delays = [0, 2000, 5000, 10000];
            console.log(
              `SignalR attempting reconnection attempt ${
                retryContext.previousRetryCount + 1
              }`
            );
            return delays[retryContext.previousRetryCount] || null;
          },
        })
        .configureLogging(signalR.LogLevel.Debug)
        .build();

      // Add connection state change handler
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

      // Log transport negotiation
      this.connection.onreconnecting((error) => {
        console.log("SignalR: Attempting to reconnect...", error);
      });

      // Start the connection with detailed logging
      console.log("SignalR: Starting connection...");
      try {
        await this.connection.start();
        console.log("SignalR: Successfully connected!");

        // Log the active transport being used
        console.log(
          "SignalR: Using transport:",
          this.connection.connection.transport.name
        );
        console.log("SignalR: Connection ID:", this.connection.connectionId);
      } catch (startError) {
        if (startError.statusCode === 401) {
          console.error(
            "SignalR: Authentication failed. Token may be invalid or expired."
          );
          // Trigger token refresh if needed
          try {
            const { fetchWithRefresh } = await import(
              "../Context/RefereshToken"
            );
            await fetchWithRefresh("/apis/auth/refresh", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            });
            console.log("SignalR: Token refreshed, retrying connection...");
            return this.startConnection(); // Retry connection after token refresh
          } catch (refreshError) {
            console.error("SignalR: Token refresh failed:", refreshError);
            return false;
          }
        }
        console.error("SignalR: Start connection failed:", startError);
        return false;
      }

      // Setup ongoing connection monitoring
      this.connection.onclose((error) => {
        console.log("SignalR: Connection closed:", error);
      });

      return true;
    } catch (err) {
      console.error("SignalR Connection Error:", err);
      return false;
    }
  }

  async stopConnection() {
    // Only log a warning if there's no connection, don't throw an error
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
      // Don't throw the error, just log it
      this.connection = null;
    }
  }

  // Join a specific task chat room
  async joinTaskChat(taskId) {
    if (!this.connection) {
      console.error("Cannot join task chat: No SignalR connection");
      return;
    }
    try {
      console.log(`Attempting to join task chat: ${taskId}`);
      await this.connection.invoke("JoinTaskChat", taskId);
      console.log(`Successfully joined task chat: ${taskId}`);
    } catch (err) {
      console.error(`Error joining task chat ${taskId}:`, err);
      throw err;
    }
  }

  // Leave a specific task chat room
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

  // Send a message to a task chat
  async sendMessage(message) {
    if (!this.connection) {
      console.error("Cannot send message: No SignalR connection");
      throw new Error("No SignalR connection available");
    }
    try {
      console.log("Sending message:", {
        ...message,
        content: message.conversationText,
      });
      await this.connection.invoke("SendMessage", message);
      console.log("Message sent successfully");
    } catch (err) {
      console.error("Error sending message:", err);
      throw err;
    }
  }

  // Register message handler
  onReceiveMessage(callback) {
    if (!this.connection) {
      console.error("Cannot register message handler: No SignalR connection");
      return;
    }
    console.log("Registering message handler");
    this.connection.on("ReceiveMessage", (message) => {
      console.log("Received message:", message);
      callback(message);
    });
  }

  // Register user joined handler
  onUserJoined(callback) {
    if (!this.connection) {
      console.error(
        "Cannot register user joined handler: No SignalR connection"
      );
      return;
    }
    console.log("Registering user joined handler");
    this.connection.on("UserJoined", (user) => {
      console.log("User joined:", user);
      callback(user);
    });
  }

  // Register user left handler
  onUserLeft(callback) {
    if (!this.connection) {
      console.error("Cannot register user left handler: No SignalR connection");
      return;
    }
    console.log("Registering user left handler");
    this.connection.on("UserLeft", (user) => {
      console.log("User left:", user);
      callback(user);
    });
  }

  // Remove all handlers
  removeHandlers() {
    if (!this.connection) {
      console.warn("Cannot remove handlers: No SignalR connection");
      return;
    }
    console.log("Removing all SignalR event handlers");
    this.connection.off("ReceiveMessage");
    this.connection.off("UserJoined");
    this.connection.off("UserLeft");
    console.log("All handlers removed");
  }

  // Check if connection is active
  isConnected() {
    const connected =
      this.connection?.state === signalR.HubConnectionState.Connected;
    console.log("SignalR connection state:", this.connection?.state);
    return connected;
  }

  // Get current connection state
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
