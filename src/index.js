import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { UserProvider } from './Context/UserContext';
import { ThemeProvider } from './Context/ThemeContext';
import { MessageProvider } from './Context/MessageContext';
import { EventTypesProvider } from './Context/EventTypesContext';
import { DepartmentProvider } from './Context/DepartmentContext';
import { TaskStatusProvider } from './Context/TaskStatusContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <UserProvider>
      <ThemeProvider>
        <MessageProvider>
          <EventTypesProvider>
            <DepartmentProvider>
              <TaskStatusProvider>
                <App />
              </TaskStatusProvider>
            </DepartmentProvider>
          </EventTypesProvider>
        </MessageProvider>
      </ThemeProvider>
    </UserProvider>
  </React.StrictMode>
);