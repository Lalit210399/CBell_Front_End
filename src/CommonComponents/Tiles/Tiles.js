import React from "react";
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
  isSelected,
  textColor,
}) => {
  const backgroundColor = bgcolor;
  const iconBackgroundColor = iconBgColor || "#3B82F6"; // Default darker shade as per example
  const tileTextColor = textColor || "#111827"; // Default text color (dark gray)
  const tileBorderColor = isSelected ? borderColor : "#E4E6E9";
  return (
    <div
      className="tile-container"
      style={{
        backgroundColor,
        boxShadow: isSelected 
          ? `0 4px 12px rgba(0, 0, 0, 0.15)` 
          : "0 2px 6px rgba(0, 0, 0, 0.05)",
        transform: isSelected ? "translateY(-2px)" : "none",
        filter: isSelected ? "brightness(1) saturate(1.2)" : "none",
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
      </div>{" "}
      <div className="tile-body">
        <h3 className="tile-title">{title}</h3>
        <p className="tile-subtitle">{subtitle}</p>
      </div>
    </div>
  );
};
export default Tile;
