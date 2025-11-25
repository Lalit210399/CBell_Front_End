import React, { useState } from 'react';
import { X, Users, Mail, Plus, Trash2 } from 'lucide-react';
import './CreateGroupModal.css';

const CreateGroupModal = ({ onClose, onCreate }) => {
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState('');

  const handleAddEmail = () => {
    const email = newEmail.trim();
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (members.includes(email)) {
      setError('This email is already added');
      return;
    }

    setMembers([...members, email]);
    setNewEmail('');
    setError('');
  };

  const handleRemoveEmail = (emailToRemove) => {
    setMembers(members.filter((email) => email !== emailToRemove));
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    if (members.length === 0) {
      setError('Please add at least one member');
      return;
    }

    onCreate({
      name: groupName.trim(),
      members: members,
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  return (
    <>
      <div className="cgm-overlay" onClick={onClose}></div>
      <div className="create-group-modal">
        <div className="cgm-header">
          <div className="cgm-header-content">
            <h2 className="cgm-title">
              <Users size={24} />
              Create New Group
            </h2>
            <p className="cgm-subtitle">
              Set up a new email distribution group
            </p>
          </div>
          <button className="cgm-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="cgm-body">
          {/* Group Name Section */}
          <div className="cgm-section">
            <label className="cgm-label">
              Group Name <span className="required">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Marketing Team, Sales Department..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="cgm-input"
              autoFocus
            />
          </div>

          {/* Add Member Section */}
          <div className="cgm-section">
            <label className="cgm-label">
              Add Members <span className="required">*</span>
            </label>
            <div className="cgm-add-member">
              <div className="cgm-input-wrapper">
                <Mail className="cgm-input-icon" size={18} />
                <input
                  type="email"
                  placeholder="Enter email address..."
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setError('');
                  }}
                  onKeyPress={handleKeyPress}
                  className="cgm-input with-icon"
                />
              </div>
              <button className="cgm-add-btn" onClick={handleAddEmail}>
                <Plus size={18} />
                Add
              </button>
            </div>
            {error && <p className="cgm-error">{error}</p>}
          </div>

          {/* Members List */}
          {members.length > 0 && (
            <div className="cgm-section">
              <label className="cgm-label">
                Members ({members.length})
              </label>
              <div className="cgm-members-list">
                {members.map((email, index) => (
                  <div key={index} className="cgm-member-item">
                    <div className="cgm-member-avatar">
                      {email.charAt(0).toUpperCase()}
                    </div>
                    <span className="cgm-member-email">{email}</span>
                    <button
                      className="cgm-remove-btn"
                      onClick={() => handleRemoveEmail(email)}
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="cgm-footer">
          <button className="cgm-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="cgm-create-btn"
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || members.length === 0}
          >
            Create Group
          </button>
        </div>
      </div>
    </>
  );
};

export default CreateGroupModal;
