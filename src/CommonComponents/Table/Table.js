import React, { useState, useEffect, useRef } from "react";
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
  skeletonCount = 5,
}) => {
  const [menuOpenIndex, setMenuOpenIndex] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const menuRefs = useRef([]);

  const toggleMenu = (index, e) => {
    e.stopPropagation();
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRefs.current.some(ref => ref && !ref.contains(event.target))) {
        setMenuOpenIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
              {showActions && <th className="sticky-header">Actions</th>}
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
                    <td className="action-container">
                      <div ref={el => menuRefs.current[index] = el}>
                        <button
                          className="action-button"
                          onClick={(e) => toggleMenu(index, e)}
                        >
                          ⋮
                        </button>
                        <div className={`dropdown_menu ${menuOpenIndex === index ? 'active' : ''}`}>
                          {onDuplicate && (
                            <button
                              className="dropdown_item"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDuplicate(item);
                                setMenuOpenIndex(null);
                              }}
                            >
                              Duplicate
                            </button>
                          )}
                          {onArchive && (
                            <button
                              className="dropdown_item"
                              onClick={(e) => {
                                e.stopPropagation();
                                onArchive(item);
                                setMenuOpenIndex(null);
                              }}
                            >
                              Archive
                            </button>
                          )}
                          {onDelete && (
                            <button
                              className="dropdown_item delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(item);
                                setMenuOpenIndex(null);
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + (showActions ? 1 : 0)} className="no-events">
                  <div className="no-events-icon">📊</div>
                  {noDataText}
                  {onAddEventClick && (
                    <div className="add-event" onClick={onAddEventClick}>
                      {addEventText}
                    </div>
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