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
 
    // If server responded with 401 (session revoked / unauthorized),
    // clear any stale auth cookies and localStorage to ensure a clean state.
    if (!response.ok) {
      if (response.status === 401) {
        try {
          const cookieNames = ["auth_token", "user", "permissions"];
          cookieNames.forEach((name) => {
            const base = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            document.cookie = base;
            document.cookie = `${base} SameSite=Lax;`;
            document.cookie = `${base} SameSite=Strict;`;
            if (window.location.protocol === "https:") {
              document.cookie = `${base} SameSite=None; Secure;`;
              document.cookie = `${base} SameSite=Strict; Secure;`;
            }
          });
        } catch (e) {
          console.warn('Failed to clear cookies after 401:', e);
        }
        try {
          localStorage.clear();
        } catch (e) {
          console.warn('Failed to clear localStorage after 401:', e);
        }
      }
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
    const base = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = base;
    document.cookie = `${base} SameSite=Lax;`;
    document.cookie = `${base} SameSite=Strict;`;
    if (window.location.protocol === "https:") {
      document.cookie = `${base} SameSite=None; Secure;`;
      document.cookie = `${base} SameSite=Strict; Secure;`;
    }
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
      headers: {
        'Content-Type': 'application/json',
        Accept: "application/json",
         "ngrok-skip-browser-warning": "1",
       },
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
 
// Services/AuthN.js
 
export const sendOTP = async (email) => {
  try {
    const response = await fetch('/apis/auth/request-reset-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to send OTP');
    return data;
  } catch (error) {
    throw error;
  }
};
 
export const verifyOTP = async (email, otp) => {
  try {
    const response = await fetch('/apis/auth/verify-reset-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'OTP verification failed');
    return data;
  } catch (error) {
    throw error;
  }
};
 
export const resetPassword = async (email, newPassword, otp) => {
  try {
    const response = await fetch('/apis/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, newPassword, otp }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Password reset failed');
    return data;
  } catch (error) {
    throw error;
  }
};
 
// Fetch Hierarchy Users
export const getHierarchyUsers = async (organizationId) => {
  try {
    const response = await fetch(`/apis/auth/hierarchy-users/${organizationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: "application/json",
        "ngrok-skip-browser-warning": "1",
      },
      credentials: 'include',
    });
 
    if (!response.ok) {
      throw new Error('Failed to fetch hierarchy users');
    }
 
    const data = await response.json();
    return data;
  } catch (error) {
    throw error.message || 'Error fetching hierarchy users';
  }
};
 
// Fetch Accessible Organizations
export const getAccessibleOrganizations = async () => {
  try {
    const response = await fetch('/apis/organization/accessible-organizations', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: "application/json",
        "ngrok-skip-browser-warning": "1",
      },
      credentials: 'include',
    });
 
    if (!response.ok) {
      throw new Error('Failed to fetch accessible organizations');
    }
 
    const data = await response.json();
    return data;
  } catch (error) {
    throw error.message || 'Error fetching accessible organizations';
  }
};
 
 
// Fetch Task Type Options
export const getTaskTypeOptions = async () => {
  try {
    const response = await fetch('/apis/tasksType/get-all', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: "application/json",
        "ngrok-skip-browser-warning": "1",
      },
      credentials: 'include',
    });
 
    if (response.status === 404) {
      return null; // Return null to indicate API not available
    }
 
    if (!response.ok) {
      throw new Error(`Failed to fetch task type options: ${response.status}`);
    }
 
    const data = await response.json();
    return data;
  } catch (error) {
    throw error.message || 'Error fetching task type options';
  }
};
 
// Delete Task
export const deleteTask = async (taskId) => {
  try {
    const response = await fetch(`/apis/task/delete/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Accept: "application/json",
        "ngrok-skip-browser-warning": "1",
      },
      credentials: 'include',
    });
 
    if (!response.ok) {
      throw new Error(`Failed to delete task: ${response.status}`);
    }
 
    const data = await response.json();
    return data;
  } catch (error) {
    throw error.message || 'Error deleting task';
  }
};
 
 
 