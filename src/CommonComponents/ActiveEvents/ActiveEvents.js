import React, { useState } from "react";
import Table from "../Table/TableNew";
import AvatarList from "../Avatar/AvatarList";
import Avatar from "../Avatar/Avatar";
import CustomDropdown from "../Dropdown/CustomDropdown";
import { Calendar } from "lucide-react";
import "./ActiveEvents.css";

const ActiveEvents = ({ events, onEventClick, title = "Active Events", loading = false }) => {
  const [filter, setFilter] = useState("All");

  const columns = [
    { key: "eventName", label: "Event Name" },
    { key: "assignTo", label: "Assign To" },
    { key: "eventDate", label: "Event Date" },
    { key: "createdBy", label: "Created By" },
  ];

  // dropdown options
  const filterOptions = [
    { label: "All" },
    { label: "Active" },
    { label: "Upcoming" },
    { label: "Completed" },
  ];

  // 🔹 filter events
  const filteredEvents =
    filter === "All"
      ? events
      : events.filter((event) => event.status === filter);

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
            <AvatarList avatars={item.assignTo} maxVisible={2} stack={true} />
          </div>
        );
      case "createdBy":
        return (
          <div onClick={handleClick}>
            <Avatar name={item.createdBy.name} src={item.createdBy.src} size="28px" />
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
    assignTo: [],
    eventDate: "",
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
        sortableColumns={["eventName", "eventDate"]}
        showActions={false}
        onRowClick={loading ? undefined : (event) => onEventClick?.(event)}
        className="fixed-height"
      />
    </div>
  );
};

export default ActiveEvents;
