import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import QuestsPage from './pages/QuestsPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import FocusPage from './pages/FocusPage.jsx';
import JournalPage from './pages/JournalPage.jsx';
import HabitsPage from './pages/HabitsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import CoachPage from './pages/CoachPage.jsx';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        {/* Floating atmospheric background text snippets */}
        <div style={styles.snippetLayer}>
          <div className="code-snippet" style={{ top: '15%', left: '5%', animationDelay: '0s' }}>
            fn main() {'{'} level_up(); {'}'}
          </div>
          <div className="code-snippet" style={{ top: '45%', right: '10%', animationDelay: '2s' }}>
            while (focus) {'{'} ship(); {'}'}
          </div>
          <div className="code-snippet" style={{ bottom: '20%', left: '15%', animationDelay: '4s' }}>
            const discipline = true;
          </div>
          <div className="code-snippet" style={{ top: '70%', right: '30%', animationDelay: '6s' }}>
            import {'{'} flow {'}'} from 'state';
          </div>
        </div>

        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/quests" element={<QuestsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/focus" element={<FocusPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/habits" element={<HabitsPage />} />
            <Route path="/coach" element={<CoachPage />} />
            <Route path="/achievements" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

const styles = {
  snippetLayer: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 0,
    overflow: 'hidden',
  },
};
