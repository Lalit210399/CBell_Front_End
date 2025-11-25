import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, X } from 'lucide-react';
import { useEmailGroups } from '../../../Context/EmailGroupsContext';
import './EmailGroupsManager.css';
import GroupDetailPanel from './GroupDetailPanel';
import CreateGroupModal from './CreateGroupModal';

// Dummy data for initial setup (only used if no groups exist)
const initialGroups = [
  {
    id: 1,
    name: 'Marketing Team',
    members: [
      'john.doe@company.com',
      'jane.smith@company.com',
      'mike.wilson@company.com',
      'sarah.johnson@company.com',
    ],
  },
  {
    id: 2,
    name: 'Development Team',
    members: [
      'dev1@company.com',
      'dev2@company.com',
      'dev3@company.com',
      'dev4@company.com',
      'dev5@company.com',
    ],
  },
  {
    id: 3,
    name: 'Sales Department',
    members: [
      'sales1@company.com',
      'sales2@company.com',
      'sales3@company.com',
    ],
  },
  {
    id: 4,
    name: 'Executive Team',
    members: [
      'ceo@company.com',
      'cto@company.com',
      'cfo@company.com',
    ],
  },
  {
    id: 5,
    name: 'Customer Support',
    members: [
      'support1@company.com',
      'support2@company.com',
      'support3@company.com',
      'support4@company.com',
      'support5@company.com',
      'support6@company.com',
    ],
  },
  {
    id: 6,
    name: 'HR Department',
    members: [
      'hr1@company.com',
      'hr2@company.com',
    ],
  },
];

const EmailGroupsManager = () => {
  const { emailGroups, setEmailGroups, addGroup, updateGroup, deleteGroup } = useEmailGroups();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Load initial dummy data if no groups exist (first time setup)
  useEffect(() => {
    if (emailGroups.length === 0) {
      setEmailGroups(initialGroups);
    }
  }, [emailGroups.length, setEmailGroups]);

  // Filter groups based on search query
  const filteredGroups = emailGroups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateGroup = (newGroup) => {
    addGroup(newGroup);
    setIsCreateModalOpen(false);
  };

  const handleUpdateGroup = (updatedGroup) => {
    updateGroup(updatedGroup.id, updatedGroup);
  };

  const handleDeleteGroup = (groupId) => {
    deleteGroup(groupId);
    setSelectedGroup(null);
  };

  return (
    <div className="email-groups-manager">
      <div className="egm-header">
        <div className="egm-header-content">
          <h2 className="egm-title">Email Groups</h2>
          <p className="egm-subtitle">
            Manage your email distribution lists and contact groups
          </p>
        </div>
        <button
          className="egm-create-btn"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={18} />
          <span>New Group</span>
        </button>
      </div>

      <div className="egm-search-bar">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="egm-search-input"
        />
        {searchQuery && (
          <button
            className="search-clear-btn"
            onClick={() => setSearchQuery('')}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="egm-groups-grid">
        {filteredGroups.length === 0 ? (
          <div className="egm-empty-state">
            <Users size={48} className="empty-icon" />
            <h3>No groups found</h3>
            <p>
              {searchQuery
                ? 'Try a different search term'
                : 'Create your first email group to get started'}
            </p>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div
              key={group.id}
              className="egm-group-card"
              onClick={() => setSelectedGroup(group)}
            >
              <div className="group-card-icon">
                <Users size={24} />
              </div>
              <div className="group-card-content">
                <h3 className="group-card-title">{group.name}</h3>
                <p className="group-card-count">
                  {group.members.length}{' '}
                  {group.members.length === 1 ? 'member' : 'members'}
                </p>
              </div>
              <div className="group-card-arrow">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.5 15L12.5 10L7.5 5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedGroup && (
        <GroupDetailPanel
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
          onUpdate={handleUpdateGroup}
          onDelete={handleDeleteGroup}
        />
      )}

      {isCreateModalOpen && (
        <CreateGroupModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateGroup}
        />
      )}
    </div>
  );
};

export default EmailGroupsManager;
