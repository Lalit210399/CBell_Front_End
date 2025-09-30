import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import "./Breadcrumb.css";

const Breadcrumb = ({ items }) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (index) => {
    setOpenDropdown(openDropdown === index ? null : index);
  };

  const handleItemClick = (item, index) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.href && item.href !== "#") {
      window.location.href = item.href;
    }
  };

  return (
    <div className="breadcrumb-container">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const hasSubItems = item.subItems && item.subItems.length > 0;
        
        return (
          <React.Fragment key={index}>
            <div className="breadcrumb-item">
              {hasSubItems ? (
                <div className="dropdown">
                  <button 
                    className={`breadcrumb-link ${isLast ? 'last-item' : ''}`}
                    onClick={() => toggleDropdown(index)}
                  >
                    {item.icon && <item.icon size={18} className="breadcrumb-icon" />}
                    {item.label} {hasSubItems && <ChevronDown />}
                  </button>
                  {openDropdown === index && (
                    <div className="dropdown-menu">
                      {item.subItems.map((subItem, subIndex) => (
                        <button
                          key={subIndex} 
                          className="dropdown-item"
                          onClick={() => handleItemClick(subItem, subIndex)}
                        >
                          {subItem.icon && <subItem.icon size={16} className="breadcrumb-icon" />}
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  className={`breadcrumb-link ${isLast ? 'last-item' : ''}`}
                  onClick={() => handleItemClick(item, index)}
                >
                  {item.icon && <item.icon size={18} className="breadcrumb-icon" />}
                  {item.label}
                </button>
              )}
            </div>
            {!isLast && <ChevronRight size={14} className="separator" />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Breadcrumb;