const mongoose = require('mongoose');

const gamificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  points: {
    type: Number,
    default: 0
  },
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActiveDate: { type: String, default: null }
  },
  badges: [{
    id: String,
    name: String,
    earnedAt: { type: Date, default: Date.now }
  }],
  level: {
    type: Number,
    default: 1
  },
  stats: {
    totalNotes: { type: Number, default: 0 },
    totalGoals: { type: Number, default: 0 },
    completedGoals: { type: Number, default: 0 },
    totalTimerMinutes: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Gamification', gamificationSchema);
