// Pages/Settings/IAM/IAMSettings.js
import React, { useState } from 'react';
import { Shield, Package, Grid, Users } from 'lucide-react';
import ModuleManagement from './ModuleManagement/ModuleManagement';
import FeatureManagement from './FeatureManagement/FeatureManagement';
import RoleManagement from './RoleManagement/RoleManagement';
import UserManagement from './UserManagement/UserManagement';
import './IAMSettings.css';

/**
 * IAM Settings - Main container for all IAM management pages
 * Provides tabbed navigation between Modules, Features, Roles, and Users
 */
const IAMSettings = () => {
  const [activeTab, setActiveTab] = useState('modules');

  const tabs = [
    { id: 'modules', label: 'Modules', icon: Package },
    { id: 'features', label: 'Features', icon: Grid },
    { id: 'roles', label: 'Roles', icon: Shield },
    { id: 'users', label: 'Users', icon: Users },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'modules':
        return <ModuleManagement />;
      case 'features':
        return <FeatureManagement />;
      case 'roles':
        return <RoleManagement />;
      case 'users':
        return <UserManagement />;
      default:
        return null;
    }
  };

  return (
    <div className="iam-settings">
      <div className="iam-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`iam-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className="iam-tab-icon" size={20} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
      <div className="iam-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default IAMSettings;
