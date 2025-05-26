import React from 'react';
import Avatar from './Avatar';
import './AvatarList.css';

const AvatarList = ({ avatars }) => {
  const maxVisibleAvatars = 4; // You can adjust this number

  return (
    <div className="avatar-list">
      {avatars.slice(0, maxVisibleAvatars).map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          name={avatar.name} // Pass name for initials
          size={avatar.size}
          shape={avatar.shape}
        />
      ))}
      {avatars.length > maxVisibleAvatars && (
        <div className="avatar-count">
          +{avatars.length - maxVisibleAvatars}
        </div>
      )}
    </div>
  );
};

export default AvatarList;