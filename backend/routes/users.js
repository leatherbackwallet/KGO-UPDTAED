const express = require('express');
const router = express.Router();
const { User } = require('../models/users.model.ts');
const { Role } = require('../models/roles.model.ts');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Get all users (admin only)
router.get('/', auth, role('admin'), async (req, res) => {
  try {
    const users = await User.find({}, '-password').populate('roleId');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Grant admin
router.put('/:id/grant', auth, role('admin'), async (req, res) => {
  try {
    const adminRole = await Role.findOne({ name: 'admin' });
    if (!adminRole) return res.status(500).json({ message: 'Admin role not found' });
    
    const user = await User.findByIdAndUpdate(req.params.id, { roleId: adminRole._id }, { new: true }).populate('roleId');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Revoke admin
router.put('/:id/revoke', auth, role('admin'), async (req, res) => {
  try {
    const customerRole = await Role.findOne({ name: 'customer' });
    if (!customerRole) return res.status(500).json({ message: 'Customer role not found' });
    
    const user = await User.findByIdAndUpdate(req.params.id, { roleId: customerRole._id }, { new: true }).populate('roleId');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 