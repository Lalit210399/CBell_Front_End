import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, X, AlertCircle } from 'lucide-react';
import { useEmailGroups } from '../../../Context/EmailGroupsContext';
import { useUser } from '../../../Context/UserContext';
import './EmailGroupsManager.css';
import GroupDetailPanel from './GroupDetailPanel';
import CreateGroupModal from './CreateGroupModal';

const EmailGroupsManager = () => {
  const { 
    emailGroups, 
    loading, 
    error, 
    fetchEmailGroups, 
    addGroup, 
    updateGroup, 
    deleteGroup 
  } = useEmailGroups();
  
  const { user, selectedOrganizationId } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [localError, setLocalError] = useState(null);

  // Fetch email groups when component mounts or organization changes
  useEffect(() => {
    const organizationId = selectedOrganizationId || user?.organizationId;
    
    if (organizationId) {
      fetchEmailGroups(organizationId).catch(err => {
        console.error('Failed to load email groups:', err);
        setLocalError(`Failed to load email groups: ${err.message}`);
      });
    } else {
      setLocalError('No organization selected. Please select an organization.');
    }
  }, [selectedOrganizationId, user?.organizationId, fetchEmailGroups]);

  // Filter groups based on search query
  const safeGroups = Array.isArray(emailGroups) ? emailGroups : [];
  const filteredGroups = safeGroups.filter((group) =>
    (group?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateGroup = async (newGroupData) => {
    try {
      setLocalError(null);
      const organizationId = selectedOrganizationId || user?.organizationId;
      
      await addGroup({
        ...newGroupData,
        organizationId: organizationId
      });
      
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Error creating group:', err);
      setLocalError(err.message || 'Failed to create group. Please try again.');
    }
  };

  const handleUpdateGroup = async (updatedGroup) => {
    try {
      setLocalError(null);
      const organizationId = selectedOrganizationId || user?.organizationId;
      
      const savedGroup = await updateGroup(updatedGroup.id, {
        name: updatedGroup.name,
        // Frontend still sends emails; backend converts them to IDs.
        members: updatedGroup.members,
        organizationId: organizationId
      });
      
      // Keep selected group in sync (backend group likely contains memberEmailIds)
      setSelectedGroup(savedGroup || updatedGroup);
    } catch (err) {
      console.error('Error updating group:', err);
      setLocalError(err.message || 'Failed to update group. Please try again.');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      setLocalError(null);
      await deleteGroup(groupId);
      setSelectedGroup(null);
    } catch (err) {
      console.error('Error deleting group:', err);
      setLocalError(err.message || 'Failed to delete group. Please try again.');
    }
  };

  // Check if user has permission to manage groups (not a Designer)
  const canManageGroups = user?.role !== 'Designer';

  return (
    <div className="email-groups-manager">
      <div className="egm-header">
        <div className="egm-header-content">
          <h2 className="egm-title">Email Groups</h2>
          <p className="egm-subtitle">
            Manage your email distribution lists and contact groups
          </p>
        </div>
        {canManageGroups && (
          <button
            className="egm-create-btn"
            onClick={() => setIsCreateModalOpen(true)}
            disabled={loading}
          >
            <Plus size={18} />
            <span>New Group</span>
          </button>
        )}
      </div>

      {/* Error Display */}
      {(error || localError) && (
        <div className="egm-error-banner">
          <AlertCircle size={18} />
          <span>{error || localError}</span>
          <button onClick={() => setLocalError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Permission Warning for Designers */}
      {!canManageGroups && (
        <div className="egm-info-banner">
          <AlertCircle size={18} />
          <span>You can view email groups but cannot create, edit, or delete them.</span>
        </div>
      )}

      <div className="egm-search-bar">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="egm-search-input"
          disabled={loading}
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
        {loading && emailGroups.length === 0 ? (
          <div className="egm-loading-state">
            <div className="loading-spinner"></div>
            <p>Loading email groups...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="egm-empty-state">
            <Users size={48} className="empty-icon" />
            <h3>No groups found</h3>
            <p>
              {searchQuery
                ? 'Try a different search term'
                : canManageGroups 
                  ? 'Create your first email group to get started'
                  : 'No email groups have been created yet'}
            </p>
          </div>
        ) : (
          filteredGroups.map((group) => (
            // New backend returns memberEmailIds; older data may still have members.
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
                  {(group.memberEmailIds?.length ?? group.members?.length ?? 0)}{' '}
                  {(group.memberEmailIds?.length ?? group.members?.length ?? 0) === 1 ? 'member' : 'members'}
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
          canManage={canManageGroups}
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
