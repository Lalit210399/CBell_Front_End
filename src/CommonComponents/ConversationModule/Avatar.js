// src/components/Avatar.jsx
import React from 'react';

const Avatar = ({ user, small = false }) => {
  return (
    <div className={`avatar ${small ? 'small' : ''}`}>
      {user.avatar}
    </div>
  );
};

export default Avatar;