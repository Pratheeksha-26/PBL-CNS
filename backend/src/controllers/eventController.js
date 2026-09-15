const Event = require('../models/Event');
const Registration = require('../models/Registration');

/** GET /api/events - public list (any authenticated user) */
async function listEvents(req, res, next) {
  try {
    const events = await Event.find().populate('sport', 'name category').populate('organizer', 'name email').sort({ eventDate: -1 });
    res.json({ success: true, events });
  } catch (err) { next(err); }
}

async function getEvent(req, res, next) {
  try {
    const event = await Event.findById(req.params.id).populate('sport').populate('organizer', 'name email');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, event });
  } catch (err) { next(err); }
}

/** POST /api/events - organizer/admin only */
async function createEvent(req, res, next) {
  try {
    const { name, sport, description, venue, eventDate, registrationDeadline } = req.body;
    const event = await Event.create({
      name,
      sport,
      description,
      venue,
      eventDate,
      registrationDeadline,
      organizer: req.user._id,
    });
    res.status(201).json({ success: true, event });
  } catch (err) { next(err); }
}

/** PUT /api/events/:id - organizer (own events) or admin */
async function updateEvent(req, res, next) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (req.user.role !== 'admin' && String(event.organizer) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only edit your own events' });
    }
    Object.assign(event, req.body);
    await event.save();
    res.json({ success: true, event });
  } catch (err) { next(err); }
}

async function deleteEvent(req, res, next) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (req.user.role !== 'admin' && String(event.organizer) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only delete your own events' });
    }
    await event.deleteOne();
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) { next(err); }
}

/** GET /api/events/:id/registrations - organizer/admin: view registrations for an event */
async function getEventRegistrations(req, res, next) {
  try {
    const registrations = await Registration.find({ event: req.params.id })
      .populate({ path: 'athlete', populate: { path: 'user', select: 'name email' } });
    res.json({ success: true, registrations });
  } catch (err) { next(err); }
}

module.exports = { listEvents, getEvent, createEvent, updateEvent, deleteEvent, getEventRegistrations };
