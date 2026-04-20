// src/pages/LoginPage.jsx — Auth page (login + register tabs)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function LoginPage() {
  const { login, register, loading } = useApp();
  const navigate = useNavigate();
  const [tab,  setTab]  = useState('login');
  const [form, setForm] = useState({ name:'', email:'', password:'' });

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    let ok;
    if (tab === 'login') {
      ok = await login(form.email, form.password);
    } else {
      ok = await register(form.name, form.email, form.password);
    }
    if (ok) navigate('/');
  };

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--bg-primary)',
      backgroundImage:'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(56,189,248,0.07) 0%, transparent 60%)'
    }}>
      <div style={{ width:'100%', maxWidth:420, padding:24 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ fontSize:56, marginBottom:12 }}>🌧️</div>
          <h1 style={{ fontFamily:"'Inter',sans-serif", fontSize:20, fontWeight:700, color:'var(--accent-blue)' }}>
            RAIN FORECASTING SYSTEM
          </h1>
          <p style={{ color:'var(--text-muted)', fontSize:13, marginTop:6 }}>
            ML-powered rainfall prediction platform
          </p>
        </div>

        <div className="glass-card" style={{ padding:32 }}>
          {/* Tabs */}
          <div style={{ display:'flex', background:'rgba(255,255,255,0.04)', borderRadius:10, padding:4, marginBottom:28 }}>
            {['login','register'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex:1, padding:'9px 0', borderRadius:8, border:'none', cursor:'pointer',
                fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:600, transition:'all .25s',
                background: tab===t ? 'var(--accent-blue)'       : 'transparent',
                color:      tab===t ? '#fff'                    : 'var(--text-secondary)',
                boxShadow:  tab===t ? '0 2px 4px rgba(59,130,246,0.2)' : 'none'
              }}>
                {t === 'login' ? '🔐 Sign In' : '✨ Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {tab === 'register' && (
              <div className="form-group">
                <label className="form-label">👤 Full Name</label>
                <input name="name" value={form.name} onChange={handleChange}
                  className="form-input" placeholder="Enter your name" required />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">📧 Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                className="form-input" placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">🔒 Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange}
                className="form-input" placeholder={tab==='register' ? 'Min 6 characters' : 'Enter password'} required />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width:'100%', marginTop:8 }} disabled={loading.auth}>
              {loading.auth ? '⏳ Please wait...' : tab === 'login' ? '🚀 Sign In' : '✨ Create Account'}
            </button>
          </form>

          {/* Guest hint */}
          <div style={{ marginTop:20, padding:'12px 16px', background:'rgba(56,189,248,0.07)', borderRadius:10, border:'1px solid rgba(56,189,248,0.15)' }}>
            <p style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.6 }}>
              💡 <strong style={{ color:'var(--accent-blue)' }}>Try it out:</strong> You can use the prediction tool
              without logging in. Login unlocks auto-predict and alert preferences.
            </p>
          </div>
        </div>

        <p style={{ textAlign:'center', fontSize:12, color:'var(--text-muted)', marginTop:20 }}>
          🌧️ Rain Forecasting System v1.0.0 • Final Year Cloud Computing Project
        </p>
      </div>
    </div>
  );
}
