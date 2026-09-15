const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createAchievement,
  getMyAchievements,
  getAthleteAchievements,
} = require('../controllers/achievementController');

const router = express.Router();

router.post('/', protect, authorize('organizer', 'admin'), createAchievement);
router.get('/mine', protect, authorize('athlete'), getMyAchievements);
router.get('/athlete/:athleteId', protect, authorize('organizer', 'admin'), getAthleteAchievements);

module.exports = router;
