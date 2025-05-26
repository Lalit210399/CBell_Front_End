// src/components/Reactions.jsx
import React from 'react';

const Reactions = ({ reactions }) => {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="reactions">
      {reactions.map((reaction, index) => (
        <span key={index} className="reaction">
          {reaction}
        </span>
      ))}
    </div>
  );
};

export default Reactions;