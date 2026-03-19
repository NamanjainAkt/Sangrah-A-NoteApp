const express = require('express');
const router = express.Router();
const { Note, Activity } = require('../models');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { archive, important, deleted, tag } = req.query;
    
    const filter = { userId: req.userId };

    if (archive === 'true') filter.isArchived = true;
    else filter.isArchived = false;

    if (important === 'true') filter.isImportant = true;
    if (deleted === 'true') filter.isDeleted = true;
    else if (deleted !== 'true') filter.isDeleted = false;

    if (tag) filter.tags = tag;

    const notes = await Note.find(filter)
      .populate('tags', 'name color')
      .sort({ isPinned: -1, order: 1, createdAt: -1 });

    res.json({ notes });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.userId
    }).populate('tags', 'name color');

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ note });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      title,
      content,
      tags,
      isPinned,
      color,
      dueDate,
      reminder,
      kanbanColumn,
      order
    } = req.body;

    const note = new Note({
      userId: req.userId,
      title,
      content,
      tags,
      isPinned: isPinned || false,
      color: color || '#ffffff',
      dueDate,
      reminder,
      kanbanColumn: kanbanColumn || 'backlog',
      order: order || 0
    });

    await note.save();
    await note.populate('tags', 'name color');

    await Activity.findOneAndUpdate(
      { userId: req.userId, date: new Date().toISOString().split('T')[0] },
      { $inc: { 'actions.notesCreated': 1, totalPoints: 10 } },
      { upsert: true }
    );

    res.status(201).json({ note });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('tags', 'name color');

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    await Activity.findOneAndUpdate(
      { userId: req.userId, date: new Date().toISOString().split('T')[0] },
      { $inc: { 'actions.notesEdited': 1, totalPoints: 5 } },
      { upsert: true }
    );

    res.json({ note });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isDeleted: true, updatedAt: new Date() },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ message: 'Note moved to bin', note });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

router.delete('/:id/permanent', async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    await Activity.findOneAndUpdate(
      { userId: req.userId, date: new Date().toISOString().split('T')[0] },
      { $inc: { 'actions.notesDeleted': 1 } },
      { upsert: true }
    );

    res.json({ message: 'Note permanently deleted' });
  } catch (error) {
    console.error('Permanent delete error:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

router.put('/:id/restore', async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isDeleted: false, updatedAt: new Date() },
      { new: true }
    ).populate('tags', 'name color');

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ note });
  } catch (error) {
    console.error('Restore note error:', error);
    res.status(500).json({ error: 'Failed to restore note' });
  }
});

module.exports = router;
