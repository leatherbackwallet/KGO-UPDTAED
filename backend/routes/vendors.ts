/**
 * Vendors Routes - Vendor management and operations
 * Handles vendor listing and management for admin users
 */

import express, { Request, Response } from 'express';
import { Vendor } from '../models/vendors.model';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = express.Router();

// GET /api/vendors - Get all active vendors
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const vendors = await Vendor.find({ status: 'active' }).select('storeName _id');
    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch vendors', code: 'FETCH_ERROR' } });
  }
});

// GET /api/vendors/all - Get all vendors (admin only)
router.get('/all', auth, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const vendors = await Vendor.find().select('storeName _id status');
    res.json(vendors);
  } catch (error) {
    console.error('Error fetching all vendors:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch vendors', code: 'FETCH_ERROR' } });
  }
});

export default router;
