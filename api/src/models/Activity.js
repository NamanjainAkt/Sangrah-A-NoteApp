const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: String,
    required: true
  },
  actions: {
    notesCreated: { type: Number, default: 0 },
    notesEdited: { type: Number, default: 0 },
    notesDeleted: { type: Number, default: 0 },
    goalsCompleted: { type: Number, default: 0 },
    tagsCreated: { type: Number, default: 0 },
    timerMinutes: { type: Number, default: 0 }
  },
  totalPoints: {
    type: Number,
    default: 0
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

activitySchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Activity', activitySchema);
