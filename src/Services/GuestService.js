// Lightweight guest invite and task service
const API_BASE = "/apis";

// Store for retry logic
let refreshPromise = null;

async function request(
  path,
  { method = "GET", body, token, headers = {}, inviteId, retry = true } = {}
) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };
  if (token) {
    opts.headers["Authorization"] = `Bearer ${token}`;
    opts.headers["Session-Identifier"] = token;
  }
  if (body !== undefined) opts.body = JSON.stringify(body);
  
  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json().catch(() => null);
  
  if (!res.ok) {
    // Handle 401 - token expired, try to refresh
    if (res.status === 401 && retry && inviteId) {
      try {
        // Prevent multiple simultaneous refresh calls
        if (!refreshPromise) {
          refreshPromise = GuestService.refreshToken(inviteId);
        }
        const refreshData = await refreshPromise;
        refreshPromise = null;
        
        // Store new token in sessionStorage
        if (typeof sessionStorage !== "undefined") {
          const storageKey = `guest_session_${inviteId}`;
          const existing = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
          sessionStorage.setItem(storageKey, JSON.stringify({
            ...existing,
            token: refreshData.token,
            expiresAt: refreshData.expiresAt,
          }));
        }
        
        // Retry the original request with new token
        return request(path, { method, body, token: refreshData.token, headers, inviteId, retry: false });
      } catch (refreshErr) {
        refreshPromise = null;
        // If refresh fails, throw original error
        const msg = refreshErr.message || "Session expired";
        const err = new Error(msg);
        err.status = refreshErr.status || 401;
        err.data = refreshErr.data;
        throw err;
      }
    }
    
    const msg = (data && data.message) || res.statusText || "Request failed";
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const GuestService = {
  createGuestInvite(payload) {
    // payload: { guestEmail, guestName?, taskId, message?, accessDurationHours }
    return request("/task/guest-invites", { method: "POST", body: payload });
  },
  getInvite(inviteId) {
    return request(`/guest-invites/${inviteId}`);
  },
  verifyInvite(inviteId, otp) {
    return request(`/guest-invites/${inviteId}/verify-otp`, {
      method: "POST",
      body: { otp },
    });
  },
  refreshToken(inviteId) {
    return request(`/guest-invites/${inviteId}/refresh-token`, {
      method: "POST",
    });
  },
  getGuestTask(taskId, token, inviteId) {
    return request(`/guest/tasks/${taskId}/full`, { token, inviteId });
  },
  approveTask(taskId, token, comment, documentId, inviteId) {
    return request(`/guest/tasks/${taskId}/approve`, {
      method: "POST",
      body: { comment, documentId },
      token,
      inviteId,
    }).then(response => response.data || response);
  },
  rejectTask(taskId, token, comment, inviteId) {
    return request(`/guest/tasks/${taskId}/reject`, {
      method: "POST",
      body: { comment },
      token,
      inviteId,
    }).then(response => response.data || response);
  },
};

export default GuestService;
