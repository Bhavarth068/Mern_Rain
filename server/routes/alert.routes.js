/**
 * routes/alert.routes.js
 * GET  /api/alerts           — All active alerts
 * POST /api/alerts/check     — Trigger alert check for all cities
 * GET  /api/alerts/:city     — Alerts for a city
 */
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/alert.controller');
const auth    = require('../middleware/auth.middleware');

router.get('/',          ctrl.getAlerts);
router.post('/check',    auth, ctrl.checkAlerts);
router.get('/:city',     ctrl.getCityAlerts);

module.exports = router;
