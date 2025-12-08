import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';
import AdminRoutes from './routes/adminRoutes';
import './Pages/Admin/AdminApp.css';

function AdminApp() {
  return (
    <div className="admin-app">
      <Router>
        <AdminRoutes />
      </Router>
      <Toaster 
        position="top-right" 
        richColors 
        expand={false}
        duration={3000}
      />
    </div>
  );
}

export default AdminApp;
