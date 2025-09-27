import React from "react";
import Table from "../Table/TableNew";
import AvatarList from "../Avatar/AvatarList";
import { Calendar } from "lucide-react";
import "./ActiveEvents.css";

const ActiveEvents = ({ events, onEventClick, title = "Active Events", loading = false }) => {

  const columns = [
    { key: "eventName", label: "Event Name" },
    { key: "assignTo", label: "Assign To" },
    { key: "displayDate", label: "Event Date" },
    { key: "createdBy", label: "Created By" },
  ];

  // 🔹 filter events - show all events
  const filteredEvents = events;

  const renderCell = (key, item) => {
    const handleClick = (e) => {
      e.stopPropagation();
      onEventClick?.(item, key);
    };

    switch (key) {
      case "eventName":
        return (
          <span className="event-link" onClick={handleClick}>
            {item.eventName || "--"}
          </span>
        );
      case "assignTo":
        return (
          <div onClick={handleClick}>
            {item.assignTo && item.assignTo.length > 0 ? (
              <AvatarList avatars={item.assignTo} maxVisible={2} stack={true} />
            ) : (
              <span>--</span>
            )}
          </div>
        );
      case "createdBy":
        return (
          <div onClick={handleClick} className="created-by-name">
            {item.createdBy?.name || "--"}
          </div>
        );
      default:
        return (
          <span className="clickable-cell" onClick={handleClick}>
            {item[key] || "--"}
          </span>
        );
    }
  };

  // Skeleton rows for loading
  const skeletonRows = Array.from({ length: 5 }, (_, i) => ({
    eventName: "",
    assignTo: [],
    displayDate: "",
    createdBy: { name: "", src: "" },
    id: `skeleton-${i}`,
  }));

  return (
    <div className="active-events-container">
      {/* Header */}
      <div className="active-events-header">
        <div className="header_left">
          <Calendar />
          <span>{title}</span>
        </div>
        {/* <CustomDropdown
          options={filterOptions}
          defaultLabel={filter}
          onSelect={(option) => setFilter(option.label)}
        /> */}
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={loading ? skeletonRows : filteredEvents}
        renderCell={loading ? () => <div className="skeleton-row-cell" /> : renderCell}
        sortableColumns={["eventName", "displayDate"]}
        showActions={false}
        onRowClick={loading ? undefined : (event) => onEventClick?.(event)}
        className="fixed-height"
      />
    </div>
  );
};

export default ActiveEvents;
