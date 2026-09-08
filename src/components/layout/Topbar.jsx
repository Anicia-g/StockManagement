import React from 'react';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

export const Topbar = ({ title = 'Dashboard', breadcrumb = 'Overview' }) => {
  const { user } = useAuth();

  const roleLabel = user?.role === 'ADMIN' ? 'Store Admin' : 'Faculty / Staff';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div>
          <div className="page-title">{title}</div>
          <div className="breadcrumb">{breadcrumb}</div>
        </div>
      </div>

      <div className="topbar-right">
        {/* Live Notification Dropdown */}
        <NotificationDropdown />

        <div className="user-chip">
          <div
            className="avatar"
            style={{
              background: user?.role === 'ADMIN' ? 'var(--blue-700)' : 'var(--navy-800)'
            }}
          >
            {user?.avatarText || 'U'}
          </div>
          <div className="who">
            <strong>{user?.name || 'Authorized User'}</strong>
            <span>
              {roleLabel} · {user?.department || 'National Engineering College'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
