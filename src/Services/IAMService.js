// Services/IAMService.js

const BASE_URL = '/apis';

// ==================== Module Management ====================

export const getAllModules = async () => {
  try {
    const response = await fetch(`${BASE_URL}/modules`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch modules');
    }

    return await response.json();
  } catch (error) {
    console.error('Get modules error:', error);
    throw error;
  }
};

export const getModuleById = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/modules/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch module');
    }

    return await response.json();
  } catch (error) {
    console.error('Get module error:', error);
    throw error;
  }
};

export const createModule = async (moduleData) => {
  try {
    const response = await fetch(`${BASE_URL}/modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(moduleData),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create module');
    }

    return await response.json();
  } catch (error) {
    console.error('Create module error:', error);
    throw error;
  }
};

export const updateModule = async (id, moduleData) => {
  try {
    const response = await fetch(`${BASE_URL}/modules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(moduleData),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update module');
    }

    return await response.json();
  } catch (error) {
    console.error('Update module error:', error);
    throw error;
  }
};

export const deleteModule = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/modules/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete module');
    }

    return await response.json();
  } catch (error) {
    console.error('Delete module error:', error);
    throw error;
  }
};

// ==================== Feature Management ====================

export const getAllFeatures = async (moduleId = null) => {
  try {
    const url = moduleId 
      ? `${BASE_URL}/features?moduleId=${moduleId}` 
      : `${BASE_URL}/features`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch features');
    }

    return await response.json();
  } catch (error) {
    console.error('Get features error:', error);
    throw error;
  }
};

export const getFeatureById = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/features/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch feature');
    }

    return await response.json();
  } catch (error) {
    console.error('Get feature error:', error);
    throw error;
  }
};

export const createFeature = async (featureData) => {
  try {
    const response = await fetch(`${BASE_URL}/features`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(featureData),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create feature');
    }

    return await response.json();
  } catch (error) {
    console.error('Create feature error:', error);
    throw error;
  }
};

export const updateFeature = async (id, featureData) => {
  try {
    const response = await fetch(`${BASE_URL}/features/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(featureData),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update feature');
    }

    return await response.json();
  } catch (error) {
    console.error('Update feature error:', error);
    throw error;
  }
};

export const deleteFeature = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/features/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete feature');
    }

    return await response.json();
  } catch (error) {
    console.error('Delete feature error:', error);
    throw error;
  }
};

// ==================== Permission Types Management ====================

export const getAllPermissionTypes = async () => {
  try {
    const response = await fetch(`${BASE_URL}/permission-types`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch permission types');
    }

    return await response.json();
  } catch (error) {
    console.error('Get permission types error:', error);
    throw error;
  }
};

export const createPermissionType = async (permissionTypeData) => {
  try {
    const response = await fetch(`${BASE_URL}/permission-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(permissionTypeData),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create permission type');
    }

    return await response.json();
  } catch (error) {
    console.error('Create permission type error:', error);
    throw error;
  }
};

export const setupDefaultPermissionTypes = async () => {
  try {
    const response = await fetch(`${BASE_URL}/permission-types/setup-defaults`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to setup default permission types');
    }

    return await response.json();
  } catch (error) {
    console.error('Setup default permission types error:', error);
    throw error;
  }
};

// ==================== Role Management ====================

export const getAllRoles = async () => {
  try {
    const response = await fetch(`${BASE_URL}/roles`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch roles');
    }

    return await response.json();
  } catch (error) {
    console.error('Get roles error:', error);
    throw error;
  }
};

export const getRoleById = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/roles/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch role');
    }

    return await response.json();
  } catch (error) {
    console.error('Get role error:', error);
    throw error;
  }
};

export const createRole = async (roleData) => {
  try {
    const response = await fetch(`${BASE_URL}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roleData),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create role');
    }

    return await response.json();
  } catch (error) {
    console.error('Create role error:', error);
    throw error;
  }
};

export const updateRole = async (id, roleData) => {
  try {
    const response = await fetch(`${BASE_URL}/roles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roleData),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update role');
    }

    return await response.json();
  } catch (error) {
    console.error('Update role error:', error);
    throw error;
  }
};

export const deleteRole = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/roles/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete role');
    }

    return await response.json();
  } catch (error) {
    console.error('Delete role error:', error);
    throw error;
  }
};

export const addPermissionsToRole = async (roleId, permissions) => {
  try {
    const response = await fetch(`${BASE_URL}/roles/${roleId}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(permissions),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add permissions to role');
    }

    return await response.json();
  } catch (error) {
    console.error('Add permissions to role error:', error);
    throw error;
  }
};

export const assignRolesToUser = async (userId, roleIds) => {
  try {
    const response = await fetch(`${BASE_URL}/roles/assign/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roleIds),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to assign roles to user');
    }

    return await response.json();
  } catch (error) {
    console.error('Assign roles to user error:', error);
    throw error;
  }
};

export const getUserRoles = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/roles/user-roles/${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch user roles');
    }

    return await response.json();
  } catch (error) {
    console.error('Get user roles error:', error);
    throw error;
  }
};

// ==================== User Permissions ====================

export const getCurrentUserPermissions = async () => {
  try {
    const response = await fetch(`${BASE_URL}/auth/permissions`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch user permissions');
    }

    return await response.json();
  } catch (error) {
    console.error('Get user permissions error:', error);
    throw error;
  }
};

export const getUsersByOrganization = async (organizationId) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/users?organizationId=${organizationId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch users');
    }

    return await response.json();
  } catch (error) {
    console.error('Get users error:', error);
    throw error;
  }
};

// ==================== Basic IAM User Management ====================

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @param {string} userData.firstName - User first name
 * @param {string} userData.lastName - User last name
 * @param {string} userData.organizationCode - Organization code
 * @returns {Promise<Object>}
 */
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to register user');
    }

    return await response.json();
  } catch (error) {
    console.error('Register user error:', error);
    throw error;
  }
};

/**
 * Get hierarchy users by organization ID
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Array>}
 */
export const getHierarchyUsers = async (organizationId) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/hierarchy-users/${organizationId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch hierarchy users');
    }

    const data = await response.json();
    // API returns { users: [...], totalCount: ..., message: ... }
    // Extract just the users array
    return data.users || [];
  } catch (error) {
    console.error('Get hierarchy users error:', error);
    throw error;
  }
};

// ==================== Permission Helper Functions ====================

/**
 * Check if a specific permission is granted
 * @param {number} permissionValue - The permission value stored in the role
 * @param {number} bitPosition - The bit position of the permission type
 * @returns {boolean}
 */
export const hasPermission = (permissionValue, bitPosition) => {
  return (permissionValue & (1 << bitPosition)) !== 0;
};

/**
 * Calculate permission value from selected permissions
 * @param {Array} selectedPermissions - Array of {bitPosition, isGranted}
 * @returns {number}
 */
export const calculatePermissionValue = (selectedPermissions) => {
  let value = 0;
  selectedPermissions.forEach(perm => {
    if (perm.isGranted) {
      value |= (1 << perm.bitPosition);
    }
  });
  return value;
};

/**
 * Get all granted permissions from a permission value
 * @param {number} permissionValue - The permission value
 * @param {Array} permissionTypes - Array of all permission types
 * @returns {Array}
 */
export const getGrantedPermissions = (permissionValue, permissionTypes) => {
  return permissionTypes.filter(pt => 
    (permissionValue & (1 << pt.bitPosition)) !== 0
  );
};
