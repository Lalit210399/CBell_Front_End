import React from 'react';
import Avatar from './Avatar';
import './AvatarList.css';

const AvatarList = ({ avatars, stack = true, maxVisible = 4, showTooltip = false }) => {
  const visibleAvatars = avatars.slice(0, maxVisible);

  return (
    <div className={`avatar-list ${stack ? 'stacked' : ''}`}>
      {visibleAvatars.map((avatar, index) => (
        <Avatar
          key={`${avatar.name}-${index}`}
          src={avatar.src}
          alt={avatar.name}
          name={avatar.name}
          size={avatar.size || "32px"}
          shape={avatar.shape || "circle"}
        />
      ))}
      {avatars.length > maxVisible && (
        <div className="avatar-count" title={`${avatars.length - maxVisible} more`}>
          +{avatars.length - maxVisible}
        </div>
      )}
    </div>
  );
};

export default AvatarList;