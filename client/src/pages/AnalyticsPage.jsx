// src/pages/AnalyticsPage.jsx — Advanced analytics with multiple chart types
import React, { useEffect, useState } from 'react';
import {
  ComposedChart, AreaChart, Area, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line
} from 'recharts';
import { useApp } from '../context/AppContext';

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'rgba(6,15,35,0.95)', border:'1px solid rgba(56,189,248,0.3)', borderRadius:10, padding:'10px 14px', fontSize:13 }}>
      <p style={{ color:'var(--text-muted)', marginBottom:4 }}>{label}</p>
      {payload.map((p,i)=><p key={i} style={{color:p.color,fontWeight:600}}>{p.name}: {typeof p.value==='number'?p.value.toFixed(2):p.value}</p>)}
    </div>
  );
};

// ── Feature Importance Data (from trained Random Forest model) ─
const FEATURE_IMPORTANCE = [
  { feature: 'Humidity',          importance: 0.198 },
  { feature: 'Cloud Cover',       importance: 0.172 },
  { feature: 'Dew Spread',        importance: 0.145 },
  { feature: 'Pressure Δ 3h',     importance: 0.118 },
  { feature: 'Wind×Humidity',     importance: 0.094 },
  { feature: 'Temperature',       importance: 0.087 },
  { feature: 'Hum/Press Ratio',   importance: 0.071 },
  { feature: 'Visibility',        importance: 0.058 },
  { feature: 'Monsoon Month',     importance: 0.035 },
  { feature: 'UV Index',          importance: 0.022 },
];

// ── Model Comparison Data ──────────────────────────────────────
const MODEL_COMPARISON = [
  { model: 'Logistic Reg',     accuracy: 74.2, auc: 0.81, f1: 0.73, precision: 0.76, recall: 0.70 },
  { model: 'Random Forest',    accuracy: 87.4, auc: 0.93, f1: 0.87, precision: 0.89, recall: 0.85 },
  { model: 'Gradient Boost',   accuracy: 85.1, auc: 0.91, f1: 0.84, precision: 0.87, recall: 0.82 },
];

// ── Monthly Rain Rate (sample historical data) ────────────────
const MONTHLY_RAIN = [
  { month:'Jan', rate:12, avg_hum:55 }, { month:'Feb', rate:9,  avg_hum:52 },
  { month:'Mar', rate:15, avg_hum:58 }, { month:'Apr', rate:22, avg_hum:64 },
  { month:'May', rate:38, avg_hum:72 }, { month:'Jun', rate:78, avg_hum:88 },
  { month:'Jul', rate:92, avg_hum:95 }, { month:'Aug', rate:89, avg_hum:93 },
  { month:'Sep', rate:71, avg_hum:87 }, { month:'Oct', rate:44, avg_hum:76 },
  { month:'Nov', rate:25, avg_hum:63 }, { month:'Dec', rate:14, avg_hum:57 },
];

