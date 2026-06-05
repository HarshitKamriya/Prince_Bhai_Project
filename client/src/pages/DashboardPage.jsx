import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const [quests, setQuests] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [clock, setClock] = useState('');

  // Quest Creation states
  const [showQuestForm, setShowQuestForm] = useState(false);
  const [questTitle, setQuestTitle] = useState('');
  const [questCategory, setQuestCategory] = useState('coding');
  const [questXp, setQuestXp] = useState(20);

  // Schedule Entry Creation states
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleStart, setScheduleStart] = useState('09:00');
  const [scheduleEnd, setScheduleEnd] = useState('10:00');
  const [scheduleCategory, setScheduleCategory] = useState('coding');

  // Live Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    const interval = setInterval(updateClock, 1000);
    updateClock();
    return () => clearInterval(interval);
  }, []);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const activeQuests = await api.get('/quests?status=active');
      setQuests(activeQuests);

      const dailySchedule = await api.get('/schedule');
      setSchedule(dailySchedule);

      const heatmapData = await api.get('/consistency');
      setHeatmap(heatmapData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Complete Quest
  const handleCompleteQuest = async (questId) => {
    try {
      await api.post(`/quests/${questId}/complete`);
      // Update local state
      setQuests(prev => prev.filter(q => q.id !== questId));
      // Refresh user level, streak, XP details
      await refreshUser();
      // Refresh heatmap data
      const heatmapData = await api.get('/consistency');
      setHeatmap(heatmapData);
    } catch (err) {
      alert(err.message || 'Error completing quest');
    }
  };

  // Add Quest
  const handleCreateQuest = async (e) => {
    e.preventDefault();
    if (!questTitle.trim()) return;

    const iconMap = {
      coding: 'code',
      gym: 'fitness_center',
      reading: 'auto_stories',
      other: 'military_tech'
    };

    try {
      const newQuest = await api.post('/quests', {
        title: questTitle,
        category: questCategory,
        xpReward: questXp,
        icon: iconMap[questCategory] || 'military_tech',
      });
      setQuests(prev => [...prev, newQuest]);
      setQuestTitle('');
      setShowQuestForm(false);
    } catch (err) {
      alert(err.message || 'Failed to deploy quest objective');
    }
  };

  // Add Schedule Entry
  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleTitle.trim()) return;

    try {
      const newEntry = await api.post('/schedule', {
        title: scheduleTitle,
        startTime: scheduleStart,
        endTime: scheduleEnd,
        category: scheduleCategory,
        date: new Date(),
      });
      setSchedule(prev => [...prev, newEntry].sort((a, b) => a.startTime.localeCompare(b.startTime)));
      setScheduleTitle('');
      setShowScheduleForm(false);
    } catch (err) {
      alert(err.message || 'Failed to deploy timeline entry');
    }
  };

  // Generate heatmap columns (52 columns of 7 days)
  const renderHeatmap = () => {
    const intensityClasses = [
      'rgba(255, 255, 255, 0.05)', // 0
      'rgba(74, 225, 118, 0.2)',    // 1
      'rgba(74, 225, 118, 0.4)',    // 2
      'rgba(74, 225, 118, 0.7)',    // 3
      'rgba(74, 225, 118, 1)',      // 4
    ];

    const grid = [];
    for (let i = 0; i < 52; i++) {
      const cells = [];
      for (let j = 0; j < 7; j++) {
        const dateIndex = i * 7 + j;
        const entry = heatmap[heatmap.length - 1 - dateIndex];
        const intensity = entry ? entry.intensity : 0;
        
        cells.push(
          <div
            key={j}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '2px',
              backgroundColor: intensityClasses[intensity],
            }}
          />
        );
      }
      grid.push(
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {cells}
        </div>
      );
    }
    return grid;
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div style={styles.container}>
      {/* Greeting Header */}
      <div style={styles.topRow}>
        <div style={styles.greetingBlock}>
          <h2 style={styles.greetingTitle}>Good Morning, {user?.displayName || 'Prince'} 👋</h2>
          <div style={styles.timeInfo}>
            <span style={styles.date}>{formattedDate}</span>
            <div style={styles.clock} id="clock">{clock}</div>
          </div>
          <p style={styles.quote}>"Discipline beats motivation."</p>
        </div>

        {/* Gamification progress */}
        <div style={styles.progressBlock}>
          <div style={styles.progressHeader}>
            <div style={styles.metricsGroup}>
              <div>
                <div style={styles.metricLabel}>🔥 STREAK</div>
                <div style={styles.metricValGreen}>{user?.currentStreak || 0} Days</div>
              </div>
              <div>
                <div style={styles.metricLabel}>⭐ LEVEL</div>
                <div style={styles.metricValBlue}>{user?.level || 1}</div>
              </div>
            </div>
            <div style={styles.xpFraction}>
              <span style={{ color: 'var(--on-surface)' }}>{user?.totalXp || 0}</span>
              <span style={{ color: 'var(--on-surface-variant)' }}>/ {user?.xpToNextLevel || 1000} XP</span>
            </div>
          </div>
          {/* Progress bar */}
          <div style={styles.progressBarTrack}>
            <div
              style={{
                ...styles.progressBarFill,
                width: `${((user?.totalXp || 0) / (user?.xpToNextLevel || 1000)) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Grid Modules */}
      <div style={styles.dashboardGrid}>
        {/* Active Quests */}
        <section style={styles.sectionCard}>
          <h3 style={styles.sectionTitle}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>military_tech</span>
            <span>Active Quests</span>
            <button onClick={() => setShowQuestForm(!showQuestForm)} style={styles.inlineAddBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{showQuestForm ? 'close' : 'add'}</span>
            </button>
          </h3>

          {showQuestForm && (
            <form onSubmit={handleCreateQuest} className="glass-card" style={styles.inlineForm}>
              <input
                type="text"
                placeholder="Quest Objective..."
                value={questTitle}
                onChange={(e) => setQuestTitle(e.target.value)}
                style={styles.inlineInput}
                required
              />
              <div style={styles.formRow}>
                <select
                  value={questCategory}
                  onChange={(e) => setQuestCategory(e.target.value)}
                  style={styles.inlineSelect}
                >
                  <option value="coding">CODING</option>
                  <option value="gym">GYM</option>
                  <option value="reading">READING</option>
                  <option value="other">OTHER</option>
                </select>
                <input
                  type="number"
                  placeholder="XP"
                  value={questXp}
                  onChange={(e) => setQuestXp(parseInt(e.target.value))}
                  style={{ ...styles.inlineInput, width: '60px' }}
                  required
                />
                <button type="submit" style={styles.inlineSubmit}>DEPLOY</button>
              </div>
            </form>
          )}

          <div style={styles.listContainer}>
            {quests.length === 0 ? (
              <div style={styles.emptyState}>NO ACTIVE QUESTS. DEPLOY A NEW MISSION OBJECTIVE.</div>
            ) : (
              quests.map((q) => (
                <div key={q.id} className="glass-card" style={styles.questCard}>
                  <div
                    style={{
                      ...styles.questIconBox,
                      color: q.category === 'coding' ? 'var(--primary)' : q.category === 'gym' ? 'var(--secondary)' : 'var(--tertiary)',
                      background: q.category === 'coding' ? 'rgba(56,189,248,0.1)' : q.category === 'gym' ? 'rgba(74,225,118,0.1)' : 'rgba(255,193,116,0.1)',
                      borderColor: q.category === 'coding' ? 'rgba(56,189,248,0.2)' : q.category === 'gym' ? 'rgba(74,225,118,0.2)' : 'rgba(255,193,116,0.2)',
                    }}
                  >
                    <span className="material-symbols-outlined">{q.icon || 'military_tech'}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.questText}>{q.title}</div>
                    <div style={styles.questXp}>+{q.xpReward} XP</div>
                  </div>
                  <button onClick={() => handleCompleteQuest(q.id)} style={styles.questCheckBtn}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Today's Protocol */}
        <section style={styles.sectionCard}>
          <h3 style={styles.sectionTitle}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>schedule</span>
            <span>Today's Protocol</span>
            <button onClick={() => setShowScheduleForm(!showScheduleForm)} style={styles.inlineAddBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{showScheduleForm ? 'close' : 'add'}</span>
            </button>
          </h3>

          {showScheduleForm && (
            <form onSubmit={handleCreateSchedule} className="glass-card" style={styles.inlineForm}>
              <input
                type="text"
                placeholder="Timeline Task..."
                value={scheduleTitle}
                onChange={(e) => setScheduleTitle(e.target.value)}
                style={styles.inlineInput}
                required
              />
              <div style={styles.formRow}>
                <input
                  type="text"
                  placeholder="Start"
                  value={scheduleStart}
                  onChange={(e) => setScheduleStart(e.target.value)}
                  style={{ ...styles.inlineInput, width: '60px' }}
                  required
                />
                <input
                  type="text"
                  placeholder="End"
                  value={scheduleEnd}
                  onChange={(e) => setScheduleEnd(e.target.value)}
                  style={{ ...styles.inlineInput, width: '60px' }}
                  required
                />
                <select
                  value={scheduleCategory}
                  onChange={(e) => setScheduleCategory(e.target.value)}
                  style={styles.inlineSelect}
                >
                  <option value="coding">CODING</option>
                  <option value="gym">GYM</option>
                  <option value="other">OTHER</option>
                </select>
                <button type="submit" style={styles.inlineSubmit}>DEPLOY</button>
              </div>
            </form>
          )}

          <div className="glass-card scrollbar-hide" style={styles.protocolCard}>
            <div className="timeline-line">
              {schedule.length === 0 ? (
                <div style={styles.emptyState}>TIMELINE PROTOCOL CLEAR.</div>
              ) : (
                schedule.map((item) => {
                  const isCompleted = item.status === 'completed';
                  return (
                    <div key={item.id} style={{ ...styles.timelineItem, opacity: isCompleted ? 0.6 : 1 }}>
                      <div
                        style={{
                          ...styles.timelineDot,
                          backgroundColor: item.category === 'gym' ? 'var(--secondary)' : 'var(--primary)',
                          boxShadow: `0 0 8px ${item.category === 'gym' ? 'var(--secondary)' : 'var(--primary)'}`,
                        }}
                      />
                      <div style={styles.timelineTime}>{item.startTime} - {item.endTime}</div>
                      <div style={styles.timelineTitle}>{item.title}</div>
                      {item.description && <p style={styles.timelineDesc}>{item.description}</p>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* Character Attributes */}
        <section style={styles.sectionCard}>
          <h3 style={styles.sectionTitle}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
            <span>Attributes</span>
          </h3>
          <div className="glass-card" style={styles.attributesCard}>
            {user?.attributes?.map((attr) => (
              <div key={attr.name} style={styles.attributeRow}>
                <div style={styles.attributeHeader}>
                  <span style={styles.attributeLabel}>{attr.name}</span>
                  <span style={styles.attributeLevel}>LVL {attr.level}</span>
                </div>
                <div style={styles.attributeTrack}>
                  <div
                    style={{
                      ...styles.attributeFill,
                      width: `${attr.progressPercent}%`,
                      backgroundColor: attr.name === 'HEALTH' ? 'var(--secondary)' : 'var(--primary)',
                    }}
                  />
                </div>
              </div>
            )) || (
              <div style={styles.emptyState}>NO ATTRIBUTES LOADED.</div>
            )}
          </div>
        </section>
      </div>

      {/* Heatmap Row */}
      <section style={{ ...styles.sectionCard, marginTop: '24px' }}>
        <div style={styles.heatmapHeader}>
          <h3 style={styles.sectionTitle}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>grid_view</span>
            <span>Consistency Map</span>
          </h3>
          <div style={styles.heatmapLegend}>
            <span>Less</span>
            <div style={{ ...styles.legendCell, backgroundColor: 'rgba(255, 255, 255, 0.05)' }} />
            <div style={{ ...styles.legendCell, backgroundColor: 'rgba(74, 225, 118, 0.2)' }} />
            <div style={{ ...styles.legendCell, backgroundColor: 'rgba(74, 225, 118, 0.4)' }} />
            <div style={{ ...styles.legendCell, backgroundColor: 'rgba(74, 225, 118, 0.7)' }} />
            <div style={{ ...styles.legendCell, backgroundColor: 'rgba(74, 225, 118, 1)' }} />
            <span>More</span>
          </div>
        </div>
        <div className="glass-card scrollbar-hide" style={styles.heatmapContainer}>
          <div style={styles.heatmapGrid}>{renderHeatmap()}</div>
        </div>
      </section>
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
  },
  topRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: '24px',
    alignItems: 'end',
    marginBottom: '24px',
  },
  greetingBlock: {
    gridColumn: 'span 7',
  },
  greetingTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '32px',
    fontWeight: '800',
    color: 'var(--on-surface)',
    letterSpacing: '-0.5px',
  },
  timeInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginTop: '4px',
  },
  date: {
    fontFamily: 'var(--font-heading)',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--primary)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  clock: {
    fontFamily: 'var(--font-code)',
    fontSize: '12px',
    color: 'var(--on-surface)',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.05)',
    padding: '4px 10px',
    borderRadius: '8px',
  },
  quote: {
    fontStyle: 'italic',
    fontSize: '14px',
    color: 'var(--on-surface-variant)',
    opacity: 0.6,
    borderLeft: '2px solid var(--primary)',
    paddingLeft: '16px',
    marginTop: '16px',
  },
  progressBlock: {
    gridColumn: 'span 5',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  metricsGroup: {
    display: 'flex',
    gap: '24px',
  },
  metricLabel: {
    fontFamily: 'var(--font-heading)',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--on-surface-variant)',
    letterSpacing: '1px',
  },
  metricValGreen: {
    fontFamily: 'var(--font-heading)',
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--secondary)',
  },
  metricValBlue: {
    fontFamily: 'var(--font-heading)',
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--primary)',
  },
  xpFraction: {
    fontFamily: 'var(--font-code)',
    fontSize: '12px',
  },
  progressBarTrack: {
    height: '8px',
    width: '100%',
    background: 'var(--surface-container)',
    borderRadius: '4px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, var(--primary-container), var(--primary))',
    boxShadow: '0 0 10px var(--primary-container)',
    transition: 'width 0.4s ease',
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: '16px',
  },
  sectionCard: {
    gridColumn: 'span 4',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
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
  inlineAddBtn: {
    marginLeft: 'auto',
    background: 'transparent',
    border: 'none',
    color: 'var(--primary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineForm: {
    padding: '12px',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    border: '1px solid rgba(56, 189, 248, 0.2)',
  },
  inlineInput: {
    background: '#0f172a',
    border: 'none',
    borderBottom: '1px solid var(--outline-variant)',
    padding: '6px 8px',
    color: 'var(--on-surface)',
    fontFamily: 'var(--font-code)',
    fontSize: '11px',
    outline: 'none',
  },
  formRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  inlineSelect: {
    background: '#0f172a',
    border: '1px solid var(--outline-variant)',
    color: 'var(--on-surface)',
    fontFamily: 'var(--font-heading)',
    fontSize: '10px',
    fontWeight: '600',
    padding: '4px 6px',
    borderRadius: 'var(--radius-sm)',
    outline: 'none',
    flex: 1,
  },
  inlineSubmit: {
    background: 'var(--primary-container)',
    color: '#002109',
    border: 'none',
    fontFamily: 'var(--font-heading)',
    fontSize: '10px',
    fontWeight: '700',
    padding: '6px 12px',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
    marginLeft: 'auto',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  questCard: {
    padding: '16px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  questIconBox: {
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questText: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--on-surface)',
  },
  questXp: {
    fontFamily: 'var(--font-code)',
    fontSize: '12px',
    color: 'var(--secondary)',
    marginTop: '2px',
  },
  questCheckBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent',
    color: 'var(--on-surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  protocolCard: {
    borderRadius: 'var(--radius-xl)',
    height: '340px',
    padding: '24px 16px',
    overflowY: 'auto',
  },
  timelineItem: {
    position: 'relative',
    marginBottom: '24px',
    paddingLeft: '8px',
  },
  timelineDot: {
    position: 'absolute',
    left: '-29px',
    top: '4px',
    width: '9px',
    height: '9px',
    borderRadius: '50%',
  },
  timelineTime: {
    fontFamily: 'var(--font-code)',
    fontSize: '12px',
    color: 'var(--primary)',
  },
  timelineTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--on-surface)',
    marginTop: '2px',
  },
  timelineDesc: {
    fontSize: '13px',
    color: 'var(--on-surface-variant)',
    opacity: 0.7,
    marginTop: '4px',
  },
  attributesCard: {
    borderRadius: 'var(--radius-xl)',
    height: '340px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  attributeRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  attributeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontFamily: 'var(--font-code)',
    fontSize: '11px',
    letterSpacing: '0.5px',
  },
  attributeLabel: {
    color: 'var(--on-surface-variant)',
  },
  attributeLevel: {
    color: 'var(--primary)',
  },
  attributeTrack: {
    height: '4px',
    width: '100%',
    background: 'var(--surface-container)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  attributeFill: {
    height: '100%',
    transition: 'width 0.4s ease',
  },
  heatmapHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heatmapLegend: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
    fontFamily: 'var(--font-code)',
    fontSize: '11px',
    color: 'var(--on-surface-variant)',
    opacity: 0.6,
  },
  legendCell: {
    width: '12px',
    height: '12px',
    borderRadius: '2px',
  },
  heatmapContainer: {
    borderRadius: 'var(--radius-xl)',
    padding: '24px',
    overflowX: 'auto',
  },
  heatmapGrid: {
    display: 'flex',
    gap: '3px',
  },
  emptyState: {
    fontFamily: 'var(--font-code)',
    fontSize: '11px',
    color: 'var(--on-surface-variant)',
    opacity: 0.5,
    textAlign: 'center',
    padding: '40px 0',
  },
};
