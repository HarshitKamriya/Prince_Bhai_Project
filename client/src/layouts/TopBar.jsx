import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function TopBar() {
  const { user } = useAuth();

  return (
    <header style={styles.header}>
      {/* Search Console */}
      <div style={styles.searchWrapper}>
        <span className="material-symbols-outlined" style={styles.searchIcon}>
          search
        </span>
        <input
          type="text"
          placeholder="QUERY SYSTEM..."
          style={styles.searchInput}
        />
      </div>

      {/* Control Actions */}
      <div style={styles.controls}>
        <div style={styles.iconGroup}>
          <span className="material-symbols-outlined" style={styles.controlIcon}>
            notifications
          </span>
          <span className="material-symbols-outlined" style={styles.controlIcon}>
            bolt
          </span>
          <span className="material-symbols-outlined" style={styles.controlIcon}>
            account_circle
          </span>
        </div>
        <div style={styles.divider}></div>
        <div style={styles.profileSummary}>
          <span style={styles.userName}>{user?.displayName || 'Prince'}</span>
          <span style={styles.statusDot}></span>
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    height: '64px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(11, 19, 38, 0.1)',
    backdropFilter: 'blur(10px)',
    position: 'sticky',
    top: 0,
    zIndex: 90,
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--on-surface-variant)',
    opacity: 0.6,
    fontSize: '20px',
  },
  searchInput: {
    background: 'var(--surface-container-low)',
    border: 'none',
    borderBottom: '1px solid var(--outline-variant)',
    outline: 'none',
    padding: '8px 12px 8px 40px',
    color: 'var(--on-surface)',
    fontFamily: 'var(--font-code)',
    fontSize: '12px',
    width: '256px',
    transition: 'all 0.3s ease',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  iconGroup: {
    display: 'flex',
    gap: '16px',
  },
  controlIcon: {
    color: 'var(--on-surface-variant)',
    cursor: 'pointer',
    fontSize: '22px',
    transition: 'color 0.3s ease',
  },
  divider: {
    width: '1px',
    height: '24px',
    background: 'rgba(255, 255, 255, 0.1)',
  },
  profileSummary: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userName: {
    fontFamily: 'var(--font-heading)',
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--on-surface)',
    letterSpacing: '0.5px',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'var(--secondary)',
    boxShadow: '0 0 8px var(--secondary)',
  },
};
