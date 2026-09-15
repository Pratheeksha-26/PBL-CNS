const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventRegistrations,
} = require('../controllers/eventController');

const router = express.Router();

router.get('/', protect, listEvents);
router.get('/:id', protect, getEvent);
router.post('/', protect, authorize('organizer', 'admin'), createEvent);
router.put('/:id', protect, authorize('organizer', 'admin'), updateEvent);
router.delete('/:id', protect, authorize('organizer', 'admin'), deleteEvent);
router.get('/:id/registrations', protect, authorize('organizer', 'admin'), getEventRegistrations);

module.exports = router;
