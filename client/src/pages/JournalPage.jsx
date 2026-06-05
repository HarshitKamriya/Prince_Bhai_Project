import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function JournalPage() {
  const [entries, setEntries] = useState([]);

  const fetchEntries = async () => {
    try {
      const data = await api.get('/journal');
      setEntries(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this journal reflection?')) return;
    try {
      await api.delete(`/journal/${id}`);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      alert(err.message || 'Error deleting journal record');
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>REFLECTION LOG ARCHIVE</h2>
      <div style={styles.list}>
        {entries.length === 0 ? (
          <div style={styles.empty}>NO PAST ENTRIES STORED. GOTO FOCUS MODE TO COMPLETE SESSIONS.</div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="glass-card" style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.date}>
                  {new Date(entry.createdAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span onClick={() => handleDelete(entry.id)} className="material-symbols-outlined" style={styles.deleteBtn}>
                  delete
                </span>
              </div>
              <div style={styles.body}>
                <div style={styles.section}>
                  <div style={styles.label}>WHAT WENT WELL:</div>
                  <p style={styles.text}>{entry.wentWell}</p>
                </div>
                <div style={styles.section}>
                  <div style={styles.label}>WHAT I LEARNED:</div>
                  <p style={styles.text}>{entry.learned}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '8px 0',
  },
  heading: {
    fontFamily: 'var(--font-heading)',
    fontSize: '24px',
    fontWeight: '800',
    color: 'var(--on-surface)',
    marginBottom: '24px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  card: {
    padding: '24px',
    borderRadius: 'var(--radius-xl)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '12px',
    marginBottom: '16px',
  },
  date: {
    fontFamily: 'var(--font-heading)',
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--primary)',
  },
  deleteBtn: {
    color: 'var(--error)',
    opacity: 0.6,
    cursor: 'pointer',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontFamily: 'var(--font-code)',
    fontSize: '10px',
    color: 'var(--on-surface-variant)',
    fontWeight: '700',
    letterSpacing: '0.5px',
  },
  text: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: 'var(--on-surface)',
  },
  empty: {
    fontFamily: 'var(--font-code)',
    fontSize: '11px',
    color: 'var(--on-surface-variant)',
    opacity: 0.4,
    textAlign: 'center',
    padding: '60px 0',
  },
};
