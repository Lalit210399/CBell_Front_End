import React from 'react';
import './StatusBadge.css';

const StatusBadge = ({ status, className = "", onClick }) => {
  const getStatusClass = (status) => {
    if (!status) return '';
    
    // Normalize status to lowercase and replace spaces with hyphens
    const normalizedStatus = status.toLowerCase().replace(/\s+/g, '-');
    
    // Map different status variations to consistent classes
    const statusMap = {
      'new': 'new',
      'active': 'active',
      'under-review': 'under-review',
      'under-approval': 'under-review', // Map under-approval to under-review
      'approved': 'approved',
      'published': 'published',
      'cancelled': 'cancelled',
      'overdue': 'overdue'
    };
    
    return statusMap[normalizedStatus] || normalizedStatus;
  };

  const statusClass = getStatusClass(status);
  const displayText = status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'No Status';

  return (
    <span
      className={`status-badge ${statusClass} ${className}`}
      onClick={onClick}
    >
      {displayText}
    </span>
  );
};

export default StatusBadge;
