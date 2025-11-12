// src/components/Avatar.jsx
import React from 'react';
import { Check, X } from 'lucide-react';

const Avatar = ({ user, small = false, isOnline = false }) => {
  const initials = user?.avatar || user?.name?.slice(0, 2).toUpperCase() || '??';

  return (
    <div
      className={`avatar ${small ? 'small' : ''}`}
      aria-label={`Avatar for ${user?.name || 'unknown user'}`}
    >
      {initials}

      {isOnline ? (
        <span
          className={`avatar-online-dot ${small ? 'small' : ''}`}
          role="img"
          aria-label="online"
          title="Online"
        >
          <Check className="avatar-dot-icon check" aria-hidden="true" />
          </span>
      ) : (
        <span
          className={`avatar-offline-dot ${small ? 'small' : ''}`}
          role="img"
          aria-label="offline"
          title="Offline: check and cross"
        >
          
          <X className="avatar-dot-icon cross" aria-hidden="true" />
        </span>
      )}
    </div>
  );
};

export default Avatar;