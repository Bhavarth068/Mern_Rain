// models/WeatherData.js — MongoDB Schema for weather readings
const mongoose = require('mongoose');

const WeatherDataSchema = new mongoose.Schema({
  city: { type: String, required: true, index: true },
  country: { type: String, default: 'IN' },
  coordinates: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true }
  },
  features: {
    temperature_c:       { type: Number, required: true },
    humidity_pct:        { type: Number, required: true },
    pressure_hpa:        { type: Number, required: true },
    wind_speed_kmh:      { type: Number, required: true },
    wind_direction_deg:  { type: Number, default: 0 },
    cloud_cover_pct:     { type: Number, default: 0 },
    dew_point_c:         { type: Number },
    visibility_km:       { type: Number },
    uv_index:            { type: Number, default: 0 },
    temp_change_3h:      { type: Number, default: 0 },
    pressure_change_3h:  { type: Number, default: 0 },
    month:               { type: Number }
  },
  weather_description: { type: String },
  icon_code:           { type: String },
  source:              { type: String, default: 'openweathermap' },
  fetchedAt:           { type: Date, default: Date.now, index: true }
}, { timestamps: true });

WeatherDataSchema.index({ city: 1, fetchedAt: -1 });

module.exports = mongoose.model('WeatherData', WeatherDataSchema);
