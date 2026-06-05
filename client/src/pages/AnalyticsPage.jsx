import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function AnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [weekly, setWeekly] = useState([]);
  const [categories, setCategories] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [logs, setLogs] = useState([]);

  const fetchData = async () => {
    try {
      const stats = await api.get('/analytics/overview');
      setOverview(stats);

      const weeklyData = await api.get('/analytics/weekly');
      setWeekly(weeklyData);

      const categoryData = await api.get('/analytics/categories');
      setCategories(categoryData);

      const monthlyData = await api.get('/analytics/monthly');
      setMonthly(monthlyData);

      const achs = await api.get('/achievements');
      setAchievements(achs);

      const recentLogs = await api.get('/activity-log');
      setLogs(recentLogs);
    } catch (err) {
      console.error('Failed to load analytics records:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalAchievements = achievements.length;
  const unlockedAchievements = achievements.filter(a => a.isUnlocked).length;

  return (
    <div style={styles.container}>
      {/* Overview Cards Row */}
      <div style={styles.statsRow}>
        <div className="glass-card" style={styles.statCard}>
          <div style={styles.statHeader}>PRODUCTIVE HOURS</div>
          <div style={styles.statValue}>{overview?.productiveHours || '0'}</div>
          <div style={styles.statTrendGreen}>{overview?.productiveHoursChange || '0%'} VS LAST MONTH</div>
        </div>
        <div className="glass-card" style={styles.statCard}>
          <div style={styles.statHeader}>WASTED HOURS</div>
          <div style={styles.statValue}>{overview?.wastedHours || '0'}</div>
          <div style={styles.statTrendRed}>{overview?.wastedHoursChange || '0%'} OPTIMIZED</div>
        </div>
        <div className="glass-card" style={styles.statCard}>
          <div style={styles.statHeader}>FOCUS SCORE</div>
          <div style={{ ...styles.statValue, color: 'var(--primary-container)' }}>
            {overview?.focusScore || '0'}<span style={{ fontSize: '20px', color: 'var(--on-surface-variant)' }}>/100</span>
          </div>
          <div style={styles.statTrendGreen}>{overview?.focusScoreChange || '0'} IN FLOW STATE</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={styles.chartsGrid}>
        {/* Weekly Curve SVG Area Chart */}
        <section className="glass-card" style={{ ...styles.chartSection, gridColumn: 'span 8' }}>
          <h3 style={styles.sectionTitle}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>insights</span>
            <span>Weekly Focus Trend</span>
          </h3>
          <div style={styles.chartContainer}>
            <svg viewBox="0 0 500 150" style={styles.svgCurve}>
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.05)" />
              <line x1="40" y1="70" x2="480" y2="70" stroke="rgba(255,255,255,0.05)" />
              <line x1="40" y1="120" x2="480" y2="120" stroke="rgba(255,255,255,0.1)" />

              {/* Area path */}
              <path
                d="M 40,120 L 40,90 L 110,65 L 180,80 L 250,30 L 320,40 L 390,110 L 460,95 L 460,120 Z"
                fill="url(#weeklyGrad)"
                opacity="0.2"
              />
              {/* Curve path */}
              <path
                d="M 40,90 L 110,65 L 180,80 L 250,30 L 320,40 L 390,110 L 460,95"
                fill="none"
                stroke="var(--primary-container)"
                strokeWidth="2"
                style={{ filter: 'drop-shadow(0 0 6px var(--primary-container))' }}
              />

              {/* Data dots */}
              <circle cx="40" cy="90" r="3" fill="var(--primary)" />
              <circle cx="110" cy="65" r="3" fill="var(--primary)" />
              <circle cx="180" cy="80" r="3" fill="var(--primary)" />
              <circle cx="250" cy="30" r="3" fill="var(--primary)" />
              <circle cx="320" cy="40" r="3" fill="var(--primary)" />
              <circle cx="390" cy="110" r="3" fill="var(--primary)" />
              <circle cx="460" cy="95" r="3" fill="var(--primary)" />

              {/* X Axis Labels */}
              <text x="40" y="140" fill="var(--on-surface-variant)" fontSize="9" textAnchor="middle">MON</text>
              <text x="110" y="140" fill="var(--on-surface-variant)" fontSize="9" textAnchor="middle">TUE</text>
              <text x="180" y="140" fill="var(--on-surface-variant)" fontSize="9" textAnchor="middle">WED</text>
              <text x="250" y="140" fill="var(--on-surface-variant)" fontSize="9" textAnchor="middle">THU</text>
              <text x="320" y="140" fill="var(--on-surface-variant)" fontSize="9" textAnchor="middle">FRI</text>
              <text x="390" y="140" fill="var(--on-surface-variant)" fontSize="9" textAnchor="middle">SAT</text>
              <text x="460" y="140" fill="var(--on-surface-variant)" fontSize="9" textAnchor="middle">SUN</text>

              <defs>
                <linearGradient id="weeklyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary-container)" />
                  <stop offset="100%" stopColor="var(--background)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </section>

        {/* Category breakdown (Pie donut chart) */}
        <section className="glass-card" style={{ ...styles.chartSection, gridColumn: 'span 4' }}>
          <h3 style={styles.sectionTitle}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>donut_large</span>
            <span>Category Breakdown</span>
          </h3>
          <div style={styles.donutRow}>
            {/* SVG Donut */}
            <svg width="100" height="100" viewBox="0 0 36 36" style={styles.donutSvg}>
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
              {/* coding: 40% */}
              <circle
                cx="18" cy="18" r="15.915"
                fill="none"
                stroke="var(--primary-container)"
                strokeWidth="3.2"
                strokeDasharray="40 60"
                strokeDashoffset="25"
              />
              {/* gym: 15% */}
              <circle
                cx="18" cy="18" r="15.915"
                fill="none"
                stroke="var(--secondary)"
                strokeWidth="3.2"
                strokeDasharray="15 85"
                strokeDashoffset="85"
              />
              {/* reading: 10% */}
              <circle
                cx="18" cy="18" r="15.915"
                fill="none"
                stroke="var(--tertiary)"
                strokeWidth="3.2"
                strokeDasharray="10 90"
                strokeDashoffset="70"
              />
            </svg>
            {/* Legend list */}
            <div style={styles.donutLegend}>
              {categories.map(cat => (
                <div key={cat.category} style={styles.legendItem}>
                  <div
                    style={{
                      ...styles.legendColorDot,
                      backgroundColor: cat.color === 'primary' ? 'var(--primary-container)' : cat.color === 'secondary' ? 'var(--secondary)' : cat.color === 'tertiary' ? 'var(--tertiary)' : 'var(--outline)',
                    }}
                  />
                  <span style={styles.legendText}>
                    {cat.category}: {cat.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Achievements grid */}
      <section className="glass-card" style={styles.achievementSection}>
        <div style={styles.achievementsHeader}>
          <h3 style={styles.sectionTitle}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>emoji_events</span>
            <span>Achievements Archive</span>
          </h3>
          <div style={styles.collectionCounter}>
            {unlockedAchievements} / {totalAchievements} UNLOCKED
          </div>
        </div>

        <div style={styles.achievementGrid}>
          {achievements.map((ach) => {
            const color = ach.color === 'primary' ? 'var(--primary)' : ach.color === 'secondary' ? 'var(--secondary)' : ach.color === 'tertiary' ? 'var(--tertiary)' : 'var(--error)';
            return (
              <div
                key={ach.id}
                style={{
                  ...styles.achCard,
                  opacity: ach.isUnlocked ? 1 : 0.35,
                  filter: ach.isUnlocked ? 'none' : 'grayscale(1)',
                }}
              >
                <div
                  style={{
                    ...styles.achIconBox,
                    borderColor: ach.isUnlocked ? color : 'rgba(255,255,255,0.1)',
                    color: ach.isUnlocked ? color : 'var(--on-surface-variant)',
                    boxShadow: ach.isUnlocked ? `0 0 12px ${color}30` : 'none',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                    {ach.icon || 'emoji_events'}
                  </span>
                </div>
                <div style={styles.achInfo}>
                  <div style={styles.achName}>{ach.name}</div>
                  <div style={styles.achDesc}>{ach.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI efficiency alert */}
      <div className="glass-card" style={styles.efficiencyAlert}>
        <span className="material-symbols-outlined" style={styles.alertIcon}>smart_toy</span>
        <div style={styles.alertText}>
          <strong>EFFICIENCY INSIGHT:</strong> Your productivity peaks between 09:00 - 11:30. Schedule deep work blocks here.
        </div>
      </div>

      {/* Operational Timeline logs */}
      <section className="glass-card" style={styles.opsCard}>
        <h3 style={styles.sectionTitle}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>reorder</span>
          <span>Operational Timeline Log</span>
        </h3>
        <div style={styles.opsList}>
          {logs.slice(0, 5).map(log => (
            <div key={log.id} style={styles.opsItem}>
              <div style={styles.opsLine} />
              <div style={styles.opsBullet} />
              <div style={styles.opsText}>
                <span style={styles.opsTime}>
                  {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' })}
                </span>
                <span style={styles.opsDesc}>{log.description}</span>
              </div>
            </div>
          ))}
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
    gap: '24px',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
  },
  statCard: {
    padding: '24px',
    borderRadius: 'var(--radius-xl)',
  },
  statHeader: {
    fontFamily: 'var(--font-heading)',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--on-surface-variant)',
    letterSpacing: '1px',
  },
  statValue: {
    fontFamily: 'var(--font-heading)',
    fontSize: '36px',
    fontWeight: '900',
    color: 'var(--on-surface)',
    marginTop: '4px',
  },
  statTrendGreen: {
    fontFamily: 'var(--font-code)',
    fontSize: '10px',
    fontWeight: '700',
    color: 'var(--secondary)',
    marginTop: '6px',
  },
  statTrendRed: {
    fontFamily: 'var(--font-code)',
    fontSize: '10px',
    fontWeight: '700',
    color: 'var(--primary)',
    marginTop: '6px',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: '16px',
  },
  chartSection: {
    padding: '20px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
  chartContainer: {
    height: '160px',
    display: 'flex',
    alignItems: 'center',
  },
  svgCurve: {
    width: '100%',
    height: '100%',
    overflow: 'visible',
  },
  donutRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
    flex: 1,
  },
  donutSvg: {
    transform: 'rotate(-90deg)',
    filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.05))',
  },
  donutLegend: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  legendColorDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  legendText: {
    fontFamily: 'var(--font-code)',
    fontSize: '11px',
    color: 'var(--on-surface-variant)',
  },
  achievementSection: {
    padding: '24px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  achievementsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collectionCounter: {
    fontFamily: 'var(--font-code)',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--primary)',
    background: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.2)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  achievementGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
  },
  achCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    background: 'rgba(255,255,255,0.01)',
    padding: '12px',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid rgba(255,255,255,0.03)',
    transition: 'all 0.3s ease',
  },
  achIconBox: {
    width: '44px',
    height: '44px',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  achName: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--on-surface)',
  },
  achDesc: {
    fontSize: '12px',
    color: 'var(--on-surface-variant)',
    opacity: 0.6,
  },
  efficiencyAlert: {
    padding: '16px',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderLeft: '3px solid var(--primary)',
  },
  alertIcon: {
    fontSize: '24px',
    color: 'var(--primary)',
  },
  alertText: {
    fontFamily: 'var(--font-body)',
    fontSize: '13px',
    color: 'var(--on-surface)',
  },
  opsCard: {
    padding: '20px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  opsList: {
    display: 'flex',
    flexDirection: 'column',
  },
  opsItem: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    paddingBottom: '16px',
  },
  opsLine: {
    position: 'absolute',
    left: '5px',
    top: '12px',
    bottom: 0,
    width: '1px',
    background: 'rgba(255,255,255,0.1)',
  },
  opsBullet: {
    width: '11px',
    height: '11px',
    borderRadius: '50%',
    background: 'var(--primary)',
    border: '2px solid var(--background)',
    zIndex: 1,
  },
  opsText: {
    display: 'flex',
    gap: '12px',
    fontFamily: 'var(--font-code)',
    fontSize: '12px',
  },
  opsTime: {
    color: 'var(--primary)',
    opacity: 0.7,
  },
  opsDesc: {
    color: 'var(--on-surface)',
  },
};
