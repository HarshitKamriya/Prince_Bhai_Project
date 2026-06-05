import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', icon: 'dashboard', path: '/' },
    { label: 'Quests', icon: 'military_tech', path: '/quests' },
    { label: 'Analytics', icon: 'insights', path: '/analytics' },
    { label: 'Focus Mode', icon: 'timer', path: '/focus' },
    { label: 'Habits', icon: 'rebase_edit', path: '/habits' },
    { label: 'AI Mentor', icon: 'psychology', path: '/coach' },
    { label: 'Achievements', icon: 'emoji_events', path: '/achievements' },
    { label: 'Journal', icon: 'menu_book', path: '/journal' },
    { label: 'Settings', icon: 'settings', path: '/settings' },
  ];

  return (
    <aside style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.header}>
        <div style={styles.avatarWrapper}>
          <img
            alt="User Avatar"
            style={styles.avatarImg}
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150'}
          />
        </div>
        <div>
          <h1 style={styles.title}>LEVELUP OS</h1>
          <span style={styles.version}>V 2.0.4</span>
        </div>
      </div>

      {/* Nav List */}
      <nav style={styles.nav}>
        <ul style={styles.navList}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li
                key={item.label}
                onClick={() => navigate(item.path)}
                style={{
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                }}
              >
                <span className="material-symbols-outlined" style={styles.navIcon}>
                  {item.icon}
                </span>
                <span style={styles.navLabel}>{item.label}</span>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Info */}
      <div style={styles.footer}>
        <div style={styles.userInfo}>
          <div style={styles.userText}>
            <span style={styles.username}>@{user?.username || 'prince_dev'}</span>
            <span style={styles.role}>{user?.role || 'ARCHITECT'}</span>
          </div>
          <div style={styles.levelBadge}>
            LVL {user?.level || 1}
          </div>
        </div>
        <button onClick={logout} style={styles.logoutBtn}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
          <span>SHUTDOWN</span>
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    position: 'fixed',
    left: 0,
    top: 0,
    height: '100vh',
    width: '256px',
    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(11, 19, 38, 0.2)',
    backdropFilter: 'blur(20px)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    boxShadow: '0 0 20px rgba(56, 189, 248, 0.1)',
  },
  header: {
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  avatarWrapper: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '1px solid #8ed5ff50',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--primary)',
    letterSpacing: '-0.5px',
  },
  version: {
    fontFamily: 'var(--font-heading)',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--on-surface-variant)',
    opacity: 0.6,
    letterSpacing: '1px',
  },
  nav: {
    flex: 1,
    marginTop: '16px',
  },
  navList: {
    listStyleType: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '0 16px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '8px 12px',
    color: 'var(--on-surface-variant)',
    opacity: 0.5,
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
    transition: 'all 0.3s ease',
  },
  navItemActive: {
    color: 'var(--on-surface)',
    background: 'rgba(255, 255, 255, 0.05)',
    borderLeft: '2px solid var(--primary)',
    opacity: 1,
  },
  navIcon: {
    fontSize: '24px',
  },
  navLabel: {
    fontFamily: 'var(--font-heading)',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  footer: {
    padding: '24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  userInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userText: {
    display: 'flex',
    flexDirection: 'column',
  },
  username: {
    fontFamily: 'var(--font-heading)',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--on-surface)',
  },
  role: {
    fontFamily: 'var(--font-heading)',
    fontSize: '10px',
    fontWeight: '700',
    color: 'var(--primary)',
    opacity: 0.7,
  },
  levelBadge: {
    fontFamily: 'var(--font-code)',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--primary-container)',
    background: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  logoutBtn: {
    background: 'transparent',
    border: '1px solid rgba(255, 180, 171, 0.2)',
    color: '#ffb4ab',
    fontFamily: 'var(--font-heading)',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '1px',
    padding: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: 'var(--radius-sm)',
    transition: 'all 0.3s ease',
  },
};
const stylesHoverOverride = `
  li:hover {
    opacity: 1 !important;
    background: rgba(255, 255, 255, 0.05);
  }
`;
