/**
 * Hubs Routes - Hub management for logistics system
 * Handles CRUD operations for physical packing stations and fulfillment centers
 */

import express, { Request, Response } from 'express';
import { Hub } from '../models/hubs.model';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = express.Router();

// Get all hubs (admin only)
router.get('/', auth, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const hubs = await Hub.find().sort({ name: 1 });
    res.json({
      success: true,
      data: hubs
    });
  } catch (error) {
    console.error('Error fetching hubs:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch hubs', code: 'HUBS_FETCH_ERROR' }
    });
  }
});

// Get single hub
router.get('/:id', auth, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const hub = await Hub.findById(req.params.id);
    if (!hub) {
      res.status(404).json({
        success: false,
        error: { message: 'Hub not found', code: 'HUB_NOT_FOUND' }
      });
      return;
    }
    res.json({
      success: true,
      data: hub
    });
  } catch (error) {
    console.error('Error fetching hub:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch hub', code: 'HUB_FETCH_ERROR' }
    });
  }
});

// Create new hub
router.post('/', auth, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const hub = new Hub(req.body);
    await hub.save();
    res.status(201).json({
      success: true,
      data: hub
    });
  } catch (error) {
    console.error('Error creating hub:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create hub', code: 'HUB_CREATE_ERROR' }
    });
  }
});

// Update hub
router.put('/:id', auth, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const hub = await Hub.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!hub) {
      res.status(404).json({
        success: false,
        error: { message: 'Hub not found', code: 'HUB_NOT_FOUND' }
      });
      return;
    }
    res.json({
      success: true,
      data: hub
    });
  } catch (error) {
    console.error('Error updating hub:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update hub', code: 'HUB_UPDATE_ERROR' }
    });
  }
});

// Delete hub
router.delete('/:id', auth, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const hub = await Hub.findByIdAndDelete(req.params.id);
    if (!hub) {
      res.status(404).json({
        success: false,
        error: { message: 'Hub not found', code: 'HUB_NOT_FOUND' }
      });
      return;
    }
    res.json({
      success: true,
      message: 'Hub deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting hub:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete hub', code: 'HUB_DELETE_ERROR' }
    });
  }
});

export default router;
