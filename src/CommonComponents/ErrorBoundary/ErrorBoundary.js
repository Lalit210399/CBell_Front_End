import React from 'react';
import { showGlobalMessage } from '../../Utils/MessageDispatcher';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Check if it's an authentication error
    if (error?.message?.includes('Session expired') ||
        error?.message?.includes('Refresh token expired') ||
        error?.message?.includes('Please log in again')) {
      
      // Show user-friendly message
      showGlobalMessage(
        'Your session has expired. Please log in again to continue.',
        'warning',
        5000
      );
      
      // Clear user data
      localStorage.removeItem('user');
      localStorage.removeItem('permissions');
      localStorage.removeItem('scope');
      localStorage.removeItem('dashboard-selected-organization');
      
      // Dispatch auth expired event
      window.dispatchEvent(new CustomEvent('auth-expired', { 
        detail: { reason: 'error-boundary-caught-auth-error' } 
      }));
      
      // Redirect to login after a short delay
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }, 2000);
    } else {
      // Show generic error message
      showGlobalMessage(
        'Something went wrong. Please try refreshing the page.',
        'error',
        0 // Don't auto-dismiss error messages
      );
    }
  }

  render() {
    if (this.state.hasError) {
      // Check if it's an authentication error
      if (this.state.error?.message?.includes('Session expired') ||
          this.state.error?.message?.includes('Refresh token expired') ||
          this.state.error?.message?.includes('Please log in again')) {
        
        // Return a simple loading state while redirecting
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            padding: '20px',
            textAlign: 'center',
            backgroundColor: '#f8f9fa'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '40px',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              maxWidth: '500px',
              width: '100%'
            }}>
              <h2 style={{ color: '#d97706', marginBottom: '16px' }}>
                Session Expired
              </h2>
              <p style={{ color: '#6c757d', marginBottom: '24px' }}>
                Your session has expired. Redirecting to login page...
              </p>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #d97706',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }}></div>
            </div>
          </div>
        );
      }

      // Generic error fallback UI
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            maxWidth: '500px',
            width: '100%'
          }}>
            <h2 style={{ color: '#dc3545', marginBottom: '16px' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#6c757d', marginBottom: '24px' }}>
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
