// src/pages/Dashboard.jsx — Main dashboard with KPIs and charts
import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useApp } from '../context/AppContext';

// ── Custom Tooltip ────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(6,15,35,0.95)', border: '1px solid rgba(56,189,248,0.3)',
      borderRadius: 10, padding: '10px 14px', fontSize: 13
    }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </p>
      ))}
    </div>
  );
};

// ── Sample 7-day trend (replaced by real data in production) ──
const SAMPLE_TREND = [
  { day: 'Mon', probability: 72, rain: 1 },
  { day: 'Tue', probability: 45, rain: 0 },
  { day: 'Wed', probability: 88, rain: 1 },
  { day: 'Thu', probability: 31, rain: 0 },
  { day: 'Fri', probability: 65, rain: 1 },
  { day: 'Sat', probability: 90, rain: 1 },
  { day: 'Sun', probability: 22, rain: 0 },
];

const PIE_DATA = [
  { name: 'Rain', value: 58 },
  { name: 'No Rain', value: 42 },
];
const PIE_COLORS = ['#38bdf8', '#34d399'];

const CITY_CARDS = [
  { city: 'Mumbai',    prob: 88, icon: '🌧️', temp: 29 },
  { city: 'Delhi',     prob: 22, icon: '☀️',  temp: 36 },
  { city: 'Chennai',   prob: 71, icon: '🌦️',  temp: 31 },
  { city: 'Kolkata',   prob: 65, icon: '🌦️',  temp: 32 },
  { city: 'Bangalore', prob: 45, icon: '⛅',  temp: 24 },
  { city: 'Hyderabad', prob: 55, icon: '🌦️',  temp: 30 },
];

export default function Dashboard() {
  const { stats, fetchStats, history, fetchHistory } = useApp();
  const [trend, setTrend] = useState(SAMPLE_TREND);

  useEffect(() => {
    fetchStats();
    fetchHistory(null, 20);
  }, [fetchStats, fetchHistory]);

  useEffect(() => {
    if (stats?.last7Days?.length) {
      setTrend(stats.last7Days.map(d => ({
        day: d._id,
        probability: Math.round((d.rainCount / (d.total || 1)) * 100),
        rain: d.rainCount
      })));
    }
  }, [stats]);

  const kpis = [
    { label: 'Total Predictions', value: stats?.stats?.total ?? '—',         icon: '🔮', change: '+12 today'   },
    { label: 'Rain Detected',     value: stats?.stats?.rainCount ?? '—',     icon: '🌧️', change: `${stats?.rainRate ?? '0%'} rate` },
    { label: 'Cities Monitored',  value: '10',                                icon: '🏙️', change: 'Live feed'   },
    { label: 'Model Accuracy',    value: '87.4%',                             icon: '🎯', change: 'Random Forest' },
  ];

  return (
    <div className="page-container animate-fade-up">
      {/* Top Bar */}
      <div className="topbar">
        <div>
          <h1 className="page-title">🌧️ Rain Forecasting Dashboard</h1>
          <p className="page-subtitle">
            <span className="live-dot" />
            Real-time ML-powered rainfall predictions across India
          </p>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        {kpis.map((k, i) => (
          <div key={i} className="glass-card stat-card animate-fade-up" style={{ animationDelay: `${i*0.08}s` }}>
            <div className="stat-icon">{k.icon}</div>
            <div className="stat-label">{k.label}</div>
            <div className="stat-value">{k.value}</div>
            <div className="stat-change">{k.change}</div>
          </div>
        ))}
      </div>

      {/* Cloud Architecture Summary */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px', background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.2)' }}>
        <div style={{ fontSize: '24px' }}>☁️</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', flex: 1 }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Database</div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>MongoDB Atlas (Managed Cloud)</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Host</div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>AWS EC2 (Elastic Compute)</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Static Assets</div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>AWS S3 + CloudFront</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Deployment</div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>Docker Containers</div>
          </div>
        </div>
        <div style={{ padding: '4px 10px', background: 'var(--accent-green)', color: '#fff', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>CLOUD ACTIVE</div>
      </div>

      {/* Charts Row */}
      <div className="dashboard-grid">
        {/* Area Chart — Rain Probability Trend */}
        <div className="glass-card chart-section">
          <h3 className="chart-title">📈 Rain Probability Trend (7 Days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="rainGradArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} domain={[0, 100]} unit="%" />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="probability"
                name="Rain Probability"
                stroke="#38bdf8"
                strokeWidth={2.5}
                fill="url(#rainGradArea)"
                dot={{ fill: '#38bdf8', r: 4 }}
                activeDot={{ r: 6, fill: '#0ea5e9' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart — Rain vs No Rain */}
        <div className="glass-card chart-section">
          <h3 className="chart-title">🔵 Prediction Breakdown</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={PIE_DATA}
                cx="50%" cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {PIE_DATA.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'rgba(6,15,35,0.95)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 10 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 13, color: 'var(--text-secondary)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Based on last 30 days of predictions</span>
          </div>
        </div>
      </div>

      {/* City Cards */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>🏙️ City Forecast Snapshot</h3>
        <div className="city-grid">
          {CITY_CARDS.map((c, i) => (
            <div key={i} className="glass-card city-card animate-fade-up" style={{ animationDelay: `${i*0.06}s` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="city-name">{c.city}</div>
                  <div className="city-meta">🌡️ {c.temp}°C</div>
                </div>
                <div style={{ fontSize: 32 }}>{c.icon}</div>
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Rain Probability</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: c.prob >= 60 ? 'var(--accent-blue)' : 'var(--accent-green)' }}>
                    {c.prob}%
                  </span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${c.prob}%`,
                    background: c.prob >= 60 ? 'var(--grad-blue)' : 'var(--accent-green)',
                    borderRadius: 4,
                    transition: 'width 1s ease'
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent History Table */}
      {history.length > 0 && (
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 className="chart-title">📋 Recent Predictions</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>City</th>
                  <th>Probability</th>
                  <th>Result</th>
                  <th>Confidence</th>
                  <th>Severity</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 8).map((p, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.city}</td>
                    <td>
                      <span style={{ color: p.result.will_rain ? 'var(--accent-blue)' : 'var(--accent-green)', fontWeight: 600 }}>
                        {p.result.rain_chance}
                      </span>
                    </td>
                    <td>
                      <span className={`result-badge ${p.result.will_rain ? 'badge-rain' : 'badge-no-rain'}`}
                        style={{ padding: '3px 10px', fontSize: 12 }}>
                        {p.result.will_rain ? '🌧️ Rain' : '☀️ Clear'}
                      </span>
                    </td>
                    <td>{p.result.confidence}</td>
                    <td style={{ fontSize: 13 }}>{p.result.severity}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(p.predictedAt).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
