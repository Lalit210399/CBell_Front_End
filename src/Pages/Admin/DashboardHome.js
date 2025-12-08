import React from 'react';
import { Link } from 'react-router-dom';
import './DashboardHome.css';

const DashboardHome = () => {
  const stats = [
    {
      title: 'Users Management',
      description: 'Manage user accounts, assign roles, and control access',
      icon: '👥',
      link: '/admin/users',
      color: '#667eea'
    },
    {
      title: 'Roles Management',
      description: 'Create and manage roles with granular permissions',
      icon: '🔐',
      link: '/admin/roles',
      color: '#48bb78'
    },
    {
      title: 'Organizations',
      description: 'Manage organizational hierarchies and structures',
      icon: '🏢',
      link: '/admin/organizations',
      color: '#ed8936'
    },
    {
      title: 'Permissions Setup',
      description: 'Configure modules, features, and permission types',
      icon: '⚙️',
      link: '/admin/permissions/modules',
      color: '#9f7aea'
    }
  ];

  return (
    <div className="dashboard-home">
      <div className="welcome-section">
        <h1>Welcome to Admin Dashboard</h1>
        <p>Manage users, roles, organizations, and permissions from one central location</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <Link 
            key={index} 
            to={stat.link} 
            className="stat-card"
            style={{ borderTopColor: stat.color }}
          >
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
              {stat.icon}
            </div>
            <h3>{stat.title}</h3>
            <p>{stat.description}</p>
            <div className="stat-arrow" style={{ color: stat.color }}>
              →
            </div>
          </Link>
        ))}
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/admin/users" className="action-btn">
            <span>➕</span>
            Create New User
          </Link>
          <Link to="/admin/roles" className="action-btn">
            <span>🔑</span>
            Create New Role
          </Link>
          <Link to="/admin/organizations" className="action-btn">
            <span>🏢</span>
            Add Organization
          </Link>
          <Link to="/admin/permissions/modules" className="action-btn">
            <span>📦</span>
            Add Module
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
