import React, { useState } from 'react';
import { User, Mail, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../Context/UserContext';
import './Settings.css';
import EmailGroupsManager from './EmailGroupsManager/EmailGroupsManager';
import ProfileSettings from './ProfileSettings/ProfileSettings';
import IAMSettings from './IAM/IAMSettings';

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [activeSection, setActiveSection] = useState('profile');

  // Check if user is a Designer
  const isDesigner = user?.roles?.some(role => role.name === "Designer" || role.displayName === "Designer");

  // Check if user is an Admin (has admin-related roles)
  const isAdmin = user?.roles?.some(role => 
    role.name === "Admin" || 
    role.name === "SuperAdmin" || 
    role.displayName === "Administrator" ||
    role.displayName === "Super Administrator"
  );

  // Redirect designers away from settings page
  React.useEffect(() => {
    if (isDesigner) {
      navigate('/dashboard', { replace: true });
    }
  }, [isDesigner, navigate]);

  const menuSections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'email', label: 'Email Groups', icon: Mail },
    // Show IAM section only for admins
    ...(isAdmin ? [{ id: 'iam', label: 'Access Control', icon: Shield }] : []),
    // { id: 'notifications', label: 'Notifications', icon: Bell },
    // { id: 'security', label: 'Security', icon: Shield },
    // { id: 'appearance', label: 'Appearance', icon: Palette },
    // { id: 'language', label: 'Language & Region', icon: Globe },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'email':
        return <EmailGroupsManager />;
      case 'profile':
        return <ProfileSettings />;
      case 'iam':
        return <IAMSettings />;
      case 'notifications':
        return (
          <div className="settings-content-placeholder">
            <h2>Notification Settings</h2>
            <p>Configure how and when you receive notifications.</p>
          </div>
        );
      case 'security':
        return (
          <div className="settings-content-placeholder">
            <h2>Security Settings</h2>
            <p>Manage your password and security preferences.</p>
          </div>
        );
      case 'appearance':
        return (
          <div className="settings-content-placeholder">
            <h2>Appearance Settings</h2>
            <p>Customize the look and feel of your workspace.</p>
          </div>
        );
      case 'language':
        return (
          <div className="settings-content-placeholder">
            <h2>Language & Region</h2>
            <p>Set your preferred language and regional settings.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-sidebar">
        <div className="settings-header">
          <h1>Settings</h1>
        </div>
        <nav className="settings-menu">
          {menuSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                className={`settings-menu-item ${
                  activeSection === section.id ? 'active' : ''
                }`}
                onClick={() => setActiveSection(section.id)}
              >
                <Icon className="menu-icon" size={20} />
                <span>{section.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      <div className="settings-content">{renderContent()}</div>
    </div>
  );
};

export default Settings;
