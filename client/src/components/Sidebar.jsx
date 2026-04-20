// src/components/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const NAV = [
  { to: '/',         icon: '🏠', label: 'Dashboard'  },
  { to: '/predict',  icon: '🌧️', label: 'Predict Rain' },
  { to: '/weather',  icon: '🌡️', label: 'Live Weather' },
  { to: '/history',  icon: '📋', label: 'History'     },
  { to: '/alerts',   icon: '🔔', label: 'Alerts'      },
  { to: '/analytics',icon: '📊', label: 'Analytics'   },
];

export default function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useApp();

  return (
    <aside className={`sidebar${mobileOpen ? ' open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🌧️</div>
        <div>
          <div className="sidebar-logo-text">RAIN<br/>FORECASTING</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}

        <div className="nav-section-label" style={{ marginTop: 24 }}>Account</div>
        {user ? (
          <>
            <div className="nav-item">
              <span className="nav-icon">👤</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</div>
              </div>
            </div>
            <button
              className="nav-item"
              onClick={logout}
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <span className="nav-icon">🚪</span> Logout
            </button>
          </>
        ) : (
          <NavLink to="/login" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={onClose}>
            <span className="nav-icon">🔐</span> Login
          </NavLink>
        )}
      </nav>

      {/* Version badge */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          <span className="live-dot" />
          v1.0.0 • ML Model Active
        </div>
      </div>
    </aside>
  );
}
