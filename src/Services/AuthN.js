// Services/AuthN.js

// User Sign Up
export const signup = async (userData) => {
  try {
    const response = await fetch('/apis/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Signup failed');
    }

    return await response.json();
  } catch (error) {
    throw error.message || 'Signup failed';
  }
};

// User Sign In
export const signin = async (credentials) => {
  try {
    const response = await fetch('/apis/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json' // Explicitly ask for JSON
      },
      body: JSON.stringify(credentials),
      credentials: 'include',
    });

    // First check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const errorText = await response.text();
      throw new Error(`Server returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Login failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("Signin error:", error);
    throw error;
  }
};

// User Logout
export const logout = async () => {
  try {
    const response = await fetch('/apis/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }

    // Cleanup
    document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.clear();
    return await response.json();
  } catch (error) {
    throw error.message || 'Logout failed';
  }
};

// Fetch User Permissions
export const getPermissions = async () => {
  try {
    const response = await fetch('/apis/auth/permissions', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch permissions');
    }

    return await response.json();
  } catch (error) {
    throw error.message || 'Error fetching permissions';
  }
};
