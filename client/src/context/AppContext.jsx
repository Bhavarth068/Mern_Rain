// src/context/AppContext.jsx — Global state management
import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AppContext = createContext();

const API = axios.create({ baseURL: "http://16.170.238.91:5000/api" });

// Attach JWT to every request
API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('rfs_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export function AppProvider({ children }) {
  const [user,        setUser]        = useState(null);
  const [weather,     setWeather]     = useState(null);
  const [prediction,  setPrediction]  = useState(null);
  const [history,     setHistory]     = useState([]);
  const [alerts,      setAlerts]      = useState([]);
  const [stats,       setStats]       = useState(null);
  const [loading,     setLoading]     = useState({});

  const setLoad = (key, val) => setLoading(p => ({ ...p, [key]: val }));

  // ── Auth ──────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    try {
      setLoad('auth', true);
      const { data } = await API.post('/auth/login', { email, password });
      localStorage.setItem('rfs_token', data.token);
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
      return false;
    } finally { setLoad('auth', false); }
  }, []);

  const register = useCallback(async (name, email, password) => {
    try {
      setLoad('auth', true);
      const { data } = await API.post('/auth/register', { name, email, password });
      localStorage.setItem('rfs_token', data.token);
      setUser(data.user);
      toast.success('Account created!');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
      return false;
    } finally { setLoad('auth', false); }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('rfs_token');
    setUser(null);
    toast.success('Logged out');
  }, []);

  // ── Weather ──────────────────────────────────────────────────
  const fetchWeather = useCallback(async (city) => {
    try {
      setLoad('weather', true);
      const { data } = await API.get(`/weather/current/${encodeURIComponent(city)}`);
      setWeather(data);
      return data;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Weather fetch failed');
      return null;
    } finally { setLoad('weather', false); }
  }, []);

  const fetchForecast = useCallback(async (city) => {
    try {
      const { data } = await API.get(`/weather/forecast/${encodeURIComponent(city)}`);
      return data;
    } catch (err) {
      toast.error('Forecast unavailable');
      return null;
    }
  }, []);

  // ── Prediction ───────────────────────────────────────────────
  const runPrediction = useCallback(async (formData) => {
    try {
      setLoad('predict', true);
      const { data } = await API.post('/predict', formData);
      setPrediction(data);
      toast.success('Prediction complete!');
      return data;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Prediction failed. Is the ML service running?');
      return null;
    } finally { setLoad('predict', false); }
  }, []);

  const autoPredict = useCallback(async (city) => {
    try {
      setLoad('predict', true);
      const { data } = await API.post('/predict/auto', { city });
      setPrediction(data);
      toast.success('Auto-prediction complete!');
      return data;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Auto-prediction failed');
      return null;
    } finally { setLoad('predict', false); }
  }, []);

  // ── History ──────────────────────────────────────────────────
  const fetchHistory = useCallback(async (city, limit = 30) => {
    try {
      setLoad('history', true);
      const url = city ? `/history/${encodeURIComponent(city)}?limit=${limit}` : `/history?limit=${limit}`;
      const { data } = await API.get(url);
      setHistory(data.history || []);
      return data;
    } catch (err) {
      toast.error('Could not load history');
      return null;
    } finally { setLoad('history', false); }
  }, []);

  // ── Stats ────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const { data } = await API.get('/predict/stats');
      setStats(data);
      return data;
    } catch (err) {
      console.error('Stats fetch failed:', err.message);
      return null;
    }
  }, []);

  // ── Alerts ───────────────────────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    try {
      const { data } = await API.get('/alerts');
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error('Alerts fetch failed');
    }
  }, []);

  const value = {
    user, weather, prediction, history, alerts, stats, loading,
    login, register, logout,
    fetchWeather, fetchForecast,
    runPrediction, autoPredict,
    fetchHistory, fetchStats, fetchAlerts,
    setPrediction
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};
