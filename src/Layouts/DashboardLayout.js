import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useUser } from '../Context/UserContext';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const menuItems = [
    {
      title: 'Dashboard',
      path: '/admin',
      icon: '📊',
      exact: true
    },
    {
      title: 'Users Management',
      path: '/admin/users',
      icon: '👥'
    },
    {
      title: 'Roles Management',
      path: '/admin/roles',
      icon: '🔐'
    },
    {
      title: 'Organizations',
      path: '/admin/organizations',
      icon: '🏢'
    },
    {
      title: 'Permissions Setup',
      path: '/admin/permissions',
      icon: '⚙️',
      submenu: [
        { title: 'Modules', path: '/admin/permissions/modules' },
        { title: 'Features', path: '/admin/permissions/features' },
        { title: 'Permission Types', path: '/admin/permissions/types' }
      ]
    }
  ];

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
          <button 
            className="toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, index) => (
            <div key={index} className="nav-item-wrapper">
              <NavLink
                to={item.path}
                end={item.exact}
                className={({ isActive }) => 
                  `nav-item ${isActive ? 'active' : ''}`
                }
              >
                <span className="nav-icon">{item.icon}</span>
                {sidebarOpen && <span className="nav-text">{item.title}</span>}
              </NavLink>
              
              {item.submenu && sidebarOpen && (
                <div className="submenu">
                  {item.submenu.map((subItem, subIndex) => (
                    <NavLink
                      key={subIndex}
                      to={subItem.path}
                      className={({ isActive }) => 
                        `submenu-item ${isActive ? 'active' : ''}`
                      }
                    >
                      {subItem.title}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Navbar */}
        <header className="top-navbar">
          <div className="navbar-left">
            <h1>Dashboard</h1>
          </div>
          <div className="navbar-right">
            <div className="user-info">
              <div className="user-avatar">
                {user?.firstName?.[0] || 'A'}
              </div>
              <div className="user-details">
                <span className="user-name">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="user-email">{user?.email}</span>
              </div>
            </div>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
