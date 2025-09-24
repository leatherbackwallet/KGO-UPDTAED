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


export default router;
