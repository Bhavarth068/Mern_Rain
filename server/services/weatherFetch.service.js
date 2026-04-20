/**
 * services/weatherFetch.service.js
 * Scheduled service — fetches weather for tracked cities every 30 minutes.
 * Called by node-cron in server.js.
 */
const axios       = require('axios');
const WeatherData = require('../models/WeatherData');

const TRACKED_CITIES = [
  'Mumbai', 'Delhi', 'Chennai', 'Kolkata', 'Bangalore',
  'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'
];
const OWM_BASE = 'https://api.openweathermap.org/data/2.5';

function mapOwm(data) {
  const tempC    = data.main.temp - 273.15;
  const humidity = data.main.humidity;
  return {
    temperature_c:      parseFloat(tempC.toFixed(2)),
    humidity_pct:       humidity,
    pressure_hpa:       data.main.pressure,
    wind_speed_kmh:     parseFloat((data.wind.speed * 3.6).toFixed(2)),
    wind_direction_deg: data.wind.deg || 0,
    cloud_cover_pct:    data.clouds?.all || 0,
    dew_point_c:        parseFloat((tempC - ((100 - humidity) / 5)).toFixed(2)),
    visibility_km:      parseFloat(((data.visibility || 10000) / 1000).toFixed(2)),
    uv_index:           0,
    temp_change_3h:     0,
    pressure_change_3h: 0,
    month:              new Date().getMonth() + 1
  };
}

exports.fetchAndStore = async () => {
  const API_KEY = process.env.OPENWEATHERMAP_API_KEY;
  if (!API_KEY) {
    console.warn('⚠️  OPENWEATHERMAP_API_KEY not set — skipping scheduled fetch.');
    return;
  }

  let fetched = 0, failed = 0;
  for (const city of TRACKED_CITIES) {
    try {
      const { data } = await axios.get(`${OWM_BASE}/weather`, {
        params: { q: city, appid: API_KEY }, timeout: 6000
      });
      await WeatherData.create({
        city:                data.name,
        country:             data.sys?.country,
        coordinates:         { lat: data.coord.lat, lon: data.coord.lon },
        features:            mapOwm(data),
        weather_description: data.weather?.[0]?.description,
        icon_code:           data.weather?.[0]?.icon,
        source:              'openweathermap'
      });
      fetched++;
    } catch (err) {
      console.error(`Failed to fetch weather for ${city}: ${err.message}`);
      failed++;
    }
    // Respect API rate limit
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`✅ Weather fetch complete: ${fetched} cities updated, ${failed} failed.`);
};
