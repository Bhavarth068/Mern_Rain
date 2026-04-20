// src/pages/HistoryPage.jsx — Paginated prediction history with charts
import React, { useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../context/AppContext';

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'rgba(6,15,35,0.95)', border:'1px solid rgba(56,189,248,0.3)', borderRadius:10, padding:'10px 14px', fontSize:13 }}>
      <p style={{ color:'var(--text-muted)', marginBottom:4 }}>{label}</p>
      {payload.map((p,i)=><p key={i} style={{color:p.color,fontWeight:600}}>{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function HistoryPage() {
  const { history, fetchHistory, loading } = useApp();

  useEffect(() => { fetchHistory(null, 50); }, [fetchHistory]);

  // Build chart data from history
  const chartData = history.slice(0, 20).reverse().map((p, i) => ({
    idx:      i + 1,
    prob:     Math.round(p.result.probability * 100),
    rain:     p.result.will_rain ? 1 : 0,
    city:     p.city
  }));

  return (
    <div className="page-container animate-fade-up">
      <div className="topbar">
        <div>
          <h1 className="page-title">📋 Prediction History</h1>
          <p className="page-subtitle">All past rain predictions stored in MongoDB</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => fetchHistory(null, 50)}>
          🔄 Refresh
        </button>
      </div>

      {/* Charts */}
      {history.length > 0 && (
        <div className="dashboard-grid" style={{ marginBottom: 24 }}>
          <div className="glass-card chart-section">
            <h3 className="chart-title">📈 Probability Over Predictions</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="idx" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} />
                <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} unit="%" domain={[0,100]} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="prob" name="Rain Prob" stroke="#38bdf8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card chart-section">
            <h3 className="chart-title">📊 Rain vs No Rain</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData.slice(-10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="city" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} />
                <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} domain={[0,100]} unit="%" />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="prob" name="Rain Prob %" fill="#0ea5e9" radius={[4,4,0,0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h3 className="chart-title">All Predictions ({history.length} records)</h3>
        {loading.history ? (
          <div className="spinner" />
        ) : history.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
            No predictions yet. Go to <strong>Predict Rain</strong> to create one.
          </p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>City</th>
                  <th>Probability</th>
                  <th>Result</th>
                  <th>Confidence</th>
                  <th>Severity</th>
                  <th>Source</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {history.map((p, i) => (
                  <tr key={p._id || i}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.city}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 50, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: p.result.rain_chance, background: p.result.will_rain ? '#38bdf8' : '#34d399', borderRadius: 3 }} />
                        </div>
                        <span style={{ color: p.result.will_rain ? 'var(--accent-blue)' : 'var(--accent-green)', fontWeight: 600 }}>
                          {p.result.rain_chance}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 600,
                        background: p.result.will_rain ? 'rgba(56,189,248,0.15)' : 'rgba(52,211,153,0.12)',
                        color: p.result.will_rain ? 'var(--accent-blue)' : 'var(--accent-green)'
                      }}>
                        {p.result.will_rain ? '🌧️ Rain' : '☀️ Clear'}
                      </span>
                    </td>
                    <td>{p.result.confidence}</td>
                    <td style={{ fontSize: 13 }}>{p.result.severity}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{p.source}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(p.predictedAt).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
