import React from "react";
import "./TableHeader.css";
import { Search, CirclePlus } from "lucide-react";

const TableHeader = ({ onSearch, onNewEventClick, loading, permissions }) => {
  return (
    <div className="table-header">
      <h2 className="title">Events</h2>
      <div className="right_section">
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search Event"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        {/* <button type="button" disabled={true} className="filter-button">
          <Filter className="filter-icon" />
          Filters
        </button> */}
        {/* New Event: Only check organization scope (not canCRUD) */}
        {permissions?.canCreate && (
          <button
            type="submit"
            className="new-event-button"
            onClick={onNewEventClick}
            disabled={loading}
          >
            <CirclePlus className="plus-icon" size={16} />
            New Event
          </button>
        )}
      </div>
    </div>
  );
};

export default TableHeader;
