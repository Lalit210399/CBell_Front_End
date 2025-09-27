import React, { useMemo } from "react";
import Table from "../Table/TableNew";
import AvatarList from "../Avatar/AvatarList";
import CustomDropdown from "../Dropdown/CustomDropdown"; // import your reusable dropdown
import { ListTodo } from "lucide-react";
import { useTaskStatus } from "../../Hooks/useTaskStatus";
import "./RecentTask.css";

const RecentTasks = ({ tasks, onTaskClick, title = "Tasks", filter, onFilterChange, showDropdown = true, loading = false, disableClientFiltering = false, hideAssignedToColumn = false }) => {
  const { getActiveTaskStatuses } = useTaskStatus();
  
  // Generate filter options from task status context
  const filterOptions = useMemo(() => {
    const activeStatuses = getActiveTaskStatuses();
    return [
      { label: "All" },
      ...activeStatuses.map(status => ({
        label: status.statusName || status.name,
        value: status.statusName || status.name
      }))
    ];
  }, [getActiveTaskStatuses]);

  // 🔹 filter tasks (only if client-side filtering is enabled)
  const filteredTasks = disableClientFiltering 
    ? tasks 
    : (filter === "All"
        ? tasks
        : tasks.filter((task) => task.status === filter));

  const renderCell = (key, item) => {
    const handleClick = (e) => {
      e.stopPropagation();
      onTaskClick?.(item, key);
    };

    const getEmptyText = (key) => {
      switch (key) {
        case "status":
          return "No Status";
        case "taskName":
          return "Untitled Task";
        case "eventName":
          return "No Event";
        case "assignedTo":
          return "Unassigned";
        case "dueDate":
          return "No Due Date";
        default:
          return "N/A";
      }
    };

    switch (key) {
      case "status":
        return (
          <span
            className={`status-badge ${item.status?.toLowerCase().replace(" ", "-") || ""}`}
            onClick={handleClick}
          >
            {item.status || getEmptyText(key)}
          </span>
        );
      case "taskName":
        return (
          <span className="task-link" onClick={handleClick}>
            {item.taskName || getEmptyText(key)}
          </span>
        );
      case "assignedTo":
        return (
          <div onClick={handleClick}>
            {item.assignedTo && item.assignedTo.length > 0 ? (
              <AvatarList avatars={item.assignedTo} maxVisible={2} stack={true} />
            ) : (
              <span className="empty-field">{getEmptyText(key)}</span>
            )}
          </div>
        );
      default:
        return (
          <span className="clickable-cell" onClick={handleClick}>
            {item[key] || getEmptyText(key)}
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
          <span>{title}</span>
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
          ...(hideAssignedToColumn ? [] : [{ key: "assignedTo", label: "Assigned To" }]),
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
