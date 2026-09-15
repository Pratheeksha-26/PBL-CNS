const Registration = require('../models/Registration');
const Athlete = require('../models/Athlete');
const Event = require('../models/Event');

/** POST /api/registrations - athlete registers for an event */
async function registerForEvent(req, res, next) {
  try {
    const { eventId } = req.body;
    const athlete = await Athlete.findOne({ user: req.user._id });
    if (!athlete) return res.status(404).json({ success: false, message: 'Athlete profile not found' });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const existing = await Registration.findOne({ athlete: athlete._id, event: eventId });
    if (existing) return res.status(409).json({ success: false, message: 'Already registered for this event' });

    const registration = await Registration.create({ athlete: athlete._id, event: eventId });
    res.status(201).json({ success: true, registration });
  } catch (err) { next(err); }
}

/** PUT /api/registrations/:id/status - organizer/admin approves or rejects */
async function updateRegistrationStatus(req, res, next) {
  try {
    const { status } = req.body; // 'approved' | 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }
    const registration = await Registration.findById(req.params.id).populate('event');
    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });

    if (req.user.role !== 'admin' && String(registration.event.organizer) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this event' });
    }

    registration.status = status;
    registration.approvedBy = req.user._id;
    await registration.save();
    res.json({ success: true, registration });
  } catch (err) { next(err); }
}

/** GET /api/registrations/mine - athlete: own registrations */
async function getMyRegistrations(req, res, next) {
  try {
    const athlete = await Athlete.findOne({ user: req.user._id });
    const registrations = await Registration.find({ athlete: athlete._id }).populate({
      path: 'event',
      populate: { path: 'sport' },
    });
    res.json({ success: true, registrations });
  } catch (err) { next(err); }
}

module.exports = { registerForEvent, updateRegistrationStatus, getMyRegistrations };
