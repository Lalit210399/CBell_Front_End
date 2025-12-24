// Services/EmailGroups.js

/**
 * Email Groups API Service
 * Integrates with backend email groups and common list endpoints
 */

// Backend moved from `/apis/email/*` to `/api/email/*`.
// Use a fallback strategy to support both during rollout.
const BASE_URLS = ['/api/email', '/apis/email'];

const fetchEmailApi = async (path, options) => {
  let lastResponse = null;

  const mergedOptions = {
    redirect: 'follow',
    // Avoid 304 Not Modified (often no body) causing JSON parse issues.
    cache: 'no-store',
    ...options,
  };

  for (const baseUrl of BASE_URLS) {
    const response = await fetch(`${baseUrl}${path}`, mergedOptions);
    lastResponse = response;

    // If the route doesn't exist on this base, try the next one.
    if (response.status === 404) {
      continue;
    }

    return response;
  }

  return lastResponse;
};

/**
 * Get authorization headers
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '1',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

/**
 * Handle API response
 */
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } else {
      errorMessage = await response.text();
    }
    
    throw new Error(errorMessage);
  }

  // Handle empty-body success statuses
  if (response.status === 204 || response.status === 304) {
    return null;
  }

  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }

  return await response.text();
};

/**
 * Get all email groups for an organization
 * @param {string} organizationId - The organization ID
 * @returns {Promise<Array>} Array of email groups
 */
export const getEmailGroups = async (organizationId) => {
  try {
    const path = organizationId
      ? `/groups?organizationId=${encodeURIComponent(organizationId)}`
      : `/groups`;

    const response = await fetchEmailApi(path, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    const data = await handleResponse(response);

    // Backend may wrap the array.
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.emailGroups)) return data.emailGroups;
    if (Array.isArray(data?.groups)) return data.groups;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.value)) return data.value;
    return [];
  } catch (error) {
    console.error('Error fetching email groups:', error);
    throw error;
  }
};

/**
 * Get a single email group by ID
 * @param {string} groupId - The group ID
 * @returns {Promise<Object>} Email group object
 */
export const getEmailGroupById = async (groupId) => {
  try {
    const response = await fetchEmailApi(`/groups/${encodeURIComponent(groupId)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    return await handleResponse(response);
  } catch (error) {
    console.error(`Error fetching email group ${groupId}:`, error);
    throw error;
  }
};

/**
 * Create a new email group
 * @param {Object} groupData - Group data { name, memberEmails|members, organizationId }
 * @returns {Promise<Object>} Created group object
 */
export const createEmailGroup = async (groupData) => {
  try {
    const memberEmails = Array.isArray(groupData?.memberEmails)
      ? groupData.memberEmails
      : Array.isArray(groupData?.members)
        ? groupData.members
        : [];

    // Prepare group data with required fields
    const groupPayload = {
      name: groupData.name,
      memberEmails,
      organizationId: groupData.organizationId,
    };

    const response = await fetchEmailApi(`/groups`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(groupPayload),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error creating email group:', error);
    throw error;
  }
};

/**
 * Update an existing email group
 * @param {string} groupId - The group ID
 * @param {Object} groupData - Updated group data { name, memberEmails|members, organizationId }
 * @returns {Promise<void>}
 */
export const updateEmailGroup = async (groupId, groupData) => {
  try {
    const memberEmails = Array.isArray(groupData?.memberEmails)
      ? groupData.memberEmails
      : Array.isArray(groupData?.members)
        ? groupData.members
        : [];

    const payload = {
      ...(typeof groupData?.name === 'string' ? { name: groupData.name } : {}),
      ...(groupData?.organizationId ? { organizationId: groupData.organizationId } : {}),
      memberEmails,
    };

    const response = await fetchEmailApi(`/groups/${encodeURIComponent(groupId)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error(`Error updating email group ${groupId}:`, error);
    throw error;
  }
};

/**
 * Delete an email group
 * @param {string} groupId - The group ID
 * @returns {Promise<void>}
 */
export const deleteEmailGroup = async (groupId) => {
  try {
    const response = await fetchEmailApi(`/groups/${encodeURIComponent(groupId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    return await handleResponse(response);
  } catch (error) {
    console.error(`Error deleting email group ${groupId}:`, error);
    throw error;
  }
};

/**
 * Resolve email groups and individual addresses into unique list
 * @param {Object} resolveData - { groupIds: [], individualEmails: [], organizationId: "" }
 * @returns {Promise<Object>} { uniqueEmails: [], addedToCommonList: [] }
 */
export const resolveEmailRecipients = async (resolveData) => {
  try {
    const response = await fetchEmailApi(`/groups/resolve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(resolveData),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error resolving email recipients:', error);
    throw error;
  }
};

/**
 * Send email with attachments
 * @param {Object} emailData - Email data including to, cc, bcc, subject, message, attachments
 * @returns {Promise<Object>} Send result
 */
export const sendEmail = async (emailData) => {
  try {
    const formData = new FormData();
    
    // Add email fields
    formData.append('Subject', emailData.subject || '');
    formData.append('Message', emailData.message || '');
    
    // Add recipients
    if (emailData.to && Array.isArray(emailData.to)) {
      emailData.to.forEach(email => formData.append('To', email));
    }
    
    if (emailData.cc && Array.isArray(emailData.cc)) {
      emailData.cc.forEach(email => formData.append('Cc', email));
    }
    
    if (emailData.bcc && Array.isArray(emailData.bcc)) {
      emailData.bcc.forEach(email => formData.append('Bcc', email));
    }
    
    // Add optional fields
    if (emailData.documentId) {
      formData.append('DocumentId', emailData.documentId);
    }
    
    if (emailData.taskId) {
      formData.append('TaskId', emailData.taskId);
    }
    
    // Add attachments
    if (emailData.attachments && Array.isArray(emailData.attachments)) {
      emailData.attachments.forEach(file => {
        formData.append('Attachment', file, file.name);
      });
    }

    const token = localStorage.getItem('authToken');
    const headers = {
      'ngrok-skip-browser-warning': '1',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };

    const response = await fetchEmailApi(`/send`, {
      method: 'POST',
      headers: headers,
      credentials: 'include',
      body: formData,
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Get common email list (optional - if implemented on backend)
 * @param {string} organizationId - The organization ID
 * @returns {Promise<Array>} Array of common email addresses
 */
export const getCommonEmailList = async (organizationId) => {
  try {
    const path = organizationId
      ? `/common?organizationId=${encodeURIComponent(organizationId)}`
      : `/common`;

    const response = await fetchEmailApi(path, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (response?.status === 404) {
      return [];
    }

    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching common email list:', error);
    throw error;
  }
};

/**
 * Add a single email to the organization's common email list
 * @param {Object} payload - { email: string, organizationId: string }
 * @returns {Promise<Object|null>} API response (if any)
 */
export const addCommonEmail = async ({ email, organizationId }) => {
  try {
    const response = await fetchEmailApi(`/common`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ email, organizationId }),
    });

    // Treat duplicates as success (common backend behavior: 409 Conflict)
    if (response?.status === 409) {
      return null;
    }

    return await handleResponse(response);
  } catch (error) {
    console.error('Error adding common email:', error);
    throw error;
  }
};

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Normalize email address (trim and lowercase)
 * @param {string} email - Email address
 * @returns {string} Normalized email
 */
export const normalizeEmail = (email) => {
  return email.trim().toLowerCase();
};
