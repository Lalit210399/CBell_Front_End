import React from 'react';
import './Avatar.css';

const Avatar = ({ src, alt = '', name = '', size = '32px', shape = 'circle' }) => {
  const avatarClass = `avatar ${size} ${shape}`;

  const getInitials = (nameStr) => {
    if (!nameStr) return '?';
    
    const names = nameStr.trim().split(' ');
    let initials = names[0].substring(0, 1).toUpperCase();
    
    if (names.length > 1) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase();
    }
    
    return initials;
  };

  const fallbackContent = getInitials(name) || alt?.charAt(0).toUpperCase() || '?';

  return (
    <div className={avatarClass}>
      {src ? (
        <img src={src} alt={alt} className="avatar-image" onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }} />
      ) : null}
      <span className="avatar-fallback" style={src ? { display: 'none' } : {}}>
        {fallbackContent}
      </span>
    </div>
  );
};

export default Avatar;