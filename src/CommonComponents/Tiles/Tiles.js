import React from "react";
import { ExternalLink } from "lucide-react";
import "./Tiles.css";
const Tile = ({
  icon,
  title,
  subtitle,
  count,
  bgcolor,
  iconBgColor,
  borderColor,
  onClick,
  onNewWindowClick,
  isSelected,
  textColor,
  showNewWindowIcon = false,
}) => {
  const backgroundColor = bgcolor;
  const iconBackgroundColor = iconBgColor || "#3B82F6"; // Default darker shade as per example
  const tileBorderColor = isSelected ? borderColor : "#E4E6E9"; // Default border color for unselected
  const tileTextColor = textColor || "#111827"; // Default text color (dark gray)
  return (
    <div
      className="tile-container"
      style={{
        backgroundColor,
        borderColor: tileBorderColor,
        borderStyle: "solid",
        borderWidth: "1px",
        cursor: onClick ? "pointer" : "default",
        color: tileTextColor,
      }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyPress={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          onClick(e);
        }
      }}
    >
      <div className="tile-header">
        <div
          className="tile-icon"
          style={{ backgroundColor: iconBackgroundColor }}
        >
          {icon}
        </div>
        <div className="tile-count">{count}</div>
        {showNewWindowIcon && (
          <button
            className="new-window-icon"
            onClick={(e) => onNewWindowClick && onNewWindowClick(e)}
            title={`View all ${title.toLowerCase()} in detailed screen`}
            style={{
              '--tile-border-color': borderColor,
              '--tile-icon-bg-color': iconBgColor,
            }}
          >
            <ExternalLink size={14} />
          </button>
        )}
      </div>
      <div className="tile-body">
        <h3 className="tile-title">{title}</h3>
        <p className="tile-subtitle">{subtitle}</p>
      </div>
    </div>
  );
};
export default Tile;
