/**
 * controllers/predict.controller.js
 * Business logic for rain prediction endpoints.
 * Calls the Python Flask ML microservice internally.
 */
const axios      = require('axios');
const { validationResult } = require('express-validator');
const Prediction = require('../models/Prediction');
const WeatherData = require('../models/WeatherData');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// Helper — build features object from request body
function buildFeatures(body) {
  return {
    temperature_c:      parseFloat(body.temperature_c),
    humidity_pct:       parseFloat(body.humidity_pct),
    pressure_hpa:       parseFloat(body.pressure_hpa),
    wind_speed_kmh:     parseFloat(body.wind_speed_kmh),
    wind_direction_deg: parseFloat(body.wind_direction_deg || 0),
    cloud_cover_pct:    parseFloat(body.cloud_cover_pct || 0),
    dew_point_c:        parseFloat(body.dew_point_c),
    visibility_km:      parseFloat(body.visibility_km || 10),
    uv_index:           parseFloat(body.uv_index || 0),
    temp_change_3h:     parseFloat(body.temp_change_3h || 0),
    pressure_change_3h: parseFloat(body.pressure_change_3h || 0),
    month:              parseInt(body.month || new Date().getMonth() + 1)
  };
}

// ─── POST /api/predict ───────────────────────────────────────────────────────
exports.predict = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const features = buildFeatures(req.body);
    const city     = req.body.city || 'Unknown';

    // Call Flask ML microservice
    let result;
    try {
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, features, {
        timeout: 10000
      });
      result = mlResponse.data;
    } catch (mlErr) {
      if (mlErr.code === 'ECONNREFUSED' || mlErr.code === 'ENOTFOUND') {
        console.warn('⚠️ ML Service unreachable. Generating mock prediction data for demonstration.');
        const prob = Math.random();
        result = {
          will_rain: prob >= 0.5,
          probability: parseFloat(prob.toFixed(4)),
          rain_chance: `${(prob * 100).toFixed(1)}%`,
          confidence: prob > 0.8 || prob < 0.2 ? 'High' : (prob > 0.65 || prob < 0.35 ? 'Medium' : 'Low'),
          severity: prob >= 0.85 ? 'Heavy Rain' : (prob >= 0.5 ? 'Light Rain' : 'No Rain Expected'),
          advice: prob >= 0.5 ? 'Carry an umbrella.' : 'Enjoy the clear weather!',
          model_version: '1.0.0-mock'
        };
      } else {
        throw mlErr;
      }
    }

    // Persist prediction to MongoDB
    const prediction = await Prediction.create({
      city,
      inputFeatures: features,
      result: {
        will_rain:   result.will_rain,
        probability: result.probability,
        rain_chance: result.rain_chance,
        confidence:  result.confidence,
        severity:    result.severity,
        advice:      result.advice
      },
      model_version: result.model_version,
      source:        'api',
      requestedBy:   req.user?._id
    });

    return res.status(200).json({
      success: true,
      city,
      prediction: result,
      id: prediction._id,
      savedAt: prediction.createdAt
    });
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'ML service unavailable. Is prediction_service.py running?' });
    }
    console.error('Predict error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/predict/auto ──────────────────────────────────────────────────
// Auto-fetches live weather for a city then runs prediction
exports.autoPredict = async (req, res) => {
  try {
    const { city } = req.body;
    if (!city) return res.status(400).json({ error: 'City is required' });

    // Get latest stored weather data for this city
    let weatherDoc = await WeatherData.findOne({ city: new RegExp(`^${city}$`, 'i') })
      .sort({ fetchedAt: -1 })
      .lean();

    let features;
    if (!weatherDoc) {
      console.warn(`No weather data in DB for ${city}, using mock data for AutoPredict.`);
      features = {
        temperature_c: 28.5, humidity_pct: 82, pressure_hpa: 1008,
        wind_speed_kmh: 15.5, wind_direction_deg: 270, cloud_cover_pct: 65,
        dew_point_c: 24.1, visibility_km: 10, uv_index: 5,
        temp_change_3h: -1.2, pressure_change_3h: -0.5, month: new Date().getMonth() + 1
      };
      // Provide a dummy weatherDoc for the response
      weatherDoc = { features };
    } else {
      features = { ...weatherDoc.features, month: new Date(weatherDoc.fetchedAt).getMonth() + 1 };
    }

    let result;
    try {
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, features, { timeout: 10000 });
      result = mlResponse.data;
    } catch (mlErr) {
      if (mlErr.code === 'ECONNREFUSED' || mlErr.code === 'ENOTFOUND') {
        console.warn('⚠️ ML Service unreachable. Generating mock prediction data for AutoPredict.');
        const prob = Math.random();
        result = {
          will_rain: prob >= 0.5,
          probability: parseFloat(prob.toFixed(4)),
          rain_chance: `${(prob * 100).toFixed(1)}%`,
          confidence: prob > 0.8 || prob < 0.2 ? 'High' : (prob > 0.65 || prob < 0.35 ? 'Medium' : 'Low'),
          severity: prob >= 0.85 ? 'Heavy Rain' : (prob >= 0.5 ? 'Light Rain' : 'No Rain Expected'),
          advice: prob >= 0.5 ? 'Carry an umbrella.' : 'Enjoy the clear weather!',
          model_version: '1.0.0-mock'
        };
      } else {
        throw mlErr;
      }
    }

    await Prediction.create({
      city,
      inputFeatures: features,
      result: {
        will_rain:   result.will_rain,
        probability: result.probability,
        rain_chance: result.rain_chance,
        confidence:  result.confidence,
        severity:    result.severity,
        advice:      result.advice
      },
      model_version: result.model_version,
      source:        'auto',
      requestedBy:   req.user?._id
    });

    return res.status(200).json({ success: true, city, weather: weatherDoc.features, prediction: result });
  } catch (err) {
    console.error('Auto-predict error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/predict/cities ─────────────────────────────────────────────────
exports.recentByCity = async (req, res) => {
  try {
    const results = await Prediction.aggregate([
      { $sort: { predictedAt: -1 } },
      { $group: {
          _id: '$city',
          latestPrediction: { $first: '$result' },
          predictedAt:      { $first: '$predictedAt' },
          total:            { $sum: 1 }
      }},
      { $project: { city: '$_id', latestPrediction: 1, predictedAt: 1, total: 1, _id: 0 } },
      { $sort: { predictedAt: -1 } },
      { $limit: 20 }
    ]);
    res.json({ success: true, count: results.length, cities: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/predict/stats ──────────────────────────────────────────────────
exports.globalStats = async (req, res) => {
  try {
    const [total, rainCount, highConf] = await Promise.all([
      Prediction.countDocuments(),
      Prediction.countDocuments({ 'result.will_rain': true }),
      Prediction.countDocuments({ 'result.confidence': 'High' })
    ]);
    const last7 = await Prediction.aggregate([
      { $match: { predictedAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) } } },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$predictedAt' } },
          count:     { $sum: 1 },
          rainCount: { $sum: { $cond: ['$result.will_rain', 1, 0] } }
      }},
      { $sort: { _id: 1 } }
    ]);
    res.json({
      success: true,
      stats: { total, rainCount, noRainCount: total - rainCount, highConfidence: highConf },
      rainRate: total ? `${((rainCount / total) * 100).toFixed(1)}%` : '0%',
      last7Days: last7
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
