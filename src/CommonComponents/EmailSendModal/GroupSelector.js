import React, { useState } from 'react';
import { Users, X, ChevronRight } from 'lucide-react';
import { useEmailGroups } from '../../Context/EmailGroupsContext';
import './GroupSelector.css';

const GroupSelector = ({ onClose, onSelectGroups }) => {
  const { emailGroups } = useEmailGroups();
  const [selectedGroups, setSelectedGroups] = useState([]);

  const toggleGroup = (groupId) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleAddToField = (field) => {
    const selectedGroupObjects = emailGroups.filter((group) =>
      selectedGroups.includes(group.id)
    );

    const allEmails = selectedGroupObjects.flatMap((group) => group.members);
    const uniqueEmails = [...new Set(allEmails)]; // Remove duplicates

    onSelectGroups(uniqueEmails, field);
    onClose();
  };

  const getTotalMembers = () => {
    const selectedGroupObjects = emailGroups.filter((group) =>
      selectedGroups.includes(group.id)
    );
    const allEmails = selectedGroupObjects.flatMap((group) => group.members);
    return new Set(allEmails).size;
  };

  return (
    <>
      <div className="group-selector-overlay" onClick={onClose}></div>
      <div className="group-selector-modal">
        <div className="gs-header">
          <div className="gs-header-content">
            <Users size={20} className="gs-header-icon" />
            <h3 className="gs-title">Select Email Groups</h3>
          </div>
          <button className="gs-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="gs-body">
          {emailGroups.length === 0 ? (
            <div className="gs-empty-state">
              <Users size={48} className="gs-empty-icon" />
              <h4>No Email Groups</h4>
              <p>Create email groups in Settings to use them here.</p>
            </div>
          ) : (
            <div className="gs-groups-list">
              {emailGroups.map((group) => (
                <div
                  key={group.id}
                  className={`gs-group-item ${
                    selectedGroups.includes(group.id) ? 'selected' : ''
                  }`}
                  onClick={() => toggleGroup(group.id)}
                >
                  <div className="gs-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedGroups.includes(group.id)}
                      onChange={() => {}}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="gs-group-info">
                    <div className="gs-group-name">{group.name}</div>
                    <div className="gs-group-count">
                      {group.members.length}{' '}
                      {group.members.length === 1 ? 'member' : 'members'}
                    </div>
                  </div>
                  <ChevronRight size={16} className="gs-arrow" />
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedGroups.length > 0 && (
          <div className="gs-footer">
            <div className="gs-selected-info">
              {selectedGroups.length}{' '}
              {selectedGroups.length === 1 ? 'group' : 'groups'} selected (
              {getTotalMembers()} total recipients)
            </div>
            <div className="gs-actions">
              <button
                className="gs-btn gs-btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <div className="gs-add-buttons">
                <button
                  className="gs-btn gs-btn-primary"
                  onClick={() => handleAddToField('to')}
                >
                  Add to To
                </button>
                <button
                  className="gs-btn gs-btn-outline"
                  onClick={() => handleAddToField('cc')}
                >
                  Add to Cc
                </button>
                <button
                  className="gs-btn gs-btn-outline"
                  onClick={() => handleAddToField('bcc')}
                >
                  Add to Bcc
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default GroupSelector;
