// models/Prediction.js — MongoDB Schema for ML predictions
const mongoose = require('mongoose');

const PredictionSchema = new mongoose.Schema({
  city:        { type: String, required: true, index: true },
  inputFeatures: {
    temperature_c:      Number,
    humidity_pct:       Number,
    pressure_hpa:       Number,
    wind_speed_kmh:     Number,
    wind_direction_deg: Number,
    cloud_cover_pct:    Number,
    dew_point_c:        Number,
    visibility_km:      Number,
    uv_index:           Number,
    temp_change_3h:     Number,
    pressure_change_3h: Number,
    month:              Number
  },
  result: {
    will_rain:    { type: Boolean, required: true },
    probability:  { type: Number, required: true },
    rain_chance:  { type: String },
    confidence:   { type: String, enum: ['High', 'Medium', 'Low'] },
    severity:     { type: String },
    advice:       { type: String }
  },
  model_version: { type: String, default: '1.0.0' },
  requestedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  source:        { type: String, enum: ['api', 'auto', 'manual'], default: 'api' },
  predictedAt:   { type: Date, default: Date.now, index: true }
}, { timestamps: true });

PredictionSchema.index({ city: 1, predictedAt: -1 });

module.exports = mongoose.model('Prediction', PredictionSchema);
