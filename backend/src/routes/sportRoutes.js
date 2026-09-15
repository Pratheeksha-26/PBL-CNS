const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { listSports, createSport, updateSport, deleteSport } = require('../controllers/sportController');

const router = express.Router();

router.get('/', protect, listSports);
router.post('/', protect, authorize('organizer', 'admin'), createSport);
router.put('/:id', protect, authorize('organizer', 'admin'), updateSport);
router.delete('/:id', protect, authorize('admin'), deleteSport);

module.exports = router;
