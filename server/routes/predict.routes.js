/**
 * routes/predict.routes.js
 * POST /api/predict        — Run ML prediction from manual input
 * POST /api/predict/auto   — Auto-fetch weather then predict
 * GET  /api/predict/cities — Get recent predictions per city
 */
const express    = require('express');
const router     = express.Router();
const { body }   = require('express-validator');
const ctrl       = require('../controllers/predict.controller');
const authMiddle = require('../middleware/auth.middleware');

const inputRules = [
  body('city').notEmpty().withMessage('City is required'),
  body('temperature_c').isFloat({ min: -60, max: 60 }),
  body('humidity_pct').isFloat({ min: 0, max: 100 }),
  body('pressure_hpa').isFloat({ min: 870, max: 1085 }),
  body('wind_speed_kmh').isFloat({ min: 0, max: 400 }),
  body('cloud_cover_pct').isFloat({ min: 0, max: 100 }),
  body('dew_point_c').isFloat({ min: -80, max: 55 }),
  body('visibility_km').isFloat({ min: 0, max: 100 }),
  body('uv_index').isFloat({ min: 0, max: 11 }),
  body('month').isInt({ min: 1, max: 12 })
];

router.post('/',        inputRules, ctrl.predict);
router.post('/auto',    ctrl.autoPredict);
router.get('/cities',   ctrl.recentByCity);
router.get('/stats',    ctrl.globalStats);

module.exports = router;
