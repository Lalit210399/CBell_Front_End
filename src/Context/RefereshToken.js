import { logout } from '../Services/AuthN';
import { showGlobalMessage } from '../Utils/MessageDispatcher';

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

// Utility function to delete cookie (only for non-HttpOnly cookies)
function deleteCookieValue(name) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict;Secure`;
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
  
  // Clear all auth-related data
  localStorage.removeItem('user');
  localStorage.removeItem('permissions');
  localStorage.removeItem('scope');
  localStorage.removeItem('dashboard-selected-organization');
  
  // Clear non-HttpOnly cookies
  deleteCookieValue('user');
  deleteCookieValue('permissions');
  
  try {
    await logout();
  } catch (logoutErr) {
    console.error('Logout after refresh token failure failed:', logoutErr);
  }
  
  // Use a more graceful redirect approach
  if (typeof window !== 'undefined') {
    // Show user-friendly message
    showGlobalMessage(
      'Your session has expired. Please log in again to continue.',
      'warning',
      5000
    );
    
    // Dispatch a custom event that components can listen to
    window.dispatchEvent(new CustomEvent('auth-expired', { 
      detail: { reason: 'refresh-token-missing' } 
    }));
    
    // Fallback to redirect if no listener handles the event
    setTimeout(() => {
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }, 2000); // Give user time to see the message
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
      if (!data.accessToken || typeof data.accessToken !== 'string' || data.accessToken.trim() === '') {
        throw new Error('Invalid access token in refresh response');
      }
      
      // Don't store access token in frontend - backend already sets it in LocalAccessToken cookie
      // The backend will handle setting the access token cookie automatically
      // We just need to validate that we received a valid token response
      
      // Reset refresh state
      isRefreshing = false;
      refreshPromise = null;
      
      // Return the token from the response (backend will set it in cookie)
      return data.accessToken;
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

  // Get current access token from backend-set cookie
  let accessToken = getCookieValue('LocalAccessToken');
  
<<<<<<< HEAD
  // Validate access token format
  if (!isValidToken(accessToken)) {
    console.warn('Invalid access token format, attempting refresh');
=======
  // Since access token is backend-only, we don't need to validate its format
  // Just check if it exists and is not null/undefined
  if (!accessToken || accessToken === 'null' || accessToken === 'undefined') {
>>>>>>> f88ac0c2bcc489808a9865f1616882a3a5750ddb
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
  // Only check for refresh token availability when we actually need to refresh
  const refreshToken = getCookieValue('LocalRefreshToken');
  
  if (!refreshToken || refreshToken === 'null' || refreshToken === 'undefined') {
    // No refresh token available, user needs to log in again
    console.warn('Access token expired and no refresh token available, logging out');
    await handleTokenExpired();
    
    // Don't throw error, just return a failed response
    return new Response(
      JSON.stringify({ error: 'Session expired. Please log in again.' }),
      { 
        status: 401, 
        statusText: 'Unauthorized',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

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