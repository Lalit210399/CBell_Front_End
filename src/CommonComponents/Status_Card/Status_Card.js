import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import './Status_Card.css';

const StatusCard = ({ title, count, loading }) => {
  const getColor = (value) => {
    if (value > 10) return 'red';
    if (value > 5) return 'orange';
    return 'green';
  };

  return (
    <div className="status-card">
      <h3>{title}</h3>
      {loading ? (
        <Skeleton width={50} height={30} />
      ) : (
        <p style={{ color: getColor(count) }}>{count}</p>
      )}
    </div>
  );
};

export default StatusCard;
