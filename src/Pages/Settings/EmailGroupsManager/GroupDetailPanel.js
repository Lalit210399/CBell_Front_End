import React, { useState, useEffect } from 'react';
import { X, Mail, Trash2, UserPlus, UserMinus, AlertCircle } from 'lucide-react';
import { validateEmail, normalizeEmail } from '../../../Services/EmailGroups';
import { useEmailGroups } from '../../../Context/EmailGroupsContext';
import { useUser } from '../../../Context/UserContext';
import './GroupDetailPanel.css';

const GroupDetailPanel = ({ group, onClose, onUpdate, onDelete, canManage = true }) => {
  const { resolveRecipients } = useEmailGroups();
  const { user, selectedOrganizationId } = useUser();

  const [members, setMembers] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Load member emails on open / group change.
  // Groups now store only memberEmailIds; emails must be resolved via /groups/resolve.
  useEffect(() => {
    let cancelled = false;

    const loadMembers = async () => {
      setError('');
      setMembers([]);

      const organizationId = selectedOrganizationId || user?.organizationId;
      if (!organizationId) {
        setError('No organization selected. Please select an organization.');
        return;
      }

      setIsLoadingMembers(true);
      try {
        const result = await resolveRecipients([group.id], [], organizationId);
        if (cancelled) return;

        const emails = (result?.uniqueEmails || []).filter(Boolean);
        setMembers(emails);
      } catch (err) {
        if (cancelled) return;
        setError(err.message || 'Failed to load group members');
      } finally {
        if (!cancelled) setIsLoadingMembers(false);
      }
    };

    if (group?.id) {
      loadMembers();
    }

    return () => {
      cancelled = true;
    };
  }, [group?.id, resolveRecipients, selectedOrganizationId, user?.organizationId]);

  const handleAddMember = async () => {
    const email = normalizeEmail(newEmail);
    
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (members.includes(email)) {
      setError('This email is already a member');
      return;
    }

    setIsUpdating(true);
    setError('');

    try {
      const updatedMembers = [...members, email];
      // Send emails; backend converts them to IDs.
      await onUpdate({ ...group, members: updatedMembers });
      setMembers(updatedMembers);
      setNewEmail('');
    } catch (err) {
      setError(err.message || 'Failed to add member');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveMember = async (emailToRemove) => {
    if (members.length === 1) {
      setError('Cannot remove the last member. Delete the group instead.');
      return;
    }

    setIsUpdating(true);
    setError('');

    try {
      const updatedMembers = members.filter((email) => email !== emailToRemove);
      // Send emails; backend converts them to IDs.
      await onUpdate({ ...group, members: updatedMembers });
      setMembers(updatedMembers);
    } catch (err) {
      setError(err.message || 'Failed to remove member');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteGroup = async () => {
    setIsUpdating(true);
    setError('');

    try {
      await onDelete(group.id);
      // Panel will be closed by parent component
    } catch (err) {
      setError(err.message || 'Failed to delete group');
      setIsUpdating(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!isUpdating && canManage) {
        handleAddMember();
      }
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
              {isLoadingMembers
                ? 'Loading members...'
                : `${members.length} ${members.length === 1 ? 'member' : 'members'}`}
            </p>
          </div>
          <button className="gdp-close-btn" onClick={onClose} disabled={isUpdating}>
            <X size={20} />
          </button>
        </div>

        <div className="gdp-body">
          {/* Error Display */}
          {error && (
            <div className="gdp-error-banner">
              <AlertCircle size={18} />
              <span>{error}</span>
              <button onClick={() => setError('')}>
                <X size={16} />
              </button>
            </div>
          )}

          {/* Permission Warning */}
          {!canManage && (
            <div className="gdp-info-banner">
              <AlertCircle size={18} />
              <span>You can view this group but cannot edit or delete it.</span>
            </div>
          )}

          {/* Add Member Section */}
          {canManage && (
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
                    onChange={(e) => {
                      setNewEmail(e.target.value);
                      setError('');
                    }}
                    onKeyPress={handleKeyPress}
                    className="gdp-input"
                    disabled={isUpdating}
                  />
                </div>
                <button
                  className="gdp-add-btn"
                  onClick={handleAddMember}
                  disabled={!newEmail.trim() || isUpdating}
                >
                  {isUpdating ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          )}

          {/* Members List */}
          <div className="gdp-section">
            <div className="gdp-section-header">
              <h3 className="gdp-section-title">
                <Mail size={18} />
                Members
              </h3>
            </div>
            <div className="gdp-members-list">
              {isLoadingMembers ? (
                <div className="gdp-empty-members">
                  <p>Loading members...</p>
                </div>
              ) : members.length === 0 ? (
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
                    {canManage && (
                      <button
                        className="member-remove-btn"
                        onClick={() => handleRemoveMember(email)}
                        title="Remove member"
                        disabled={isUpdating}
                      >
                        <UserMinus size={16} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Danger Zone */}
          {canManage && (
            <div className="gdp-danger-zone">
              <h3 className="gdp-section-title">
                <Trash2 size={18} />
                Danger Zone
              </h3>
              {!showDeleteConfirm ? (
                <button
                  className="gdp-delete-btn"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isUpdating}
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
                      disabled={isUpdating}
                    >
                      Cancel
                    </button>
                    <button 
                      className="delete-confirm-btn" 
                      onClick={handleDeleteGroup}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default GroupDetailPanel;
