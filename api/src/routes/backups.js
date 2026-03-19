const express = require('express');
const router = express.Router();
const { Backup, Note, Tag, Goal, Activity } = require('../models');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.get('/export', async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.userId, isDeleted: false });
    const tags = await Tag.find({ userId: req.userId });
    const goals = await Goal.find({ userId: req.userId });
    const activities = await Activity.find({ userId: req.userId });

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        notes,
        tags,
        goals,
        activities
      }
    };

    const backup = new Backup({
      userId: req.userId,
      data: exportData,
      description: 'Manual export'
    });
    await backup.save();

    res.json({ data: exportData });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

router.post('/import', async (req, res) => {
  try {
    const { notes, tags, goals, activities } = req.body;

    if (tags && tags.length > 0) {
      await Tag.deleteMany({ userId: req.userId });
      const tagsToInsert = tags.map(t => ({ ...t, userId: req.userId, _id: undefined }));
      await Tag.insertMany(tagsToInsert);
    }

    if (notes && notes.length > 0) {
      await Note.deleteMany({ userId: req.userId });
      const notesToInsert = notes.map(n => ({ ...n, userId: req.userId, _id: undefined }));
      await Note.insertMany(notesToInsert);
    }

    if (goals && goals.length > 0) {
      await Goal.deleteMany({ userId: req.userId });
      const goalsToInsert = goals.map(g => ({ ...g, userId: req.userId, _id: undefined }));
      await Goal.insertMany(goalsToInsert);
    }

    const backup = new Backup({
      userId: req.userId,
      data: req.body,
      description: 'Import backup'
    });
    await backup.save();

    res.json({ message: 'Import successful' });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import data' });
  }
});

router.get('/history', async (req, res) => {
  try {
    const backups = await Backup.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('_id description createdAt');

    res.json({ backups });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to fetch backup history' });
  }
});

module.exports = router;
