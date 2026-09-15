const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getMyProfile,
  updateMyProfile,
  uploadPhoto,
  getMyHistory,
  listAthletes,
} = require('../controllers/athleteController');

const router = express.Router();

router.use(protect);

router.get('/me', authorize('athlete'), getMyProfile);
router.put('/me', authorize('athlete'), updateMyProfile);
router.post('/me/photo', authorize('athlete'), upload.single('photo'), uploadPhoto);
router.get('/me/history', authorize('athlete'), getMyHistory);

router.get('/', authorize('organizer', 'admin'), listAthletes);

module.exports = router;
