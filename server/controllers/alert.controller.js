/**
 * controllers/alert.controller.js
 * Rain alert system — checks predictions and flags high-probability rain events.
 */
const Prediction = require('../models/Prediction');

exports.getAlerts = async (req, res) => {
  try {
    // Return predictions where rain probability >= 60% in last 24h
    const threshold = parseFloat(req.query.threshold) || 0.6;
    const alerts = await Prediction.find({
      'result.probability': { $gte: threshold },
      predictedAt:          { $gte: new Date(Date.now() - 24*60*60*1000) }
    }).sort({ 'result.probability': -1 }).limit(50).lean();
    return res.json({ success: true, count: alerts.length, alerts });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getCityAlerts = async (req, res) => {
  try {
    const { city } = req.params;
    const alerts = await Prediction.find({
      city,
      'result.probability': { $gte: 0.6 },
      predictedAt:          { $gte: new Date(Date.now() - 48*60*60*1000) }
    }).sort({ predictedAt: -1 }).lean();
    return res.json({ success: true, city, alerts });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.checkAlerts = async (req, res) => {
  // Placeholder for push notification / email trigger logic
  return res.json({ success: true, message: 'Alert check triggered', timestamp: new Date().toISOString() });
};
