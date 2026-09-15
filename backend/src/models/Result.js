const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    registration: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true },
    athlete: { type: mongoose.Schema.Types.ObjectId, ref: 'Athlete', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    position: { type: String, default: '' }, // e.g. "1st Place", "Gold Medal"
    scoreOrTime: { type: String, default: '' },
    remarks: { type: String, default: '' },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Result', resultSchema);
