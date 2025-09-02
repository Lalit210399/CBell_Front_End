import React from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../CommonComponents/Sidebar/Sidebar";
import Navbar from "../CommonComponents/Navbar/Navbar";
import "./MainLayout.css";

const MainLayout = ({ children }) => {
  const location = useLocation();
  const hideNavAndSidebar =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/signup";

  return (
    <div className={`app-layout ${hideNavAndSidebar ? "no-nav-sidebar" : ""}`}>
      {!hideNavAndSidebar && (
        <div className="app-sidebar">
          <aside aria-label="Primary">
            <Sidebar />
          </aside>
        </div>
      )}
      <div className="app-content">
        {!hideNavAndSidebar && (
          <header className="app-header" role="banner">
            <Navbar />
          </header>
        )}
        <section className="app-body">{children}</section>
      </div>
    </div>
  );
};

export default MainLayout;
