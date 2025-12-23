// CommonComponents/IAM/PermissionGuard/PermissionGuard.js
import React from 'react';
import PropTypes from 'prop-types';
import { usePermission } from '../../../Hooks/usePermission';

/**
 * Component to conditionally render children based on user permissions
 * 
 * @example
 * <PermissionGuard module="Administration" feature="Users" permission="Create">
 *   <Button>Create User</Button>
 * </PermissionGuard>
 */
const PermissionGuard = ({
  module,
  feature,
  permission,
  permissions, // For multiple permissions
  requireAll = false, // If true, requires all permissions; if false, requires any
  children,
  fallback = null,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();

  // Handle multiple permissions
  if (permissions && Array.isArray(permissions)) {
    const hasAccess = requireAll
      ? hasAllPermissions(module, feature, permissions)
      : hasAnyPermission(module, feature, permissions);

    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  // Handle single permission
  if (!hasPermission(module, feature, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

PermissionGuard.propTypes = {
  module: PropTypes.string.isRequired,
  feature: PropTypes.string.isRequired,
  permission: PropTypes.string, // Single permission
  permissions: PropTypes.arrayOf(PropTypes.string), // Multiple permissions
  requireAll: PropTypes.bool,
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
};

export default PermissionGuard;
