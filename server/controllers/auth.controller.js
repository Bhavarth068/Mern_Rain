/**
 * controllers/auth.controller.js
 * JWT-based user registration, login, and profile management.
 */
const jwt  = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const user  = await User.create({ name, email, password });
    const token = signToken(user._id);
    return res.status(201).json({ success: true, token, user: user.toSafeObject() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    user.lastLogin = new Date();
    await user.save();
    const token = signToken(user._id);
    return res.json({ success: true, token, user: user.toSafeObject() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getMe = async (req, res) => {
  return res.json({ success: true, user: req.user.toSafeObject() });
};

exports.updateAlerts = async (req, res) => {
  try {
    const { enabled, threshold, cities } = req.body;
    await User.findByIdAndUpdate(req.user._id, {
      'alerts.enabled':   enabled,
      'alerts.threshold': threshold,
      'alerts.cities':    cities
    });
    return res.json({ success: true, message: 'Alert preferences updated' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
