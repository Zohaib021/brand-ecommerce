const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/users  ← admin dashboard customers count
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/stats  ← admin dashboard stats card
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const total = await User.countDocuments();
    res.json({ total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;