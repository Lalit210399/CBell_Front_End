// components/ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../Context/UserContext";

function getCookieValue(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

const ProtectedRoute = ({ children }) => {
  const { user } = useUser();
  const refreshToken = getCookieValue("LocalRefreshToken");

  // ✅ Check both refreshToken + user context
  if (!refreshToken || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

// Permission-based guard for route-level access control
export const RequirePermission = ({ children, resource, managementKey = "Event Management", action = "Read" }) => {
  const { permissions: userPermissions } = useUser();

  const hasPermission = (() => {
    if (!userPermissions || !userPermissions.permissions) return false;
    const resourcePermissions = userPermissions.permissions[resource];
    if (!resourcePermissions) return false;
    const actions = resourcePermissions[managementKey];
    if (!Array.isArray(actions)) return false;
    return actions.includes(action);
  })();

  const computeFirstAllowedPath = () => {
    const p = userPermissions?.permissions || {};
    const canDashboard = Array.isArray(p?.Dashboard?.["Dashboard Management"]) && p.Dashboard["Dashboard Management"].includes("Read");
    const canEvents = Array.isArray(p?.Events?.["Event Management"]) && p.Events["Event Management"].includes("Read");
    // Schedule visibility is tied to Events read in current app
    if (canDashboard) return "/dashboard";
    if (canEvents) return "/events";
    // Fallbacks
    return "/login";
  };

  if (!hasPermission) {
    const redirectTo = computeFirstAllowedPath();
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};