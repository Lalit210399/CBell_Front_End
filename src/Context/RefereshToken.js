import { logout } from '../Services/AuthN';

// State management for token refresh
let isRefreshing = false;
let refreshPromise = null;
let refreshTokenExpired = false;
let pendingRequests = new Set();

// Utility function to get cookie value
function getCookieValue(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Utility function to validate token format
function isValidToken(token) {
  if (!token || typeof token !== 'string') return false;
  // Basic JWT format validation (3 parts separated by dots)
  const parts = token.split('.');
  return parts.length === 3;
}

// Centralized function to handle token expiration
async function handleTokenExpired() {
  if (refreshTokenExpired) {
    return; // Already handled
  }
  
  refreshTokenExpired = true;
  isRefreshing = false;
  refreshPromise = null;
  
  // Reject all pending requests
  pendingRequests.forEach(reject => {
    reject(new Error('Refresh token expired'));
  });
  pendingRequests.clear();
  
  try {
    await logout();
  } catch (logoutErr) {
    console.error('Logout after refresh token failure failed:', logoutErr);
  }
  
  // Clear all auth-related data
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
  localStorage.removeItem('permissions');
  localStorage.removeItem('dashboard-selected-organization');
  
  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

// Function to perform token refresh
async function performTokenRefresh() {
  if (isRefreshing) {
    return refreshPromise;
  }

  isRefreshing = true;
  
  const refreshToken = getCookieValue('LocalRefreshToken');
  
  if (!refreshToken) {
    isRefreshing = false;
    await handleTokenExpired();
    throw new Error('No refresh token available');
  }

  refreshPromise = fetch('/apis/auth/refresh-token', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': '1'
    },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (res) => {
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          // Refresh token is invalid/expired
          await handleTokenExpired();
          throw new Error('Refresh token expired');
        }
        throw new Error(`Refresh token failed with status ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      if (!data.accessToken || !isValidToken(data.accessToken)) {
        throw new Error('Invalid access token in refresh response');
      }
      
      const newToken = data.accessToken;
      localStorage.setItem('accessToken', newToken);
      
      // Reset refresh state
      isRefreshing = false;
      refreshPromise = null;
      
      return newToken;
    })
    .catch(async (err) => {
      isRefreshing = false;
      refreshPromise = null;
      await handleTokenExpired();
      throw err;
    });

  return refreshPromise;
}

// Main function to handle API calls with automatic token refresh
export async function fetchWithRefresh(input, init = {}) {
  // If refresh token has already expired, don't attempt any requests
  if (refreshTokenExpired) {
    throw new Error('Refresh token expired');
  }

  // Get current access token
  let accessToken = localStorage.getItem('accessToken');
  
  // Validate access token format
  if (!isValidToken(accessToken)) {
    console.warn('Invalid access token format, attempting refresh');
    accessToken = null;
  }

  // Prepare headers
  const headers = {
    ...(init.headers || {}),
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'ngrok-skip-browser-warning': '1',
  };

  // Add authorization header if we have a valid token
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  // Make the initial request
  const response = await fetch(input, { ...init, headers });

  // If request is successful, return response
  if (response.status !== 401) {
    return response;
  }

  // If we get 401, we need to refresh the token
  try {
    // Wait for token refresh (this will handle concurrent requests properly)
    const newToken = await performTokenRefresh();
    
    // Retry the original request with the new token
    const retryHeaders = {
      ...headers,
      Authorization: `Bearer ${newToken}`,
    };

    return fetch(input, { ...init, headers: retryHeaders });
  } catch (err) {
    // If refresh fails, the error is already handled in performTokenRefresh
    throw err;
  }
}

// Function to reset refresh token state (call after successful login)
export function resetRefreshTokenState() {
  isRefreshing = false;
  refreshPromise = null;
  refreshTokenExpired = false;
  pendingRequests.clear();
}

// Function to check if refresh token is expired (for debugging)
export function isRefreshTokenExpired() {
  return refreshTokenExpired;
}

// Function to get current refresh state (for debugging)
export function getRefreshState() {
  return {
    isRefreshing,
    refreshTokenExpired,
    hasRefreshPromise: !!refreshPromise,
    pendingRequestsCount: pendingRequests.size
  };
}

// Function to manually trigger token refresh (for testing/debugging)
export async function manualTokenRefresh() {
  if (refreshTokenExpired) {
    throw new Error('Refresh token has expired');
  }
  
  return performTokenRefresh();
}