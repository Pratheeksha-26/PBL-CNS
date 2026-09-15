const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    athlete: { type: mongoose.Schema.Types.ObjectId, ref: 'Athlete', required: true },
    result: { type: mongoose.Schema.Types.ObjectId, ref: 'Result', default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    level: {
      type: String,
      enum: ['school', 'district', 'state', 'national', 'international'],
      default: 'state',
    },
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Achievement', achievementSchema);
