import React from "react";
import "./TabMenu.css";
import { SquarePen, CircleX } from "lucide-react";

const TabMenu = ({
  tabs,
  showEditButton,
  onEditClick,
  activeTab,
  setActiveTab,
  isEditMode,
  onCancelClick,
}) => {
  return (
    <div className="tab-container">
      <div className="tab-header">
        <div className="tab-items">
          {tabs.length > 0 ? (
            tabs.map((tab) => (
              <button
                key={tab.label}
                className={`tab-item ${
                  activeTab === tab.label ? "active" : ""
                }`}
                onClick={() => setActiveTab(tab.label)}
              >
                {tab.label}
              </button>
            ))
          ) : (
            <div className="no-tabs">No tabs available</div>
          )}
        </div>

        <div className="tab-actions">
          {isEditMode ? (
            <button className="cancel-button" onClick={onCancelClick}>
              <CircleX size={18} />
            </button>
          ) : showEditButton ? (
            <button className="edit-button" onClick={onEditClick}>
              <SquarePen size={18} />
            </button>
          ) : null}
        </div>
      </div>
      <div className="tab-content">
        {tabs.map(
          (tab) =>
            activeTab === tab.label && (
              <div
                key={tab.label}
                className="tab-panel fade-in scrollable-tab-content"
              >
                {tab.component}
              </div>
            )
        )}
      </div>
    </div>
  );
};

export default TabMenu;