const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  registerForEvent,
  updateRegistrationStatus,
  getMyRegistrations,
} = require('../controllers/registrationController');

const router = express.Router();

router.post('/', protect, authorize('athlete'), registerForEvent);
router.get('/mine', protect, authorize('athlete'), getMyRegistrations);
router.put('/:id/status', protect, authorize('organizer', 'admin'), updateRegistrationStatus);

module.exports = router;
