// Task.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Table from "../../../CommonComponents/Table/Table";
import "../Tasks.css";

const columns = [
  { key: "creative_name", label: "Creative Name" },
  { key: "creative_type", label: "Creative Type" },
  { key: "assigned_to", label: "Assigned To" },
  { key: "due_date", label: "Due Date" },
  { key: "status", label: "Status" },
];

const Task = ({ tasksData, eventId }) => {

  const [tasks, setTasks] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const navigate = useNavigate();

  useEffect(() => {
    setTasks(tasksData || []);
  }, [tasksData]);

  const handleSort = (columnKey) => {
    let direction = "asc";
    if (sortConfig.key === columnKey && sortConfig.direction === "asc") {
      direction = "desc";
    }

    const sortedTasks = [...tasks].sort((a, b) => {
      const valA = a[columnKey] ?? ""; // fallback to empty string
      const valB = b[columnKey] ?? "";

      if (typeof valA === "string" && typeof valB === "string") {
        return direction === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setTasks(sortedTasks);
    setSortConfig({ key: columnKey, direction });
  };


  const handleRowClick = (row) => {
    console.log("TaskID:", row.id); // Log the task ID
    navigate('/events/eventDetailPage/tasks', { state: { taskId: row.id, mode: "view", eventId: eventId } });
  };

  return (
    <div className="Publish_Section">
      <Table
        columns={columns}
        data={tasks}
        onSort={handleSort}
        sortableColumns={["creative_name", "creative_type", "assigned_to", "due_date", "status"]}
        showActions={false}
        noDataText="No Tasks Scheduled at this time"
        addEventText="Click here to add a New Task"
        onRowClick={handleRowClick}
      />

    </div>
  );
};

export default Task;
