import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { UserProvider } from './Context/UserContext';
import { ThemeProvider } from './Context/ThemeContext';
import { MessageProvider } from './Context/MessageContext'; // <-- New provider

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <UserProvider>
      <ThemeProvider>
        <MessageProvider>  {/* Wrap App with MessageProvider */}
          <App />
        </MessageProvider>
      </ThemeProvider>
    </UserProvider>
  </React.StrictMode>
);