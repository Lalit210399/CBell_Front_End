import React, { useState } from "react";
import "./Table.css";

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
  loading = false,
  skeletonCount = 5, // Number of skeleton rows to show
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

  return (
    <div className="table-container">
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  className={sortableColumns.includes(column.key) ? "sortable" : ""}
                >
                  {column.label}{" "}
                  {sortableColumns.includes(column.key) &&
                    sortConfig.key === column.key && (
                      <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                    )}
                </th>
              ))}
              {showActions && <th className="sticky-header">Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: skeletonCount }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="skeleton-row">
                  {columns.map((column) => (
                    <td key={`skeleton-cell-${column.key}`}>
                      <div 
                        className="skeleton-cell"
                        style={{ 
                          width: column.skeletonWidth || '80%',
                          height: column.skeletonHeight || '20px'
                        }} 
                      />
                    </td>
                  ))}
                  {showActions && (
                    <td className="action-container">
                      <div 
                        className="skeleton-cell" 
                        style={{ width: '24px', height: '24px' }} 
                      />
                    </td>
                  )}
                </tr>
              ))
            ) : data.length > 0 ? (
              data.map((item, index) => (
                <tr
                  key={index}
                  className={onRowClick ? "clickable-row" : ""}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td key={column.key}>
                      {renderCell
                        ? renderCell(column.key, item)
                        : item[column.key]}
                    </td>
                  ))}
                  {showActions && (
                    <td className="action-container" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="action-button"
                        onClick={() => toggleMenu(index)}
                      >
                        ⋮
                      </button>
                      {menuOpenIndex === index && (
                        <div className="dropdown_menu">
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
                <td colSpan={columns.length + (showActions ? 1 : 0)} className="no-data">
                  {noDataText}
                  {onAddEventClick && (
                    <>
                      <br />
                      <span className="add-event" onClick={onAddEventClick}>
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