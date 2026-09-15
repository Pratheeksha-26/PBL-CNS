const Achievement = require('../models/Achievement');
const Athlete = require('../models/Athlete');

/** POST /api/achievements - organizer/admin adds an achievement record for an athlete */
async function createAchievement(req, res, next) {
  try {
    const { athleteId, resultId, title, description, level, date } = req.body;
    const achievement = await Achievement.create({
      athlete: athleteId,
      result: resultId || null,
      title,
      description,
      level,
      date,
    });
    res.status(201).json({ success: true, achievement });
  } catch (err) { next(err); }
}

/** GET /api/achievements/mine - athlete: own achievements */
async function getMyAchievements(req, res, next) {
  try {
    const athlete = await Athlete.findOne({ user: req.user._id });
    const achievements = await Achievement.find({ athlete: athlete._id }).sort({ date: -1 });
    res.json({ success: true, achievements });
  } catch (err) { next(err); }
}

/** GET /api/achievements/athlete/:athleteId - organizer/admin view */
async function getAthleteAchievements(req, res, next) {
  try {
    const achievements = await Achievement.find({ athlete: req.params.athleteId }).sort({ date: -1 });
    res.json({ success: true, achievements });
  } catch (err) { next(err); }
}

module.exports = { createAchievement, getMyAchievements, getAthleteAchievements };
