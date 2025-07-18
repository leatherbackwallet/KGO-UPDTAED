const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Get all users (admin only)
router.get('/', auth, role('Admin'), async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Grant admin
router.put('/:id/grant', auth, role('Admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: 'Admin' }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Revoke admin
router.put('/:id/revoke', auth, role('Admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: 'Customer' }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 