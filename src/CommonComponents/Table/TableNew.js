import React, { useState, useEffect, useRef } from "react";
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

  const menuRef = useRef(null);

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
    <div className="table_container">
      <div className={`table_wrapper ${className}`}>
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
                  className={sortableColumns.includes(column.key) ? "sortable clickable-header" : "clickable-header"}
                >
                  {column.label}{" "}
                  {sortableColumns.includes(column.key) &&
                    sortConfig.key === column.key && (
                      <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                    )}
                </th>
              ))}
              {showActions && <th className="sticky_header">Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: skeletonCount }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="skeleton_row">
                  {columns.map((column) => (
                    <td key={`skeleton_cell-${column.key}`}>
                      <div
                        className="skeleton_cell"
                        style={{
                          width: column.skeletonWidth || "80%",
                          height: column.skeletonHeight || "20px",
                        }}
                      />
                    </td>
                  ))}
                  {showActions && (
                    <td className="action_container">
                      <div
                        className="skeleton_cell"
                        style={{ width: "24px", height: "24px" }}
                      />
                    </td>
                  )}
                </tr>
              ))
            ) : data.length > 0 ? (
              data.map((item, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={onRowClick ? "clickable_row" : ""}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={onColumnClick ? "clickable_cell" : ""}
                      onClick={(e) => {
                        if (onColumnClick) {
                          e.stopPropagation(); // prevent row click from firing
                          onColumnClick(column, item);
                        }
                      }}
                    >
                      <span
                        className="tooltip_wrapper"
                        title={item[column.key] ? item[column.key].toString() : ""}
                      >
                        {renderCell ? renderCell(column.key, item) : item[column.key]}
                      </span>

                    </td>
                  ))}
                  {showActions && (
                    <td
                      className="action_container"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="action_button"
                        onClick={() => toggleMenu(rowIndex)}
                      >
                        ⋮
                      </button>
                      {menuOpenIndex === rowIndex && (
                        <div className="dropdown_menu" ref={menuRef}>
                          {onDuplicate && (
                            <button
                              className="dropdown_item"
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
                              className="dropdown_item"
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
                              className="dropdown_item delete"
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
                  className="no-data"
                >
                  {noDataText}
                  {onAddEventClick && (
                    <>
                      <br />
                      <span className="add_event" onClick={onAddEventClick}>
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
