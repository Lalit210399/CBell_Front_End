// utils/fetchWithRefresh.js
import Cookies from 'js-cookie';

let isRefreshing = false;
let refreshPromise = null;

// Helper to get refresh token from cookies by name
function getCookieValue(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

export async function fetchWithRefresh(input, init = {}) {
  let accessToken = localStorage.getItem('accessToken');

  const headers = {
    ...(init.headers || {}),
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'ngrok-skip-browser-warning': '1',
  };

  const response = await fetch(input, { ...init, headers });

  if (response.status !== 401) {
    return response;
  }

  // Access token expired, try refreshing
  if (!isRefreshing) {
    isRefreshing = true;
    // Get refresh token from cookie (not httpOnly)
    let refreshToken = getCookieValue('LocalRefreshToken');
    if (refreshToken) {
      console.log('Refresh token from cookie:', refreshToken);
    } else {
      console.warn('LocalRefreshToken is not accessible in cookies');
    }

    refreshPromise = fetch('/apis/auth/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Refresh token failed');
        return res.json();
      })
      .then((data) => {
        const newToken = data.accessToken;
        localStorage.setItem('accessToken', newToken);
        isRefreshing = false;
        return newToken;
      })
      .catch((err) => {
        isRefreshing = false;
        throw err;
      });
  }

  try {
    const newToken = await refreshPromise;

    // Retry original request with new token
    const retryHeaders = {
      ...headers,
      Authorization: `Bearer ${newToken}`,
    };

    return fetch(input, { ...init, headers: retryHeaders });
  } catch (err) {
    throw err;
  }
}
