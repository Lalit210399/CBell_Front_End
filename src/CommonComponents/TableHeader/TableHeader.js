import React from "react";
import "./TableHeader.css";
import { Search, Filter, CirclePlus } from "lucide-react";
import Button from "../Button/Button";

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
        <Button type="button" className="btn-secondary" Icon={Filter}>
          Filters
        </Button>
        <Button
          type="submit"
          className="btn-primary"
          Icon={CirclePlus}
          onClick={onNewEventClick}
          disabled={!permissions?.canCreate || loading}
        >
          New Event
        </Button>
      </div>
    </div>
  );
};

export default TableHeader;
