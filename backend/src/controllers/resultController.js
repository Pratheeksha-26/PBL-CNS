const Result = require('../models/Result');
const Registration = require('../models/Registration');

/** POST /api/results - organizer/admin records a result for an approved registration */
async function createResult(req, res, next) {
  try {
    const { registrationId, position, scoreOrTime, remarks } = req.body;
    const registration = await Registration.findById(registrationId).populate('event');
    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });
    if (registration.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Only approved registrations can have results recorded' });
    }
    if (req.user.role !== 'admin' && String(registration.event.organizer) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this event' });
    }

    const result = await Result.create({
      registration: registration._id,
      athlete: registration.athlete,
      event: registration.event._id,
      position,
      scoreOrTime,
      remarks,
      recordedBy: req.user._id,
    });

    res.status(201).json({ success: true, result });
  } catch (err) { next(err); }
}

/** GET /api/results/event/:eventId - organizer/admin: results for an event */
async function getResultsByEvent(req, res, next) {
  try {
    const results = await Result.find({ event: req.params.eventId }).populate({
      path: 'athlete',
      populate: { path: 'user', select: 'name email' },
    });
    res.json({ success: true, results });
  } catch (err) { next(err); }
}

module.exports = { createResult, getResultsByEvent };
