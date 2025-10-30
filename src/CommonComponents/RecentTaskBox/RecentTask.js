import React, { useMemo, useState } from "react";
import Table from "../Table/TableNew";
import AvatarList from "../Avatar/AvatarList";
import CustomDropdown from "../Dropdown/CustomDropdown"; // import your reusable dropdown
import { ListTodo } from "lucide-react";
import { useTaskStatus } from "../../Hooks/useTaskStatus";
import "./RecentTask.css";

const RecentTasks = ({ tasks, onTaskClick, onEventClick, title = "Tasks", filter, onFilterChange, showDropdown = true, loading = false, disableClientFiltering = false, hideAssignedToColumn = false, showOrganizationColumn = false, showAssignedByColumn = false }) => {
  const { getActiveTaskStatuses } = useTaskStatus();

  // State for sorting
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Handle sorting
  const handleSort = (key, direction) => {
    setSortConfig({ key, direction });
  };

  // Generate filter options from task status context
  const filterOptions = useMemo(() => {
    const activeStatuses = getActiveTaskStatuses();

    // Debug logging to understand what's happening

    // Fallback filter options if context doesn't provide data
    const fallbackOptions = [
      { label: "All" },
      { label: "New", value: "New" },
      { label: "Active", value: "Active" },
      { label: "Under Approval", value: "Under Approval" },
      { label: "Approved", value: "Approved" },
      { label: "Published", value: "Published" },
      // { label: "Cancelled", value: "Cancelled" }
    ];

    // If we have active statuses from context, use them; otherwise use fallback
    if (activeStatuses && activeStatuses.length > 0) {
      const contextOptions = [
        { label: "All" },
        ...activeStatuses.map(status => ({
          label: status.statusName || status.name,
          value: status.statusName || status.name
        }))
      ];
      return contextOptions;
    }

    return fallbackOptions;
  }, [getActiveTaskStatuses]);

  // 🔹 filter tasks (only if client-side filtering is enabled)
  const filteredTasks = useMemo(() => {
    let filtered = disableClientFiltering
      ? tasks
      : (filter === "All"
          ? tasks
          : tasks.filter((task) => task.status === filter));

    // Apply sorting if sortConfig is set
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortConfig.direction === "asc" ? -1 : 1;
        if (bValue == null) return sortConfig.direction === "asc" ? 1 : -1;

        // Handle string sorting
        if (typeof aValue === "string" && typeof bValue === "string") {
          const comparison = aValue.localeCompare(bValue);
          return sortConfig.direction === "asc" ? comparison : -comparison;
        }

        // Handle date sorting (assuming dueDate is a string in DD/MM/YYYY format)
        if (sortConfig.key === "dueDate") {
          const aDate = new Date(aValue.split('/').reverse().join('-'));
          const bDate = new Date(bValue.split('/').reverse().join('-'));
          const comparison = aDate - bDate;
          return sortConfig.direction === "asc" ? comparison : -comparison;
        }

        // Default comparison for other types
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [tasks, filter, disableClientFiltering, sortConfig]);

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
        case "organizationName":
          return "No Organization";
        case "assignedBy":
          return "Unknown";
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
            {(item.status || getEmptyText(key)).charAt(0).toUpperCase() + (item.status || getEmptyText(key)).slice(1).toLowerCase()}
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
              <AvatarList 
                avatars={item.assignedTo} 
                maxVisible={2} 
                stack={true} 
                showTooltip={true}
                tooltipPosition="top"
              />
            ) : (
              <span className="empty-field">{getEmptyText(key)}</span>
            )}
          </div>
        );
      case "assignedBy":
        return (
          <span 
            className="assigned-by-badge" 
            onClick={handleClick}
            title={`Assigned by: ${item.assignedBy || getEmptyText(key)}`}
          >
            {item.assignedBy || getEmptyText(key)}
          </span>
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
    assignedBy: "",
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
          ...(showOrganizationColumn ? [{ key: "organizationName", label: "Organization Name" }] : []),
          ...(hideAssignedToColumn ? [] : [{ key: "assignedTo", label: "Assigned To" }]),
          ...(showAssignedByColumn ? [{ key: "assignedBy", label: "Assigned By" }] : []),
          { key: "dueDate", label: "Due Date" },
        ]}
        data={loading ? skeletonRows : filteredTasks}
        renderCell={loading ? () => <div className="skeleton-row-cell" /> : renderCell}
        sortableColumns={["taskName", "eventName", ...(showOrganizationColumn ? ["organizationName"] : []), "dueDate"]}
        showActions={false}
        onSort={handleSort}
        onRowClick={loading ? undefined : (task) => {
          // Row click - navigate to task detail page
          onTaskClick?.(task);
        }}
        // onCellClick={loading ? undefined : (column, task, event) => {
        //   // Only eventName cell is clickable - navigate to event detail
        //   if (column.key === "eventName") {
        //     // Call the onEventClick handler if provided
        //     onEventClick?.(task);
        //   }
        // }}
        // clickableColumns={["eventName"]} // Only eventName cell is clickable
        rowClickable={true} // Enable row clicks for task navigation
        // cellClickPriority={true} // Event name click overrides row click
        className="fixed-height"
      />
    </div>
  );
};

export default RecentTasks;