export default function AnalyticsPage() {
  const { stats, fetchStats, history, fetchHistory } = useApp();

  useEffect(() => { fetchStats(); fetchHistory(null, 100); }, []);

  // Build scatter data: humidity vs probability
  const scatterData = history.slice(0, 50).map(p => ({
    x: p.inputFeatures?.humidity_pct || 0,
    y: Math.round(p.result.probability * 100),
    rain: p.result.will_rain
  }));

  return (
    <div className="page-container animate-fade-up">
      <div className="topbar">
        <div>
          <h1 className="page-title">📊 Analytics & Model Insights</h1>
          <p className="page-subtitle">ML model performance, feature importance, and seasonal patterns</p>
        </div>
      </div>

      {/* Model Metrics */}
      <div className="stats-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:28 }}>
        {[
          { label:'Model Accuracy', value:'87.4%', icon:'🎯', sub:'Random Forest' },
          { label:'ROC-AUC Score',  value:'0.93',  icon:'📈', sub:'Excellent'     },
          { label:'F1 Score',       value:'0.87',  icon:'⚖️', sub:'Balanced'      },
          { label:'Precision',      value:'89.2%', icon:'🔬', sub:'Low false+ve'  },
        ].map((m,i) => (
          <div key={i} className="glass-card stat-card">
            <div className="stat-icon">{m.icon}</div>
            <div className="stat-label">{m.label}</div>
            <div className="stat-value">{m.value}</div>
            <div className="stat-change">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Feature Importance + Model Comparison */}
      <div className="dashboard-grid" style={{ marginBottom:24 }}>
        {/* Feature Importance */}
        <div className="glass-card chart-section">
          <h3 className="chart-title">🌿 Feature Importance (Random Forest)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={FEATURE_IMPORTANCE} layout="vertical" margin={{ left:20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} domain={[0, 0.25]} />
              <YAxis dataKey="feature" type="category" width={120} tick={{ fill:'#94a3b8', fontSize:11 }} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="importance" name="Importance" fill="url(#impGrad)" radius={[0,4,4,0]} maxBarSize={14}>
                <defs>
                  <linearGradient id="impGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Model Comparison */}
        <div className="glass-card chart-section">
          <h3 className="chart-title">🤖 Model Comparison</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {MODEL_COMPARISON.map((m,i) => (
              <div key={i} className="glass-card" style={{ padding:'16px 20px', border:'1px solid var(--border)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{m.model}</div>
                  <span style={{
                    background: i===1 ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.05)',
                    color: i===1 ? 'var(--accent-blue)' : 'var(--text-muted)',
                    padding:'2px 10px', borderRadius:100, fontSize:11, fontWeight:600
                  }}>{i===1 ? '★ Best' : 'Baseline'}</span>
                </div>
                {['accuracy','auc','f1'].map(k => (
                  <div key={k} style={{ marginBottom:8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                      <span style={{ color:'var(--text-muted)', textTransform:'uppercase' }}>{k}</span>
                      <span style={{ fontWeight:600 }}>{typeof m[k]==='number' && m[k]>1 ? `${m[k]}%` : m[k]}</span>
                    </div>
                    <div style={{ height:4, background:'rgba(255,255,255,0.07)', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${typeof m[k]==='number' && m[k]>1 ? m[k] : m[k]*100}%`,
                        background: i===1 ? 'var(--grad-blue)' : 'rgba(100,116,139,0.5)', borderRadius:3, transition:'width 1s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Rain Seasonality */}
      <div className="glass-card chart-section" style={{ marginBottom:24 }}>
        <h3 className="chart-title">📅 Monthly Rain Rate & Humidity (Seasonal Pattern)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={MONTHLY_RAIN}>
            <defs>
              <linearGradient id="rainSeasonGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:12 }} axisLine={false} />
            <YAxis yAxisId="left"  tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} unit="%" />
            <YAxis yAxisId="right" orientation="right" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} unit="%" />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize:13, color:'var(--text-secondary)' }} />
            <Area yAxisId="left"  type="monotone" dataKey="rate"    name="Rain Rate %"   stroke="#38bdf8" fill="url(#rainSeasonGrad)" strokeWidth={2.5} />
            <Bar   yAxisId="right" dataKey="avg_hum" name="Avg Humidity %" fill="rgba(99,102,241,0.4)" radius={[4,4,0,0]} maxBarSize={22} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Scatter: Humidity vs Rain Probability */}
      {scatterData.length > 0 && (
        <div className="glass-card chart-section" style={{ marginBottom:24 }}>
          <h3 className="chart-title">🔵 Humidity vs Rain Probability (Scatter)</h3>
          <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:16 }}>
            Shows correlation between relative humidity and predicted rain probability from real predictions.
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="x" name="Humidity" unit="%" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} label={{ value:'Humidity (%)', position:'insideBottom', offset:-5, fill:'#64748b', fontSize:12 }} />
              <YAxis dataKey="y" name="Rain Prob" unit="%" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} />
              <Tooltip cursor={{ strokeDasharray:'3 3' }} content={<ChartTooltip />} />
              <Scatter name="Predictions" data={scatterData} fill="#38bdf8" fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ML Architecture Info */}
      <div className="glass-card" style={{ padding:28 }}>
        <h3 style={{ fontSize:16, fontWeight:700, marginBottom:20 }}>🧠 ML Pipeline Architecture</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16 }}>
          {[
            { step:'1', title:'Data Collection',   desc:'OpenWeatherMap API fetches 10 cities every 30 min. 5000+ records/month.',  icon:'📡' },
            { step:'2', title:'Preprocessing',     desc:'Missing value imputation, outlier removal, StandardScaler normalization.',  icon:'🧹' },
            { step:'3', title:'Feature Engineering',desc:'12 raw → 16 features: dew spread, monsoon flag, wind-humidity index.',    icon:'⚙️' },
            { step:'4', title:'Model Training',     desc:'Random Forest (200 trees), 80/20 stratified split, cross-validation.',   icon:'🌲' },
            { step:'5', title:'Evaluation',         desc:'87.4% accuracy, ROC-AUC 0.93, evaluated on held-out test set.',          icon:'📊' },
            { step:'6', title:'Deployment',         desc:'joblib-exported model served via Flask microservice on port 5001.',       icon:'🚀' },
          ].map((s,i) => (
            <div key={i} className="glass-card" style={{ padding:'18px 20px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:28, height:28, background:'var(--grad-blue)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>{s.step}</div>
                <div style={{ fontWeight:600, fontSize:14 }}>{s.title}</div>
                <div style={{ fontSize:20, marginLeft:'auto' }}>{s.icon}</div>
              </div>
              <p style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
