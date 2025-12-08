// API Configuration and Utilities
const API_BASE_URLS = {
  auth: '/apis/auth',  // Using your existing proxy setup
  contentCreator: '/apis/content'  // Using your existing proxy setup
};

// Get token from cookies (using your existing auth system)
function getCookieValue(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

export const getToken = () => {
  return getCookieValue('authToken');
};

// Generic fetch wrapper with auth token
export const fetchApi = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
    credentials: 'include',  // Include cookies for authentication
  };

  try {
    const response = await fetch(url, config);
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const errorText = await response.text();
      throw new Error(`Server returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API endpoints (these will use existing login system)
export const authApi = {
  register: (userData) =>
    fetchApi(`${API_BASE_URLS.auth}/register`, {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  getCurrentUser: () =>
    fetchApi(`${API_BASE_URLS.auth}/me`),
};

// Users API endpoints
export const usersApi = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchApi(`${API_BASE_URLS.auth}/users${queryString ? `?${queryString}` : ''}`);
  },

  getById: (userId) =>
    fetchApi(`${API_BASE_URLS.auth}/users/${userId}`),

  update: (userId, userData) =>
    fetchApi(`${API_BASE_URLS.auth}/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),

  delete: (userId) =>
    fetchApi(`${API_BASE_URLS.auth}/users/${userId}`, {
      method: 'DELETE',
    }),
};

// Roles API endpoints
export const rolesApi = {
  getAll: () =>
    fetchApi(`${API_BASE_URLS.auth}/roles`),

  getById: (roleId) =>
    fetchApi(`${API_BASE_URLS.auth}/roles/${roleId}`),

  create: (roleData) =>
    fetchApi(`${API_BASE_URLS.auth}/roles`, {
      method: 'POST',
      body: JSON.stringify(roleData),
    }),

  update: (roleId, roleData) =>
    fetchApi(`${API_BASE_URLS.auth}/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    }),

  delete: (roleId) =>
    fetchApi(`${API_BASE_URLS.auth}/roles/${roleId}`, {
      method: 'DELETE',
    }),

  assignToUser: (userId, roleIds) =>
    fetchApi(`${API_BASE_URLS.auth}/roles/assign/${userId}`, {
      method: 'POST',
      body: JSON.stringify(roleIds),
    }),

  removeFromUser: (userId, roleId) =>
    fetchApi(`${API_BASE_URLS.auth}/roles/remove/${userId}/${roleId}`, {
      method: 'DELETE',
    }),
};

// Organizations API endpoints
export const organizationsApi = {
  getAll: () =>
    fetchApi(`${API_BASE_URLS.auth}/organizations`),

  getById: (orgId) =>
    fetchApi(`${API_BASE_URLS.auth}/organizations/${orgId}`),

  create: (orgData) =>
    fetchApi(`${API_BASE_URLS.auth}/organizations`, {
      method: 'POST',
      body: JSON.stringify(orgData),
    }),

  update: (orgId, orgData) =>
    fetchApi(`${API_BASE_URLS.auth}/organizations/${orgId}`, {
      method: 'PUT',
      body: JSON.stringify(orgData),
    }),

  delete: (orgId) =>
    fetchApi(`${API_BASE_URLS.auth}/organizations/${orgId}`, {
      method: 'DELETE',
    }),
};

// Permissions API endpoints
export const permissionsApi = {
  getModules: () =>
    fetchApi(`${API_BASE_URLS.auth}/modules`),

  getFeatures: (moduleId) =>
    fetchApi(`${API_BASE_URLS.auth}/features${moduleId ? `?moduleId=${moduleId}` : ''}`),

  getPermissionTypes: () =>
    fetchApi(`${API_BASE_URLS.auth}/permission-types`),

  createModule: (moduleData) =>
    fetchApi(`${API_BASE_URLS.auth}/modules`, {
      method: 'POST',
      body: JSON.stringify(moduleData),
    }),

  createFeature: (featureData) =>
    fetchApi(`${API_BASE_URLS.auth}/features`, {
      method: 'POST',
      body: JSON.stringify(featureData),
    }),

  createPermissionType: (permissionTypeData) =>
    fetchApi(`${API_BASE_URLS.auth}/permission-types`, {
      method: 'POST',
      body: JSON.stringify(permissionTypeData),
    }),
};
