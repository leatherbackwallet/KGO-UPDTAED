/**
 * Orders Routes - Order management for customers and admins
 * Supports guest checkout and order tracking
 */

import express from 'express';
import { Order, Product } from '../models/index';
import { ensureDatabaseConnection } from '../middleware/database';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { calculateComboPrice } from '../utils/comboUtils';

const router = express.Router();

// Create order (customer)
router.post('/', auth, ensureDatabaseConnection, async (req: any, res) => {
  try {
    const { products, recipientAddress, deliveryAddress, shippingAddress, paymentMethod } = req.body;
    
    // Use recipientAddress if provided, otherwise fall back to other address formats
    const address = recipientAddress || deliveryAddress || shippingAddress;
    
    if (!address) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'Recipient address is required', code: 'MISSING_ADDRESS' } 
      });
    }
    
    // Calculate total and prepare order items
    let totalPrice = 0;
    const orderItems = [];
    
    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ 
          success: false, 
          error: { message: 'Product not found', code: 'PRODUCT_NOT_FOUND' } 
        });
      }

      let itemPrice: number;
      let orderItemData: any = {
        productId: item.product,
        quantity: item.quantity,
        isCombo: false,
        comboBasePrice: 0,
        comboItemConfigurations: []
      };

      // Handle combo products
      if (product.isCombo && item.isCombo) {
        // Validate combo configuration
        if (!item.comboItemConfigurations || !Array.isArray(item.comboItemConfigurations)) {
          return res.status(400).json({
            success: false,
            error: {
              message: `Combo product ${product.name} requires comboItemConfigurations`,
              code: 'MISSING_COMBO_CONFIG'
            }
          });
        }

        // Validate combo base price matches
        if (item.comboBasePrice !== product.comboBasePrice) {
          return res.status(400).json({
            success: false,
            error: {
              message: `Combo base price mismatch for product ${product.name}`,
              code: 'COMBO_PRICE_MISMATCH'
            }
          });
        }

        // Recalculate combo price server-side
        itemPrice = calculateComboPrice(product.comboBasePrice || 0, item.comboItemConfigurations);

        // Store combo configuration
        orderItemData.isCombo = true;
        orderItemData.comboBasePrice = product.comboBasePrice || 0;
        orderItemData.comboItemConfigurations = item.comboItemConfigurations;
        orderItemData.price = itemPrice;
      } else if (product.isCombo && !item.isCombo) {
        // Combo product but not sent as combo - use base price
        itemPrice = product.comboBasePrice || 0;
        orderItemData.price = itemPrice;
      } else {
        // Regular product
        itemPrice = product.price;
        orderItemData.price = itemPrice;
      }

      const itemTotal = itemPrice * item.quantity;
      totalPrice += itemTotal;
      orderItems.push(orderItemData);
    }
    
    // Prepare shipping details - handle both new recipientAddress format and legacy formats
    const shippingDetails = {
      recipientName: address.name || `${req.user.firstName} ${req.user.lastName}`,
      recipientPhone: address.phone || req.user.phone,
      address: {
        streetName: address.address?.streetName || address.street || address.streetName,
        houseNumber: address.address?.houseNumber || address.houseNumber || '',
        postalCode: address.address?.postalCode || address.postalCode || address.zipCode,
        city: address.address?.city || address.city,
        countryCode: address.address?.countryCode || address.countryCode || address.country || 'DE'
      },
      specialInstructions: address.additionalInstructions || address.specialInstructions || ''
    };
    
    // Create order
    const order = await Order.create({
      userId: req.user.id,
      requestedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      shippingDetails,
      orderItems,
      totalPrice,
      orderStatus: 'payment_done',
      statusHistory: [{
        status: 'payment_done',
        timestamp: new Date(),
        notes: 'Order created and payment received'
      }]
    });
    
    return res.status(201).json({
      success: true,
      data: {
        message: 'Order created successfully',
        order: {
          id: order._id,
          orderId: order.orderId,
          totalPrice: order.totalPrice,
          orderStatus: order.orderStatus
        }
      }
    });
  } catch (err) {
    console.error('Order creation error:', err);
    return res.status(500).json({ 
      success: false, 
      error: { message: 'Server error', code: 'SERVER_ERROR' } 
    });
  }
});

// Get order by ID with comprehensive transaction details
router.get('/:orderId', auth, ensureDatabaseConnection, async (req: any, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate('userId', 'firstName lastName email phone')
      .populate('orderItems.productId', 'name description images categories price')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found', code: 'ORDER_NOT_FOUND' }
      });
    }

    // Check if user can access this order (own order or admin)
    const userId = typeof order.userId === 'string' ? order.userId : order.userId._id.toString();
    if (userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied', code: 'ACCESS_DENIED' }
      });
    }

    // Format order with comprehensive transaction details
    const formattedOrder = {
      ...order,
      transactionSummary: {
        orderId: order.orderId,
        transactionId: order.transactionId,
        razorpayPaymentId: order.razorpayPaymentId,
        razorpayOrderId: order.razorpayOrderId,
        paymentMethod: order.paymentMethod,
        paymentGateway: order.paymentGateway,
        currency: order.currency,
        amountPaid: order.amountPaid,
        amountRefunded: order.amountRefunded,
        refundStatus: order.refundStatus,
        paymentStatus: order.paymentStatus,
        paymentDate: order.paymentDate,
        paymentVerifiedAt: order.paymentVerifiedAt,
        webhookReceived: order.webhookReceived,
        webhookEvents: order.webhookEvents,
        failureReason: order.failureReason
      }
    };

    res.status(200).json({
      success: true,
      data: { order: formattedOrder }
    });
  } catch (err: any) {
    console.error('Error fetching order details:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Server error', code: 'SERVER_ERROR' }
    });
  }
});

