const express = require('express');
const router = express.Router();
const { Gamification } = require('../models');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    let gamification = await Gamification.findOne({ userId: req.userId });

    if (!gamification) {
      gamification = await Gamification.create({
        userId: req.userId,
        points: 0,
        streak: { current: 0, longest: 0, lastActiveDate: null },
        badges: [],
        level: 1,
        stats: {
          totalNotes: 0,
          totalGoals: 0,
          completedGoals: 0,
          totalTimerMinutes: 0
        }
      });
    }

    const levelPoints = gamification.level * 100;
    const progressToNextLevel = (gamification.points % levelPoints) / levelPoints * 100;

    res.json({
      gamification: {
        ...gamification.toObject(),
        progressToNextLevel,
        pointsToNextLevel: levelPoints - (gamification.points % levelPoints)
      }
    });
  } catch (error) {
    console.error('Get gamification error:', error);
    res.status(500).json({ error: 'Failed to fetch gamification data' });
  }
});

router.put('/', async (req, res) => {
  try {
    const { points, badges, streak } = req.body;

    const updateObj = {};
    if (points !== undefined) updateObj.points = points;
    if (badges !== undefined) updateObj.badges = badges;
    if (streak !== undefined) updateObj.streak = streak;

    const gamification = await Gamification.findOneAndUpdate(
      { userId: req.userId },
      { ...updateObj, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    res.json({ gamification });
  } catch (error) {
    console.error('Update gamification error:', error);
    res.status(500).json({ error: 'Failed to update gamification' });
  }
});

module.exports = router;
