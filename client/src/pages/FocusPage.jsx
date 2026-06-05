import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function FocusPage() {
  const { refreshUser } = useAuth();
  
  // Timer States
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [preset, setPreset] = useState(25); // 25 or 50
  const timerRef = useRef(null);

  // Ambient Sound States
  const [activeSound, setActiveSound] = useState(null);
  const [volume, setVolume] = useState(50);

  // Quest States
  const [activeQuestsList, setActiveQuestsList] = useState([]);
  const [activeQuest, setActiveQuest] = useState(null);

  // Journal States
  const [wentWell, setWentWell] = useState('');
  const [learned, setLearned] = useState('');
  const [journalSaved, setJournalSaved] = useState(false);

  const audioRef = useRef(null);

  const fetchActiveQuests = async () => {
    try {
      const activeQuests = await api.get('/quests?status=active');
      setActiveQuestsList(activeQuests);
      if (activeQuests.length > 0) {
        setActiveQuest(activeQuests[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchActiveQuests();
  }, []);

  // Timer Countdown Logic
  useEffect(() => {
    if (isActive && secondsLeft > 0) {
      timerRef.current = setTimeout(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isActive) {
      setIsActive(false);
      handleTimerComplete();
    }
    return () => clearTimeout(timerRef.current);
  }, [isActive, secondsLeft]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setSecondsLeft(preset * 60);
  };

  const handlePresetChange = (mins) => {
    setIsActive(false);
    setPreset(mins);
    setSecondsLeft(mins * 60);
  };

  const handleTimerComplete = async () => {
    alert('Focus session complete! Storing logs and awarding XP...');
    try {
      // Storing completed focus session
      const session = await api.post('/focus/start', {
        questId: activeQuest?.id || null,
        duration: preset,
      });

      await api.post(`/focus/${session.id}/complete`);

      // Optionally complete the quest as well if they want
      if (activeQuest && window.confirm(`Would you like to mark "${activeQuest.title}" as completed as well?`)) {
        await api.post(`/quests/${activeQuest.id}/complete`);
        setActiveQuest(null);
        fetchActiveQuests();
      }

      await refreshUser();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSoundToggle = (soundType) => {
    if (activeSound === soundType) {
      setActiveSound(null);
    } else {
      setActiveSound(soundType);
    }
  };

  const handleSaveJournal = async (e) => {
    e.preventDefault();
    if (!wentWell.trim() || !learned.trim()) return;

    try {
      await api.post('/journal', { wentWell, learned });
      setJournalSaved(true);
      setWentWell('');
      setLearned('');
      setTimeout(() => setJournalSaved(false), 3000);
      await refreshUser();
    } catch (err) {
      alert(err.message || 'Error saving journal reflection');
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const percentProgress = ((preset * 60 - secondsLeft) / (preset * 60)) * 100;

  return (
    <div style={styles.container}>
      {/* Top Pomodoro Layout */}
      <div style={styles.mainFocusGrid}>
        {/* Large Timer Block */}
        <section className="glass-card" style={styles.timerCard}>
          <div style={styles.presetsRow}>
            <button
              onClick={() => handlePresetChange(25)}
              style={{ ...styles.presetBtn, color: preset === 25 ? 'var(--primary)' : 'var(--on-surface-variant)' }}
            >
              25 MIN
            </button>
            <button
              onClick={() => handlePresetChange(50)}
              style={{ ...styles.presetBtn, color: preset === 50 ? 'var(--primary)' : 'var(--on-surface-variant)' }}
            >
              50 MIN
            </button>
          </div>

          <div style={styles.timeDisplay} className="glow-text">
            {formatTime(secondsLeft)}
          </div>

          <div style={styles.controlsRow}>
            <button onClick={toggleTimer} style={styles.playBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                {isActive ? 'pause' : 'play_arrow'}
              </span>
            </button>
            <button onClick={resetTimer} style={styles.resetBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                restart_alt
              </span>
            </button>
          </div>

          <div style={styles.timerTrack}>
            <div style={{ ...styles.timerFill, width: `${percentProgress}%` }} />
          </div>
        </section>

        {/* Ambient & Active Quest Info Sidebar */}
        <div style={styles.sidebarColumn}>
          {/* Active Quest Selection */}
          <section className="glass-card" style={styles.activeQuestCard}>
            <div style={styles.sidebarHeader}>ACTIVE MISSION FOCUS</div>
            {activeQuestsList.length > 0 ? (
              <div style={styles.questContent}>
                <label style={styles.selectLabel}>SELECT OBJECTIVE LINK:</label>
                <select
                  value={activeQuest?.id || ''}
                  onChange={(e) => {
                    const selected = activeQuestsList.find(q => q.id === parseInt(e.target.value));
                    setActiveQuest(selected || null);
                  }}
                  style={styles.selectDropdown}
                >
                  <option value="">-- NO QUEST LINKED --</option>
                  {activeQuestsList.map(q => (
                    <option key={q.id} value={q.id}>{q.title}</option>
                  ))}
                </select>

                {activeQuest && (
                  <div style={styles.questDetails}>
                    <div style={styles.questTitle}>{activeQuest.title}</div>
                    <div style={styles.tagRow}>
                      {activeQuest.tags.map(tag => (
                        <span key={tag} style={styles.tagChip}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div style={styles.pendingXp}>+{activeQuest.xpReward} XP PENDING</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.emptyQuestText}>NO ACTIVE MISSIONS IN QUEUE.</div>
            )}
          </section>

          {/* Ambient Selector */}
          <section className="glass-card" style={styles.ambientCard}>
            <div style={styles.sidebarHeader}>AMBIENT PROTOCOL</div>
            <div style={styles.ambientGrid}>
              {['Rain', 'Forest', 'Cafe', 'Lofi'].map((sound) => {
                const isActiveSound = activeSound === sound;
                return (
                  <button
                    key={sound}
                    onClick={() => handleSoundToggle(sound)}
                    style={{
                      ...styles.ambientBtn,
                      borderColor: isActiveSound ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                      background: isActiveSound ? 'rgba(56, 189, 248, 0.05)' : 'rgba(255,255,255,0.02)',
                      color: isActiveSound ? 'var(--primary)' : 'var(--on-surface-variant)',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      {sound === 'Rain' ? 'rainy' : sound === 'Forest' ? 'nature' : sound === 'Cafe' ? 'coffee' : 'music_note'}
                    </span>
                    <span>{sound.toUpperCase()}</span>
                  </button>
                );
              })}
            </div>
            {activeSound && (
              <div style={styles.visualizerRow}>
                <div className="wave-line" style={{ ...styles.wave, animationDelay: '0.1s' }} />
                <div className="wave-line" style={{ ...styles.wave, animationDelay: '0.3s' }} />
                <div className="wave-line" style={{ ...styles.wave, animationDelay: '0.5s' }} />
                <div className="wave-line" style={{ ...styles.wave, animationDelay: '0.2s' }} />
                <div className="wave-line" style={{ ...styles.wave, animationDelay: '0.4s' }} />
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Synaptic Record Journal Form */}
      <section className="glass-card" style={styles.journalCard}>
        <div style={styles.journalHeader}>
          <h3 style={styles.sectionTitle}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>menu_book</span>
            <span>Synaptic Record</span>
          </h3>
          <span style={styles.journalTip}>REFLECTING INCREASES RETENTION BY UP TO 23%</span>
        </div>

        {journalSaved && <div style={styles.saveAlert}>SYNAPTIC RECORD LOGGED TO KERNEL SUCCESS.</div>}

        <form onSubmit={handleSaveJournal} style={styles.journalForm}>
          <div style={styles.formRow}>
            <div style={styles.fieldCol}>
              <label style={styles.label}>WHAT WENT WELL TODAY?</label>
              <textarea
                value={wentWell}
                onChange={(e) => setWentWell(e.target.value)}
                placeholder="Log daily breakthroughs and successful cycles..."
                style={styles.textarea}
                required
              />
            </div>
            <div style={styles.fieldCol}>
              <label style={styles.label}>WHAT DID I LEARN TODAY?</label>
              <textarea
                value={learned}
                onChange={(e) => setLearned(e.target.value)}
                placeholder="Log key learnings, architecture patterns, and notes..."
                style={styles.textarea}
                required
              />
            </div>
          </div>
          <button type="submit" style={styles.submitBtn}>
            SAVE REFLECTION LOG
          </button>
        </form>
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
  mainFocusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: '24px',
  },
  timerCard: {
    gridColumn: 'span 8',
    padding: '40px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '340px',
    position: 'relative',
  },
  presetsRow: {
    display: 'flex',
    gap: '24px',
    marginBottom: '24px',
  },
  presetBtn: {
    background: 'transparent',
    border: 'none',
    fontFamily: 'var(--font-code)',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    letterSpacing: '1px',
    transition: 'color 0.3s ease',
  },
  timeDisplay: {
    fontFamily: 'var(--font-code)',
    fontSize: '72px',
    fontWeight: '700',
    color: 'var(--primary)',
    letterSpacing: '-2px',
    margin: '16px 0',
  },
  controlsRow: {
    display: 'flex',
    gap: '24px',
    alignItems: 'center',
    marginBottom: '32px',
  },
  playBtn: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'var(--primary-container)',
    color: '#002109',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 0 15px rgba(56,189,248,0.4)',
    transition: 'transform 0.3s ease',
  },
  resetBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.05)',
    color: 'var(--on-surface)',
    border: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
  },
  timerTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'var(--surface-container)',
  },
  timerFill: {
    height: '100%',
    background: 'var(--primary)',
    boxShadow: '0 0 8px var(--primary)',
    transition: 'width 1s linear',
  },
  sidebarColumn: {
    gridColumn: 'span 4',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  activeQuestCard: {
    padding: '20px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flex: 1,
  },
  sidebarHeader: {
    fontFamily: 'var(--font-heading)',
    fontSize: '10px',
    fontWeight: '800',
    color: 'var(--on-surface-variant)',
    opacity: 0.6,
    letterSpacing: '1px',
  },
  questContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    justifyContent: 'center',
    flex: 1,
  },
  selectLabel: {
    fontFamily: 'var(--font-code)',
    fontSize: '9px',
    color: 'var(--on-surface-variant)',
    fontWeight: 'bold',
  },
  selectDropdown: {
    background: '#0f172a',
    border: '1px solid var(--outline-variant)',
    color: 'var(--on-surface)',
    fontFamily: 'var(--font-heading)',
    fontSize: '12px',
    padding: '8px',
    borderRadius: 'var(--radius-sm)',
    outline: 'none',
  },
  questDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '8px',
  },
  questTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--on-surface)',
  },
  tagRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  tagChip: {
    fontFamily: 'var(--font-code)',
    fontSize: '9px',
    color: 'var(--primary-container)',
    background: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.2)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  pendingXp: {
    fontFamily: 'var(--font-code)',
    fontSize: '12px',
    color: 'var(--secondary)',
    fontWeight: '600',
  },
  emptyQuestText: {
    fontFamily: 'var(--font-code)',
    fontSize: '11px',
    color: 'var(--on-surface-variant)',
    opacity: 0.4,
    textAlign: 'center',
    padding: '24px 0',
  },
  ambientCard: {
    padding: '20px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  ambientGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
  },
  ambientBtn: {
    border: '1px solid',
    padding: '10px',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: 'var(--font-heading)',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    transition: 'all 0.3s ease',
  },
  visualizerRow: {
    display: 'flex',
    gap: '4px',
    height: '24px',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '8px',
  },
  wave: {
    width: '3px',
    height: '100%',
    background: 'var(--primary)',
    animation: 'waveHeight 1s ease-in-out infinite alternate',
    borderRadius: '2px',
  },
  journalCard: {
    padding: '24px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  journalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  journalTip: {
    fontFamily: 'var(--font-code)',
    fontSize: '9px',
    color: 'var(--primary-container)',
    fontWeight: '700',
    letterSpacing: '0.5px',
  },
  journalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
  },
  fieldCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontFamily: 'var(--font-code)',
    fontSize: '9px',
    color: 'var(--on-surface-variant)',
    fontWeight: '700',
    letterSpacing: '0.5px',
  },
  textarea: {
    background: '#0f172a',
    border: 'none',
    borderBottom: '1px solid var(--outline-variant)',
    padding: '12px',
    color: 'var(--on-surface)',
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    minHeight: '80px',
    outline: 'none',
    resize: 'none',
    transition: 'border-color 0.3s ease',
  },
  submitBtn: {
    alignSelf: 'flex-start',
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
  },
  saveAlert: {
    background: 'rgba(74, 225, 118, 0.1)',
    border: '1px solid var(--secondary)',
    color: '#dae2fd',
    fontFamily: 'var(--font-code)',
    fontSize: '11px',
    padding: '10px',
    borderRadius: '4px',
    textAlign: 'center',
  },
};
