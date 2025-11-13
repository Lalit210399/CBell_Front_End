import React, { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [scope, setScope] = useState(null);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scopeChangeTrigger, setScopeChangeTrigger] = useState(0);

  useEffect(() => {
    // simulate restoring session from localStorage
    const storedUser = localStorage.getItem("user");
    const storedPermissions = localStorage.getItem("permissions");
    const storedScope = localStorage.getItem("scope");
    const storedSelectedOrg = localStorage.getItem("dashboard-selected-organization");

    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedPermissions) setPermissions(JSON.parse(storedPermissions));
    if (storedScope) setScope(JSON.parse(storedScope));
    if (storedSelectedOrg) setSelectedOrganizationId(storedSelectedOrg);

    setLoading(false); // ✅ auth state resolved
  }, []);

  // Initialize selected organization when user and scope are available
  useEffect(() => {
    if (user?.organizationId && scope?.accessibleOrganizations && !selectedOrganizationId) {
      // Check if saved org is still accessible
      const savedOrgId = localStorage.getItem("dashboard-selected-organization");
      if (savedOrgId && scope.accessibleOrganizations.some(org => String(org.id) === String(savedOrgId))) {
        setSelectedOrganizationId(savedOrgId);
      } else {
        // Default to user's organization
        setSelectedOrganizationId(String(user.organizationId));
        localStorage.setItem("dashboard-selected-organization", String(user.organizationId));
      }
    }
  }, [user?.organizationId, scope?.accessibleOrganizations, selectedOrganizationId]);

  // Listen for auth expiration events
  useEffect(() => {
    const handleAuthExpired = (event) => {
      //console.log('Auth expired event received:', event.detail);
      resetUserState();
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    
    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, []);

  // Helper function to check if user is viewing their own organization
  const isViewingOwnOrganization = () => {
    return selectedOrganizationId === user?.organizationId;
  };

  const handleScopeChange = (organizationId, currentLocation = null) => {
    // Check if scope change is allowed on current page
    if (currentLocation) {
      // Only allow scope changes on the exact main pages, not sub-paths
      const allowedPages = ['/dashboard','/designer-dashboard', '/events', '/schedule', '/chat'];
      const isAllowedPage = allowedPages.includes(currentLocation.pathname);
      
      // If not on an allowed page, change scope and redirect to dashboard
      if (!isAllowedPage) {
        // Change the scope first
        setSelectedOrganizationId(String(organizationId));
        if (organizationId) {
          localStorage.setItem("dashboard-selected-organization", String(organizationId));
        } else {
          localStorage.removeItem("dashboard-selected-organization");
        }
        // Trigger scope change for components to refetch data
        setScopeChangeTrigger(prev => prev + 1);
        // Then redirect to dashboard
        window.location.href = '/dashboard';
        return;
      }
    }
    
    // Normal scope change for allowed pages
    setSelectedOrganizationId(String(organizationId));
    if (organizationId) {
      localStorage.setItem("dashboard-selected-organization", String(organizationId));
    } else {
      localStorage.removeItem("dashboard-selected-organization");
    }
    
    // Trigger scope change for components to refetch data
    setScopeChangeTrigger(prev => prev + 1);
  };

  // Reset all user-related state (to be called on logout)
  const resetUserState = () => {
    setUser(null);
    setPermissions(null);
    setScope(null);
    setSelectedOrganizationId(null);
    setScopeChangeTrigger(0);
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      setUser, 
      permissions, 
      setPermissions, 
      scope, 
      setScope, 
      selectedOrganizationId,
      handleScopeChange,
      isViewingOwnOrganization,
      loading,
      scopeChangeTrigger,
      resetUserState
    }}>
      {children}
    </UserContext.Provider>
  );
};

/**

 * @name useUser
 * Custom hook to access UserContext
 * @throws {Error} If used outside of UserProvider
 * @returns {Object} UserContext
 */
export const useUser = () => useContext(UserContext);