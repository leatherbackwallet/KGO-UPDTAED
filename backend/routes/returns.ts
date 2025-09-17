/**
 * Returns Routes - Return Merchandise Authorization (RMA) management
 * Handles the complete return workflow from request to resolution
 */

import express, { Request, Response } from 'express';
import { Return } from '../models/returns.model';
import { Order } from '../models/orders.model';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = express.Router();

// Get all returns (admin/support only)
router.get('/', auth, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    let query: any = {};
    if (status) {
      query.status = status;
    }

    const returns = await Return.find(query)
      .populate('orderId', 'orderNumber totalAmount')
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Return.countDocuments(query);

    res.json({
      success: true,
      data: returns,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching returns:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch returns', code: 'RETURNS_FETCH_ERROR' }
    });
  }
});

// Get single return
router.get('/:id', auth, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const returnRequest = await Return.findById(req.params.id)
      .populate('orderId')
      .populate('userId', 'firstName lastName email phone');

    if (!returnRequest) {
      res.status(404).json({
        success: false,
        error: { message: 'Return request not found', code: 'RETURN_NOT_FOUND' }
      });
      return;
    }

    res.json({
      success: true,
      data: returnRequest
    });
  } catch (error) {
    console.error('Error fetching return:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch return', code: 'RETURN_FETCH_ERROR' }
    });
  }
});

// Create return request
router.post('/', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, reason, items, description } = req.body;
    
    // Validate order exists and belongs to user
    const order = await Order.findOne({ 
      _id: orderId, 
      userId: (req as any).user.id 
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: { message: 'Order not found', code: 'ORDER_NOT_FOUND' }
      });
      return;
    }

    const returnRequest = new Return({
      orderId,
      userId: (req as any).user.id,
      reason,
      items,
      description,
      status: 'pending'
    });

    await returnRequest.save();

    res.status(201).json({
      success: true,
      data: returnRequest,
      message: 'Return request created successfully'
    });
  } catch (error) {
    console.error('Error creating return request:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create return request', code: 'RETURN_CREATE_ERROR' }
    });
  }
});

// Update return status (admin only)
router.put('/:id/status', auth, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, notes } = req.body;
    
    const returnRequest = await Return.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        adminNotes: notes,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!returnRequest) {
      res.status(404).json({
        success: false,
        error: { message: 'Return request not found', code: 'RETURN_NOT_FOUND' }
      });
      return;
    }

    res.json({
      success: true,
      data: returnRequest,
      message: 'Return status updated successfully'
    });
  } catch (error) {
    console.error('Error updating return status:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update return status', code: 'RETURN_UPDATE_ERROR' }
    });
  }
});

// Process return (admin only)
router.post('/:id/process', auth, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, refundAmount, notes } = req.body;
    
    const returnRequest = await Return.findByIdAndUpdate(
      req.params.id,
      { 
        status: action === 'approve' ? 'approved' : 'rejected',
        refundAmount: action === 'approve' ? refundAmount : 0,
        adminNotes: notes,
        processedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!returnRequest) {
      res.status(404).json({
        success: false,
        error: { message: 'Return request not found', code: 'RETURN_NOT_FOUND' }
      });
      return;
    }

    res.json({
      success: true,
      data: returnRequest,
      message: `Return ${action === 'approve' ? 'approved' : 'rejected'} successfully`
    });
  } catch (error) {
    console.error('Error processing return:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to process return', code: 'RETURN_PROCESS_ERROR' }
    });
  }
});

export default router;
