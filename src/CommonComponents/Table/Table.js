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
  skeletonCount = 5, // Number of skeleton rows to show
}) => {
  const [menuOpenIndex, setMenuOpenIndex] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [dropdownPosition, setDropdownPosition] = useState({});

  const toggleMenu = (index, event) => {
    if (menuOpenIndex === index) {
      setMenuOpenIndex(null);
      return;
    }

    // If no event is provided (e.g., when closing menu), just close it
    if (!event) {
      setMenuOpenIndex(null);
      return;
    }

    // Calculate dropdown position to prevent overflow
    const buttonRect = event.currentTarget.getBoundingClientRect();
    const tableContainer = event.currentTarget.closest('.table-container');
    const tableRect = tableContainer.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let position = { right: 0, top: '100%' };
    
    // Check available space on the right side
    const dropdownWidth = 120; // min-width from CSS
    const spaceOnRight = viewportWidth - buttonRect.right;
    const spaceOnLeft = buttonRect.left;
    
    // Calculate if we're near the right edge of the table
    const tableRightEdge = tableRect.right;
    const isNearTableRightEdge = buttonRect.right > (tableRightEdge - 50);
    
    // If there's not enough space on the right OR we're near the table's right edge, show on the left
    if ((spaceOnRight < dropdownWidth || isNearTableRightEdge) && spaceOnLeft >= dropdownWidth) {
      position.right = 'auto';
      position.left = 0;
    }
    // If there's not enough space on either side, prefer left and adjust width
    else if (spaceOnRight < dropdownWidth && spaceOnLeft < dropdownWidth) {
      position.right = 'auto';
      position.left = 0;
    }
    
    // Check if dropdown would overflow to the bottom
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    
    if (spaceBelow < 200 && spaceAbove > 200) {
      position.top = 'auto';
      position.bottom = '100%';
    }
    
    setDropdownPosition({ [index]: position });
    setMenuOpenIndex(index);
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
              {showActions && <th className="sticky-header action-column">Action</th>}
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
                    <td className="action-container action-column">
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
                    <td className="action-container action-column" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="action-button"
                        onClick={(e) => toggleMenu(index, e)}
                      >
                        ⋮
                      </button>
                      {menuOpenIndex === index && (
                        <div 
                          className={`dropdown_menu ${dropdownPosition[index]?.left !== undefined ? 'dropdown-left' : ''}`}
                          ref={menuRef}
                          style={dropdownPosition[index] || {}}
                        >
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