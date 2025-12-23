import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Users, ChevronDown, AlertCircle } from 'lucide-react';
import { useEmailGroups } from '../../Context/EmailGroupsContext';
import { useUser } from '../../Context/UserContext';
import { validateEmail, normalizeEmail } from '../../Services/EmailGroups';
import './EmailSelector.css';

/**
 * EmailSelector Component
 * Allows selecting email groups and individual email addresses
 * Supports preview and resolution of recipients before sending
 */
const EmailSelector = ({ 
  onRecipientsChange, 
  selectedGroupIds = [], 
  individualEmails = [],
  placeholder = "Select groups or enter email addresses...",
  disabled = false,
  showResolveButton = true,
  className = ""
}) => {
  const { emailGroups, fetchEmailGroups, resolveRecipients } = useEmailGroups();
  const { user, selectedOrganizationId } = useUser();
  
  const [localGroupIds, setLocalGroupIds] = useState(selectedGroupIds);
  const [localEmails, setLocalEmails] = useState(individualEmails);
  const [inputValue, setInputValue] = useState('');
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [error, setError] = useState('');
  const [resolvedData, setResolvedData] = useState(null);
  const [isResolving, setIsResolving] = useState(false);
  
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Load email groups on mount
  useEffect(() => {
    const organizationId = selectedOrganizationId || user?.organizationId;
    if (organizationId && emailGroups.length === 0) {
      fetchEmailGroups(organizationId).catch(err => {
        console.error('Failed to load email groups:', err);
      });
    }
  }, [selectedOrganizationId, user?.organizationId, emailGroups.length, fetchEmailGroups]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowGroupDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Notify parent of changes
  useEffect(() => {
    if (onRecipientsChange) {
      onRecipientsChange({
        groupIds: localGroupIds,
        individualEmails: localEmails,
        resolved: resolvedData
      });
    }
  }, [localGroupIds, localEmails, resolvedData, onRecipientsChange]);

  const handleGroupToggle = (groupId) => {
    setLocalGroupIds(prev => {
      const newIds = prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId];
      return newIds;
    });
    setResolvedData(null); // Clear resolved data when groups change
  };

  const handleAddEmail = () => {
    const email = normalizeEmail(inputValue);
    
    if (!email) return;

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (localEmails.includes(email)) {
      setError('This email is already added');
      return;
    }

    setLocalEmails(prev => [...prev, email]);
    setInputValue('');
    setError('');
    setResolvedData(null); // Clear resolved data when emails change
  };

  const handleRemoveEmail = (emailToRemove) => {
    setLocalEmails(prev => prev.filter(email => email !== emailToRemove));
    setResolvedData(null);
  };

  const handleRemoveGroup = (groupId) => {
    setLocalGroupIds(prev => prev.filter(id => id !== groupId));
    setResolvedData(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    } else if (e.key === 'Backspace' && !inputValue && localEmails.length > 0) {
      // Remove last email on backspace if input is empty
      setLocalEmails(prev => prev.slice(0, -1));
      setResolvedData(null);
    }
  };

  const handleResolve = async () => {
    setIsResolving(true);
    setError('');
    
    try {
      const organizationId = selectedOrganizationId || user?.organizationId;
      const result = await resolveRecipients(localGroupIds, localEmails, organizationId);
      setResolvedData(result);
      
      return result;
    } catch (err) {
      setError(err.message || 'Failed to resolve recipients');
      throw err;
    } finally {
      setIsResolving(false);
    }
  };

  const getSelectedGroups = () => {
    return emailGroups.filter(group => localGroupIds.includes(group.id));
  };

  const getTotalRecipientCount = () => {
    if (resolvedData) {
      return resolvedData.uniqueEmails?.length || 0;
    }
    
    // Estimate count before resolution
    const groupMembersCount = getSelectedGroups().reduce(
      (sum, group) => sum + (group.members?.length || 0), 
      0
    );
    return groupMembersCount + localEmails.length;
  };

  return (
    <div className={`email-selector ${className}`}>
      {/* Selected Groups and Emails Display */}
      <div className={`es-selected-container ${disabled ? 'disabled' : ''}`}>
        {/* Selected Groups */}
        {getSelectedGroups().map(group => (
          <div key={group.id} className="es-chip es-group-chip">
            <Users size={14} />
            <span>{group.name}</span>
            <span className="es-chip-count">({group.members?.length || 0})</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemoveGroup(group.id)}
                className="es-chip-remove"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}

        {/* Individual Emails */}
        {localEmails.map((email, index) => (
          <div key={index} className="es-chip es-email-chip">
            <Mail size={14} />
            <span>{email}</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemoveEmail(email)}
                className="es-chip-remove"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}

        {/* Input for adding emails */}
        {!disabled && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyPress}
            placeholder={localGroupIds.length === 0 && localEmails.length === 0 ? placeholder : ''}
            className="es-input"
            disabled={disabled}
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="es-actions">
        {/* Group Selection Button */}
        {!disabled && (
          <div className="es-dropdown-wrapper" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowGroupDropdown(!showGroupDropdown)}
              className="es-group-btn"
              disabled={disabled}
            >
              <Users size={16} />
              <span>Select Groups</span>
              <ChevronDown size={16} className={showGroupDropdown ? 'rotated' : ''} />
            </button>

            {/* Group Dropdown */}
            {showGroupDropdown && (
              <div className="es-dropdown">
                {emailGroups.length === 0 ? (
                  <div className="es-dropdown-empty">
                    <p>No email groups available</p>
                  </div>
                ) : (
                  emailGroups.map(group => (
                    <label key={group.id} className="es-dropdown-item">
                      <input
                        type="checkbox"
                        checked={localGroupIds.includes(group.id)}
                        onChange={() => handleGroupToggle(group.id)}
                      />
                      <div className="es-dropdown-item-content">
                        <span className="es-dropdown-item-name">{group.name}</span>
                        <span className="es-dropdown-item-count">
                          {group.members?.length || 0} members
                        </span>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Resolve Button */}
        {showResolveButton && (localGroupIds.length > 0 || localEmails.length > 0) && (
          <button
            type="button"
            onClick={handleResolve}
            className="es-resolve-btn"
            disabled={disabled || isResolving}
          >
            {isResolving ? 'Resolving...' : `Preview (${getTotalRecipientCount()})`}
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="es-error">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Resolved Recipients Info */}
      {resolvedData && (
        <div className="es-resolved-info">
          <div className="es-resolved-header">
            <Mail size={14} />
            <span>
              {resolvedData.uniqueEmails?.length || 0} unique recipient(s) will receive this email
            </span>
          </div>
          {resolvedData.addedToCommonList && resolvedData.addedToCommonList.length > 0 && (
            <div className="es-resolved-new">
              <AlertCircle size={14} />
              <span>
                {resolvedData.addedToCommonList.length} new address(es) will be added to common list
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailSelector;
