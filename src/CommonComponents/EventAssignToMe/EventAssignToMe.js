import React from "react";
import Table from "../Table/TableNew";
import AvatarList from "../Avatar/AvatarList";
import { User } from "lucide-react";
import "./EventAssignToMe.css";

const EventAssignToMe = ({ events, onEventClick, title = "Events Assigned to Me", loading = false }) => {

  const columns = [
    { key: "eventName", label: "Event Name" },
    { key: "collegeName", label: "College Name" },
    { key: "assignTo", label: "Assign To" },
    { key: "eventDate", label: "Event Date" },
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
            {item.eventName}
          </span>
        );
      case "assignTo":
        return (
          <div onClick={handleClick}>
            {(!item.assignTo || item.assignTo.length === 0) ? (
              <span>-</span>
            ) : (
              <AvatarList avatars={item.assignTo} maxVisible={2} stack={true} />
            )}
          </div>
        );
      case "createdBy":
        return (
          <div onClick={handleClick} className="created-by-name">
            {item.createdBy.name}
          </div>
        );
      default:
        return (
          <span className="clickable-cell" onClick={handleClick}>
            {item[key]}
          </span>
        );
    }
  };

  // Skeleton rows for loading
  const skeletonRows = Array.from({ length: 5 }, (_, i) => ({
    eventName: "",
    collegeName: "",
    assignTo: [],
    eventDate: "",
    createdBy: { name: "", src: "" },
    id: `skeleton-${i}`,
  }));

  return (
    <div className="event-assign-to-me-container">
      {/* Header */}
      <div className="event-assign-to-me-header">
        <div className="header_left">
          <User />
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
        sortableColumns={["eventName", "collegeName", "eventDate"]}
        showActions={false}
        onRowClick={loading ? undefined : (event) => onEventClick?.(event)}
        className="fixed-height"
      />
    </div>
  );
};

export default EventAssignToMe;
