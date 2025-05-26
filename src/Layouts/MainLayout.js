import React from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../CommonComponents/Sidebar/Sidebar";
import Navbar from "../CommonComponents/Navbar/Navbar";
import "./MainLayout.css";

const MainLayout = ({ children }) => {
  const location = useLocation();
  const hideNavAndSidebar = location.pathname === "/" || location.pathname === "/login" || location.pathname === "/signup";

  return (
    <div className={`layout-container ${hideNavAndSidebar ? 'no-nav-sidebar' : ''}`}>
      {!hideNavAndSidebar && <Sidebar />}
      <div className="main-content-container">
        {!hideNavAndSidebar && <Navbar />}
        <div className="main-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;