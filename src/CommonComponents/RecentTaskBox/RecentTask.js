import React, { useState } from "react";
import Table from "../Table/TableNew";
import AvatarList from "../Avatar/AvatarList";
import CustomDropdown from "../Dropdown/CustomDropdown"; // import your reusable dropdown
import { ListTodo } from "lucide-react";
import "./RecentTask.css";

const RecentTasks = ({ tasks, onTaskClick, title = "Tasks", filter, onFilterChange, showDropdown = true, loading = false }) => {
  // dropdown options
  const filterOptions = [
    { label: "All" },
    { label: "New" },
    { label: "Active" },
    { label: "Under Approval" },
    { label: "Approved" },
    { label: "Published" },
  ];

  // 🔹 filter tasks
  const filteredTasks =
    filter === "All"
      ? tasks
      : tasks.filter((task) => task.status === filter);

  const renderCell = (key, item) => {
    const handleClick = (e) => {
      e.stopPropagation();
      onTaskClick?.(item, key);
    };

    switch (key) {
      case "status":
        return (
          <span
            className={`status-badge ${item.status.toLowerCase().replace(" ", "-")}`}
            onClick={handleClick}
          >
            {item.status}
          </span>
        );
      case "taskName":
        return (
          <span className="task-link" onClick={handleClick}>
            {item.taskName}
          </span>
        );
      case "assignedTo":
        return (
          <div onClick={handleClick}>
            <AvatarList avatars={item.assignedTo} maxVisible={2} stack={true} />
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
    status: "",
    taskName: "",
    eventName: "",
    assignedTo: [],
    dueDate: "",
    id: `skeleton-${i}`,
  }));

  return (
    <div className="recent-tasks-container">
      {/* Header */}
      <div className="recent-tasks-header">
        <div className="header_left">
          <ListTodo />
          <p>{title}</p>
        </div>
        {showDropdown && (
          <CustomDropdown
            options={filterOptions}
            defaultLabel={filter}
            onSelect={(option) => onFilterChange(option.label)}
          />
        )}
      </div>

      {/* Table */}
      <Table
        columns={[
          { key: "status", label: "Status" },
          { key: "taskName", label: "Task Name" },
          { key: "eventName", label: "Event Name" },
          { key: "assignedTo", label: "Assigned To" },
          { key: "dueDate", label: "Due Date" },
        ]}
        data={loading ? skeletonRows : filteredTasks}
        renderCell={loading ? () => <div className="skeleton-row-cell" /> : renderCell}
        sortableColumns={["taskName", "eventName", "dueDate"]}
        showActions={false}
        onRowClick={loading ? undefined : (task) => onTaskClick?.(task)}
        className="fixed-height"
      />
    </div>
  );
};

export default RecentTasks;
