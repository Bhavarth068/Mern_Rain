/**
 * routes/auth.routes.js
 * POST /api/auth/register
 * POST /api/auth/login
 * GET  /api/auth/me
 */
const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const ctrl    = require('../controllers/auth.controller');
const auth    = require('../middleware/auth.middleware');

router.post('/register', [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], ctrl.register);

router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], ctrl.login);

router.get('/me', auth, ctrl.getMe);
router.put('/alerts', auth, ctrl.updateAlerts);

module.exports = router;
