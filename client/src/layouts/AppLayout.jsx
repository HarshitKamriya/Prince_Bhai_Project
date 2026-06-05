import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={styles.loadingWrapper}>
        <div style={styles.spinner}></div>
        <div style={styles.loadingText}>BOOTING OS...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.mainArea}>
        <TopBar />
        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: 'var(--background)',
  },
  mainArea: {
    marginLeft: '256px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  content: {
    padding: '24px',
    flex: 1,
  },
  loadingWrapper: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'var(--background)',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '2px solid rgba(56, 189, 248, 0.1)',
    borderTop: '2px solid var(--primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontFamily: 'var(--font-code)',
    fontSize: '12px',
    color: 'var(--primary)',
    letterSpacing: '2px',
  },
};

// Insert spin animation keyframe if missing
const styleElement = document.createElement('style');
styleElement.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleElement);
