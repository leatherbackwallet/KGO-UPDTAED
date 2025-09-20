/**
 * Users Routes - User management and administration
 * Handles user operations for admin users
 */

import express, { Request, Response } from 'express';
import { User } from '../models/users.model';
import { Role } from '../models/roles.model';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { validateAdminSession, logSecurityEvent, adminRateLimit } from '../middleware/apiSecurity';

const router = express.Router();

// Get all users (admin only)
router.get('/', auth, requireRole('admin'), validateAdminSession, adminRateLimit, logSecurityEvent('USER_LIST_ACCESS'), async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find({}, '-password').populate('roleId');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Grant admin
router.put('/:id/grant', auth, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    // Find the admin role first
    const adminRole = await Role.findOne({ name: 'admin' });
    if (!adminRole) {
      res.status(500).json({ message: 'Admin role not found' });
      return;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { roleId: adminRole._id },
      { new: true }
    );
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ message: 'Admin granted', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Revoke admin
router.put('/:id/revoke', auth, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    // Find the customer role first
    const customerRole = await Role.findOne({ name: 'customer' });
    if (!customerRole) {
      res.status(500).json({ message: 'Customer role not found' });
      return;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { roleId: customerRole._id },
      { new: true }
    );
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ message: 'Admin revoked', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
