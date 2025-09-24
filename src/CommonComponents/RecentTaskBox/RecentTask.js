import React, { useMemo } from "react";
import Table from "../Table/TableNew";
import AvatarList from "../Avatar/AvatarList";
import CustomDropdown from "../Dropdown/CustomDropdown"; // import your reusable dropdown
import { ListTodo } from "lucide-react";
import { useTaskStatus } from "../../Hooks/useTaskStatus";
import "./RecentTask.css";

<<<<<<< HEAD
const RecentTasks = ({ tasks, onTaskClick, title = "Tasks", filter, onFilterChange }) => {
  // dropdown options
  const filterOptions = [
    { label: "All" },
    { label: "New" },
    { label: "Active" },
    { label: "Under Approval " },
    { label: "Approved" },
    { label: "Published" },
  ];
=======
const RecentTasks = ({ tasks, onTaskClick, title = "Tasks", filter, onFilterChange, showDropdown = true, loading = false }) => {
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
>>>>>>> a3951b3e1e8c4af6b88d0d22f94bb6251b86cdd9

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

  return (
    <div className="recent-tasks-container">
      {/* Header */}
      <div className="recent-tasks-header">
        <div className="header_left">
          <ListTodo />
          <p>{title}</p>
        </div>
        <CustomDropdown
          options={filterOptions}
          defaultLabel={filter}
          onSelect={(option) => onFilterChange(option.label)}
        />
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
        data={filteredTasks}
        renderCell={renderCell}
        sortableColumns={["taskName", "eventName", "dueDate"]}
        showActions={false}
        onRowClick={(task) => onTaskClick?.(task)}
        className="fixed-height"
      />
    </div>
  );
};

export default RecentTasks;
