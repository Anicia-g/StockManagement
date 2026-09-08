import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { Link } from 'react-router-dom';

export const NotificationDropdown = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIconForType = (type) => {
    switch (type) {
      case 'LOW_STOCK':
        return '⚠';
      case 'INDENT_CREATED':
        return '▧';
      case 'INDENT_STATUS':
        return '✓';
      case 'PURCHASE':
        return '↧';
      case 'TRANSFER':
        return '↥';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className="notification-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="bell"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        title="View notifications"
        style={{ cursor: 'pointer', border: 'none' }}
      >
        🔔
        {unreadCount > 0 && <span className="dot" />}
      </button>

      {isOpen && (
        <div
          className="notification-dropdown"
          style={{
            position: 'absolute',
            top: '48px',
            right: '0',
            width: '360px',
            maxWidth: '90vw',
            background: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 100,
            overflow: 'hidden',
            animation: 'slideUp 0.15s ease-out'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              background: '#fafbfc'
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--navy-900)' }}>
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={markAllAsRead}
                style={{ fontSize: '0.74rem', padding: '2px 6px', color: 'var(--blue-600)' }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-500)', fontSize: '0.83rem' }}>
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && markAsRead(n._id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    background: n.isRead ? 'var(--white)' : 'var(--blue-50)',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: n.type === 'LOW_STOCK' ? 'var(--red-100)' : 'var(--blue-100)',
                      color: n.type === 'LOW_STOCK' ? 'var(--red-600)' : 'var(--blue-700)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      flexShrink: 0
                    }}
                  >
                    {getIconForType(n.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: n.isRead ? 600 : 700,
                        fontSize: '0.82rem',
                        color: 'var(--text-900)',
                        marginBottom: '2px'
                      }}
                    >
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-700)', lineHeight: '1.3' }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-400)', marginTop: '4px' }}>
                      {new Date(n.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  {!n.isRead && (
                    <div
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: 'var(--blue-600)',
                        marginTop: '6px',
                        flexShrink: 0
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>

          <div
            style={{
              padding: '10px 16px',
              borderTop: '1px solid var(--border)',
              textAlign: 'center',
              background: '#fafbfc'
            }}
          >
            <Link
              to="/low-stock"
              onClick={() => setIsOpen(false)}
              style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--blue-600)' }}
            >
              View Low Stock Deficits →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
