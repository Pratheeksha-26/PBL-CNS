const Sport = require('../models/Sport');

async function listSports(req, res, next) {
  try {
    const sports = await Sport.find().sort({ name: 1 });
    res.json({ success: true, sports });
  } catch (err) { next(err); }
}

async function createSport(req, res, next) {
  try {
    const { name, category, description } = req.body;
    const sport = await Sport.create({ name, category, description });
    res.status(201).json({ success: true, sport });
  } catch (err) { next(err); }
}

async function updateSport(req, res, next) {
  try {
    const sport = await Sport.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!sport) return res.status(404).json({ success: false, message: 'Sport not found' });
    res.json({ success: true, sport });
  } catch (err) { next(err); }
}

async function deleteSport(req, res, next) {
  try {
    const sport = await Sport.findByIdAndDelete(req.params.id);
    if (!sport) return res.status(404).json({ success: false, message: 'Sport not found' });
    res.json({ success: true, message: 'Sport deleted' });
  } catch (err) { next(err); }
}

module.exports = { listSports, createSport, updateSport, deleteSport };
