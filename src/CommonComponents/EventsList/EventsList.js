import React, { useState, useEffect, useRef } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import './EventsList.css';

const EventList = ({ title, data = [], type, onSeeAll, icon, loading }) => {
  const [visibleCount, setVisibleCount] = useState(10);
  const listRef = useRef(null);

  // Infinite scroll handler
  useEffect(() => {
    const listElement = listRef.current;
    if (!listElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = listElement;
      if (scrollTop + clientHeight >= scrollHeight - 20 && visibleCount < data.length) {
        setVisibleCount(prev => Math.min(prev + 10, data.length));
      }
    };

    listElement.addEventListener('scroll', handleScroll);
    return () => listElement.removeEventListener('scroll', handleScroll);
  }, [visibleCount, data.length]);

  const renderSkeletonItem = (index) => (
    <li key={index} className={type === 'tasks' ? 'task-item' : 'event-item'}>
      <Skeleton width="20%" />
      <Skeleton width="30%" />
      <Skeleton width="25%" />
      {type === 'tasks' && <Skeleton width="20%" />}
    </li>
  );

  const renderTaskColumns = (item) => (
    <li key={item.id} className="task-item">
      <span className="task-name">{item.name}</span>
      <span className="event-name">{item.event}</span>
      <span className="org-name">{item.college}</span>
      <span className={`status-badge ${item.statusClass}`}>{item.status}</span>
      <span className="due-date">{item.date}</span>
    </li>
  );

  const renderEventItem = (item, index) => (
    <li key={index} className={`event-item ${type === 'upcoming' ? 'upcoming' : ''}`}>
      <span className="event-name">{item.name}</span>
      <span className="event-org">{item.college}</span>
      <span className="event-date">{item.date}</span>
    </li>
  );

  const renderColumnHeaders = () => {
    if (type === 'tasks') {
      return (
        <li className="column-headers task-item">
          <span className="task-name">Task Name</span>
          <span className="event-name">Event</span>
          <span className="org-name">Organization</span>
          <span className="status-header">Status</span>
          <span className="due-date">Due Date</span>
        </li>
      );
    } else {
      return (
        <li className="column-headers event-item">
          <span className="event-name">Event Name</span>
          <span className="event-org">Organization</span>
          <span className="event-date">Date</span>
        </li>
      );
    }
  };

  return (
    <div className="event-list">
      <div className="event-list-header">
        <h3>{title}</h3>
        {icon && <div className="icon-container">{icon}</div>}
      </div>

      <div className="scrollable-container">
        <ul 
          ref={listRef}
          className={`${type === 'tasks' ? 'task-list-items' : 'event-list-items'}`}
        >
          {!loading && data.length > 0 && (
            <div className="sticky-header">
              {renderColumnHeaders()}
            </div>
          )}
          
          {loading
            ? Array.from({ length: 3 }).map((_, index) => renderSkeletonItem(index))
            : data.slice(0, visibleCount).map((item, index) =>
                type === 'tasks' ? renderTaskColumns(item) : renderEventItem(item, index)
              )}
        </ul>
      </div>
    </div>
  );
};

export default EventList;