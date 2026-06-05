import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login, register, user, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleGoogleLoginResponse = async (response) => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle(response.credential);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    /* global google */
    const initGoogleGSI = () => {
      if (typeof google !== 'undefined' && document.getElementById('google-signin-btn')) {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        
        google.accounts.id.initialize({
          client_id: clientId || 'your-google-client-id.apps.googleusercontent.com',
          callback: handleGoogleLoginResponse,
        });

        if (clientId) {
          google.accounts.id.renderButton(
            document.getElementById('google-signin-btn'),
            { 
              theme: 'outline', 
              size: 'large', 
              width: 340,
              text: 'signin_with',
              shape: 'rectangular'
            }
          );
        }
      }
    };

    // Give it a tiny delay to ensure script has finished loading/registering in DOM
    const timer = setTimeout(initGoogleGSI, 200);
    return () => clearTimeout(timer);
  }, [isRegister]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(email, username, displayName, password);
      } else {
        await login(username || email, password); // defaults to username or email field
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Background elements */}
      <div style={styles.glow} />

      <div style={styles.card} className="glass-card">
        <div style={styles.header}>
          <h2 style={styles.title}>LEVELUP OS</h2>
          <p style={styles.subtitle}>
            {isRegister ? 'INITIALIZE USER AGENT PROFILE' : 'DECRYPT ACCESS KEY TO START PORTAL'}
          </p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {isRegister && (
            <>
              <div style={styles.formGroup}>
                <label style={styles.label}>EMAIL ADDRESS</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>DISPLAY NAME</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>{isRegister ? 'USERNAME' : 'USERNAME OR EMAIL'}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'PROCESSING...' : isRegister ? 'CREATE PROFILE' : 'SECURE LOG IN'}
          </button>
        </form>

        {/* Google Sign-in */}
        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>OR SECURE SIGN IN</span>
          <span style={styles.dividerLine} />
        </div>

        {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
          <div style={styles.googleContainer}>
            <div id="google-signin-btn"></div>
          </div>
        ) : (
          <button 
            type="button" 
            onClick={() => handleGoogleLoginResponse({ credential: 'mock-google-token' })}
            style={styles.mockGoogleBtn}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>login</span>
            <span>BYPASS: MOCK GOOGLE LOGIN</span>
          </button>
        )}

        <div style={styles.toggleText}>
          {isRegister ? 'ALREADY REGISTERED?' : 'NEW USER INITIALIZATION?'}
          <span
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            style={styles.toggleLink}
          >
            {isRegister ? ' SYSTEM ACCESS' : ' BOOT INITIALIZE'}
          </span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#020617',
    position: 'relative',
    overflow: 'hidden',
    padding: '16px',
  },
  glow: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, rgba(2,6,23,0) 70%)',
    zIndex: 0,
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    padding: '40px',
    borderRadius: 'var(--radius-xl)',
    zIndex: 1,
    boxShadow: '0 0 40px rgba(56, 189, 248, 0.1)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '28px',
    fontWeight: '900',
    color: 'var(--primary)',
    letterSpacing: '2px',
    textShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
  },
  subtitle: {
    fontFamily: 'var(--font-code)',
    fontSize: '9px',
    color: 'var(--on-surface-variant)',
    letterSpacing: '1px',
    marginTop: '8px',
    opacity: 0.8,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontFamily: 'var(--font-code)',
    fontSize: '9px',
    color: 'var(--on-surface-variant)',
    letterSpacing: '1px',
    fontWeight: '700',
  },
  input: {
    background: '#0f172a',
    border: 'none',
    borderBottom: '1px solid var(--outline-variant)',
    padding: '10px 12px',
    color: 'var(--on-surface)',
    fontFamily: 'var(--font-code)',
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.3s ease',
  },
  submitBtn: {
    background: 'var(--primary-container)',
    color: '#002109',
    border: 'none',
    fontFamily: 'var(--font-heading)',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '1px',
    padding: '12px',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
    transition: 'box-shadow 0.3s ease',
    marginTop: '8px',
  },
  error: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid var(--error)',
    color: '#ffdad6',
    fontFamily: 'var(--font-code)',
    fontSize: '11px',
    padding: '10px',
    borderRadius: 'var(--radius-sm)',
    marginBottom: '20px',
    textAlign: 'center',
  },
  toggleText: {
    marginTop: '24px',
    textAlign: 'center',
    fontFamily: 'var(--font-code)',
    fontSize: '10px',
    color: 'var(--on-surface-variant)',
    opacity: 0.8,
  },
  toggleLink: {
    color: 'var(--primary)',
    cursor: 'pointer',
    fontWeight: '700',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    margin: '20px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    fontFamily: 'var(--font-code)',
    fontSize: '8px',
    color: 'var(--on-surface-variant)',
    opacity: 0.6,
    letterSpacing: '1px',
  },
  googleContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '10px',
    width: '100%',
  },
  mockGoogleBtn: {
    background: 'transparent',
    border: '1px dashed var(--primary)',
    color: 'var(--primary)',
    fontFamily: 'var(--font-heading)',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '1px',
    padding: '10px',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    width: '100%',
    marginBottom: '10px',
  },
};
// Add interactive button hover shadows dynamically
const styleEl = document.createElement('style');
styleEl.innerHTML = `
  button:hover {
    box-shadow: 0 0 15px var(--primary-container);
  }
  input:focus {
    border-color: var(--primary) !important;
  }
`;
document.head.appendChild(styleEl);
