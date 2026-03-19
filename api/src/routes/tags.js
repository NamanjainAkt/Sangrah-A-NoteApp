const express = require('express');
const router = express.Router();
const { Tag } = require('../models');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const tags = await Tag.find({ userId: req.userId }).sort({ name: 1 });
    res.json({ tags });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const existingTag = await Tag.findOne({ userId: req.userId, name });
    if (existingTag) {
      return res.status(409).json({ error: 'Tag already exists' });
    }

    const tag = new Tag({
      userId: req.userId,
      name,
      color: color || '#3b82f6'
    });

    await tag.save();
    res.status(201).json({ tag });
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, color } = req.body;

    const tag = await Tag.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name, color },
      { new: true, runValidators: true }
    );

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json({ tag });
  } catch (error) {
    console.error('Update tag error:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const tag = await Tag.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json({ message: 'Tag deleted', tag });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

module.exports = router;
