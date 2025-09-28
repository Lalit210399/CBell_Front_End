// Task.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Table from "../../../CommonComponents/Table/Table";
import AvatarList from "../../../CommonComponents/Avatar/AvatarList";
import { useUser } from "../../../Context/UserContext";
import { deleteTask } from "../../../Services/AuthN";
import "../Tasks.css";

const columns = [
  { key: "creative_name", label: "Creative Name" },
  { key: "creative_type", label: "Creative Type" },
  { key: "assigned_to", label: "Assigned To" },
  { key: "due_date", label: "Due Date" },
  { key: "status", label: "Status" },
];

const Task = ({ tasksData, eventId, eventName }) => {

  const [tasks, setTasks] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const navigate = useNavigate();
  const { user, permissions: userPermissions } = useUser();

  const permissions = {
    canCreate: userPermissions?.permissions?.Tasks?.["Task Management"]?.includes("Create") ?? false,
    canRead: userPermissions?.permissions?.Tasks?.["Task Management"]?.includes("Read") ?? false,
    canUpdate: userPermissions?.permissions?.Tasks?.["Task Management"]?.includes("Update") ?? false,
    canDelete: userPermissions?.permissions?.Tasks?.["Task Management"]?.includes("Delete") ?? false,
    canArchive: userPermissions?.permissions?.Tasks?.["Task Management"]?.includes("Update") ?? false,
    canDuplicate: userPermissions?.permissions?.Tasks?.["Task Management"]?.includes("Update") ?? false,
  };

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

  // Custom cell renderer for the table (similar to Events.js)
  const renderCell = (key, item) => {
    if (key === "assigned_to") {
      
      // Handle assigned users similar to participants in Events.js
      const assignedUsers = item.assigned_to || [];
      
      if (!Array.isArray(assignedUsers) || assignedUsers.length === 0) {
        return <span className="no-assigned-users">No assigned users</span>;
      }


      // Convert assigned users to avatar format
      const avatars = assignedUsers.map((user, index) => {
        
        // Handle different user object formats
        let userId, firstName, lastName, fullName;
        
        if (typeof user === 'object' && user !== null) {
          // Check for different possible field names
          userId = user.id || user.userId || user._id || index;
          firstName = user.firstName || user.first_name || user.name?.split(' ')[0] || '';
          lastName = user.lastName || user.last_name || user.name?.split(' ').slice(1).join(' ') || '';
          fullName = user.name || user.userName || user.fullName || `${firstName} ${lastName}`.trim() || `User ${index + 1}`;
        } else if (typeof user === 'string') {
          userId = user;
          fullName = user;
          firstName = user.split(' ')[0] || '';
          lastName = user.split(' ').slice(1).join(' ') || '';
        } else {
          userId = index;
          fullName = `User ${index + 1}`;
          firstName = 'User';
          lastName = `${index + 1}`;
        }


        return {
          id: userId,
          name: fullName,
          src: fullName,
          fallback: fullName.charAt(0).toUpperCase() || "?",
          size: "32px",
          shape: "circle",
        };
      });


      return (
        <AvatarList
          avatars={avatars}
          stack={true}
          maxVisible={2}
          showTooltip={true}
        />
      );
    }
    
    if (key === "status") {
      const status = item[key] || "Unknown";
      const statusClass = status.toLowerCase().replace(/\s+/g, '-');
      return (
        <span className={`status-badge status-${statusClass}`}>
          {status}
        </span>
      );
    }
    
    return item[key];
  };


  const handleRowClick = (row) => {
    navigate('/events/eventDetailPage/tasks', { 
      state: { 
        taskId: row.id, 
        mode: "view", 
        eventId: eventId,
        eventName: eventName,
        organizationId: user?.organizationId 
      } 
    });
  };

  const handleDeleteTask = async (task) => {
    if (!permissions.canDelete) {
      alert("You don't have permission to delete tasks");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete the task "${task.creative_name || 'Untitled Task'}"?`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await deleteTask(task.id);
      
      // Remove the deleted task from the local state
      setTasks(prevTasks => prevTasks.filter(t => t.id !== task.id));
      
      alert("Task deleted successfully");
    } catch (error) {
      alert(`Failed to delete task: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="Publish_Section">
      <Table
        columns={columns}
        data={tasks}
        onSort={handleSort}
        renderCell={renderCell}
        sortableColumns={["creative_name", "creative_type", "assigned_to", "due_date", "status"]}
        // showActions={false}
        noDataText="No Tasks Scheduled at this time"
        addEventText="Click here to add a New Task"
        onRowClick={handleRowClick}
        onDelete={permissions.canDelete ? handleDeleteTask : undefined}
        onArchive={permissions.canArchive ? () => alert("Archive pressed") : undefined}
        onDuplicate={permissions.canDuplicate ? () => alert("Duplicate pressed") : undefined}
      />

    </div>
  );
};

export default Task;
