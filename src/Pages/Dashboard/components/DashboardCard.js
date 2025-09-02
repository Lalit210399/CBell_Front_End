import React from 'react';
import PropTypes from 'prop-types';

export const DashboardCard = ({
  title,
  children,
  isLoading,
  isActive,
  accent,
  onFocus,
  className = ''
}) => {
  return (
    <div 
      className={`dashboard-card ${isActive ? 'active' : ''} ${className}`}
      style={{ '--accent-color': accent }}
      onFocus={onFocus}
      tabIndex={0}
    >
      <div className="dashboard-card-header">
        <h2>{title}</h2>
      </div>
      <div className={`dashboard-card-content ${isLoading ? 'dashboard-card-loading' : ''}`}>
        {children}
      </div>
    </div>
  );
};

DashboardCard.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  isLoading: PropTypes.bool,
  isActive: PropTypes.bool,
  accent: PropTypes.string,
  onFocus: PropTypes.func,
  className: PropTypes.string
};

export default DashboardCard;
