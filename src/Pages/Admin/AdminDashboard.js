
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Tile from '../../CommonComponents/Tiles/Tiles';
import Table from '../../CommonComponents/Table/Table';
import { useAdmin } from './AdminContext';
import './Admin.css';
import {
  Users,
  Shield,
  UserCheck,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const AdminDashboard = () => {
  const { users, loading, error, isLoggedIn } = useAdmin();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('users');

  // Original roles data for dashboard
  const dashboardRoles = [
    {
      id: 1,
      name: 'super_admin',
      displayName: 'Super Administrator',
      description: 'Complete system access with all permissions',
    },
    {
      id: 2,
      name: 'admin',
      displayName: 'Administrator',
      description: 'Full administrative access except system settings',
    },
    {
      id: 3,
      name: 'manager',
      displayName: 'Manager',
      description: 'Management access for users and events',
    },
    {
      id: 4,
      name: 'moderator',
      displayName: 'Moderator',
      description: 'Content moderation and user management',
    },
    {
      id: 5,
      name: 'user',
      displayName: 'User',
      description: 'Basic user access with limited permissions',
    },
  ];

  // Calculate statistics
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.status === 'Active').length;
    const totalRoles = dashboardRoles.length;
    const adminRoles = dashboardRoles.filter(role => role.name === 'admin').length;

    return { totalUsers, activeUsers, totalRoles, adminRoles };
  }, [users, dashboardRoles]);

  // Dashboard tiles
  const dashboardTiles = [
    {
      icon: <Users size={24} color="rgba(60, 131, 246, 1)" />,
      count: loading ? "..." : stats.totalUsers,
      title: "Total Users",
      subtitle: "All registered users",
      bgcolor: "rgba(185, 210, 251, 0.2)",
      iconBgColor: "rgba(60, 131, 246, 0.2)",
      borderColor: "rgba(60, 131, 246, 1)",
      textColor: "rgba(30, 58, 138, 1)",
    },
    {
      icon: <UserCheck size={24} color="rgba(52, 168, 83, 1)" />,
      count: loading ? "..." : stats.activeUsers,
      title: "Active Users",
      subtitle: "Currently active users",
      bgcolor: "rgba(181, 224, 194, 0.2)",
      iconBgColor: "rgba(52, 168, 83, 0.2)",
      borderColor: "rgba(92, 185, 117, 1)",
      textColor: "rgba(20, 83, 45, 1)",
    },
    {
      icon: <Shield size={24} color="rgba(168, 85, 247, 1)" />,
      count: loading ? "..." : stats.totalRoles,
      title: "Total Roles",
      subtitle: "Available roles",
      bgcolor: "rgba(224, 194, 251, 0.2)",
      iconBgColor: "rgba(168, 85, 247, 0.2)",
      borderColor: "rgba(168, 85, 247, 1)",
      textColor: "rgba(88, 28, 135, 1)",
    },
    {
      icon: <Settings size={24} color="rgba(249, 115, 22, 1)" />,
      count: loading ? "..." : stats.adminRoles,
      title: "Admin Roles",
      subtitle: "Administrator roles",
      bgcolor: "rgba(253, 205, 170, 0.2)",
      iconBgColor: "rgba(249, 115, 22, 0.2)",
      borderColor: "rgba(249, 115, 22, 1)",
      textColor: "rgba(124, 45, 18, 1)",
    },
  ];

  // Handle tile click
  const handleTileClick = (tile) => {
    if (tile.title === "Total Users" || tile.title === "Active Users") {
      setActiveSection('users');
      navigate('/admin/users');
    } else if (tile.title === "Total Roles" || tile.title === "Admin Roles") {
      setActiveSection('roles');
      navigate('/admin/roles');
    }
  };

  // Handle more button click
  const handleMoreClick = (tile) => {
    if (tile.title === "Total Users" || tile.title === "Active Users") {
      navigate('/admin/users');
    } else if (tile.title === "Total Roles" || tile.title === "Admin Roles") {
      navigate('/admin/roles');
    }
  };

  // Handle user row click
  const handleUserClick = (user) => {
    navigate(`/admin/users/${user.id}/roles`);
  };

  // Handle role actions
  const handleRoleEdit = (role) => {
    navigate(`/admin/roles/${role.id}/edit`);
  };

  const handleRoleDelete = (role) => {
    if (window.confirm(`Are you sure you want to delete the role "${role.displayName}"?`)) {
      // deleteRole function would be called here
    }
  };

  // Handle create role
  const handleCreateRole = () => {
    navigate('/admin/roles/create');
  };

  // Recent users (last 5)
  const recentUsers = users.slice(-5).reverse();

  // Recent roles (last 5)
  const recentRoles = dashboardRoles.slice(-5).reverse();

  const userColumns = [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'email', label: 'Email Address' },
    { key: 'organizationName', label: 'Organization' },
    { key: 'organizationCode', label: 'Org Code' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
  ];

  const roleColumns = [
    { key: 'name', label: 'Name' },
    { key: 'displayName', label: 'Display Name' },
    { key: 'description', label: 'Description' },
  ];

  const renderUserCell = (key, item) => {
    if (key === 'status') {
      return <span className={item.status === 'Active' ? 'status-active' : 'status-inactive'}>{item.status}</span>;
    }
    return item[key];
  };

  if (loading) return <div className="loading">Loading admin dashboard...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-dashboard">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h2>Admin Panel - Manage Users & Roles</h2>
        <div className="welcome-controls">
          <button
            className="dashboard-btn dashboard-btn-primary"
            onClick={() => navigate('/admin/users/create')}
          >
            <Plus size={16} />
            Create User
          </button>
          <button
            className="dashboard-btn dashboard-btn-primary"
            onClick={handleCreateRole}
          >
            <Plus size={16} />
            Create Role
          </button>
        </div>
      </div>

      {/* Summary Tiles */}
      <div className="tiles-container">
        <button className="scroll-btn left" onClick={() => {}}>
          <ChevronLeft size={24} />
        </button>

        <div className="summary-tiles">
          {dashboardTiles.map((tile, idx) => (
            <Tile
              key={idx}
              {...tile}
              onClick={() => handleTileClick(tile)}
              onMoreClick={() => handleMoreClick(tile)}
            />
          ))}
        </div>

        <button
          className="scroll-btn right"
          onClick={() => {}}
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Bottom Section */}
      <div className="admin-bottom-section">
        {/* Recent Users */}
        <div className="recent-users">
          <div className="section-header">
            <Users size={20} />
            <span>Recent Users</span>
          </div>
          <Table
            columns={userColumns}
            data={recentUsers}
            renderCell={renderUserCell}
            noDataText="No users found"
            loading={loading}
            onRowClick={handleUserClick}
            showActions={false}
          />
        </div>

        {/* Recent Roles */}
        <div className="recent-roles">
          <div className="section-header">
            <Shield size={20} />
            <span>Recent Roles</span>
          </div>
          <Table
            columns={roleColumns}
            data={recentRoles}
            noDataText="No roles found"
            loading={loading}
            onRowClick={handleRoleEdit}
            showActions={true}
            onDelete={handleRoleDelete}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
