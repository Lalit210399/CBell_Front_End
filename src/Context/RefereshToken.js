// RefreshToken.js
import { logout } from "../Services/AuthN";

let isRefreshing = false;
let refreshPromise = null;
let refreshFailed = false; // gate to prevent storms after hard failure

function getCookieValue(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

function buildHeaders(initHeaders = {}, token) {
  const h = new Headers(initHeaders);
  // Only set Authorization if token exists
  if (token) h.set("Authorization", `Bearer ${token}`);
  if (!h.has("Accept")) h.set("Accept", "application/json");
  // Only set content type if caller didn’t provide; for GETs this is unnecessary
  if (!h.has("Content-Type") && !["GET", "HEAD"].includes((initHeaders.method || "").toUpperCase())) {
    h.set("Content-Type", "application/json");
  }
  h.set("ngrok-skip-browser-warning", "1");
  return h;
}

// You may need to switch between cookie-based refresh (credentials) vs. token in cookie body
async function doRefreshToken() {
  // If your server uses cookies (httpOnly) for refresh, you may not need a body at all.
  // Example #1: cookies only
  // const res = await fetch("/apis/auth/refresh-token", {
  //   method: "POST",
  //   credentials: "include",
  // });

  // Example #2: refresh token from non-httpOnly cookie (your current approach)
  const refreshToken = getCookieValue("LocalRefreshToken");
  if (!refreshToken) throw new Error("NO_REFRESH_TOKEN");

  // If your backend expects JSON, keep JSON headers/body. If OAuth2 style, use form-encoded.
  // Form-encoded (commonly required by OAuth2 servers):
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch("/apis/auth/refresh-token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    credentials: "include", // needed if server uses cookies for session/CSRF
    body,
  });

  if (!res.ok) {
    throw new Error(`REFRESH_FAILED_${res.status}`);
  }

  const data = await res.json();
  // Save new tokens; backend may rotate refresh tokens
  if (data?.accessToken) localStorage.setItem("accessToken", data.accessToken);
  if (data?.refreshToken) document.cookie = `LocalRefreshToken=${data.refreshToken}; path=/; SameSite=Lax`;
  return data?.accessToken || null;
}

async function runRefreshOnce() {
  if (refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = doRefreshToken()
    .then((newAccess) => {
      isRefreshing = false;
      refreshPromise = null;
      refreshFailed = false;
      return newAccess;
    })
    .catch((err) => {
      isRefreshing = false;
      refreshPromise = null;
      refreshFailed = true;
      throw err;
    });
  return refreshPromise;
}

async function handleHardLogout(reason = "SESSION_EXPIRED") {
  try {
    await logout();
  } catch (e) {
    // non-fatal
    console.warn("Logout failed:", e);
  } finally {
    // Clear local tokens as a fallback
    try {
      localStorage.removeItem("accessToken");
    } catch {}
    // Global event for a single toast (optional)
    try {
      window.dispatchEvent(new CustomEvent("app:auth-expired", { detail: { reason } }));
    } catch {}
    // Redirect to login
    if (typeof window !== "undefined") {
      window.location.assign("/login?reason=session_expired");
    }
  }
}

export async function fetchWithRefresh(input, init = {}) {
  // Stopstorm: if refresh already failed, short-circuit
  if (refreshFailed) return Promise.reject(new Error("AUTH_REFRESH_FAILED"));

  const method = (init.method || "GET").toUpperCase();
  const initialToken = localStorage.getItem("accessToken");
  const headers = buildHeaders(init.headers, initialToken);

  const makeRequest = (tokenToUse) => {
    const h = buildHeaders(init.headers, tokenToUse);
    return fetch(input, { ...init, method, headers: h });
  };

  let res = await makeRequest(initialToken);

  // Only attempt refresh on 401/403 from protected endpoints
  if (![401, 403].includes(res.status)) {
    return res;
  }

  try {
    // If a refresh is ongoing, wait for it; else start one
    const newToken = await runRefreshOnce();

    if (!newToken) {
      // No token returned but refresh succeeded (rare); try once without token
      return makeRequest(null);
    }

    // Retry original request with the new token
    const retryRes = await makeRequest(newToken);
    return retryRes;
  } catch (err) {
    // Hard failure: logout once and surface controlled error
    await handleHardLogout();
    throw err;
  }
}
