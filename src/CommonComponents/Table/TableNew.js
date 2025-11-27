import React, { useState, useEffect, useRef, useMemo } from "react";
import "./TableNew.css";

const Table = ({
  columns,
  data,
  onSort,
  renderCell,
  noDataText = "No data available",
  addEventText = "Add new item",
  onAddEventClick,
  sortableColumns = [],
  onDuplicate,
  onArchive,
  onDelete,
  showActions = true,
  onRowClick,
  onColumnClick, // ✅ NEW prop for column clicks
  onCellClick, // ✅ NEW prop for individual cell clicks
  clickableColumns = [], // ✅ NEW prop to specify which columns are clickable
  rowClickable = true, // ✅ NEW prop to enable/disable row clicks
  cellClickPriority = true, // ✅ NEW prop - if true, cell clicks override row clicks
  loading = false,
  skeletonCount = 5, // Number of skeleton rows to show
  className = "", // New prop for additional className
}) => {
  const [menuOpenIndex, setMenuOpenIndex] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const toggleMenu = (index) => {
    setMenuOpenIndex(menuOpenIndex === index ? null : index);
  };

  const handleSort = (key) => {
    if (!sortableColumns.includes(key)) return;

    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    onSort?.(key, direction);
  };

  // Sort data based on sortConfig
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !data) return data;

    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Handle nested objects (like createdBy.name)
      let aCompare = aValue;
      let bCompare = bValue;

      if (typeof aValue === 'object' && aValue.name) {
        aCompare = aValue.name;
      }
      if (typeof bValue === 'object' && bValue.name) {
        bCompare = bValue.name;
      }

      // Handle dates
      const aDate = new Date(aCompare);
      const bDate = new Date(bCompare);
      const isDateColumn = !isNaN(aDate.getTime()) && !isNaN(bDate.getTime()) && 
                          (String(aCompare).includes('/') || String(aCompare).includes('-'));
      
      if (isDateColumn) {
        return sortConfig.direction === "asc" 
          ? aDate - bDate 
          : bDate - aDate;
      }

      // Handle strings
      if (typeof aCompare === 'string' && typeof bCompare === 'string') {
        return sortConfig.direction === "asc"
          ? aCompare.localeCompare(bCompare)
          : bCompare.localeCompare(aCompare);
      }

      // Handle numbers
      if (typeof aCompare === 'number' && typeof bCompare === 'number') {
        return sortConfig.direction === "asc"
          ? aCompare - bCompare
          : bCompare - aCompare;
      }

      // Default string comparison
      return sortConfig.direction === "asc"
        ? String(aCompare).localeCompare(String(bCompare))
        : String(bCompare).localeCompare(String(aCompare));
    });

    return sorted;
  }, [data, sortConfig]);

  const menuRef = useRef(null);

  // Function to generate meaningful tooltip text for objects and arrays
  const getTooltipText = (value) => {
    if (!value) return "";
    if (Array.isArray(value)) {
      return value.map(item => typeof item === 'object' ? (item.name || item.toString()) : item).join(',  ');
    }
    if (typeof value === 'object') {
      return value.name || value.toString();
    }
    return value.toString();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpenIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="tn-table_container">
      <div className={`tn-table_wrapper ${className}`}>
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => {
                    handleSort(column.key);
                    onColumnClick?.(column); // ✅ Column click
                  }}
                  className={sortableColumns.includes(column.key) ? "tn-sortable tn-clickable_header" : "tn-clickable_header"}
                >
                  {column.label}{" "}
                  {sortableColumns.includes(column.key) && (
                    <span className={sortConfig.key === column.key ? "tn-sort-active" : "tn-sort-inactive"}>
                      {sortConfig.key === column.key 
                        ? (sortConfig.direction === "asc" ? "↑" : "↓")
                        : "⇅"}
                    </span>
                  )}
                </th>
              ))}
              {showActions && <th className="tn-sticky_header">Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: skeletonCount }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="tn-skeleton_row">
                  {columns.map((column) => (
                    <td key={`skeleton_cell-${column.key}`}>
                      <div
                        className="tn-skeleton_cell"
                        style={{
                          width: column.skeletonWidth || "80%",
                          height: column.skeletonHeight || "20px",
                        }}
                      />
                    </td>
                  ))}
                  {showActions && (
                    <td className="tn-action_container">
                      <div
                        className="tn-skeleton_cell"
                        style={{ width: "24px", height: "24px" }}
                      />
                    </td>
                  )}
                </tr>
              ))
            ) : sortedData && sortedData.length > 0 ? (
              sortedData.map((item, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={
                    (onRowClick && rowClickable) 
                      ? "tn-clickable_row" 
                      : ""
                  }
                  onClick={(e) => {
                    // Only handle row click if no cell click occurred and row is clickable
                    if (rowClickable && onRowClick && !e.defaultPrevented) {
                      onRowClick(item);
                    }
                  }}
                >
                  {columns.map((column) => {
                    // const isClickable = clickableColumns.includes(column.key) || onCellClick;
                    // const hasColumnClick = onColumnClick;
                    const isRowClickable = rowClickable && onRowClick;
                    
                    return (
                      <td
                        key={column.key}
                        className={
                          // isClickable || hasColumnClick 
                          //   ? "tn-clickable_cell tn-hover_effect" 
                          //   : 
                          isRowClickable 
                            ? "tn-row_clickable_cell"
                            : ""
                        }
                        // onClick={(e) => {
                        //   if (isClickable && onCellClick) {
                        //     e.stopPropagation(); // prevent row click from firing
                        //     e.preventDefault(); // prevent default behavior
                        //     onCellClick(column, item, e);
                        //   } else if (hasColumnClick) {
                        //     e.stopPropagation(); // prevent row click from firing
                        //     e.preventDefault(); // prevent default behavior
                        //     onColumnClick(column, item);
                        //   } else if (cellClickPriority && isClickable) {
                        //     // If cell click priority is enabled and this is a clickable cell,
                        //     // prevent row click even if no cell handler is provided
                        //     e.stopPropagation();
                        //   }
                        // }}
                        style={{
                          // cursor: isClickable || hasColumnClick 
                          //   ? 'pointer' 
                          //   : 
                          cursor: isRowClickable 
                            ? 'pointer' 
                            : 'default'
                        }}
                      >
                        <span
                          className="tn-tooltip_wrapper"
                          title={getTooltipText(item[column.key])}
                        >
                          {renderCell ? renderCell(column.key, item) : item[column.key]}
                        </span>
                      </td>
                    );
                  })}
                  {showActions && (
                    <td
                      className="tn-action_container"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="tn-action_button"
                        onClick={() => toggleMenu(rowIndex)}
                      >
                        ⋮
                      </button>
                      {menuOpenIndex === rowIndex && (
                        <div className="tn-dropdown_menu" ref={menuRef}>
                          {onDuplicate && (
                            <button
                              className="tn-dropdown_item"
                              onClick={() => {
                                onDuplicate(item);
                                toggleMenu(null);
                              }}
                            >
                              Duplicate
                            </button>
                          )}
                          {onArchive && (
                            <button
                              className="tn-dropdown_item"
                              onClick={() => {
                                onArchive(item);
                                toggleMenu(null);
                              }}
                            >
                              Archive
                            </button>
                          )}
                          {onDelete && (
                            <button
                              className="tn-dropdown_item tn-delete"
                              onClick={() => {
                                onDelete(item);
                                toggleMenu(null);
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (showActions ? 1 : 0)}
                  className="tn-no_data"
                >
                  {noDataText}
                  {onAddEventClick && (
                    <>
                      <br />
                      <span className="tn-add_event" onClick={onAddEventClick}>
                        {addEventText}
                      </span>
                    </>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
