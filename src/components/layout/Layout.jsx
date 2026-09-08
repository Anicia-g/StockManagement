import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export const Layout = ({ children, title, breadcrumb }) => {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-col">
        <Topbar title={title} breadcrumb={breadcrumb} />
        <main className="content">
          {children}
          <div className="footer-note">
            Electrical Stock Monitoring System · Maintenance Department · National Engineering College
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
