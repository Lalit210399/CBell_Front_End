// components/ProtectedRoute.js
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../Context/UserContext";

function getCookieValue(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useUser();
  const location = useLocation();

  // Wait until auth state is restored to avoid redirecting away on refresh
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '16px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  // Only check user context - let the API calls handle refresh token validation
  if (!user) {
    // Prevent multiple redirects by checking if we're already on login page
    if (location.pathname !== '/login') {
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
    
    // If already on login page, just return null to prevent blinking
    return null;
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