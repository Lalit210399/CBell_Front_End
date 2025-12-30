//EmailGroup.js
// Services/EmailGroups.js

/**
 * Email Groups API Service
 * Integrates with backend email groups and common list endpoints
 */

const BASE_URL = '/apis/email';

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

  // Handle 204 No Content
  if (response.status === 204) {
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
    const url = organizationId 
      ? `${BASE_URL}/groups?organizationId=${organizationId}`
      : `${BASE_URL}/groups`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    return await handleResponse(response);
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
    const response = await fetch(`${BASE_URL}/groups/${groupId}`, {
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
 * @param {Object} groupData - Group data { name, members, organizationId, userId }
 * @returns {Promise<Object>} Created group object
 */
export const createEmailGroup = async (groupData) => {
  try {
    // Prepare group data with required fields
    const groupPayload = {
      name: groupData.name,
      // Backend uses memberEmails; keep members too for compatibility
      members: groupData.members || [],
      memberEmails: groupData.members || [],
      organizationId: groupData.organizationId,
      createdBy: groupData.userId || 'system' // Get from context
    };

    const response = await fetch(`${BASE_URL}/groups`, {
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
 * @param {Object} groupData - Updated group data { name, members, organizationId }
 * @returns {Promise<void>}
 */
export const updateEmailGroup = async (groupId, groupData) => {
  try {
    const response = await fetch(`${BASE_URL}/groups/${groupId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        ...groupData,
        // Backend uses memberEmails; keep members too for compatibility
        memberEmails: groupData.memberEmails ?? groupData.members ?? [],
        members: groupData.members ?? groupData.memberEmails ?? [],
      }),
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
    const response = await fetch(`${BASE_URL}/groups/${groupId}`, {
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
    const response = await fetch(`${BASE_URL}/groups/resolve`, {
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

    const response = await fetch(`${BASE_URL}/send`, {
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
    const url = organizationId 
      ? `${BASE_URL}/common?organizationId=${organizationId}`
      : `${BASE_URL}/common`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching common email list:', error);
    // Return empty array if endpoint doesn't exist yet
    if (error.message.includes('404')) {
      return [];
    }
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

/**
 * Normalize/Coerce email group members into a clean string array.
 * Backend payloads sometimes return null, a comma-separated string,
 * or .NET-style collections (e.g. { $values: [...] }).
 *
 * @param {unknown} members
 * @returns {string[]}
 */
export const normalizeEmailGroupMembers = (members) => {
  if (!members) return [];

  if (Array.isArray(members)) {
    return members
      .map((m) => (typeof m === 'string' ? normalizeEmail(m) : String(m ?? '').trim().toLowerCase()))
      .filter(Boolean);
  }

  // Handle Sets/iterables that aren't arrays
  if (typeof members === 'object' && typeof members[Symbol.iterator] === 'function') {
    try {
      return normalizeEmailGroupMembers(Array.from(members));
    } catch {
      // Fall through to object handling below
    }
  }

  if (typeof members === 'string') {
    return members
      .split(/[\n,;]+/)
      .map((m) => (typeof m === 'string' ? normalizeEmail(m) : ''))
      .filter(Boolean);
  }

  // Handle common wrapped-list shapes (e.g. .NET $values)
  if (typeof members === 'object') {
    const candidate = members.$values ?? members.values ?? members.items ?? members.members;
    if (candidate) return normalizeEmailGroupMembers(candidate);
  }

  return [];
};

