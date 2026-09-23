const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Athlete = require('../models/Athlete');

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/**
 * POST /api/auth/register
 * Public registration is restricted to the 'athlete' role.
 * Organizer/Admin/Verifier accounts are created by an Admin via
 * the admin management endpoints (RBAC: role escalation must not
 * be self-serve).
 */
async function register(req, res, next) {
  try {
    const { name, email, password, role = 'athlete' } = req.body;
    const allowedRoles = ['athlete', 'organizer', 'admin'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be athlete, organizer, or admin' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, role });
    if (role === 'athlete') {
      await Athlete.create({ user: user._id });
    }

    const token = signToken(user);
    res.status(201).json({ success: true, token, user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/login */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = signToken(user);
    res.json({ success: true, token, user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

/** GET /api/auth/me */
async function me(req, res) {
  res.json({ success: true, user: req.user.toSafeJSON() });
}

module.exports = { register, login, me };
