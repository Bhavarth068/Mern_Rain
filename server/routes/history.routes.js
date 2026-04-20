/**
 * routes/history.routes.js
 * GET  /api/history          — All prediction history (paginated)
 * GET  /api/history/:city    — History for a specific city
 * GET  /api/history/accuracy — Model accuracy over time
 * DEL  /api/history/:id      — Delete a history entry (admin)
 */
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/history.controller');
const auth    = require('../middleware/auth.middleware');

router.get('/',            ctrl.getAll);
router.get('/accuracy',    ctrl.getAccuracyStats);
router.get('/:city',       ctrl.getByCity);
router.delete('/:id', auth, ctrl.deleteEntry);

module.exports = router;
