const express = require('express');
const router = express.Router();
const { Goal, Activity, Gamification } = require('../models');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { status, type } = req.query;
    
    const filter = { userId: req.userId };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const goals = await Goal.find(filter)
      .sort({ createdAt: -1 });

    res.json({ goals });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ goal });
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, type, target, endDate } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Goal title is required' });
    }

    const goal = new Goal({
      userId: req.userId,
      title,
      description: description || '',
      type: type || 'daily',
      target: target || 1,
      current: 0,
      status: 'active',
      endDate
    });

    await goal.save();

    await Gamification.findOneAndUpdate(
      { userId: req.userId },
      { $inc: { 'stats.totalGoals': 1 } }
    );

    res.status(201).json({ goal });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ goal });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

router.put('/:id/increment', async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    goal.current += 1;
    if (goal.current >= goal.target) {
      goal.status = 'completed';
      goal.completedAt = new Date();

      await Activity.findOneAndUpdate(
        { userId: req.userId, date: new Date().toISOString().split('T')[0] },
        { $inc: { 'actions.goalsCompleted': 1, totalPoints: 50 } },
        { upsert: true }
      );

      await Gamification.findOneAndUpdate(
        { userId: req.userId },
        {
          $inc: { 'stats.completedGoals': 1, points: 50 },
          $set: { updatedAt: new Date() }
        }
      );
    }

    goal.updatedAt = new Date();
    await goal.save();

    res.json({ goal });
  } catch (error) {
    console.error('Increment goal error:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ message: 'Goal deleted', goal });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

module.exports = router;
