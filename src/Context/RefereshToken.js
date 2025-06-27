// utils/fetchWithRefresh.js
import Cookies from 'js-cookie';

let isRefreshing = false;
let refreshPromise = null;

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
    let refreshToken = localStorage.getItem('LocalRefreshToken');
    let source = 'cookie';
    if (!refreshToken) {
      refreshToken = localStorage.getItem('LocalRefreshToken');
      source = refreshToken ? 'localStorage' : 'none';
    }
    if (refreshToken) {
      console.log(`Existing refresh token found in ${source}:`, refreshToken);
    } else {
      console.warn('LocalRefreshToken is not accessible in cookies or localStorage');
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
        console.log('New access token:', newToken);
        console.log('Refresh token:', refreshToken); // Log the refresh token
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
