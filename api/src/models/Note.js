const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    default: ''
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  isImportant: {
    type: Boolean,
    default: false,
    index: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  color: {
    type: String,
    default: '#ffffff'
  },
  dueDate: {
    type: Date,
    default: null
  },
  reminder: {
    type: Date,
    default: null
  },
  kanbanColumn: {
    type: String,
    enum: ['backlog', 'todo', 'in-progress', 'done'],
    default: 'backlog'
  },
  order: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

noteSchema.index({ userId: 1, isArchived: 1, isDeleted: 1 });
noteSchema.index({ userId: 1, isImportant: 1 });
noteSchema.index({ userId: 1, tags: 1 });

module.exports = mongoose.model('Note', noteSchema);
