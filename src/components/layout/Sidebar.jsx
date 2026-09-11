import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export const Sidebar = ({ mobileOpen = false, onCloseMobile = () => {} }) => {
  const { user, isAdmin, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLinkClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="mark">📦</div>
          <div className="name">
            Consumable Stock
            <span>{isAdmin ? 'Admin Portal' : 'Faculty Portal'}</span>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="nav-group">
          <div className="nav-label">Overview</div>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            <span className="icon">▤</span> Dashboard
          </NavLink>

          {/* FACULTY SECTION */}
          {!isAdmin && (
            <>
              <div className="nav-label">Store Catalog & Requisitions</div>
              <NavLink
                to="/faculty/catalog"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="icon">▦</span> Product Catalog
              </NavLink>

              <NavLink
                to="/indents/create"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="icon">＋</span> Create Indent
              </NavLink>

              <NavLink
                to="/faculty/requests"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="icon">▧</span> My Indent Requests
              </NavLink>
            </>
          )}

          {/* ADMIN SECTION */}
          {isAdmin && (
            <>
              <div className="nav-label">Inventory & Movements</div>
              <NavLink
                to="/products"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="icon">▦</span> Products
              </NavLink>

              <NavLink
                to="/purchases"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="icon">↧</span> Record Purchase (IN)
              </NavLink>

              <NavLink
                to="/transfers"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="icon">↥</span> Record Transfer (OUT)
              </NavLink>

              <NavLink
                to="/history"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="icon">≣</span> Stock History
              </NavLink>

              <NavLink
                to="/low-stock"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="icon">!</span> Low Stock Alerts
                {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
              </NavLink>

              <div className="nav-label">Master Data</div>
              <NavLink
                to="/categories"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="icon">🏷</span> Categories
              </NavLink>

              <NavLink
                to="/units"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="icon">⚖</span> Units of Measurement
              </NavLink>

              <NavLink
                to="/stock-documents"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="icon">📖</span> Stock Registers (SR/CSSR)
              </NavLink>

              <div className="nav-label">Requisitions & Approvals</div>
              <NavLink
                to="/manage-indents"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="icon">📋</span> Manage Indents
              </NavLink>

              <div className="nav-label">Analytics & Reports</div>
              <NavLink
                to="/analytics"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="icon">📈</span> Stock Analytics
              </NavLink>

              <NavLink
                to="/reports"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="icon">📄</span> Reports & Export
              </NavLink>
            </>
          )}
        </div>

        <div className="sidebar-foot">
          <button type="button" className="nav-link" onClick={handleLogout} style={{ width: '100%' }}>
            <span className="icon">⏻</span> Logout ({isAdmin ? 'Admin' : 'Faculty'})
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
