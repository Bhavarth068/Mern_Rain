// src/pages/WeatherPage.jsx — Live weather lookup and forecast
import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useApp } from '../context/AppContext';

const FEATURE_MAP = [
  { key: 'temperature_c',      label: 'Temperature', icon: '🌡️', unit: '°C' },
  { key: 'humidity_pct',       label: 'Humidity',    icon: '💧', unit: '%'  },
  { key: 'pressure_hpa',       label: 'Pressure',    icon: '⬇️', unit: ' hPa' },
  { key: 'wind_speed_kmh',     label: 'Wind Speed',  icon: '💨', unit: ' km/h' },
  { key: 'cloud_cover_pct',    label: 'Cloud Cover', icon: '☁️', unit: '%'  },
  { key: 'visibility_km',      label: 'Visibility',  icon: '👁️', unit: ' km' },
  { key: 'dew_point_c',        label: 'Dew Point',   icon: '🌫️', unit: '°C' },
  { key: 'wind_direction_deg', label: 'Wind Dir',    icon: '🧭', unit: '°'  },
];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'rgba(6,15,35,0.95)', border:'1px solid rgba(56,189,248,0.3)', borderRadius:10, padding:'10px 14px', fontSize:13 }}>
      <p style={{ color:'var(--text-muted)', marginBottom:4 }}>{label}</p>
      {payload.map((p,i) => <p key={i} style={{ color:p.color, fontWeight:600 }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function WeatherPage() {
  const { fetchWeather, fetchForecast, autoPredict, loading } = useApp();
  const [city,     setCity]     = useState('Mumbai');
  const [weather,  setWeather]  = useState(null);
  const [forecast, setForecast] = useState(null);
  const [autoPred, setAutoPred] = useState(null);

  const handleFetch = async () => {
    const w = await fetchWeather(city);
    if (w) setWeather(w);
    const f = await fetchForecast(city);
    if (f) setForecast(f);
  };

  const handleAutoPredict = async () => {
    const p = await autoPredict(city);
    if (p) setAutoPred(p);
  };

  const forecastChart = forecast?.forecast?.slice(0, 16).map(f => ({
    time:  f.datetime.split(' ')[1]?.slice(0, 5) || f.datetime.slice(11, 16),
    temp:  f.temperature,
    hum:   f.humidity,
    rain:  f.rain_mm
  })) || [];

  return (
    <div className="page-container animate-fade-up">
      <div className="topbar">
        <div>
          <h1 className="page-title">🌡️ Live Weather</h1>
          <p className="page-subtitle">Real-time data from OpenWeatherMap API</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card" style={{ padding: '20px 24px', marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input
          className="form-input"
          style={{ flex: 1, minWidth: 200 }}
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="Enter city name (e.g. Mumbai)"
          onKeyDown={e => e.key === 'Enter' && handleFetch()}
        />
        <button className="btn btn-primary" onClick={handleFetch} disabled={loading.weather}>
          {loading.weather ? '⏳' : '🔍'} Get Weather
        </button>
        {weather && (
          <button className="btn btn-outline" onClick={handleAutoPredict} disabled={loading.predict}>
            {loading.predict ? '⏳' : '🔮'} Auto Predict
          </button>
        )}
      </div>

      {/* Auto-prediction alert */}
      {autoPred && (
        <div className={`alert-banner ${autoPred.prediction.will_rain ? 'alert-rain' : 'alert-ok'}`} style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 24 }}>{autoPred.prediction.will_rain ? '🌧️' : '☀️'}</span>
          <div>
            <strong>{autoPred.city} — {autoPred.prediction.severity}</strong>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              Rain probability: {autoPred.prediction.rain_chance} | {autoPred.prediction.advice}
            </div>
          </div>
        </div>
      )}

      {/* Current Weather */}
      {weather && (
        <>
          <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 28, fontWeight: 800 }}>{weather.city}, {weather.country}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, textTransform: 'capitalize', marginTop: 4 }}>
                  {weather.description}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  📍 {weather.coordinates?.lat?.toFixed(2)}°N, {weather.coordinates?.lon?.toFixed(2)}°E
                  &nbsp;•&nbsp; Updated: {new Date(weather.fetchedAt).toLocaleTimeString('en-IN')}
                </p>
              </div>
              {weather.icon && (
                <img src={weather.icon} alt={weather.description} style={{ width: 80, height: 80 }} />
              )}
            </div>

            <div className="features-grid">
              {FEATURE_MAP.map(({ key, label, icon, unit }) => (
                <div key={key} className="feature-chip">
                  <div className="feature-chip-icon">{icon}</div>
                  <div className="feature-chip-value">
                    {weather.features?.[key] != null ? `${weather.features[key]}${unit}` : '—'}
                  </div>
                  <div className="feature-chip-label">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Forecast Chart */}
          {forecastChart.length > 0 && (
            <div className="glass-card chart-section" style={{ marginBottom: 24 }}>
              <h3 className="chart-title">🌡️ Temperature & Humidity Forecast (48h)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={forecastChart}>
                  <defs>
                    <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} />
                  <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="temp" name="Temp °C" stroke="#f59e0b" fill="url(#tempGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="hum"  name="Humidity %" stroke="#38bdf8" fill="url(#humGrad)"  strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Forecast Table */}
          {forecast?.forecast && (
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 className="chart-title">📅 5-Day Forecast</h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Temp (°C)</th>
                      <th>Humidity (%)</th>
                      <th>Wind (km/h)</th>
                      <th>Cloud (%)</th>
                      <th>Rain (mm)</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.forecast.slice(0, 15).map((f, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f.datetime}</td>
                        <td style={{ fontWeight: 600, color: 'var(--accent-amber)' }}>{f.temperature}°C</td>
                        <td>{f.humidity}%</td>
                        <td>{f.wind_speed}</td>
                        <td>{f.cloud_cover}%</td>
                        <td style={{ color: f.rain_mm > 0 ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
                          {f.rain_mm > 0 ? `💧 ${f.rain_mm}` : '—'}
                        </td>
                        <td style={{ fontSize: 12, textTransform: 'capitalize' }}>{f.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!weather && !loading.weather && (
        <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🌤️</div>
          <h3 style={{ marginBottom: 8 }}>Search for a City</h3>
          <p style={{ color: 'var(--text-muted)' }}>Enter a city name above to fetch live weather data</p>
        </div>
      )}
    </div>
  );
}
