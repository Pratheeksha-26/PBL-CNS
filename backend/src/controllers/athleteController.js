const Athlete = require('../models/Athlete');
const Registration = require('../models/Registration');
const Achievement = require('../models/Achievement');
const Certificate = require('../models/Certificate');
const User = require('../models/User');

/** GET /api/athletes/me - athlete's own profile, sensitive fields decrypted (AES-256-GCM) */
async function getMyProfile(req, res, next) {
  try {
    const athlete = await Athlete.findOne({ user: req.user._id })
      .populate('user', 'name email role')
      .populate('sports', 'name category');
    if (!athlete) return res.status(404).json({ success: false, message: 'Athlete profile not found' });

    res.json({ success: true, athlete: athlete.getDecrypted(), cryptoNote: 'Sensitive fields decrypted with AES-256-GCM for this authenticated request only.' });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/athletes/me - update profile; sensitive fields are AES-256-GCM encrypted before saving */
async function updateMyProfile(req, res, next) {
  try {
    const { bio, sports, dateOfBirth, phone, address, governmentId } = req.body;
    const athlete = await Athlete.findOne({ user: req.user._id });
    if (!athlete) return res.status(404).json({ success: false, message: 'Athlete profile not found' });

    if (bio !== undefined) athlete.bio = bio;
    if (sports !== undefined) athlete.sports = sports;
    athlete.setSensitiveFields({ dateOfBirth, phone, address, governmentId });

    await athlete.save();
    res.json({ success: true, athlete: athlete.getDecrypted(), cryptoNote: 'Sensitive fields re-encrypted with AES-256-GCM (fresh random IV) before storage.' });
  } catch (err) {
    next(err);
  }
}

/** POST /api/athletes/me/photo - upload profile photo */
async function uploadPhoto(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const athlete = await Athlete.findOne({ user: req.user._id });
    athlete.photoUrl = `/uploads/photos/${req.file.filename}`;
    await athlete.save();
    res.json({ success: true, photoUrl: athlete.photoUrl });
  } catch (err) {
    next(err);
  }
}

/** GET /api/athletes/me/history - registrations, achievements, certificates */
async function getMyHistory(req, res, next) {
  try {
    const athlete = await Athlete.findOne({ user: req.user._id });
    if (!athlete) return res.status(404).json({ success: false, message: 'Athlete profile not found' });

    const [registrations, achievements, certificates] = await Promise.all([
      Registration.find({ athlete: athlete._id }).populate({ path: 'event', populate: { path: 'sport' } }),
      Achievement.find({ athlete: athlete._id }).sort({ date: -1 }),
      Certificate.find({ athlete: athlete._id }).sort({ createdAt: -1 }).select('-signature'),
    ]);

    res.json({ success: true, registrations, achievements, certificates });
  } catch (err) {
    next(err);
  }
}

/** GET /api/athletes - organizer/admin: list all athletes (basic, non-sensitive info) */
async function listAthletes(req, res, next) {
  try {
    const athletes = await Athlete.find()
      .populate('user', 'name email role isActive')
      .populate('sports', 'name');
    const safe = athletes.map((a) => {
      const obj = a.toObject();
      delete obj.dateOfBirthEnc;
      delete obj.phoneEnc;
      delete obj.addressEnc;
      delete obj.governmentIdEnc;
      return obj;
    });
    res.json({ success: true, athletes: safe });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMyProfile, updateMyProfile, uploadPhoto, getMyHistory, listAthletes };
