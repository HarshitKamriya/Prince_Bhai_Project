import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function CoachPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: `[AI SENTINEL ONLINE]
=======================================
Direct neural telemetry link established.
Operator: @${user?.username || 'unknown'}
Role: ${user?.role || 'INITIATE'} (LVL ${user?.level || 1})

Ready to deliver diagnostics, objectives suggestions, and motivators. 
Try typing a question, or execute one of the diagnostic commands below.`,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    if (!textToSend) {
      setInputText('');
    }

    // Add user message to state
    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Gather conversation history (last 6 messages to keep context size clean)
      const chatHistory = messages
        .filter(m => m.id !== 'welcome')
        .slice(-6)
        .map(m => ({
          sender: m.sender,
          text: m.text
        }));

      // Call API
      const response = await api.post('/ai/chat', {
        message: text,
        history: chatHistory
      });

      // Add AI reply to state
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: response.text,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `[CRITICAL ERROR] Failed to communicate with AI core.\nDetails: ${err.message || 'Unknown network interruption.'}\nVerify server connectivity and API keys.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCommand = (command) => {
    handleSendMessage(command);
  };

  return (
    <div style={styles.container}>
      {/* Page Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle} className="glow-text">AI SENTINEL INTERFACE</h1>
          <p style={styles.subtitle}>SYNAPTIC MENTOR & PRODUCTIVITY DIAGNOSTICS</p>
        </div>
        <div style={styles.statusBadge}>
          <span style={styles.statusDot}></span>
          <span style={styles.statusText}>LINK SECURE</span>
        </div>
      </div>

      <div style={styles.workspace}>
        {/* Chat Deck */}
        <div style={styles.chatDeck} className="glass-card">
          {/* Feed */}
          <div style={styles.feed}>
            {messages.map(msg => (
              <div 
                key={msg.id} 
                style={{
                  ...styles.messageWrapper,
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div 
                  style={{
                    ...styles.bubble,
                    ...(msg.sender === 'user' ? styles.userBubble : styles.aiBubble),
                    borderLeft: msg.sender === 'ai' ? '2px solid var(--primary-container)' : 'none',
                    borderRight: msg.sender === 'user' ? '2px solid var(--secondary)' : 'none'
                  }}
                >
                  <div style={styles.bubbleMeta}>
                    <span style={msg.sender === 'user' ? styles.userMetaName : styles.aiMetaName}>
                      {msg.sender === 'user' ? '@OPERATOR' : 'SYS_SENTINEL'}
                    </span>
                    <span style={styles.bubbleTime}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={styles.bubbleText}>
                    {msg.text.split('\n').map((line, i) => (
                      <div key={i} style={{ minHeight: '16px' }}>{line}</div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div style={styles.messageWrapper} className="ai-thinking">
                <div style={{ ...styles.bubble, ...styles.aiBubble, borderLeft: '2px solid var(--primary-container)' }}>
                  <div style={styles.bubbleMeta}>
                    <span style={styles.aiMetaName}>SYS_SENTINEL</span>
                    <span style={styles.bubbleTime}>CALCULATING...</span>
                  </div>
                  <div style={styles.thinkingContainer}>
                    <div style={styles.thinkingDot}></div>
                    <div style={{ ...styles.thinkingDot, animationDelay: '0.2s' }}></div>
                    <div style={{ ...styles.thinkingDot, animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Triggers */}
          <div style={styles.triggers}>
            <button 
              style={styles.triggerBtn} 
              onClick={() => handleQuickCommand('diagnostics')}
              disabled={loading}
            >
              <span className="material-symbols-outlined" style={styles.triggerIcon}>monitoring</span>
              <span>/DIAGNOSTICS</span>
            </button>
            <button 
              style={styles.triggerBtn} 
              onClick={() => handleQuickCommand('motivate')}
              disabled={loading}
            >
              <span className="material-symbols-outlined" style={styles.triggerIcon}>bolt</span>
              <span>/MOTIVATE</span>
            </button>
            <button 
              style={styles.triggerBtn} 
              onClick={() => handleQuickCommand('suggest next')}
              disabled={loading}
            >
              <span className="material-symbols-outlined" style={styles.triggerIcon}>explore</span>
              <span>/SUGGEST_NEXT</span>
            </button>
          </div>

          {/* Input Bar */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
            style={styles.inputForm}
          >
            <input
              type="text"
              placeholder={loading ? "Sentinel is compiling analytics..." : "Inquire mentor core or type a command..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={styles.input}
              disabled={loading}
              className="glow-border"
            />
            <button 
              type="submit" 
              style={{
                ...styles.sendBtn,
                opacity: loading || !inputText.trim() ? 0.5 : 1
              }}
              disabled={loading || !inputText.trim()}
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>
        </div>

        {/* Sidebar Info Panel */}
        <div style={styles.sidePanel} className="glass-card">
          <h3 style={styles.panelTitle}>TELEMETRY ARCHIVE</h3>
          <div style={styles.panelDivider}></div>
          
          <div style={styles.diagRow}>
            <span style={styles.diagLbl}>SYSTEM STAT:</span>
            <span style={{ ...styles.diagVal, color: 'var(--primary)' }}>ONLINE</span>
          </div>

          <div style={styles.diagRow}>
            <span style={styles.diagLbl}>OPERATOR LEVEL:</span>
            <span style={styles.diagVal}>LVL {user?.level || 1}</span>
          </div>

          <div style={styles.diagRow}>
            <span style={styles.diagLbl}>STREAK INDEX:</span>
            <span style={{ ...styles.diagVal, color: 'var(--secondary)' }}>{user?.currentStreak || 0} CYCLES</span>
          </div>

          <div style={styles.diagRow}>
            <span style={styles.diagLbl}>CORE ENGINE:</span>
            <span style={styles.diagVal}>
              {import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'OAUTH2 AUTH' : 'LOCAL BYPASS'}
            </span>
          </div>

          <div style={styles.panelDivider}></div>
          
          <div style={styles.logBox}>
            <div style={styles.logTitle}>SENTINEL SUBROUTINES:</div>
            <div style={styles.logItem}>- [OK] Neural telemetry sync active</div>
            <div style={styles.logItem}>- [OK] User statistics parser loaded</div>
            <div style={styles.logItem}>- [OK] RPG attributes telemetry mapping online</div>
            <div style={styles.logItem}>- [INFO] LLM Gateway: {import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'External client' : 'Sim bypass'}</div>
          </div>
        </div>
      </div>
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
    height: 'calc(100vh - 120px)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(74, 225, 118, 0.05)',
    border: '1px solid rgba(74, 225, 118, 0.2)',
    padding: '6px 12px',
    borderRadius: 'var(--radius-md)',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    backgroundColor: 'var(--secondary)',
    borderRadius: '50%',
    boxShadow: '0 0 8px var(--secondary)',
    animation: 'pulse 2s infinite',
  },
  statusText: {
    fontFamily: 'var(--font-code)',
    fontSize: '10px',
    fontWeight: '700',
    color: 'var(--secondary)',
    letterSpacing: '1px',
  },
  workspace: {
    display: 'flex',
    gap: '20px',
    flex: 1,
    minHeight: 0, // critical for nested scrolling
  },
  chatDeck: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 'var(--radius-xl)',
    overflow: 'hidden',
    minHeight: 0,
  },
  feed: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    background: 'rgba(2, 6, 23, 0.2)',
  },
  messageWrapper: {
    display: 'flex',
    width: '100%',
  },
  bubble: {
    maxWidth: '85%',
    padding: '16px',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-code)',
    fontSize: '12px',
    lineHeight: '1.6',
  },
  aiBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    color: 'var(--on-surface)',
  },
  userBubble: {
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
    border: '1px solid rgba(56, 189, 248, 0.1)',
    color: '#8ed5ff',
  },
  bubbleMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '4px',
  },
  aiMetaName: {
    color: 'var(--primary)',
    fontWeight: '800',
    fontSize: '10px',
  },
  userMetaName: {
    color: 'var(--secondary)',
    fontWeight: '800',
    fontSize: '10px',
  },
  bubbleTime: {
    color: 'var(--on-surface-variant)',
    opacity: 0.5,
    fontSize: '9px',
  },
  bubbleText: {
    whiteSpace: 'pre-wrap',
  },
  triggers: {
    display: 'flex',
    gap: '10px',
    padding: '12px 20px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    flexWrap: 'wrap',
  },
  triggerBtn: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: 'var(--on-surface)',
    fontFamily: 'var(--font-heading)',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '1px',
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.3s ease',
  },
  triggerIcon: {
    fontSize: '14px',
    color: 'var(--primary-container)',
  },
  inputForm: {
    display: 'flex',
    padding: '16px 20px',
    background: 'rgba(11, 19, 38, 0.4)',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    gap: '12px',
  },
  input: {
    flex: 1,
    background: 'rgba(2, 6, 23, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--on-surface)',
    fontFamily: 'var(--font-code)',
    fontSize: '13px',
    padding: '12px 16px',
    outline: 'none',
  },
  sendBtn: {
    background: 'var(--primary-container)',
    color: 'var(--on-primary)',
    border: 'none',
    width: '44px',
    height: '44px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  sidePanel: {
    width: '280px',
    padding: '24px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    height: '100%',
    overflowY: 'auto',
  },
  panelTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '13px',
    fontWeight: '800',
    color: 'var(--on-surface)',
    letterSpacing: '1px',
  },
  panelDivider: {
    height: '1px',
    background: 'rgba(255, 255, 255, 0.08)',
  },
  diagRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diagLbl: {
    fontFamily: 'var(--font-heading)',
    fontSize: '10px',
    fontWeight: '700',
    color: 'var(--on-surface-variant)',
    opacity: 0.6,
  },
  diagVal: {
    fontFamily: 'var(--font-code)',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--on-surface)',
  },
  logBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    background: 'rgba(0, 0, 0, 0.2)',
    padding: '12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid rgba(255, 255, 255, 0.03)',
  },
  logTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '9px',
    fontWeight: '800',
    color: 'var(--primary)',
    letterSpacing: '0.5px',
  },
  logItem: {
    fontFamily: 'var(--font-code)',
    fontSize: '10px',
    color: 'var(--on-surface-variant)',
    opacity: 0.7,
  },
  thinkingContainer: {
    display: 'flex',
    gap: '6px',
    padding: '4px 0',
    alignItems: 'center',
  },
  thinkingDot: {
    width: '6px',
    height: '6px',
    backgroundColor: 'var(--primary)',
    borderRadius: '50%',
    animation: 'thinking 1.4s infinite ease-in-out both',
  }
};

// Add styles and animations dynamically
const styleElement = document.createElement('style');
styleElement.innerHTML = `
  @keyframes pulse {
    0% { transform: scale(0.95); opacity: 0.5; }
    50% { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(0.95); opacity: 0.5; }
  }
  @keyframes thinking {
    0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
    40% { transform: scale(1); opacity: 1; }
  }
  .glow-border:focus {
    border-color: var(--primary) !important;
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.25);
  }
  button:hover:not(:disabled) {
    background-color: rgba(255, 255, 255, 0.08) !important;
    border-color: var(--primary) !important;
    box-shadow: 0 0 8px rgba(56, 189, 248, 0.2);
  }
`;
document.head.appendChild(styleElement);
