const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { createResult, getResultsByEvent } = require('../controllers/resultController');

const router = express.Router();

router.post('/', protect, authorize('organizer', 'admin'), createResult);
router.get('/event/:eventId', protect, authorize('organizer', 'admin'), getResultsByEvent);

module.exports = router;
