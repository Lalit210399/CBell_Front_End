// src/App.js
import React from 'react';
import ConversationModule from './ConversationModule';
import './Style.css';

const index = () => {
  const currentUser = {
    id: 'user1',
    name: 'John Doe',
    avatar: 'JD'
  };

  const sampleUsers = [
    currentUser,
    { id: 'user2', name: 'Jane Smith', avatar: 'JS' },
    { id: 'user3', name: 'Mike Johnson', avatar: 'MJ' }
  ];

  return (
    // <div className="app-container">
      <div className="teams-container">
        <ConversationModule currentUser={currentUser} users={sampleUsers} />
      </div>
    // </div>
  );
};

export default index;