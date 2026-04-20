// src/pages/PredictPage.jsx — Weather input form + ML prediction result
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  RadialBarChart, RadialBar, ResponsiveContainer
} from 'recharts';

const CITIES = ['Mumbai', 'Delhi', 'Chennai', 'Kolkata', 'Bangalore',
                 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Custom'];

const DEFAULT_FORM = {
  city: 'Mumbai', temperature_c: '', humidity_pct: '', pressure_hpa: '',
  wind_speed_kmh: '', wind_direction_deg: '', cloud_cover_pct: '',
  dew_point_c: '', visibility_km: '', uv_index: '',
  temp_change_3h: '', pressure_change_3h: '',
  month: new Date().getMonth() + 1
};

const FIELDS = [
  { key: 'temperature_c',      label: 'Temperature (°C)',       icon: '🌡️', placeholder: 'e.g. 28.5',  hint: '-60 to 60'    },
  { key: 'humidity_pct',       label: 'Humidity (%)',            icon: '💧', placeholder: 'e.g. 85',    hint: '0 to 100'     },
  { key: 'pressure_hpa',       label: 'Pressure (hPa)',          icon: '⬇️', placeholder: 'e.g. 1008',  hint: '870 to 1085'  },
  { key: 'wind_speed_kmh',     label: 'Wind Speed (km/h)',       icon: '💨', placeholder: 'e.g. 22',    hint: '0 to 400'     },
  { key: 'wind_direction_deg', label: 'Wind Direction (°)',      icon: '🧭', placeholder: 'e.g. 270',   hint: '0 to 360'     },
  { key: 'cloud_cover_pct',    label: 'Cloud Cover (%)',         icon: '☁️', placeholder: 'e.g. 75',    hint: '0 to 100'     },
  { key: 'dew_point_c',        label: 'Dew Point (°C)',          icon: '🌫️', placeholder: 'e.g. 24.1',  hint: '-80 to 55'    },
  { key: 'visibility_km',      label: 'Visibility (km)',         icon: '👁️', placeholder: 'e.g. 8.0',   hint: '0 to 100'     },
  { key: 'uv_index',           label: 'UV Index',                icon: '☀️', placeholder: 'e.g. 4.2',   hint: '0 to 11'      },
  { key: 'temp_change_3h',     label: 'Temp Change 3h (°C)',     icon: '📉', placeholder: 'e.g. -1.5',  hint: 'Delta'        },
  { key: 'pressure_change_3h', label: 'Pressure Change 3h (hPa)',icon: '📊', placeholder: 'e.g. -2.1',  hint: 'Delta'        },
];

// ── Probability Ring ────────────────────────────────────────────
function ProbabilityRing({ probability }) {
  const pct  = Math.round(probability * 100);
  const willRain = probability >= 0.5;

  return (
    <div style={{ 
      padding: '24px', 
      background: 'var(--bg-secondary)', 
      borderRadius: 'var(--radius-md)', 
      marginBottom: '24px', 
      border: '1px solid var(--border)',
      textAlign: 'center'
    }}>
      <div style={{ 
        fontSize: '48px', 
        fontWeight: 800, 
        lineHeight: 1,
        color: willRain ? 'var(--accent-blue)' : 'var(--accent-green)',
        marginBottom: '8px'
      }}>
        {pct}%
      </div>
      <div style={{ 
        fontSize: '13px', 
        color: 'var(--text-secondary)', 
        fontWeight: 600, 
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        Rain Chance
      </div>
    </div>
  );
}

// ── Sample data fill ────────────────────────────────────────────
const SAMPLE_DATA = {
  temperature_c: '28.5', humidity_pct: '85', pressure_hpa: '1008.2',
  wind_speed_kmh: '22.4', wind_direction_deg: '270', cloud_cover_pct: '75',
  dew_point_c: '24.1', visibility_km: '8.0', uv_index: '4.2',
  temp_change_3h: '-1.5', pressure_change_3h: '-2.1', month: 7
};

export default function PredictPage() {
  const { runPrediction, fetchWeather, loading } = useApp();
  const [form,       setForm]       = useState(DEFAULT_FORM);
  const [result,     setResult]     = useState(null);
  const [cityInput,  setCityInput]  = useState('');

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  const fillSample = () => setForm(p => ({ ...p, ...SAMPLE_DATA }));

  const fetchAndFill = async () => {
    const city = form.city === 'Custom' ? cityInput : form.city;
    if (!city) return;
    const data = await fetchWeather(city);
    if (data?.features) {
      setForm(p => ({ ...p, ...Object.fromEntries(
        Object.entries(data.features).map(([k,v]) => [k, String(v)])
      )}));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const payload = {
      city: form.city === 'Custom' ? cityInput : form.city,
      ...Object.fromEntries(
        Object.entries(form)
          .filter(([k]) => k !== 'city')
          .map(([k, v]) => [k, parseFloat(v)])
      ),
      month: parseInt(form.month)
    };
    const data = await runPrediction(payload);
    if (data) setResult(data);
  };

  return (
    <div className="page-container animate-fade-up">
      <div className="topbar">
        <div>
          <h1 className="page-title">🌧️ Rain Prediction</h1>
          <p className="page-subtitle">Enter weather parameters to get ML-powered rainfall forecast</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline btn-sm" onClick={fillSample}>🧪 Fill Sample</button>
          <button className="btn btn-outline btn-sm" onClick={fetchAndFill} disabled={loading.weather}>
            {loading.weather ? '⏳' : '📡'} Auto-Fill from API
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 380px' : '1fr', gap: 24 }}>
        {/* Form */}
        <div className="glass-card form-section">
          <h2 className="form-title">📝 Weather Parameters</h2>
          <p className="form-subtitle">All fields are required for accurate ML prediction</p>

          <form onSubmit={handleSubmit}>
            {/* City selection */}
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">📍 City</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <select
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="form-select"
                  style={{ flex: 1 }}
                >
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {form.city === 'Custom' && (
                  <input
                    className="form-input"
                    placeholder="Enter city name"
                    value={cityInput}
                    onChange={e => setCityInput(e.target.value)}
                    style={{ flex: 1 }}
                  />
                )}
              </div>
            </div>

            <div className="form-grid">
              {FIELDS.map(({ key, label, icon, placeholder, hint }) => (
                <div key={key} className="form-group">
                  <label className="form-label">{icon} {label}</label>
                  <input
                    type="number"
                    step="any"
                    name={key}
                    value={form[key]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="form-input"
                    required
                  />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{hint}</span>
                </div>
              ))}

              <div className="form-group">
                <label className="form-label">📅 Month</label>
                <select name="month" value={form.month} onChange={handleChange} className="form-select">
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
                    .map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 24 }}
              disabled={loading.predict}
            >
              {loading.predict ? '⏳ Predicting...' : '🔮 Predict Rain'}
            </button>
          </form>
        </div>

        {/* Result Panel */}
        {result && (
          <div className="glass-card result-card animate-fade-in">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>🎯 Prediction Result</h2>

            <ProbabilityRing probability={result.prediction.probability} />

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
              <div className={`result-badge ${result.prediction.will_rain ? 'badge-rain' : 'badge-no-rain'}`} style={{ margin: 0 }}>
                {result.prediction.will_rain ? '🌧️ Rain Expected' : '☀️ No Rain'}
              </div>
              <div className={`result-badge ${
                result.prediction.confidence === 'High'   ? 'badge-rain' :
                result.prediction.confidence === 'Medium' ? 'badge-warn' : ''
              }`} style={{ margin: 0 }}>
                {result.prediction.confidence} Confidence
              </div>
            </div>

            <div className={`alert-banner ${result.prediction.will_rain ? 'alert-rain' : 'alert-ok'}`} style={{ textAlign: 'left', marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{result.prediction.severity}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{result.prediction.advice}</div>
              </div>
            </div>

            {/* Feature chips */}
            <div className="features-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {[
                { icon: '🌡️', val: `${result.prediction.probability ? (result.prediction.probability * 100).toFixed(1) : 0}%`, lbl: 'Probability' },
                { icon: '🎯', val: result.prediction.confidence, lbl: 'Confidence' },
                { icon: '🤖', val: `v${result.prediction.model_version}`, lbl: 'Model' },
                { icon: '⏰', val: new Date(result.prediction.predicted_at || result.savedAt || Date.now()).toLocaleTimeString('en-IN'), lbl: 'Predicted At' },
              ].map((f, i) => (
                <div key={i} className="feature-chip">
                  <div className="feature-chip-icon">{f.icon}</div>
                  <div className="feature-chip-value">{f.val}</div>
                  <div className="feature-chip-label">{f.lbl}</div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 20 }}>
              Prediction ID: {result.id?.slice(-8)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
