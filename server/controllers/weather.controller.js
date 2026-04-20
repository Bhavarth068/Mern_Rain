/**
 * controllers/weather.controller.js
 * Fetches live weather from OpenWeatherMap, stores to MongoDB.
 */
const axios       = require('axios');
const WeatherData = require('../models/WeatherData');

const OWM_BASE = 'https://api.openweathermap.org/data/2.5';
const API_KEY  = process.env.OPENWEATHERMAP_API_KEY;

// Helper: map OWM response → our schema features
function mapOwmToFeatures(data) {
  const tempC   = data.main.temp - 273.15;
  const humidity = data.main.humidity;
  const dewPoint = tempC - ((100 - humidity) / 5); // Magnus approx
  return {
    temperature_c:      parseFloat(tempC.toFixed(2)),
    humidity_pct:       humidity,
    pressure_hpa:       data.main.pressure,
    wind_speed_kmh:     parseFloat((data.wind.speed * 3.6).toFixed(2)),
    wind_direction_deg: data.wind.deg || 0,
    cloud_cover_pct:    data.clouds?.all || 0,
    dew_point_c:        parseFloat(dewPoint.toFixed(2)),
    visibility_km:      parseFloat(((data.visibility || 10000) / 1000).toFixed(2)),
    uv_index:           0, // requires separate OWM UV call
    temp_change_3h:     0,
    pressure_change_3h: 0,
    month:              new Date().getMonth() + 1
  };
}

// ─── GET /api/weather/current/:city ──────────────────────────────────────────
exports.getCurrentWeather = async (req, res) => {
  try {
    const { city } = req.params;

    // 1. Get coordinates using free Geocoding API
    const geoRes = await axios.get(`https://geocoding-api.open-meteo.com/v1/search`, {
      params: { name: city, count: 1, format: 'json' },
      timeout: 8000
    });

    if (!geoRes.data.results || geoRes.data.results.length === 0) {
      return res.status(404).json({ error: `City "${city}" not found` });
    }
    const loc = geoRes.data.results[0];

    // 2. Fetch live weather using free Open-Meteo API
    const weatherRes = await axios.get(`https://api.open-meteo.com/v1/forecast`, {
      params: {
        latitude: loc.latitude,
        longitude: loc.longitude,
        current: 'temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,cloud_cover',
        timezone: 'auto'
      },
      timeout: 8000
    });

    const current = weatherRes.data.current;
    
    // Map to our project features schema
    const dewPoint = current.temperature_2m - ((100 - current.relative_humidity_2m) / 5);
    const features = {
      temperature_c: current.temperature_2m,
      humidity_pct: current.relative_humidity_2m,
      pressure_hpa: current.surface_pressure,
      wind_speed_kmh: current.wind_speed_10m,
      wind_direction_deg: current.wind_direction_10m,
      cloud_cover_pct: current.cloud_cover,
      dew_point_c: parseFloat(dewPoint.toFixed(2)),
      visibility_km: 10,
      uv_index: 5,
      temp_change_3h: 0,
      pressure_change_3h: 0,
      month: new Date().getMonth() + 1
    };

    // Upsert weather record
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const existing = await WeatherData.findOne({ city: new RegExp(`^${loc.name}$`, 'i'), fetchedAt: { $gte: thirtyMinsAgo } });

    let weatherDoc = existing;
    if (!existing) {
      weatherDoc = await WeatherData.create({
        city: loc.name,
        country: loc.country_code || 'IN',
        coordinates: { lat: loc.latitude, lon: loc.longitude },
        features,
        weather_description: current.cloud_cover > 60 ? 'cloudy' : 'clear',
        icon_code: current.cloud_cover > 60 ? '04d' : '01d',
        source: 'open-meteo'
      });
    }

    return res.json({
      success: true,
      city: loc.name,
      country: loc.country_code,
      features,
      description: current.cloud_cover > 60 ? 'cloudy' : 'clear',
      icon: current.cloud_cover > 60 ? 'https://openweathermap.org/img/wn/04d@2x.png' : 'https://openweathermap.org/img/wn/01d@2x.png',
      fetchedAt: weatherDoc.fetchedAt,
      coordinates: { lat: loc.latitude, lon: loc.longitude }
    });
  } catch (err) {
    console.error('Weather fetch error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch live data from Open-Meteo API.' });
  }
};

// ─── GET /api/weather/forecast/:city ─────────────────────────────────────────
exports.getForecast = async (req, res) => {
  try {
    const { city } = req.params;

    // 1. Get coordinates
    const geoRes = await axios.get(`https://geocoding-api.open-meteo.com/v1/search`, {
      params: { name: city, count: 1, format: 'json' }, timeout: 8000
    });
    if (!geoRes.data.results || geoRes.data.results.length === 0) {
      return res.status(404).json({ error: `City "${city}" not found` });
    }
    const loc = geoRes.data.results[0];

    // 2. Get 5-day hourly forecast
    const weatherRes = await axios.get(`https://api.open-meteo.com/v1/forecast`, {
      params: {
        latitude: loc.latitude,
        longitude: loc.longitude,
        hourly: 'temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,cloud_cover,rain',
        timezone: 'auto',
        forecast_days: 5
      }, timeout: 8000
    });

    const hourly = weatherRes.data.hourly;
    const forecast = [];
    
    // Open-Meteo gives hourly data (120 points). We'll take every 3rd hour to match original OWM style (40 points)
    for (let i = 0; i < hourly.time.length; i += 3) {
      if (forecast.length >= 40) break;
      forecast.push({
        datetime:    hourly.time[i].replace('T', ' '),
        temperature: hourly.temperature_2m[i],
        humidity:    hourly.relative_humidity_2m[i],
        pressure:    hourly.surface_pressure[i],
        wind_speed:  hourly.wind_speed_10m[i],
        cloud_cover: hourly.cloud_cover[i],
        description: hourly.cloud_cover[i] > 60 ? 'cloudy' : 'clear',
        icon:        hourly.cloud_cover[i] > 60 ? '04d' : '01d',
        rain_mm:     hourly.rain[i] || 0
      });
    }

    return res.json({ success: true, city: loc.name, country: loc.country_code, forecast });
  } catch (err) {
    console.error('Forecast fetch error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch forecast from Open-Meteo API' });
  }
};

// ─── GET /api/weather/history/:city ──────────────────────────────────────────
exports.getHistory = async (req, res) => {
  try {
    const { city } = req.params;
    const limit    = parseInt(req.query.limit) || 48;
    const records  = await WeatherData.find({ city })
      .sort({ fetchedAt: -1 })
      .limit(limit)
      .lean();
    return res.json({ success: true, city, count: records.length, history: records });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/weather/cities ──────────────────────────────────────────────────
exports.getAvailableCities = async (req, res) => {
  try {
    const cities = await WeatherData.distinct('city');
    return res.json({ success: true, cities });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/weather/manual ─────────────────────────────────────────────────
exports.storeManualEntry = async (req, res) => {
  try {
    const { city, coordinates, ...features } = req.body;
    const doc = await WeatherData.create({
      city,
      coordinates: coordinates || { lat: 0, lon: 0 },
      features,
      source: 'manual'
    });
    return res.status(201).json({ success: true, id: doc._id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
