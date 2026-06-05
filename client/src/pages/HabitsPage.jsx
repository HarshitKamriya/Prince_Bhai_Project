import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const CATEGORIES = [
  { id: 'health', name: 'Health', color: 'var(--secondary)', icon: 'fitness_center' },
  { id: 'coding', name: 'Coding', color: 'var(--primary)', icon: 'code' },
  { id: 'reading', name: 'Reading', color: 'var(--tertiary)', icon: 'book' },
  { id: 'mindfulness', name: 'Mindfulness', color: '#c084fc', icon: 'self_improvement' }
];

const ICONS = [
  { value: 'repeat', label: 'Default' },
  { value: 'fitness_center', label: 'Gym' },
  { value: 'code', label: 'Coding' },
  { value: 'book', label: 'Reading' },
  { value: 'self_improvement', label: 'Mindfulness' },
  { value: 'water_drop', label: 'Hydration' },
  { value: 'bedtime', label: 'Sleep' },
  { value: 'restaurant', label: 'Diet' }
];

export default function HabitsPage() {
  const { refreshUser } = useAuth();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('health');
  const [frequency, setFrequency] = useState('daily');
  const [targetCount, setTargetCount] = useState(1);
  const [icon, setIcon] = useState('repeat');

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const data = await api.get('/habits');
      setHabits(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch habits:', err);
      setError('Failed to load habits. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleToggleHabit = async (habitId) => {
    try {
      const result = await api.patch(`/habits/${habitId}/toggle`);
      
      // Update local state
      setHabits(prev =>
        prev.map(h => (h.id === habitId ? result.habit : h))
      );
      
      await refreshUser();
    } catch (err) {
      alert(err.message || 'Failed to toggle habit completion.');
    }
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const newHabit = await api.post('/habits', {
        title,
        category,
        frequency,
        targetCount: parseInt(targetCount) || 1,
        icon
      });

      setHabits(prev => [newHabit, ...prev]);
      
      // Reset form
      setTitle('');
      setCategory('health');
      setFrequency('daily');
      setTargetCount(1);
      setIcon('repeat');
      setIsFormOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to create habit.');
    }
  };

  const handleDeleteHabit = async (habitId) => {
    if (!confirm('Are you sure you want to delete this habit protocol?')) return;
    try {
      await api.delete(`/habits/${habitId}`);
      setHabits(prev => prev.filter(h => h.id !== habitId));
    } catch (err) {
      alert(err.message || 'Failed to delete habit.');
    }
  };

  const getCategoryDetails = (catId) => {
    return CATEGORIES.find(c => c.id === catId) || CATEGORIES[0];
  };

  // Stats calculations
  const totalCount = habits.length;
  const completedTodayCount = habits.filter(h => h.completedToday).length;
  const completionRate = totalCount > 0 ? Math.round((completedTodayCount / totalCount) * 100) : 0;
  const highestStreak = habits.reduce((max, h) => Math.max(max, h.bestStreak || 0), 0);

  return (
    <div style={styles.container}>
      {/* HEADER SECTION */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle} className="glow-text">HABIT PROTOCOLS</h1>
          <p style={styles.subtitle}>DAILY & WEEKLY RECURRING SYSTEM CYCLES</p>
        </div>
        
        <div style={styles.headerStats}>
          <div style={styles.statBadge}>
            <span style={styles.statVal}>{completedTodayCount}/{totalCount}</span>
            <span style={styles.statLbl}>COMPLETED TODAY</span>
          </div>
          <button 
            style={styles.addBtn}
            onClick={() => setIsFormOpen(!isFormOpen)}
          >
            <span className="material-symbols-outlined">{isFormOpen ? 'close' : 'add'}</span>
            <span>{isFormOpen ? 'CANCEL PROTOCOL' : 'INITIALIZE HABIT'}</span>
          </button>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div style={styles.errorCard} className="glass-card">
          <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>warning</span>
          <span style={{ fontFamily: 'var(--font-code)', fontSize: '12px' }}>{error}</span>
        </div>
      )}

      {/* ADD HABIT FORM */}
      {isFormOpen && (
        <form onSubmit={handleAddHabit} style={styles.formCard} className="glass-card">
          <h3 style={styles.formTitle}>NEW HABIT PROTOCOL PARAMETERS</h3>
          
          <div style={styles.formGrid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>HABIT TITLE</label>
              <input
                type="text"
                placeholder="e.g. Solve 3 LeetCode problems"
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={styles.input}
                className="glow-border"
                required
              />
            </div>

            <div style={styles.inputRow}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>CATEGORY</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={styles.select}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>FREQUENCY</label>
                <select
                  value={frequency}
                  onChange={e => setFrequency(e.target.value)}
                  style={styles.select}
                >
                  <option value="daily">DAILY</option>
                  <option value="weekly">WEEKLY</option>
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>ICON</label>
                <select
                  value={icon}
                  onChange={e => setIcon(e.target.value)}
                  style={styles.select}
                >
                  {ICONS.map(i => (
                    <option key={i.value} value={i.value}>{i.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button type="submit" style={styles.submitBtn}>
            DEPLOY PROTOCOL
          </button>
        </form>
      )}

      {/* LOADER */}
      {loading ? (
        <div style={styles.loaderWrapper}>
          <div style={styles.spinner}></div>
          <div style={styles.loaderText}>SYNCING PROTOCOLS...</div>
        </div>
      ) : (
        <>
          {/* HABITS GRID */}
          {habits.length === 0 ? (
            <div style={styles.emptyCard} className="glass-card">
              <span className="material-symbols-outlined" style={styles.emptyIcon}>rebase_edit</span>
              <p style={styles.emptyTitle}>NO HABIT PROTOCOLS ONLINE</p>
              <p style={styles.emptyText}>Initialize a new recurring routine to build habits, accumulate XP, and level up.</p>
            </div>
          ) : (
            <div style={styles.grid}>
              {habits.map(habit => {
                const cat = getCategoryDetails(habit.category);
                return (
                  <div 
                    key={habit.id} 
                    style={{
                      ...styles.card,
                      borderLeft: `4px solid ${cat.color}`,
                      opacity: habit.isActive ? 1 : 0.6
                    }} 
                    className="glass-card"
                  >
                    <div style={styles.cardHeader}>
                      <div style={{ ...styles.iconBg, backgroundColor: `${cat.color}15` }}>
                        <span 
                          className="material-symbols-outlined" 
                          style={{ color: cat.color, fontSize: '20px' }}
                        >
                          {habit.icon}
                        </span>
                      </div>
                      
                      <div style={styles.cardMeta}>
                        <h3 style={styles.cardTitle}>{habit.title}</h3>
                        <div style={styles.badgeRow}>
                          <span style={{ ...styles.categoryBadge, backgroundColor: `${cat.color}20`, color: cat.color }}>
                            {cat.name.toUpperCase()}
                          </span>
                          <span style={styles.freqBadge}>
                            {habit.frequency.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={styles.cardBody}>
                      <div style={styles.streakInfo}>
                        <div style={styles.streakStat}>
                          <span style={styles.streakEmoji}>🔥</span>
                          <div style={styles.streakTextCol}>
                            <span style={styles.streakVal}>{habit.currentStreak} DAYS</span>
                            <span style={styles.streakLbl}>CURRENT STREAK</span>
                          </div>
                        </div>
                        
                        <div style={styles.bestStreakCol}>
                          <span style={styles.bestVal}>{habit.bestStreak} DAYS</span>
                          <span style={styles.bestLbl}>BEST STREAK</span>
                        </div>
                      </div>
                    </div>

                    <div style={styles.cardActions}>
                      <button
                        onClick={() => handleToggleHabit(habit.id)}
                        style={{
                          ...styles.completeBtn,
                          borderColor: habit.completedToday ? 'var(--secondary)' : 'rgba(255, 255, 255, 0.15)',
                          backgroundColor: habit.completedToday ? 'rgba(74, 225, 118, 0.1)' : 'transparent',
                        }}
                      >
                        <span 
                          className="material-symbols-outlined" 
                          style={{ 
                            color: habit.completedToday ? 'var(--secondary)' : 'var(--on-surface-variant)',
                            fontSize: '18px'
                          }}
                        >
                          {habit.completedToday ? 'check_circle' : 'circle'}
                        </span>
                        <span style={{
                          color: habit.completedToday ? 'var(--secondary)' : 'var(--on-surface-variant)',
                          fontFamily: 'var(--font-heading)',
                          fontSize: '11px',
                          fontWeight: '700'
                        }}>
                          {habit.completedToday ? 'PROTOCOL ACTIVE (DONE)' : 'EXECUTE PROTOCOL'}
                        </span>
                      </button>

                      <button 
                        style={styles.deleteBtn}
                        onClick={() => handleDeleteHabit(habit.id)}
                        title="Decommission Habit"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* STATS SUMMARY */}
          {habits.length > 0 && (
            <div style={styles.summaryRow} className="glass-card">
              <div style={styles.summaryCol}>
                <span style={styles.summaryVal}>{totalCount}</span>
                <span style={styles.summaryLbl}>TOTAL HABITS</span>
              </div>
              <div style={styles.summaryCol}>
                <span style={styles.summaryVal}>{completionRate}%</span>
                <span style={styles.summaryLbl}>TODAY'S RATE</span>
              </div>
              <div style={styles.summaryCol}>
                <span style={styles.summaryVal}>{highestStreak} DAYS</span>
                <span style={styles.summaryLbl}>HIGHEST STREAK</span>
              </div>
              <div style={styles.summaryCol}>
                <span style={styles.summaryVal}>15 XP</span>
                <span style={styles.summaryLbl}>XP PER HITS</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  pageTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '28px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    color: 'var(--on-surface)',
  },
  subtitle: {
    fontFamily: 'var(--font-code)',
    fontSize: '11px',
    color: 'var(--primary-container)',
    opacity: 0.8,
    letterSpacing: '1.5px',
    marginTop: '4px',
  },
  headerStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statBadge: {
    background: 'rgba(56, 189, 248, 0.05)',
    border: '1px solid rgba(56, 189, 248, 0.2)',
    padding: '8px 16px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statVal: {
    fontFamily: 'var(--font-code)',
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--primary)',
  },
  statLbl: {
    fontFamily: 'var(--font-heading)',
    fontSize: '9px',
    fontWeight: '700',
    color: 'var(--on-surface-variant)',
    opacity: 0.6,
  },
  addBtn: {
    background: 'var(--primary-container)',
    color: 'var(--on-primary)',
    border: 'none',
    fontFamily: 'var(--font-heading)',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '1px',
    padding: '12px 20px',
    cursor: 'pointer',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)',
  },
  errorCard: {
    padding: '16px',
    borderRadius: 'var(--radius-md)',
    borderColor: 'rgba(255, 180, 171, 0.2)',
    backgroundColor: 'rgba(255, 180, 171, 0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  formCard: {
    padding: '24px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '13px',
    fontWeight: '800',
    letterSpacing: '1px',
    color: 'var(--on-surface)',
    opacity: 0.9,
  },
  formGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  inputRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  label: {
    fontFamily: 'var(--font-heading)',
    fontSize: '10px',
    fontWeight: '700',
    color: 'var(--on-surface-variant)',
    opacity: 0.7,
  },
  input: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'var(--on-surface)',
    fontFamily: 'var(--font-body)',
    fontSize: '13px',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    width: '100%',
  },
  select: {
    background: '#0b1326',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'var(--on-surface)',
    fontFamily: 'var(--font-body)',
    fontSize: '13px',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  submitBtn: {
    background: 'transparent',
    border: '1px solid var(--primary)',
    color: 'var(--primary)',
    fontFamily: 'var(--font-heading)',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '1.5px',
    padding: '12px',
    cursor: 'pointer',
    borderRadius: 'var(--radius-md)',
    transition: 'all 0.3s ease',
    alignSelf: 'flex-start',
  },
  loaderWrapper: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '80px 0',
    gap: '16px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '2px solid rgba(56, 189, 248, 0.1)',
    borderTop: '2px solid var(--primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loaderText: {
    fontFamily: 'var(--font-code)',
    fontSize: '11px',
    color: 'var(--primary)',
    letterSpacing: '1px',
  },
  emptyCard: {
    padding: '60px 40px',
    textAlign: 'center',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  emptyIcon: {
    fontSize: '48px',
    color: 'var(--primary)',
    opacity: 0.5,
  },
  emptyTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '16px',
    fontWeight: '800',
    letterSpacing: '0.5px',
    color: 'var(--on-surface)',
  },
  emptyText: {
    fontFamily: 'var(--font-body)',
    fontSize: '13px',
    color: 'var(--on-surface-variant)',
    opacity: 0.7,
    maxWidth: '400px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '20px',
  },
  card: {
    padding: '20px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
  },
  iconBg: {
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMeta: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  cardTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--on-surface)',
    margin: 0,
  },
  badgeRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  categoryBadge: {
    fontFamily: 'var(--font-heading)',
    fontSize: '9px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  freqBadge: {
    fontFamily: 'var(--font-heading)',
    fontSize: '9px',
    fontWeight: '700',
    color: 'var(--on-surface-variant)',
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '2px 8px',
    borderRadius: '4px',
    opacity: 0.8,
  },
  cardBody: {
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '12px 0',
  },
  streakInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  streakEmoji: {
    fontSize: '20px',
  },
  streakTextCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  streakVal: {
    fontFamily: 'var(--font-code)',
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--on-surface)',
  },
  streakLbl: {
    fontFamily: 'var(--font-heading)',
    fontSize: '9px',
    fontWeight: '700',
    color: 'var(--on-surface-variant)',
    opacity: 0.5,
  },
  bestStreakCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  bestVal: {
    fontFamily: 'var(--font-code)',
    fontSize: '13px',
    color: 'var(--on-surface-variant)',
  },
  bestLbl: {
    fontFamily: 'var(--font-heading)',
    fontSize: '9px',
    fontWeight: '700',
    color: 'var(--on-surface-variant)',
    opacity: 0.5,
  },
  cardActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completeBtn: {
    flex: 1,
    border: '1px solid',
    borderRadius: 'var(--radius-md)',
    padding: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  deleteBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--error)',
    opacity: 0.6,
    padding: '10px',
    cursor: 'pointer',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '24px',
    borderRadius: 'var(--radius-xl)',
    flexWrap: 'wrap',
    gap: '16px',
  },
  summaryCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '100px',
  },
  summaryVal: {
    fontFamily: 'var(--font-code)',
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--primary)',
  },
  summaryLbl: {
    fontFamily: 'var(--font-heading)',
    fontSize: '10px',
    fontWeight: '700',
    color: 'var(--on-surface-variant)',
    opacity: 0.6,
    marginTop: '4px',
  }
};
