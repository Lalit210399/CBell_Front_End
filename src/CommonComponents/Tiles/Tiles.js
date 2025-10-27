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
  const iconBackgroundColor = iconBgColor || "#EFF6FF";
  const tileBorderColor = isSelected ? borderColor : "#F3F4F6";
  const tileTextColor = textColor || "#1E293B";
  return (
    <div
      className="new-tile-container"
      style={{
        background: `linear-gradient(105deg, ${backgroundColor}, #fff 80%)`,
        border: `2px solid ${tileBorderColor}`,
        color: tileTextColor,
        cursor: onClick ? "pointer" : "default",
        boxShadow: isSelected
          ? `0 2px 12px 0 ${borderColor}55`
          : "0 2px 8px rgba(30, 41, 59, 0.04)",
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
      <div className="tile-icon-accent" style={{ background: iconBackgroundColor, borderColor: borderColor }}>
        {icon}
      </div>
      <div className="tile-main-content">
        <div className="tile-text-content">
          <span className="tile-title">{title}</span>
          <span className="tile-subtitle">{subtitle}</span>
        </div>
        <span className="tile-large-count">{count}</span>
      </div>
    </div>
  );
};
export default Tile;
