import React from "react";
import { useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";

export default function SettingsMenu({ onClose }) {
  const navigate = useNavigate();

  const go = (path) => {
    navigate(path);
    onClose && onClose();
  };

  return (
    <div className="settings-menu">
      <button className="settings-menu-item" onClick={() => go("/settings")}>
        <Settings size={18} />
        <span>Settings</span>
      </button>
    </div>
  );
}