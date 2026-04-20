/**
 * routes/weather.routes.js
 * GET /api/weather/current/:city   — Live weather from OpenWeatherMap
 * GET /api/weather/forecast/:city  — 5-day forecast
 * GET /api/weather/history/:city   — Stored weather history from DB
 */
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/weather.controller');
const auth    = require('../middleware/auth.middleware');

router.get('/current/:city',  ctrl.getCurrentWeather);
router.get('/forecast/:city', ctrl.getForecast);
router.get('/history/:city',  ctrl.getHistory);
router.get('/cities',         ctrl.getAvailableCities);
router.post('/manual',   auth, ctrl.storeManualEntry);

module.exports = router;
