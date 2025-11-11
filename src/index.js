import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { SignalRProvider } from './Context/SignalRContext';
import { UserProvider } from './Context/UserContext';
import { ThemeProvider } from './Context/ThemeContext';
import { MessageProvider } from './Context/MessageContext';
import { EventTypesProvider } from './Context/EventTypesContext';
import { DepartmentProvider } from './Context/DepartmentContext';
import { TaskStatusProvider } from './Context/TaskStatusContext';

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Check if it's an authentication error
  if (event.reason?.message?.includes('Session expired') ||
      event.reason?.message?.includes('Refresh token expired') ||
      event.reason?.message?.includes('Please log in again')) {
    
    console.warn('Authentication error detected, clearing user data');
    
    // Clear user data
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
    localStorage.removeItem('scope');
    localStorage.removeItem('dashboard-selected-organization');
    
    // Dispatch auth expired event
    window.dispatchEvent(new CustomEvent('auth-expired', { 
      detail: { reason: 'unhandled-promise-rejection' } 
    }));
    
    // Prevent the default behavior (logging to console)
    event.preventDefault();
  } else {
    // For other errors, show a generic error message
    console.warn('Unhandled error:', event.reason?.message || 'An unexpected error occurred');
    
    // Prevent the default behavior to avoid showing the error overlay
    event.preventDefault();
  }
});

// Global error handler for JavaScript errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  // Check if it's an authentication-related error
  if (event.error?.message?.includes('Session expired') ||
      event.error?.message?.includes('Refresh token expired') ||
      event.error?.message?.includes('Please log in again')) {
    
    console.warn('Authentication error detected in global error handler');
    
    // Clear user data
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
    localStorage.removeItem('scope');
    localStorage.removeItem('dashboard-selected-organization');
    
    // Dispatch auth expired event
    window.dispatchEvent(new CustomEvent('auth-expired', { 
      detail: { reason: 'global-error-handler' } 
    }));
  } else {
    // For other errors, just log them
    console.warn('Global error:', event.error?.message || 'An unexpected error occurred');
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));

// Register service worker for FCM
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('Service Worker registered successfully:', registration);
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
}

root.render(
  <React.StrictMode>
    <UserProvider>
      <ThemeProvider>
        <MessageProvider>
          <EventTypesProvider>
            <DepartmentProvider>
              <TaskStatusProvider>
                <SignalRProvider>
                  <App />
                </SignalRProvider>
              </TaskStatusProvider>
            </DepartmentProvider>
          </EventTypesProvider>
        </MessageProvider>
      </ThemeProvider>
    </UserProvider>
  </React.StrictMode>
);
