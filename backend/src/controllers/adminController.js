const User = require('../models/User');
const Athlete = require('../models/Athlete');
const Event = require('../models/Event');
const Certificate = require('../models/Certificate');
const { ROLES } = require('../models/User');

/** GET /api/admin/users - list all users */
async function listUsers(req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) { next(err); }
}

/** POST /api/admin/users - admin creates a user of any role (organizer, verifier, admin, athlete) */
async function createUser(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    if (!ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: `Role must be one of: ${ROLES.join(', ')}` });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, password, role });
    if (role === 'athlete') {
      await Athlete.create({ user: user._id });
    }
    res.status(201).json({ success: true, user: user.toSafeJSON() });
  } catch (err) { next(err); }
}

/** PUT /api/admin/users/:id/role - change a user's role */
async function updateUserRole(req, res, next) {
  try {
    const { role } = req.body;
    if (!ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: `Role must be one of: ${ROLES.join(', ')}` });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const previousRole = user.role;
    user.role = role;
    await user.save();

    if (role === 'athlete' && previousRole !== 'athlete') {
      const exists = await Athlete.findOne({ user: user._id });
      if (!exists) await Athlete.create({ user: user._id });
    }

    res.json({ success: true, user: user.toSafeJSON() });
  } catch (err) { next(err); }
}

/** PUT /api/admin/users/:id/status - activate/deactivate a user */
async function updateUserStatus(req, res, next) {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: user.toSafeJSON() });
  } catch (err) { next(err); }
}

/** DELETE /api/admin/users/:id */
async function deleteUser(req, res, next) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await Athlete.deleteOne({ user: user._id });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) { next(err); }
}

/** GET /api/admin/stats - system activity overview */
async function getStats(req, res, next) {
  try {
    const [totalUsers, totalAthletes, totalEvents, totalCertificates, roleBreakdown] = await Promise.all([
      User.countDocuments(),
      Athlete.countDocuments(),
      Event.countDocuments(),
      Certificate.countDocuments(),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    ]);
    res.json({
      success: true,
      stats: { totalUsers, totalAthletes, totalEvents, totalCertificates, roleBreakdown },
    });
  } catch (err) { next(err); }
}

module.exports = { listUsers, createUser, updateUserRole, updateUserStatus, deleteUser, getStats };
