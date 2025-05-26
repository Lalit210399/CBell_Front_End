import React, { useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import './EventsList.css';

const EventList = ({ title, data = [], type, onSeeAll, icon, loading }) => {
  const [visibleCount, setVisibleCount] = useState(5);

  const isScrollable = data.length > visibleCount;

  const handleSeeAll = () => {
    setVisibleCount((prev) => prev + 5);
    if (onSeeAll) onSeeAll();
  };

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
      <span className="due-date">{item.date}</span>
    </li>
  );

  return (
    <div className="event-list">
      <div className="event-list-header">
        <h3>{title}</h3>
        {icon && <div className="icon-container">{icon}</div>}
      </div>

      <ul className={`${type === 'tasks' ? 'task-list-items' : 'event-list-items'} scrollable-list`}>
        {loading
          ? Array.from({ length: 3 }).map((_, index) => renderSkeletonItem(index))
          : data.slice(0, visibleCount).map((item, index) =>
              type === 'tasks' ? renderTaskColumns(item) : (
                <li key={index} className={`event-item ${type === 'upcoming' ? 'upcoming' : ''}`}>
                  <span className="event-name">{item.name}</span>
                  <span className="event-org">{item.college}</span>
                  <span className="event-date">{item.date}</span>
                </li>
              )
            )}
      </ul>

      {!loading && isScrollable && (
        <button className="see-all-button" onClick={handleSeeAll}>
          See More
        </button>
      )}
    </div>
  );
};

export default EventList;
