import React from 'react';
import './Avatar.css';

const Avatar = ({ src, alt = '', size = 'medium', shape = 'circle', children }) => {
  const avatarClass = `avatar ${size} ${shape}`;

  // Use first letter of alt as fallback if no children provided
  const fallbackText = children || alt?.charAt(0).toUpperCase() || '?';

  return (
    <div className={avatarClass}>
      {src ? (
        <img src={src} alt={alt} className="avatar-image" />
      ) : (
        <span className="avatar-fallback">{fallbackText}</span>
      )}
    </div>
  );
};

export default Avatar;