// Generate PDF receipt for order
router.get('/:orderId/receipt', auth, ensureDatabaseConnection, async (req: any, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate('userId', 'firstName lastName email phone')
      .populate('orderItems.productId', 'name description images categories price')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found', code: 'ORDER_NOT_FOUND' }
      });
    }

    // Check if user can access this order (own order or admin)
    const userId = typeof order.userId === 'string' ? order.userId : order.userId._id.toString();
    if (userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied', code: 'ACCESS_DENIED' }
      });
    }

    // Import PDF service dynamically to avoid circular dependencies
    const PDFService = (await import('../services/pdf.service')).default;
    
    // Generate PDF
    const pdfBuffer = await PDFService.generateOrderReceipt({
      order: order as any,
      companyInfo: {
        name: 'OnYourBehlf - Kerala Gifts Online',
        address: 'Kerala, India',
        phone: '+91-XXXXXXXXXX',
        email: 'info@keralgiftsonline.in',
        website: 'https://keralgiftsonline.in'
      }
    });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${order.orderId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (err: any) {
    console.error('Error generating PDF receipt:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to generate PDF receipt', code: 'PDF_GENERATION_ERROR' }
    });
  }
});

// Get all orders (admin)
router.get('/', auth, requireRole('admin'), ensureDatabaseConnection, async (req: any, res) => {
  try {
    const orders = await Order.find({ isDeleted: false })
      .populate('userId', 'firstName lastName email phone')
      .populate({
        path: 'orderItems.productId',
        select: 'name price images description categories',
        populate: {
          path: 'categories',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });
    return res.json(orders || []);
  } catch (err) {
    console.error('Error fetching orders:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get my orders (customer)
router.get('/my', auth, ensureDatabaseConnection, async (req: any, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id, isDeleted: false })
      .populate({
        path: 'orderItems.productId',
        select: 'name price images description categories',
        populate: {
          path: 'categories',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });
    return res.json(orders || []);
  } catch (err) {
    console.error('Error fetching user orders:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Update order status with timeline tracking (admin)
router.put('/:id/status', auth, requireRole('admin'), ensureDatabaseConnection, async (req: any, res) => {
  try {
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: { message: 'Status is required', code: 'MISSING_STATUS' }
      });
    }

    // Validate status
    const validStatuses = ['payment_done', 'order_received', 'collecting_items', 'packing', 'en_route', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid status', code: 'INVALID_STATUS' }
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found', code: 'ORDER_NOT_FOUND' }
      });
    }

    // Update order status and add to history
    order.orderStatus = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      notes: notes || '',
      updatedBy: req.user.id
    });

    await order.save();

    // Populate and return updated order
    const updatedOrder = await Order.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone')
      .populate({
        path: 'orderItems.productId',
        select: 'name price images description categories',
        populate: {
          path: 'categories',
          select: 'name'
        }
      });

    return res.json({
      success: true,
      data: {
        message: 'Order status updated successfully',
        order: updatedOrder
      }
    });
  } catch (err) {
    console.error('Error updating order status:', err);
    return res.status(500).json({
      success: false,
      error: { message: 'Server error', code: 'SERVER_ERROR' }
    });
  }
});

// Update order recipient (admin or order owner)
router.put('/:id/recipient', auth, ensureDatabaseConnection, async (req: any, res) => {
  try {
    const { recipientAddress } = req.body;
    
    if (!recipientAddress || !recipientAddress.name || !recipientAddress.phone || !recipientAddress.address) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'Recipient address information is required', code: 'MISSING_RECIPIENT_INFO' } 
      });
    }

    // Check if order exists and user has permission to update it
    const existingOrder = await Order.findById(req.params.id);
    if (!existingOrder) {
      return res.status(404).json({ 
        success: false, 
        error: { message: 'Order not found', code: 'ORDER_NOT_FOUND' } 
      });
    }

    // Allow admin to update any order, or user to update their own order
    const isAdmin = req.user.roleName === 'admin';
    const isOrderOwner = existingOrder.userId.toString() === req.user.id;
    
    if (!isAdmin && !isOrderOwner) {
      return res.status(403).json({ 
        success: false, 
        error: { message: 'You can only update your own orders', code: 'UNAUTHORIZED' } 
      });
    }

    // Prepare shipping details
    const shippingDetails = {
      recipientName: recipientAddress.name,
      recipientPhone: recipientAddress.phone,
      address: {
        streetName: recipientAddress.address.streetName,
        houseNumber: recipientAddress.address.houseNumber,
        postalCode: recipientAddress.address.postalCode,
        city: recipientAddress.address.city,
        countryCode: recipientAddress.address.countryCode || 'DE'
      },
      specialInstructions: recipientAddress.additionalInstructions || ''
    };

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id, 
      { shippingDetails }, 
      { new: true }
    ).populate('userId', 'firstName lastName email phone')
     .populate({
       path: 'orderItems.productId',
       select: 'name price images description categories',
       populate: {
         path: 'categories',
         select: 'name'
       }
     });

    if (!updatedOrder) {
      return res.status(404).json({ 
        success: false, 
        error: { message: 'Order not found', code: 'ORDER_NOT_FOUND' } 
      });
    }

    return res.json({
      success: true,
      data: {
        message: 'Order recipient updated successfully',
        order: updatedOrder
      }
    });
  } catch (err) {
    console.error('Error updating order recipient:', err);
    return res.status(500).json({ 
      success: false, 
      error: { message: 'Server error', code: 'SERVER_ERROR' } 
    });
  }
});

// Delete order (admin)
router.delete('/:id', auth, requireRole('admin'), ensureDatabaseConnection, async (req: any, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    return res.json({ message: 'Order deleted' });
  } catch (err) {
    console.error('Error deleting order:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router; 