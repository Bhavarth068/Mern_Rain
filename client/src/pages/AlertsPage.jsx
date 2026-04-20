// src/pages/AlertsPage.jsx — Real-time rain alerts
import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';

const SEVERITY_COLORS = {
  'Heavy Rain':  { bg: 'rgba(248,113,113,0.1)',  border: '#f87171', icon: '🌊' },
  'Moderate Rain':{ bg: 'rgba(56,189,248,0.1)',  border: '#38bdf8', icon: '🌧️' },
  'Light Rain':  { bg: 'rgba(99,102,241,0.1)',   border: '#818cf8', icon: '🌦️' },
  'Drizzle Chance':{ bg:'rgba(251,191,36,0.1)', border: '#fbbf24', icon: '🌂' },
  'No Rain':     { bg: 'rgba(52,211,153,0.1)',   border: '#34d399', icon: '☀️' },
};

export default function AlertsPage() {
  const { alerts, fetchAlerts, loading } = useApp();

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const highRisk  = alerts.filter(a => a.result.probability >= 0.8);
  const medRisk   = alerts.filter(a => a.result.probability >= 0.6 && a.result.probability < 0.8);

  return (
    <div className="page-container animate-fade-up">
      <div className="topbar">
        <div>
          <h1 className="page-title">🔔 Rain Alerts</h1>
          <p className="page-subtitle">Active alerts where rain probability ≥ 60% in last 24 hours</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchAlerts}>🔄 Refresh</button>
      </div>

      {/* Alert Summary */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Alerts',  value: alerts.length, icon: '🔔', color: 'var(--accent-blue)'  },
          { label: 'High Risk',     value: highRisk.length, icon: '🚨', color: 'var(--accent-red)'  },
          { label: 'Medium Risk',   value: medRisk.length, icon: '⚠️', color: 'var(--accent-amber)' },
          { label: 'Cities at Risk',value: new Set(alerts.map(a=>a.city)).size, icon: '🏙️', color: 'var(--accent-violet)' },
        ].map((s, i) => (
          <div key={i} className="glass-card stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ background: 'none', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Alerts List */}
      {loading.alerts ? (
        <div className="spinner" />
      ) : alerts.length === 0 ? (
        <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h3 style={{ marginBottom: 8, color: 'var(--accent-green)' }}>All Clear!</h3>
          <p style={{ color: 'var(--text-muted)' }}>No significant rain alerts in the last 24 hours.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {alerts.map((alert, i) => {
            const style = SEVERITY_COLORS[alert.result.severity] || SEVERITY_COLORS['No Rain'];
            return (
              <div key={i} className="glass-card" style={{
                padding: '20px 24px',
                borderLeft: `4px solid ${style.border}`,
                background: style.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 20,
                flexWrap: 'wrap',
                animationDelay: `${i * 0.05}s`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 36 }}>{style.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>{alert.city}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                      {alert.result.severity} • {alert.result.advice}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      {new Date(alert.predictedAt).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: style.border }}>
                    {alert.result.rain_chance}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {alert.result.confidence} Confidence
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info box */}
      <div className="glass-card" style={{ padding: 20, marginTop: 24, display: 'flex', gap: 14 }}>
        <div style={{ fontSize: 24 }}>ℹ️</div>
        <div>
          <strong>About Alerts</strong>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.6 }}>
            Alerts are automatically generated when the ML model predicts rain probability ≥ 60%.
            High-risk alerts (≥ 80%) are flagged for immediate action.
            Alerts are retained for 48 hours. Configure your alert preferences in your account settings.
          </p>
        </div>
      </div>
    </div>
  );
}
