import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export const Sidebar = () => {
  const { user, isAdmin, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="mark">⚡</div>
        <div className="name">
          Electrical Stock
          <span>{isAdmin ? 'Store & Management' : 'Department Portal'}</span>
        </div>
      </div>

      <div className="nav-group">
        <div className="nav-label">Overview</div>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <span className="icon">▤</span> Dashboard
        </NavLink>

        <div className="nav-label">Inventory & Movement</div>
        <NavLink
          to="/products"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <span className="icon">▦</span> Products
        </NavLink>

        {/* Admin only: Purchase & Transfer */}
        {isAdmin && (
          <>
            <NavLink
              to="/purchases"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="icon">↧</span> Purchase
            </NavLink>

            <NavLink
              to="/transfers"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="icon">↥</span> Transfer
            </NavLink>

            <NavLink
              to="/history"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="icon">≣</span> Stock History
            </NavLink>

            <NavLink
              to="/low-stock"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="icon">!</span> Low Stock
            </NavLink>
          </>
        )}

        <div className="nav-label">Indent Requests</div>
        {/* Faculty option: Create Indent */}
        {!isAdmin && (
          <NavLink
            to="/indents/create"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="icon">＋</span> Create Indent
          </NavLink>
        )}

        <NavLink
          to="/indents"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <span className="icon">▧</span> {isAdmin ? 'Indent Requests' : 'My Indents'}
        </NavLink>

        {/* Admin only: Analytics & Reports */}
        {isAdmin && (
          <>
            <div className="nav-label">Analytics & Reports</div>
            <NavLink
              to="/analytics"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="icon">📈</span> Analytics
            </NavLink>

            <NavLink
              to="/reports"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="icon">📄</span> Reports
            </NavLink>
          </>
        )}
      </div>

      <div className="sidebar-foot">
        <button type="button" className="nav-link" onClick={handleLogout}>
          <span className="icon">⏻</span> Logout ({user?.name ? user.name.split(' ')[0] : 'User'})
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
