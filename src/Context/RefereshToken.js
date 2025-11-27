import { logout } from "../Services/AuthN";
import { showGlobalMessage } from "../Utils/MessageDispatcher";

// State management for refresh process
let isRefreshing = false;
let refreshPromise = null;
let refreshTokenExpired = false;

/** -------------------- Cookie Helpers -------------------- **/
function getCookieValue(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

function deleteCookieValue(name) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict;Secure`;
}

/** -------------------- Handle Token Expiration -------------------- **/
async function handleTokenExpired() {
  if (refreshTokenExpired) return;
  refreshTokenExpired = true;
  isRefreshing = false;
  refreshPromise = null;

  localStorage.removeItem("user");
  localStorage.removeItem("permissions");
  localStorage.removeItem("scope");
  localStorage.removeItem("dashboard-selected-organization");

  deleteCookieValue("user");
  deleteCookieValue("permissions");

  try {
    await logout();
  } catch (err) {
    console.error("Logout after refresh failure failed:", err);
  }

  showGlobalMessage(
    "Your session has expired. Please log in again to continue.",
    "warning",
    5000
  );

  window.dispatchEvent(
    new CustomEvent("auth-expired", { detail: { reason: "refresh-failed" } })
  );

  setTimeout(() => {
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }, 2000);
}

/** -------------------- Perform Token Refresh -------------------- **/
async function performTokenRefresh() {
  if (isRefreshing) return refreshPromise;

  isRefreshing = true;

  refreshPromise = await fetch("/apis/auth/refresh-token", {
    method: "POST",
    credentials: "include", // important
    headers: { "ngrok-skip-browser-warning": "1" }, // optional
  })
    .then(async (res) => {
      if (!res.ok) {
        console.warn("Token refresh failed with status:", res.status);
        await handleTokenExpired();
        throw new Error("Token refresh failed");
      }
      return res; // cookies updated by server
    })
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

  return refreshPromise;
}

/** -------------------- Fetch Wrapper with Auto Refresh -------------------- **/
export async function fetchWithRefresh(input, init = {}) {
  if (refreshTokenExpired) throw new Error("Session expired");

  const headers = {
    ...(init.headers || {}),
    "ngrok-skip-browser-warning": "1",
  };

  // Include cookies in every request
  const requestOptions = {
    ...init,
    headers,
    credentials: "include",
  };

  let response = await fetch(input, requestOptions);

  if (response.status !== 401) {
    return response; // success, no refresh needed
  }

  console.warn("Access token expired, attempting refresh...");

  try {
    const refreshResponse = await performTokenRefresh();
    if (refreshResponse?.ok) {
      // Retry original request
      return fetch(input, requestOptions);
    } else {
      await handleTokenExpired();
      return new Response(
        JSON.stringify({ error: "Session expired. Please log in again." }),
        {
          status: 401,
          statusText: "Unauthorized",
          // headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (err) {
    console.error("Token refresh failed:", err);
    await handleTokenExpired();
    throw err;
  }
}

/** -------------------- Utility Functions -------------------- **/
export function resetRefreshTokenState() {
  isRefreshing = false;
  refreshPromise = null;
  refreshTokenExpired = false;
}

export function isRefreshTokenExpired() {
  return refreshTokenExpired;
}

export function getRefreshState() {
  return {
    isRefreshing,
    refreshTokenExpired,
    hasRefreshPromise: !!refreshPromise,
  };
}

export async function manualTokenRefresh() {
  if (refreshTokenExpired) throw new Error("Refresh token expired");
  return performTokenRefresh();
}
