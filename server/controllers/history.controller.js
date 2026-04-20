/**
 * controllers/history.controller.js
 * Returns paginated prediction history from MongoDB.
 */
const Prediction = require('../models/Prediction');

exports.getAll = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const [records, total] = await Promise.all([
      Prediction.find()
        .sort({ predictedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Prediction.countDocuments()
    ]);

    return res.json({
      success: true, total,
      page, pages: Math.ceil(total / limit),
      history: records
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getByCity = async (req, res) => {
  try {
    const { city } = req.params;
    const limit    = parseInt(req.query.limit) || 30;
    const records  = await Prediction.find({ city })
      .sort({ predictedAt: -1 })
      .limit(limit)
      .lean();
    return res.json({ success: true, city, count: records.length, history: records });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getAccuracyStats = async (req, res) => {
  try {
    // Compute daily prediction breakdown for last 30 days
    const stats = await Prediction.aggregate([
      { $match: { predictedAt: { $gte: new Date(Date.now() - 30*24*60*60*1000) } } },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$predictedAt' } },
          total:     { $sum: 1 },
          rainCount: { $sum: { $cond: ['$result.will_rain', 1, 0] } },
          avgProb:   { $avg: '$result.probability' }
      }},
      { $sort: { _id: 1 } }
    ]);
    return res.json({ success: true, dailyStats: stats });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.deleteEntry = async (req, res) => {
  try {
    await Prediction.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Entry deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
