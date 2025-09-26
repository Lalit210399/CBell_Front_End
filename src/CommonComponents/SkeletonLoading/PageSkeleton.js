import React from 'react';
import './PageSkeleton.css';

const PageSkeleton = ({ type = "task" }) => {
  if (type === "task") {
    return <TaskDetailSkeleton />;
  } else if (type === "event") {
    return <EventDetailSkeleton />;
  }
  return <div>Loading...</div>;
};

const TaskDetailSkeleton = () => {
  return (
    <div className="task-creation-module">
      {/* Breadcrumb Skeleton */}
      <div className="BreadCrumb">
        <div className="skeleton-breadcrumb">
          <div className="skeleton-breadcrumb-item"></div>
          <div className="skeleton-breadcrumb-separator"></div>
          <div className="skeleton-breadcrumb-item"></div>
          <div className="skeleton-breadcrumb-separator"></div>
          <div className="skeleton-breadcrumb-item"></div>
        </div>
      </div>

      {/* Top Section Skeleton */}
      <div className="Top-Section">
        <div className="skeleton-top-section">
          <div className="skeleton-title"></div>
          <div className="skeleton-status"></div>
          <div className="skeleton-created-by"></div>
          <div className="skeleton-actions">
            <div className="skeleton-button"></div>
            <div className="skeleton-button"></div>
          </div>
        </div>
      </div>

      {/* Inner Content Skeleton */}
      <div className="Inner-Content">
        <div className="skeleton-tabs">
          <div className="skeleton-tab-header">
            <div className="skeleton-tab"></div>
            <div className="skeleton-tab"></div>
            <div className="skeleton-tab"></div>
          </div>
          <div className="skeleton-tab-content">
            <div className="skeleton-form">
              <div className="skeleton-form-row">
                <div className="skeleton-form-field"></div>
                <div className="skeleton-form-field"></div>
              </div>
              <div className="skeleton-form-row">
                <div className="skeleton-form-field"></div>
                <div className="skeleton-form-field"></div>
              </div>
              <div className="skeleton-form-field large"></div>
              <div className="skeleton-form-field large"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EventDetailSkeleton = () => {
  return (
    <div className="event-detail-module">
      {/* Breadcrumb Skeleton */}
      <div className="BreadCrumb">
        <div className="skeleton-breadcrumb">
          <div className="skeleton-breadcrumb-item"></div>
          <div className="skeleton-breadcrumb-separator"></div>
          <div className="skeleton-breadcrumb-item"></div>
          <div className="skeleton-breadcrumb-separator"></div>
          <div className="skeleton-breadcrumb-item"></div>
        </div>
      </div>

      {/* Top Section Skeleton */}
      <div className="Top-Section">
        <div className="skeleton-top-section">
          <div className="skeleton-title"></div>
          <div className="skeleton-event-info">
            <div className="skeleton-info-item"></div>
            <div className="skeleton-info-item"></div>
            <div className="skeleton-info-item"></div>
          </div>
          <div className="skeleton-participants">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-avatar"></div>
            <div className="skeleton-avatar"></div>
          </div>
          <div className="skeleton-actions">
            <div className="skeleton-button"></div>
            <div className="skeleton-button"></div>
          </div>
        </div>
      </div>

      {/* Inner Content Skeleton */}
      <div className="Inner-Content">
        <div className="skeleton-tabs">
          <div className="skeleton-tab-header">
            <div className="skeleton-tab"></div>
            <div className="skeleton-tab"></div>
            <div className="skeleton-tab"></div>
            <div className="skeleton-tab"></div>
          </div>
          <div className="skeleton-tab-content">
            <div className="skeleton-form">
              <div className="skeleton-form-row">
                <div className="skeleton-form-field"></div>
                <div className="skeleton-form-field"></div>
              </div>
              <div className="skeleton-form-field large"></div>
              <div className="skeleton-form-field large"></div>
              <div className="skeleton-form-row">
                <div className="skeleton-form-field"></div>
                <div className="skeleton-form-field"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageSkeleton;
