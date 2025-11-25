import React, { useState } from 'react';
import { X, Mail, Trash2, UserPlus, UserMinus } from 'lucide-react';
import './GroupDetailPanel.css';

const GroupDetailPanel = ({ group, onClose, onUpdate, onDelete }) => {
  const [members, setMembers] = useState([...group.members]);
  const [newEmail, setNewEmail] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleAddMember = () => {
    const email = newEmail.trim();
    if (email && !members.includes(email)) {
      const updatedMembers = [...members, email];
      setMembers(updatedMembers);
      onUpdate({ ...group, members: updatedMembers });
      setNewEmail('');
    }
  };

  const handleRemoveMember = (emailToRemove) => {
    const updatedMembers = members.filter((email) => email !== emailToRemove);
    setMembers(updatedMembers);
    onUpdate({ ...group, members: updatedMembers });
  };

  const handleDeleteGroup = () => {
    onDelete(group.id);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMember();
    }
  };

  return (
    <>
      <div className="gdp-overlay" onClick={onClose}></div>
      <div className="group-detail-panel">
        <div className="gdp-header">
          <div className="gdp-header-content">
            <h2 className="gdp-title">{group.name}</h2>
            <p className="gdp-subtitle">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </p>
          </div>
          <button className="gdp-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="gdp-body">
          <div className="gdp-section">
            <div className="gdp-section-header">
              <h3 className="gdp-section-title">
                <UserPlus size={18} />
                Add Member
              </h3>
            </div>
            <div className="gdp-add-member">
              <div className="gdp-input-wrapper">
                <Mail className="gdp-input-icon" size={18} />
                <input
                  type="email"
                  placeholder="Enter email address..."
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="gdp-input"
                />
              </div>
              <button
                className="gdp-add-btn"
                onClick={handleAddMember}
                disabled={!newEmail.trim()}
              >
                Add
              </button>
            </div>
          </div>

          <div className="gdp-section">
            <div className="gdp-section-header">
              <h3 className="gdp-section-title">
                <Mail size={18} />
                Members
              </h3>
            </div>
            <div className="gdp-members-list">
              {members.length === 0 ? (
                <div className="gdp-empty-members">
                  <p>No members in this group yet.</p>
                </div>
              ) : (
                members.map((email, index) => (
                  <div key={index} className="gdp-member-item">
                    <div className="member-avatar">
                      {email.charAt(0).toUpperCase()}
                    </div>
                    <span className="member-email">{email}</span>
                    <button
                      className="member-remove-btn"
                      onClick={() => handleRemoveMember(email)}
                      title="Remove member"
                    >
                      <UserMinus size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="gdp-danger-zone">
            <h3 className="gdp-section-title">
              <Trash2 size={18} />
              Danger Zone
            </h3>
            {!showDeleteConfirm ? (
              <button
                className="gdp-delete-btn"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Group
              </button>
            ) : (
              <div className="gdp-delete-confirm">
                <p className="delete-confirm-text">
                  Are you sure? This action cannot be undone.
                </p>
                <div className="delete-confirm-actions">
                  <button
                    className="delete-cancel-btn"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button className="delete-confirm-btn" onClick={handleDeleteGroup}>
                    Yes, Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default GroupDetailPanel;
