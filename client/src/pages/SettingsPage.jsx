import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';

export default function SettingsPage() {
  const { user, refreshUser, logout, setUser } = useAuth();

  // Profile fields
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // Stats
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get('/users/me/stats');
        setStats(data);
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    };
    fetchStats();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const updated = await api.patch('/users/me', { displayName, avatarUrl });
      setUser(updated);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordError(false);

    if (newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters');
      setPasswordError(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg('Passwords do not match');
      setPasswordError(true);
      return;
    }

    try {
      await api.patch('/users/me/password', {
        currentPassword,
        newPassword,
      });
      setPasswordMsg('PASSWORD UPDATED SUCCESSFULLY');
      setPasswordError(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(''), 3000);
    } catch (err) {
      setPasswordMsg(err.message || 'Failed to update password');
      setPasswordError(true);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await api.get('/users/me/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `levelup-os-${user?.username || 'user'}-export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Failed to export data');
    }
  };

  const handleResetProgress = async () => {
    if (!window.confirm('⚠️ CRITICAL: This will reset ALL your progress (XP, level, streaks, attributes). Quests and tasks will remain. This cannot be undone. Continue?')) return;
    if (!window.confirm('Are you absolutely sure? Type "RESET" in the next prompt to confirm.')) return;

    try {
      await api.post('/users/me/reset');
      await refreshUser();
      alert('Progress has been reset to initial state.');
    } catch (err) {
      alert(err.message || 'Failed to reset progress');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('🚨 DANGER: This will permanently delete your account and ALL associated data. This action is IRREVERSIBLE. Continue?')) return;

    try {
      await api.delete('/users/me');
      logout();
    } catch (err) {
      alert(err.message || 'Failed to delete account');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.heading}>KERNEL SETTINGS</h2>
        <div style={styles.badgeRow}>
          <span style={styles.badge}>SYSTEM CONFIG v2.0.4</span>
          <span style={styles.badgeGreen}>OPERATOR: @{user?.username || 'unknown'}</span>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Profile Configuration */}
        <section className="glass-card" style={styles.card}>
          <h3 style={styles.sectionTitle}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
            <span>Identity Configuration</span>
          </h3>

          {profileSaved && <div style={styles.successAlert}>PROFILE KERNEL UPDATED SUCCESSFULLY.</div>}

          <form onSubmit={handleSaveProfile} style={styles.form}>
            <div style={styles.avatarPreview}>
              <img
                src={avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150'}
                alt="Avatar"
                style={styles.avatarImg}
              />
              <div style={styles.avatarOverlay}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit</span>
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>DISPLAY NAME</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={styles.input}
                placeholder="Your display name..."
                required
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>AVATAR URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                style={styles.input}
                placeholder="https://..."
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>EMAIL</label>
              <input
                type="text"
                value={user?.email || ''}
                style={{ ...styles.input, opacity: 0.5 }}
                disabled
              />
              <span style={styles.hint}>Email cannot be changed.</span>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>USERNAME</label>
              <input
                type="text"
                value={user?.username || ''}
                style={{ ...styles.input, opacity: 0.5 }}
                disabled
              />
              <span style={styles.hint}>Username is immutable.</span>
            </div>

            <button type="submit" style={styles.primaryBtn}>SAVE IDENTITY</button>
          </form>
        </section>

        {/* Right Column */}
        <div style={styles.rightColumn}>
          {/* Password Change */}
          <section className="glass-card" style={styles.card}>
            <h3 style={styles.sectionTitle}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>lock</span>
              <span>Security Protocol</span>
            </h3>

            {passwordMsg && (
              <div style={passwordError ? styles.errorAlert : styles.successAlert}>
                {passwordMsg}
              </div>
            )}

            <form onSubmit={handleChangePassword} style={styles.form}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>CURRENT PASSWORD</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={styles.input}
                  placeholder="Enter current password..."
                  required
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>NEW PASSWORD</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={styles.input}
                  placeholder="Minimum 6 characters..."
                  required
                  minLength={6}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>CONFIRM NEW PASSWORD</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={styles.input}
                  placeholder="Repeat new password..."
                  required
                />
              </div>
              <button type="submit" style={styles.primaryBtn}>UPDATE SECURITY KEY</button>
            </form>
          </section>

          {/* System Stats */}
          <section className="glass-card" style={styles.card}>
            <h3 style={styles.sectionTitle}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>monitoring</span>
              <span>System Diagnostics</span>
            </h3>
            <div style={styles.statsGrid}>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>LEVEL</span>
                <span style={{ ...styles.statValue, color: 'var(--primary)' }}>{user?.level || 1}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>TOTAL XP</span>
                <span style={{ ...styles.statValue, color: 'var(--secondary)' }}>{user?.totalXp || 0}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>STREAK</span>
                <span style={{ ...styles.statValue, color: 'var(--tertiary)' }}>{user?.currentStreak || 0} 🔥</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>ROLE</span>
                <span style={{ ...styles.statValue, color: 'var(--primary-container)' }}>{user?.role || 'INITIATE'}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>QUESTS DONE</span>
                <span style={styles.statValue}>{stats?.questsCompleted || 0}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>FOCUS SESSIONS</span>
                <span style={styles.statValue}>{stats?.focusSessions || 0}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>JOURNALS</span>
                <span style={styles.statValue}>{stats?.journalEntries || 0}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>MEMBER SINCE</span>
                <span style={styles.statValue}>
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Actions Row */}
      <div style={styles.actionsRow}>
        {/* Data Export */}
        <section className="glass-card" style={styles.actionCard}>
          <div style={styles.actionInfo}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--primary)' }}>download</span>
            <div>
              <div style={styles.actionTitle}>EXPORT DATA ARCHIVE</div>
              <div style={styles.actionDesc}>Download all your data as a JSON file for backup or migration.</div>
            </div>
          </div>
          <button onClick={handleExportData} style={styles.outlineBtn}>EXPORT</button>
        </section>

        {/* Reset Progress */}
        <section className="glass-card" style={styles.actionCard}>
          <div style={styles.actionInfo}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--tertiary)' }}>restart_alt</span>
            <div>
              <div style={styles.actionTitle}>RESET PROGRESS</div>
              <div style={styles.actionDesc}>Reset XP, level, streaks, and attributes to initial state. Quests and tasks preserved.</div>
            </div>
          </div>
          <button onClick={handleResetProgress} style={styles.warningBtn}>RESET</button>
        </section>

        {/* Delete Account */}
        <section className="glass-card" style={{ ...styles.actionCard, borderColor: 'rgba(255, 180, 171, 0.2)' }}>
          <div style={styles.actionInfo}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--error)' }}>delete_forever</span>
            <div>
              <div style={{ ...styles.actionTitle, color: 'var(--error)' }}>DELETE ACCOUNT</div>
              <div style={styles.actionDesc}>Permanently delete your account and all associated data. This cannot be undone.</div>
            </div>
          </div>
          <button onClick={handleDeleteAccount} style={styles.dangerBtn}>DELETE</button>
        </section>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '1440px',
    margin: '0 auto',
    padding: '8px 0',
    gap: '24px',
  },
  header: {
    marginBottom: '8px',
  },
  heading: {
    fontFamily: 'var(--font-heading)',
    fontSize: '28px',
    fontWeight: '800',
    color: 'var(--on-surface)',
  },
  badgeRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '6px',
  },
  badge: {
    fontFamily: 'var(--font-code)',
    fontSize: '9px',
    fontWeight: '700',
    color: 'var(--primary)',
    background: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.2)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  badgeGreen: {
    fontFamily: 'var(--font-code)',
    fontSize: '9px',
    fontWeight: '700',
    color: 'var(--secondary)',
    background: 'rgba(74, 225, 118, 0.1)',
    border: '1px solid rgba(74, 225, 118, 0.2)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: '24px',
  },
  card: {
    padding: '24px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  rightColumn: {
    gridColumn: 'span 7',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: 'var(--font-heading)',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: 'var(--on-surface-variant)',
    letterSpacing: '1px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  avatarPreview: {
    position: 'relative',
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '2px solid rgba(56, 189, 248, 0.3)',
    cursor: 'pointer',
    alignSelf: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    color: 'white',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontFamily: 'var(--font-code)',
    fontSize: '9px',
    fontWeight: '700',
    color: 'var(--on-surface-variant)',
    letterSpacing: '0.5px',
  },
  input: {
    background: '#0f172a',
    border: '1px solid var(--outline-variant)',
    padding: '10px 12px',
    color: 'var(--on-surface)',
    fontFamily: 'var(--font-body)',
    fontSize: '13px',
    outline: 'none',
    borderRadius: 'var(--radius-sm)',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
  },
  hint: {
    fontFamily: 'var(--font-code)',
    fontSize: '9px',
    color: 'var(--on-surface-variant)',
    opacity: 0.4,
  },
  primaryBtn: {
    background: 'var(--primary-container)',
    color: '#002109',
    border: 'none',
    fontFamily: 'var(--font-heading)',
    fontSize: '11px',
    fontWeight: '700',
    padding: '10px 20px',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
    letterSpacing: '0.5px',
    alignSelf: 'flex-start',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  successAlert: {
    background: 'rgba(74, 225, 118, 0.1)',
    border: '1px solid var(--secondary)',
    color: '#dae2fd',
    fontFamily: 'var(--font-code)',
    fontSize: '11px',
    padding: '10px',
    borderRadius: '4px',
    textAlign: 'center',
  },
  errorAlert: {
    background: 'rgba(255, 180, 171, 0.1)',
    border: '1px solid var(--error)',
    color: 'var(--error)',
    fontFamily: 'var(--font-code)',
    fontSize: '11px',
    padding: '10px',
    borderRadius: '4px',
    textAlign: 'center',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    background: 'rgba(255,255,255,0.02)',
    padding: '12px',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid rgba(255,255,255,0.03)',
  },
  statLabel: {
    fontFamily: 'var(--font-code)',
    fontSize: '9px',
    fontWeight: '700',
    color: 'var(--on-surface-variant)',
    letterSpacing: '0.5px',
    opacity: 0.6,
  },
  statValue: {
    fontFamily: 'var(--font-heading)',
    fontSize: '18px',
    fontWeight: '800',
    color: 'var(--on-surface)',
  },
  actionsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
  },
  actionCard: {
    padding: '20px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  actionInfo: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  actionTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--on-surface)',
  },
  actionDesc: {
    fontFamily: 'var(--font-body)',
    fontSize: '12px',
    color: 'var(--on-surface-variant)',
    opacity: 0.6,
    marginTop: '4px',
    lineHeight: '1.4',
  },
  outlineBtn: {
    background: 'transparent',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    color: 'var(--primary)',
    fontFamily: 'var(--font-heading)',
    fontSize: '11px',
    fontWeight: '700',
    padding: '8px 16px',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
    letterSpacing: '0.5px',
    transition: 'all 0.3s ease',
  },
  warningBtn: {
    background: 'transparent',
    border: '1px solid rgba(255, 193, 116, 0.3)',
    color: 'var(--tertiary)',
    fontFamily: 'var(--font-heading)',
    fontSize: '11px',
    fontWeight: '700',
    padding: '8px 16px',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
    letterSpacing: '0.5px',
    transition: 'all 0.3s ease',
  },
  dangerBtn: {
    background: 'transparent',
    border: '1px solid rgba(255, 180, 171, 0.3)',
    color: 'var(--error)',
    fontFamily: 'var(--font-heading)',
    fontSize: '11px',
    fontWeight: '700',
    padding: '8px 16px',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
    letterSpacing: '0.5px',
    transition: 'all 0.3s ease',
  },
};

// Inject CSS for avatar hover
const styleTag = document.createElement('style');
styleTag.textContent = `
  .settings-avatar-wrap:hover .avatar-overlay {
    opacity: 1 !important;
  }
`;
if (!document.querySelector('#settings-styles')) {
  styleTag.id = 'settings-styles';
  document.head.appendChild(styleTag);
}
