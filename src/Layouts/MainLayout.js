import React from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../CommonComponents/Sidebar/Sidebar";
import Navbar from "../CommonComponents/Navbar/Navbar";
import "./MainLayout.css";

const MainLayout = ({ children }) => {
  const location = useLocation();
  const hideNavAndSidebar = ["/", "/login", "/signup"].includes(location.pathname);

  return (
    <div className={`layout-container ${hideNavAndSidebar ? 'no-nav-sidebar' : ''}`}>
      {!hideNavAndSidebar && <Sidebar />}
      <div className="main-content-container">
        {!hideNavAndSidebar && <Navbar />}
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;