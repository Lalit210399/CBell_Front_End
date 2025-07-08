// components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

function getCookieValue(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

const ProtectedRoute = ({ children }) => {
  const refreshToken = getCookieValue('LocalRefreshToken');
  // accessToken is HttpOnly, so we assume it's managed by backend and not accessible here
  // We only check for the presence of refresh token

  if (!refreshToken) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
