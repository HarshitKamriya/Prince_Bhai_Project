import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function QuestsPage() {
  const { refreshUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [leetcode, setLeetcode] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('DEEP_WORK');

  // Fetch initial data
  const fetchData = async () => {
    try {
      const allTasks = await api.get('/tasks');
      setTasks(allTasks);

      const recentLogs = await api.get('/activity-log');
      setLogs(recentLogs);

      // Fetch Leetcode stats from database
      const lcData = await api.get('/coding-progress');
      const colors = {
        easy: 'var(--secondary)',
        medium: 'var(--tertiary)',
        hard: 'var(--error)',
      };
      setLeetcode(lcData.map(item => ({
        difficulty: item.difficulty,
        solved: item.solved,
        total: item.total,
        color: colors[item.difficulty.toLowerCase()] || 'var(--primary)',
      })));
    } catch (err) {
      console.error('Error fetching quests details:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update solved count for a difficulty
  const handleUpdateLeetcode = async (difficulty, newCount) => {
    if (newCount < 0) return;
    const diffRecord = leetcode.find(item => item.difficulty === difficulty);
    if (!diffRecord || newCount > diffRecord.total) return;

    try {
      // Hit update API
      await api.patch(`/coding-progress/${difficulty}`, { solved: newCount });
      
      // Update local state
      setLeetcode(prev =>
        prev.map(item => (item.difficulty === difficulty ? { ...item, solved: newCount } : item))
      );

      // Increment CODING attribute slightly for solving problems
      const codAttr = await api.get('/attributes').then(res => res.find(a => a.name === 'CODING'));
      if (codAttr) {
        let newProgress = codAttr.progressPercent + 5;
        let newLvl = codAttr.level;
        if (newProgress >= 100) {
          newProgress -= 100;
          newLvl += 1;
        }
        await api.patch('/attributes/CODING', { level: newLvl, progressPercent: newProgress });
      }

      await refreshUser();
    } catch (err) {
      alert(err.message || 'Error updating coding progress');
    }
  };

  // Complete Task
  const handleToggleTask = async (taskId) => {
    try {
      await api.post(`/tasks/${taskId}/complete`);
      setTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t))
      );
      await refreshUser();
      const recentLogs = await api.get('/activity-log');
      setLogs(recentLogs);
    } catch (err) {
      alert(err.message || 'Failed to toggle task status');
    }
  };

  // Add Task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const task = await api.post('/tasks', {
        title: newTaskTitle,
        category: newTaskCategory,
      });
      setTasks(prev => [...prev, task]);
      setNewTaskTitle('');
    } catch (err) {
      alert(err.message || 'Error adding task');
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      alert(err.message || 'Error deleting task');
    }
  };

  // Drag and Drop implementation
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetCategory) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData('text/plain');
    if (!taskIdStr) return;

    const taskId = parseInt(taskIdStr);
    const draggedTask = tasks.find(t => t.id === taskId);
    if (!draggedTask || draggedTask.category === targetCategory) return;

    const updatedTasks = tasks.map(t =>
      t.id === taskId ? { ...t, category: targetCategory } : t
    );
    setTasks(updatedTasks);

    try {
      const targetCategoryTasks = updatedTasks.filter(t => t.category === targetCategory);
      const items = targetCategoryTasks.map((t, index) => ({
        id: t.id,
        sortOrder: index,
        category: targetCategory,
      }));

      await api.patch('/tasks/reorder', { items });
    } catch (err) {
      console.error('Failed to save task drag position:', err);
      fetchData();
    }
  };

  const categories = [
    { key: 'DEEP_WORK', title: 'DEEP WORK', color: 'var(--primary)' },
    { key: 'HEALTH', title: 'HEALTH', color: 'var(--secondary)' },
    { key: 'PERSONAL', title: 'PERSONAL', color: 'var(--tertiary)' },
  ];

  return (
    <div style={styles.container}>
      {/* Header queue */}
      <div style={styles.queueHeader}>
        <div>
          <h2 style={styles.heading}>MISSION_QUEUE</h2>
          <div style={styles.badgeRow}>
            <span style={styles.badgeGreen}>EXECUTION STATUS: 78% ACTIVE</span>
            <span style={styles.badgeBlue}>DRAG_REORDER_ENABLED</span>
          </div>
        </div>

        {/* Quick Add Task */}
        <form onSubmit={handleAddTask} style={styles.addForm}>
          <input
            type="text"
            placeholder="Add new mission objective..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            style={styles.addInput}
            required
          />
          <select
            value={newTaskCategory}
            onChange={(e) => setNewTaskCategory(e.target.value)}
            style={styles.addSelect}
          >
            <option value="DEEP_WORK">DEEP WORK</option>
            <option value="HEALTH">HEALTH</option>
            <option value="PERSONAL">PERSONAL</option>
          </select>
          <button type="submit" style={styles.addBtn}>
            DEPLOY
          </button>
        </form>
      </div>

      {/* Kanban Board Row */}
      <div style={styles.kanbanRow}>
        {categories.map(cat => {
          const catTasks = tasks.filter(t => t.category === cat.key);
          return (
            <div
              key={cat.key}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, cat.key)}
              style={styles.column}
            >
              <h3 style={{ ...styles.columnTitle, color: cat.color }}>
                <span style={{ ...styles.dot, backgroundColor: cat.color }} />
                <span>{cat.title}</span>
                <span style={styles.countBadge}>{catTasks.length}</span>
              </h3>

              <div style={styles.columnBody} className="scrollbar-hide">
                {catTasks.length === 0 ? (
                  <div style={styles.emptyColumn}>DROP OBJECTIVES HERE</div>
                ) : (
                  catTasks.map(t => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, t.id)}
                      className="glass-card"
                      style={{
                        ...styles.taskCard,
                        opacity: t.isCompleted ? 0.5 : 1,
                        textDecoration: t.isCompleted ? 'line-through' : 'none',
                      }}
                    >
                      <div style={styles.taskLeft}>
                        <button
                          onClick={() => handleToggleTask(t.id)}
                          style={{
                            ...styles.checkBtn,
                            borderColor: t.isCompleted ? 'var(--secondary)' : 'rgba(255, 255, 255, 0.2)',
                            background: t.isCompleted ? 'rgba(74, 225, 118, 0.1)' : 'transparent',
                          }}
                        >
                          {t.isCompleted && (
                            <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--secondary)' }}>
                              check
                            </span>
                          )}
                        </button>
                        <span style={styles.taskTitle}>{t.title}</span>
                      </div>
                      <div style={styles.taskRight}>
                        <span className="material-symbols-outlined" style={styles.dragHandle}>
                          drag_indicator
                        </span>
                        <span
                          onClick={() => handleDeleteTask(t.id)}
                          className="material-symbols-outlined"
                          style={styles.deleteBtn}
                        >
                          delete
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats and logs */}
      <div style={styles.bottomRow}>
        {/* Leetcode engagement */}
        <section style={styles.leetcodeCard} className="glass-card">
          <h3 style={styles.sectionTitle}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>code</span>
            <span>Leetcode Engagement</span>
          </h3>
          <div style={styles.leetcodeStats}>
            {leetcode.map(lc => (
              <div key={lc.difficulty} style={styles.lcRow}>
                <div style={styles.lcHeader}>
                  <span style={styles.lcLabel}>{lc.difficulty.toUpperCase()}</span>
                  <div style={styles.lcControls}>
                    <button
                      onClick={() => handleUpdateLeetcode(lc.difficulty, lc.solved - 1)}
                      style={styles.controlBtn}
                    >
                      -
                    </button>
                    <span style={styles.lcFraction}>{lc.solved} / {lc.total}</span>
                    <button
                      onClick={() => handleUpdateLeetcode(lc.difficulty, lc.solved + 1)}
                      style={styles.controlBtn}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div style={styles.lcTrack}>
                  <div
                    style={{
                      ...styles.lcFill,
                      width: `${(lc.solved / lc.total) * 100}%`,
                      backgroundColor: lc.color,
                      boxShadow: `0 0 8px ${lc.color}`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Kernel Timeline Logs */}
        <section style={styles.logCard} className="glass-card">
          <h3 style={styles.sectionTitle}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>terminal</span>
            <span>Kernel Logs</span>
          </h3>
          <div style={styles.logList} className="scrollbar-hide">
            {logs.length === 0 ? (
              <div style={styles.emptyLogs}>TIMELINE LOGS EMPTY.</div>
            ) : (
              logs.map(log => (
                <div key={log.id} style={styles.logItem}>
                  <span style={styles.logTime}>
                    [{new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })}]
                  </span>
                  <span
                    style={{
                      ...styles.logDesc,
                      color: log.type === 'XP_GAIN' ? 'var(--secondary)' : log.type === 'BADGE' ? 'var(--primary)' : 'var(--on-surface-variant)',
                    }}
                  >
                    {log.description}
                  </span>
                </div>
              ))
            )}
          </div>
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
  },
  queueHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
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
  badgeBlue: {
    fontFamily: 'var(--font-code)',
    fontSize: '9px',
    fontWeight: '700',
    color: 'var(--primary)',
    background: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.2)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  addForm: {
    display: 'flex',
    gap: '8px',
  },
  addInput: {
    background: '#0f172a',
    border: '1px solid var(--outline-variant)',
    outline: 'none',
    padding: '8px 12px',
    color: 'var(--on-surface)',
    fontFamily: 'var(--font-code)',
    fontSize: '12px',
    width: '220px',
    borderRadius: 'var(--radius-sm)',
  },
  addSelect: {
    background: '#0f172a',
    border: '1px solid var(--outline-variant)',
    color: 'var(--on-surface)',
    fontFamily: 'var(--font-heading)',
    fontSize: '11px',
    fontWeight: '600',
    padding: '0 8px',
    borderRadius: 'var(--radius-sm)',
    outline: 'none',
  },
  addBtn: {
    background: 'var(--primary-container)',
    color: '#002109',
    border: 'none',
    fontFamily: 'var(--font-heading)',
    fontSize: '11px',
    fontWeight: '700',
    padding: '8px 16px',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
  },
  kanbanRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    background: 'rgba(11, 19, 38, 0.15)',
    borderRadius: 'var(--radius-xl)',
    padding: '16px',
    minHeight: '400px',
  },
  columnTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontFamily: 'var(--font-heading)',
    fontSize: '12px',
    fontWeight: '800',
    letterSpacing: '1px',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  countBadge: {
    marginLeft: 'auto',
    fontFamily: 'var(--font-code)',
    fontSize: '10px',
    color: 'var(--on-surface-variant)',
    background: 'rgba(255,255,255,0.05)',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  columnBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    overflowY: 'auto',
    flex: 1,
  },
  emptyColumn: {
    textAlign: 'center',
    fontFamily: 'var(--font-code)',
    fontSize: '10px',
    color: 'var(--on-surface-variant)',
    opacity: 0.3,
    padding: '60px 0',
    border: '1px dashed rgba(255,255,255,0.05)',
    borderRadius: 'var(--radius-lg)',
  },
  taskCard: {
    padding: '12px',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'grab',
  },
  taskLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  checkBtn: {
    width: '20px',
    height: '20px',
    border: '1px solid',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--on-surface)',
  },
  taskRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  dragHandle: {
    fontSize: '18px',
    color: 'var(--on-surface-variant)',
    opacity: 0.3,
    cursor: 'grab',
  },
  deleteBtn: {
    fontSize: '18px',
    color: 'var(--error)',
    opacity: 0.6,
    cursor: 'pointer',
    transition: 'opacity 0.3s ease',
  },
  bottomRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: '16px',
  },
  leetcodeCard: {
    gridColumn: 'span 4',
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
  leetcodeStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    justifyContent: 'space-between',
    flex: 1,
  },
  lcRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  lcHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: 'var(--font-code)',
    fontSize: '11px',
  },
  lcLabel: {
    color: 'var(--on-surface-variant)',
  },
  lcControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  controlBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--on-surface)',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  lcFraction: {
    color: 'var(--on-surface)',
    minWidth: '50px',
    textAlign: 'center',
  },
  lcTrack: {
    height: '4px',
    background: 'var(--surface-container)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  lcFill: {
    height: '100%',
    borderRadius: '2px',
  },
  logCard: {
    gridColumn: 'span 8',
    padding: '20px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  logList: {
    height: '140px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  logItem: {
    display: 'flex',
    gap: '12px',
    fontFamily: 'var(--font-code)',
    fontSize: '11px',
  },
  logTime: {
    color: 'var(--primary-container)',
    opacity: 0.6,
  },
  logDesc: {
    color: 'var(--on-surface-variant)',
  },
  emptyLogs: {
    fontFamily: 'var(--font-code)',
    fontSize: '11px',
    color: 'var(--on-surface-variant)',
    opacity: 0.3,
    textAlign: 'center',
    padding: '40px 0',
  },
};
