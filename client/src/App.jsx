// src/App.jsx — Root application with routing and layout
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AppProvider } from './context/AppContext';
import Sidebar       from './components/Sidebar';
import Dashboard     from './pages/Dashboard';
import PredictPage   from './pages/PredictPage';
import WeatherPage   from './pages/WeatherPage';
import HistoryPage   from './pages/HistoryPage';
import AlertsPage    from './pages/AlertsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LoginPage     from './pages/LoginPage';

// ── Rain animation background ──────────────────────────────────
function RainBackground() {
  const drops = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left:  `${Math.random() * 100}%`,
    height:`${40 + Math.random() * 80}px`,
    delay: `${Math.random() * 4}s`,
    duration:`${1.5 + Math.random() * 2}s`,
    opacity: 0.04 + Math.random() * 0.06
  }));
  return (
    <div className="rain-animation-bg" aria-hidden="true">
      {drops.map(d => (
        <div key={d.id} className="rain-drop" style={{
          left: d.left, height: d.height,
          animationDuration: d.duration,
          animationDelay: d.delay,
          opacity: d.opacity
        }} />
      ))}
    </div>
  );
}

// ── Main app layout (with sidebar) ───────────────────────────────
function AppLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="app-layout">
      <RainBackground />

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        style={{
          position: 'fixed', top: 16, left: 16, zIndex: 200,
          display: 'none', background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)',
          cursor: 'pointer', fontSize: 18,
          '@media (max-width: 1024px)': { display: 'flex' }
        }}
        aria-label="Open sidebar"
      >☰</button>

      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:99 }}
        />
      )}

      <main className="main-content">{children}</main>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────
export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#ffffff',
              color: '#1f2937',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontSize: 14,
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#ffffff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
          }}
        />

        <Routes>
          {/* Auth — full-page, no sidebar */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected layout routes */}
          <Route path="/*" element={
            <AppLayout>
              <Routes>
                <Route path="/"          element={<Dashboard />}     />
                <Route path="/predict"   element={<PredictPage />}   />
                <Route path="/weather"   element={<WeatherPage />}   />
                <Route path="/history"   element={<HistoryPage />}   />
                <Route path="/alerts"    element={<AlertsPage />}    />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="*"          element={<Navigate to="/" />} />
              </Routes>
            </AppLayout>
          } />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
