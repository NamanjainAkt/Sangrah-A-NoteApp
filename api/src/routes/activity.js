const express = require('express');
const router = express.Router();
const { Activity, Gamification } = require('../models');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = { userId: req.userId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    const activities = await Activity.find(filter)
      .sort({ date: -1 })
      .limit(365);

    res.json({ activities });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

router.get('/heatmap', async (req, res) => {
  try {
    const { year } = req.query;
    
    const startDate = `${year || new Date().getFullYear()}-01-01`;
    const endDate = `${year || new Date().getFullYear()}-12-31`;

    const activities = await Activity.find({
      userId: req.userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    res.json({ activities });
  } catch (error) {
    console.error('Get heatmap error:', error);
    res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { action, minutes, points } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const updateObj = { $set: { updatedAt: new Date() } };
    if (action === 'timer' && minutes) {
      updateObj.$inc = { 'actions.timerMinutes': minutes, totalPoints: points || 0 };
    } else {
      updateObj.$inc = { totalPoints: points || 10 };
    }

    const activity = await Activity.findOneAndUpdate(
      { userId: req.userId, date: today },
      updateObj,
      { upsert: true, new: true }
    );

    if (minutes) {
      await Gamification.findOneAndUpdate(
        { userId: req.userId },
        { $inc: { 'stats.totalTimerMinutes': minutes } }
      );
    }

    res.json({ activity });
  } catch (error) {
    console.error('Log activity error:', error);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

module.exports = router;
