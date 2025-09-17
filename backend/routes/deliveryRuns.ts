/**
 * Delivery Runs Routes - Advanced logistics management
 * Handles delivery run planning, execution, and tracking for hyperlocal delivery
 */

import express, { Request, Response } from 'express';
import { DeliveryRun } from '../models/deliveryRuns.model';
import { Order } from '../models/orders.model';
import { Hub } from '../models/hubs.model';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = express.Router();

// Get all delivery runs (admin and delivery agents)
router.get('/', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, deliveryAgentId, date } = req.query;
    const filter: any = {};
    
    // Filter by status
    if (status) {
      filter.status = status;
    }
    
    // Filter by delivery agent
    if (deliveryAgentId) {
      filter.deliveryAgentId = deliveryAgentId;
    }
    
    // Filter by date
    if (date) {
      const startDate = new Date(date as string);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      filter.scheduledDate = {
        $gte: startDate,
        $lt: endDate
      };
    }

    const deliveryRuns = await DeliveryRun.find(filter)
      .populate('orders')
      .populate('hubId', 'name address')
      .sort({ scheduledDate: -1 });

    res.json({
      success: true,
      data: deliveryRuns
    });
  } catch (error) {
    console.error('Error fetching delivery runs:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch delivery runs', code: 'DELIVERY_RUNS_FETCH_ERROR' }
    });
  }
});

// Get single delivery run
router.get('/:id', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const deliveryRun = await DeliveryRun.findById(req.params.id)
      .populate('orders')
      .populate('hubId', 'name address')
      .populate('deliveryAgentId', 'firstName lastName phone');

    if (!deliveryRun) {
      res.status(404).json({
        success: false,
        error: { message: 'Delivery run not found', code: 'DELIVERY_RUN_NOT_FOUND' }
      });
      return;
    }

    res.json({
      success: true,
      data: deliveryRun
    });
  } catch (error) {
    console.error('Error fetching delivery run:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch delivery run', code: 'DELIVERY_RUN_FETCH_ERROR' }
    });
  }
});

// Create new delivery run
router.post('/', auth, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const deliveryRun = new DeliveryRun(req.body);
    await deliveryRun.save();
    
    res.status(201).json({
      success: true,
      data: deliveryRun
    });
  } catch (error) {
    console.error('Error creating delivery run:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create delivery run', code: 'DELIVERY_RUN_CREATE_ERROR' }
    });
  }
});

// Update delivery run
router.put('/:id', auth, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const deliveryRun = await DeliveryRun.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!deliveryRun) {
      res.status(404).json({
        success: false,
        error: { message: 'Delivery run not found', code: 'DELIVERY_RUN_NOT_FOUND' }
      });
      return;
    }

    res.json({
      success: true,
      data: deliveryRun
    });
  } catch (error) {
    console.error('Error updating delivery run:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update delivery run', code: 'DELIVERY_RUN_UPDATE_ERROR' }
    });
  }
});

// Start delivery run
router.post('/:id/start', auth, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const deliveryRun = await DeliveryRun.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'in_progress',
        actualStartTime: new Date()
      },
      { new: true }
    );

    if (!deliveryRun) {
      res.status(404).json({
        success: false,
        error: { message: 'Delivery run not found', code: 'DELIVERY_RUN_NOT_FOUND' }
      });
      return;
    }

    res.json({
      success: true,
      data: deliveryRun,
      message: 'Delivery run started successfully'
    });
  } catch (error) {
    console.error('Error starting delivery run:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to start delivery run', code: 'DELIVERY_RUN_START_ERROR' }
    });
  }
});

// Complete delivery run
router.post('/:id/complete', auth, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const deliveryRun = await DeliveryRun.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'completed',
        actualEndTime: new Date()
      },
      { new: true }
    );

    if (!deliveryRun) {
      res.status(404).json({
        success: false,
        error: { message: 'Delivery run not found', code: 'DELIVERY_RUN_NOT_FOUND' }
      });
      return;
    }

    res.json({
      success: true,
      data: deliveryRun,
      message: 'Delivery run completed successfully'
    });
  } catch (error) {
    console.error('Error completing delivery run:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to complete delivery run', code: 'DELIVERY_RUN_COMPLETE_ERROR' }
    });
  }
});

export default router;
