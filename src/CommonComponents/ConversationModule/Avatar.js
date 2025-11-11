// src/components/Avatar.jsx
import React from 'react';

const Avatar = ({ user, small = false, isOnline = false }) => {
  return (
    <div className={`avatar ${small ? 'small' : ''}`} style={{ position: 'relative' }}>
      {user?.avatar || user?.name?.slice(0,2).toUpperCase() || '??'}
      {isOnline && (
        <span className={`avatar-online-dot ${small ? 'small' : ''}`} aria-hidden="true" />
      )}
    </div>
  );
};

export default Avatar;