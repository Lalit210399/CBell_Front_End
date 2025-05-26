import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import "./Breadcrumb.css";

const Breadcrumb = ({ items }) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (index) => {
    setOpenDropdown(openDropdown === index ? null : index);
  };

  return (
    <div className="breadcrumb-container">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const hasSubItems = item.subItems && item.subItems.length > 0;
        
        return (
          <div key={index} className="breadcrumb-item">
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
                      <a 
                        key={subIndex} 
                        href={subItem.href} 
                        className="dropdown-item"
                      >
                        {subItem.icon && <subItem.icon size={16} className="breadcrumb-icon" />}
                        {subItem.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <a 
                href={item.href} 
                className={`breadcrumb-link ${isLast ? 'last-item' : ''}`}
              >
                {item.icon && <item.icon size={18} className="breadcrumb-icon" />}
                {item.label}
              </a>
            )}
            {!isLast && <span className="separator"><ChevronRight /></span>}
          </div>
        );
      })}
    </div>
  );
};

export default Breadcrumb;