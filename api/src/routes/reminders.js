const express = require('express');
const router = express.Router();
const { Reminder } = require('../models');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { upcoming, completed } = req.query;
    
    const filter = { userId: req.userId };
    if (completed === 'true') filter.isCompleted = true;
    else if (upcoming === 'true') filter.isCompleted = false;

    const reminders = await Reminder.find(filter)
      .populate('noteId', 'title')
      .sort({ dueDate: 1 });

    res.json({ reminders });
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { noteId, title, dueDate } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({ error: 'Title and due date are required' });
    }

    const reminder = new Reminder({
      userId: req.userId,
      noteId,
      title,
      dueDate: new Date(dueDate)
    });

    await reminder.save();
    res.status(201).json({ reminder });
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, dueDate, isCompleted, isNotified } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (isCompleted !== undefined) updateData.isCompleted = isCompleted;
    if (isNotified !== undefined) updateData.isNotified = isNotified;

    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true }
    );

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    res.json({ reminder });
  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({ error: 'Failed to update reminder' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    res.json({ message: 'Reminder deleted' });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

module.exports = router;
