import React from 'react';
import { Outlet } from 'react-router-dom';
import '../pages/admin/Admin.css'; // Assuming CSS is moved or shared

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <header className="admin-header">
        <h1>Admin Panel</h1>
        {/* Placeholder header */}
      </header>
      <div className="admin-content">
        <aside className="admin-sidebar">
          {/* Placeholder sidebar */}
          <nav>
            <ul>
              <li>Dashboard</li>
              <li>Users</li>
              <li>Roles</li>
            </ul>
          </nav>
        </aside>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
