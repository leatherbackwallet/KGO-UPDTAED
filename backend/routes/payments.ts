// @ts-nocheck
/**
 * Payments Routes - Payment processing and order management
 * Handles Razorpay integration and payment verification
 */

import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import paymentService from '../services/payment.service';
import { Order, Product } from '../models/index';
import { ensureDatabaseConnection } from '../middleware/database';
import { auth } from '../middleware/auth';
import { calculateComboPrice } from '../utils/comboUtils';
import stockService from '../services/stockService';

const router = express.Router();

const validatePaymentOrder = [
    body('products').isArray().withMessage('Products must be an array'),
    body('products.*.product').isMongoId().withMessage('Invalid product ID'),
    body('products.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    // Combo product validation
    body('products.*.isCombo').optional().isBoolean().withMessage('isCombo must be a boolean'),
    body('products.*.comboBasePrice').optional().isNumeric().withMessage('comboBasePrice must be a number'),
    body('products.*.comboItemConfigurations').optional().isArray().withMessage('comboItemConfigurations must be an array'),
    body('products.*.comboItemConfigurations.*.name').optional().notEmpty().withMessage('Combo item name is required'),
    body('products.*.comboItemConfigurations.*.unitPrice').optional().isNumeric().withMessage('Combo item unit price must be a number'),
    body('products.*.comboItemConfigurations.*.quantity').optional().isNumeric().withMessage('Combo item quantity must be a number'),
    body('products.*.comboItemConfigurations.*.unit').optional().notEmpty().withMessage('Combo item unit is required'),
    body('recipientAddress').isObject().withMessage('Recipient address is required'),
    body('recipientAddress.name').notEmpty().withMessage('Recipient name is required'),
    body('recipientAddress.phone').notEmpty().withMessage('Recipient phone is required'),
    body('recipientAddress.address').isObject().withMessage('Address details are required'),
    body('recipientAddress.address.streetName').notEmpty().withMessage('Street name is required'),
    body('recipientAddress.address.postalCode').notEmpty().withMessage('Postal code is required'),
    body('recipientAddress.address.city').notEmpty().withMessage('City is required')
];

const validatePaymentVerification = [
    body('razorpay_order_id').notEmpty().withMessage('Razorpay order ID is required'),
    body('razorpay_payment_id').notEmpty().withMessage('Razorpay payment ID is required'),
    body('razorpay_signature').notEmpty().withMessage('Razorpay signature is required')
];

router.post('/create-order', auth, ensureDatabaseConnection, validatePaymentOrder, async (req: Request, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    
    try {
        await session.withTransaction(async () => {
            console.log('🔍 [Payment Route] Create order request received');
            console.log('🔍 [Payment Route] Request body:', JSON.stringify(req.body, null, 2));
            
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.log('❌ [Payment Route] Validation errors:', errors.array());
                throw new Error('VALIDATION_ERROR');
            }

            const { products, recipientAddress, orderNotes } = req.body;
            const userId = (req as any).user.id;
            console.log('🔍 [Payment Route] User ID:', userId);
            console.log('🔍 [Payment Route] Products:', products);

            // Check stock availability using stock service
            const stockCheck = await stockService.checkStockAvailability(products, session);
            
            if (!stockCheck.available) {
                const errorMessage = stockCheck.results
                    .filter(r => !r.available)
                    .map(r => `${r.productName}: ${r.currentStock} available, ${r.requestedQuantity} requested`)
                    .join('; ');
                throw new Error(`INSUFFICIENT_STOCK:${errorMessage}`);
            }

            // Reserve stock for this order
            const sessionId = `payment_${Date.now()}_${userId}`;
            const reservationResult = await stockService.reserveStock(
                products,
                userId,
                sessionId,
                session
            );

            if (!reservationResult.success) {
                throw new Error(`STOCK_RESERVATION_FAILED:${reservationResult.errors.join('; ')}`);
            }

            // Calculate total amount
            let totalAmount = 0;
            const orderItems = [];

            for (const item of products) {
                const product = await Product.findById(item.product).session(session);
                if (!product) {
                    throw new Error(`PRODUCT_NOT_FOUND:${item.product}`);
                }

            let itemTotal: number;
            let itemPrice: number;
            let orderItemData: any = {
                productId: product._id,
                quantity: item.quantity,
                isCombo: false,
                comboBasePrice: 0,
                comboItemConfigurations: []
            };

            // Handle combo products
            if (product.isCombo && item.isCombo) {
                // Validate combo configuration
                if (!item.comboItemConfigurations || !Array.isArray(item.comboItemConfigurations)) {
                    res.status(400).json({
                        success: false,
                        error: {
                            message: `Combo product ${product.name} requires comboItemConfigurations`,
                            code: 'MISSING_COMBO_CONFIG'
                        }
                    });
                    return;
                }

                // Validate combo base price matches
                if (item.comboBasePrice !== product.comboBasePrice) {
                    res.status(400).json({
                        success: false,
                        error: {
                            message: `Combo base price mismatch for product ${product.name}`,
                            code: 'COMBO_PRICE_MISMATCH'
                        }
                    });
                    return;
                }

                // Recalculate combo price server-side
                itemPrice = calculateComboPrice(product.comboBasePrice || 0, item.comboItemConfigurations);
                itemTotal = itemPrice * item.quantity;

                // Store combo configuration
                orderItemData.isCombo = true;
                orderItemData.comboBasePrice = product.comboBasePrice || 0;
                orderItemData.comboItemConfigurations = item.comboItemConfigurations;
                orderItemData.price = itemPrice;
                orderItemData.total = itemTotal;
            } else if (product.isCombo && !item.isCombo) {
                // Combo product but not sent as combo - use base price
                itemPrice = product.comboBasePrice || 0;
                itemTotal = itemPrice * item.quantity;
                orderItemData.price = itemPrice;
                orderItemData.total = itemTotal;
            } else {
                // Regular product
                itemPrice = product.price;
                itemTotal = itemPrice * item.quantity;
                orderItemData.price = itemPrice;
                orderItemData.total = itemTotal;
            }

            totalAmount += itemTotal;
            orderItems.push(orderItemData);
        }

        // Create Razorpay order
        const razorpayOrder = await paymentService.createOrder(totalAmount, 'INR');

        // Create order in database with PENDING status
        const order = new Order({
            userId,
            orderItems,
            recipientAddress,
            totalAmount,
            totalPrice: totalAmount, // ✅ Ensure totalPrice is set for all users
            orderNotes,
            razorpayOrderId: razorpayOrder.id,
            orderStatus: 'pending', // Changed from 'payment_done' to 'pending'
            paymentStatus: 'pending', // Explicitly set payment status
            // Add required fields for all users
            shippingDetails: {
                recipientName: recipientAddress.name,
                recipientPhone: recipientAddress.phone,
                address: recipientAddress.address
            },
            requestedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        });

        await order.save();

            res.status(200).json({
                success: true,
                data: {
                    order_id: razorpayOrder.id, // Match Google's naming convention
                    orderId: order._id,
                    razorpayOrderId: razorpayOrder.id,
                    amount: totalAmount,
                    currency: 'INR',
                    key: process.env.RAZORPAY_KEY_ID,
                    stockReservations: reservationResult.reservations // Include reservation info
                }
            });
        });
    } catch (error: any) {
        console.error('Error creating payment order:', error);
        
        // Handle specific error types
        if (error.message === 'VALIDATION_ERROR') {
            const errors = validationResult(req);
            res.status(400).json({
                success: false,
                error: {
                    message: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: errors.array()
                }
            });
            return;
        }
        
        if (error.message.startsWith('INSUFFICIENT_STOCK:')) {
            const stockMessage = error.message.split(':')[1];
            res.status(400).json({
                success: false,
                error: {
                    message: `Insufficient stock: ${stockMessage}`,
                    code: 'INSUFFICIENT_STOCK'
                }
            });
            return;
        }
        
        if (error.message.startsWith('STOCK_RESERVATION_FAILED:')) {
            const reservationMessage = error.message.split(':')[1];
            res.status(400).json({
                success: false,
                error: {
                    message: `Stock reservation failed: ${reservationMessage}`,
                    code: 'STOCK_RESERVATION_FAILED'
                }
            });
            return;
        }
        
        if (error.message.startsWith('PRODUCT_NOT_FOUND:')) {
            const productId = error.message.split(':')[1];
            res.status(400).json({
                success: false,
                error: {
                    message: `Product with ID ${productId} not found`,
                    code: 'PRODUCT_NOT_FOUND'
                }
            });
            return;
        }
        
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to create payment order',
                code: 'PAYMENT_ORDER_ERROR'
            }
        });
    } finally {
        await session.endSession();
    }
});

router.post('/verify', auth, ensureDatabaseConnection, validatePaymentVerification, async (req: Request, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: errors.array()
                }
            });
            return;
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Verify payment signature
        const isValidSignature = paymentService.verifyPayment(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!isValidSignature) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid payment signature',
                    code: 'INVALID_SIGNATURE'
                }
            });
            return;
        }

        // Get detailed payment information from Razorpay
        const paymentDetails = await paymentService.getPaymentDetails(razorpay_payment_id);
        const orderDetails = await paymentService.getOrderDetails(razorpay_order_id);

        // Extract comprehensive transaction details
        const transactionData = {
            orderStatus: 'payment_done', // Only set to payment_done after successful verification
            paymentStatus: 'captured', // Set payment status to captured
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            paymentDate: new Date(),
            paymentVerifiedAt: new Date(),
            // Store detailed Razorpay information
            razorpayPaymentDetails: paymentDetails,
            razorpayOrderDetails: orderDetails,
            // Additional tracking fields
            transactionId: paymentDetails.id || razorpay_payment_id,
            paymentMethod: paymentDetails.method || 'unknown',
            paymentGateway: 'razorpay',
            currency: paymentDetails.currency || 'INR',
            amountPaid: paymentDetails.amount ? paymentDetails.amount / 100 : 0, // Convert from paise
            amountRefunded: 0,
            refundStatus: 'none',
            webhookReceived: false,
            webhookEvents: []
        };

        // Update order status with comprehensive payment verification
        const order = await Order.findOneAndUpdate(
            { razorpayOrderId: razorpay_order_id },
            transactionData,
            { new: true }
        );

        if (!order) {
            res.status(404).json({
                success: false,
                error: {
                    message: 'Order not found',
                    code: 'ORDER_NOT_FOUND'
                }
            });
            return;
        }

        // Update product stock
        for (const item of order.orderItems) {
            await Product.findByIdAndUpdate(
                item.productId,
                { $inc: { stock: -item.quantity } }
            );
        }

        res.status(200).json({
            success: true,
            data: {
                orderId: order._id,
                status: 'confirmed',
                message: 'Payment verified successfully'
            }
        });
    } catch (error: any) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to verify payment',
                code: 'PAYMENT_VERIFICATION_ERROR'
            }
        });
    }
});

// New endpoint to check payment status without full verification
router.post('/check-status', auth, ensureDatabaseConnection, async (req: Request, res: Response): Promise<void> => {
    try {
        const { razorpay_order_id, razorpay_payment_id } = req.body;

        if (!razorpay_order_id && !razorpay_payment_id) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Either razorpay_order_id or razorpay_payment_id is required',
                    code: 'MISSING_PAYMENT_ID'
                }
            });
            return;
        }

        // Try to find order by razorpay order ID or payment ID
        const order = await Order.findOne({
            $or: [
                { razorpayOrderId: razorpay_order_id },
                { razorpayPaymentId: razorpay_payment_id }
            ]
        });

        if (!order) {
            res.status(404).json({
                success: false,
                error: {
                    message: 'Order not found',
                    code: 'ORDER_NOT_FOUND'
                }
            });
            return;
        }

        // Check if payment is already verified
        if (order.paymentStatus === 'captured' && order.orderStatus === 'payment_done') {
            res.status(200).json({
                success: true,
                data: {
                    orderId: order._id,
                    status: 'verified',
                    paymentStatus: order.paymentStatus,
                    orderStatus: order.orderStatus,
                    message: 'Payment already verified'
                }
            });
            return;
        }

        // If we have payment ID, try to get payment details from Razorpay
        if (razorpay_payment_id) {
            try {
                const paymentDetails = await paymentService.getPaymentDetails(razorpay_payment_id);
                
                // Check if payment was successful
                if (paymentDetails.status === 'captured') {
                    res.status(200).json({
                        success: true,
                        data: {
                            orderId: order._id,
                            status: 'payment_success',
                            paymentStatus: 'captured',
                            orderStatus: order.orderStatus,
                            message: 'Payment successful but not yet verified',
                            needsVerification: true
                        }
                    });
                    return;
                } else if (paymentDetails.status === 'failed') {
                    res.status(200).json({
                        success: true,
                        data: {
                            orderId: order._id,
                            status: 'payment_failed',
                            paymentStatus: 'failed',
                            orderStatus: order.orderStatus,
                            message: 'Payment failed'
                        }
                    });
                    return;
                }
            } catch (error) {
                console.error('Error fetching payment details:', error);
                // Continue to return current order status
            }
        }

        // Return current order status
        res.status(200).json({
            success: true,
            data: {
                orderId: order._id,
                status: 'pending',
                paymentStatus: order.paymentStatus || 'pending',
                orderStatus: order.orderStatus || 'pending',
                message: 'Payment status pending'
            }
        });

    } catch (error: any) {
        console.error('Error checking payment status:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to check payment status',
                code: 'STATUS_CHECK_ERROR'
            }
        });
    }
});

// New endpoint for payment status polling
router.post('/poll-status', auth, ensureDatabaseConnection, async (req: Request, res: Response): Promise<void> => {
    try {
        const { razorpay_order_id, razorpay_payment_id, maxAttempts = 10, intervalMs = 2000 } = req.body;

        if (!razorpay_order_id && !razorpay_payment_id) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Either razorpay_order_id or razorpay_payment_id is required',
                    code: 'MISSING_PAYMENT_ID'
                }
            });
            return;
        }

        let attempts = 0;
        let order = null;

        while (attempts < maxAttempts) {
            try {
                // Find order
                order = await Order.findOne({
                    $or: [
                        { razorpayOrderId: razorpay_order_id },
                        { razorpayPaymentId: razorpay_payment_id }
                    ]
                });

                if (!order) {
                    res.status(404).json({
                        success: false,
                        error: {
                            message: 'Order not found',
                            code: 'ORDER_NOT_FOUND'
                        }
                    });
                    return;
                }

                // Check if payment is already verified
                if (order.paymentStatus === 'captured' && order.orderStatus === 'payment_done') {
                    res.status(200).json({
                        success: true,
                        data: {
                            orderId: order._id,
                            status: 'verified',
                            paymentStatus: order.paymentStatus,
                            orderStatus: order.orderStatus,
                            message: 'Payment verified',
                            attempts: attempts + 1
                        }
                    });
                    return;
                }

                // If we have payment ID, check Razorpay status
                if (razorpay_payment_id) {
                    try {
                        const paymentDetails = await paymentService.getPaymentDetails(razorpay_payment_id);
                        
                        if (paymentDetails.status === 'captured') {
                            res.status(200).json({
                                success: true,
                                data: {
                                    orderId: order._id,
                                    status: 'payment_success',
                                    paymentStatus: 'captured',
                                    orderStatus: order.orderStatus,
                                    message: 'Payment successful but not yet verified',
                                    needsVerification: true,
                                    attempts: attempts + 1
                                }
                            });
                            return;
                        } else if (paymentDetails.status === 'failed') {
                            res.status(200).json({
                                success: true,
                                data: {
                                    orderId: order._id,
                                    status: 'payment_failed',
                                    paymentStatus: 'failed',
                                    orderStatus: order.orderStatus,
                                    message: 'Payment failed',
                                    attempts: attempts + 1
                                }
                            });
                            return;
                        }
                    } catch (error) {
                        console.error('Error fetching payment details in poll:', error);
                    }
                }

                attempts++;
                if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, intervalMs));
                }
            } catch (error) {
                console.error('Error in polling attempt:', error);
                attempts++;
                if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, intervalMs));
                }
            }
        }

        // Return final status after max attempts
        res.status(200).json({
            success: true,
            data: {
                orderId: order?._id,
                status: 'timeout',
                paymentStatus: order?.paymentStatus || 'unknown',
                orderStatus: order?.orderStatus || 'unknown',
                message: 'Payment status check timed out',
                attempts: attempts
            }
        });

    } catch (error: any) {
        console.error('Error polling payment status:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to poll payment status',
                code: 'POLL_ERROR'
            }
        });
    }
});

// Webhook endpoint for Razorpay payment status updates
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response): Promise<void> => {
    try {
        const signature = req.headers['x-razorpay-signature'] as string;
        const body = req.body;

        if (!signature) {
            console.error('Missing Razorpay signature in webhook');
            res.status(400).json({ success: false, error: 'Missing signature' });
            return;
        }

        // Verify webhook signature
        const isValidSignature = paymentService.verifyWebhookSignature(body.toString(), signature);
        
        if (!isValidSignature) {
            console.error('Invalid webhook signature');
            res.status(400).json({ success: false, error: 'Invalid signature' });
            return;
        }

        const event = JSON.parse(body.toString());
        console.log('Razorpay webhook event:', event.event);

        // Handle different webhook events
        switch (event.event) {
            case 'payment.captured':
                await handlePaymentCaptured(event.payload.payment.entity);
                break;
            case 'payment.failed':
                await handlePaymentFailed(event.payload.payment.entity);
                break;
            case 'order.paid':
                await handleOrderPaid(event.payload.order.entity);
                break;
            default:
                console.log('Unhandled webhook event:', event.event);
        }

        res.status(200).json({ success: true });
    } catch (error: any) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ success: false, error: 'Webhook processing failed' });
    }
});

// Helper function to handle payment captured event
async function handlePaymentCaptured(payment: any) {
    try {
        const webhookEvent = {
            event: 'payment.captured',
            timestamp: new Date(),
            data: payment
        };

        const order = await Order.findOneAndUpdate(
            { razorpayPaymentId: payment.id },
            {
                $set: {
                    orderStatus: 'payment_done',
                    paymentStatus: 'captured',
                    paymentDate: new Date(),
                    razorpayPaymentDetails: payment,
                    transactionId: payment.id,
                    paymentMethod: payment.method || 'unknown',
                    paymentGateway: 'razorpay',
                    currency: payment.currency || 'INR',
                    amountPaid: payment.amount ? payment.amount / 100 : 0,
                    webhookReceived: true
                },
                $push: {
                    webhookEvents: webhookEvent
                }
            },
            { new: true }
        );

        if (order) {
            console.log(`Payment captured for order: ${order._id}`);
            console.log(`Transaction ID: ${payment.id}, Amount: ₹${payment.amount ? payment.amount / 100 : 0}`);
            
            // Update product stock
            for (const item of order.orderItems) {
                await Product.findByIdAndUpdate(
                    item.productId,
                    { $inc: { stock: -item.quantity } }
                );
            }
        }
    } catch (error: any) {
        console.error('Error handling payment captured:', error);
    }
}

// Helper function to handle payment failed event
async function handlePaymentFailed(payment: any) {
    try {
        const webhookEvent = {
            event: 'payment.failed',
            timestamp: new Date(),
            data: payment
        };

        const order = await Order.findOneAndUpdate(
            { razorpayPaymentId: payment.id },
            {
                $set: {
                    orderStatus: 'cancelled',
                    paymentStatus: 'failed',
                    paymentDate: new Date(),
                    razorpayPaymentDetails: payment,
                    // Add failure reason for better tracking
                    failureReason: payment.error_code || payment.error_description || 'Payment failed',
                    // Additional tracking fields
                    transactionId: payment.id,
                    paymentMethod: payment.method || 'unknown',
                    paymentGateway: 'razorpay',
                    currency: payment.currency || 'INR',
                    amountPaid: 0,
                    webhookReceived: true,
                    // Restore stock if it was decremented
                    stockRestored: false
                },
                $push: {
                    webhookEvents: webhookEvent
                }
            },
            { new: true }
        );

        if (order) {
            console.log(`Payment failed for order: ${order._id}, Reason: ${payment.error_code || 'Unknown'}`);
            console.log(`Transaction ID: ${payment.id}, Error: ${payment.error_description || 'Unknown error'}`);
            
            // Restore product stock if it was decremented
            if (!order.stockRestored) {
                for (const item of order.orderItems) {
                    await Product.findByIdAndUpdate(
                        item.productId,
                        { $inc: { stock: item.quantity } }
                    );
                }
                
                // Mark stock as restored
                await Order.findByIdAndUpdate(order._id, { stockRestored: true });
                console.log(`Stock restored for failed order: ${order._id}`);
            }
        }
    } catch (error: any) {
        console.error('Error handling payment failed:', error);
    }
}

// Helper function to handle order paid event
async function handleOrderPaid(order: any) {
    try {
        const dbOrder = await Order.findOneAndUpdate(
            { razorpayOrderId: order.id },
            {
                status: 'confirmed',
                paymentStatus: 'paid',
                paymentDate: new Date(),
                razorpayOrderDetails: order
            },
            { new: true }
        );

        if (dbOrder) {
            console.log(`Order paid: ${dbOrder._id}`);
        }
    } catch (error: any) {
        console.error('Error handling order paid:', error);
    }
}

router.get('/orders', auth, ensureDatabaseConnection, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const orders = await Order.find({ userId })
            .populate('orderItems.productId', 'name price images')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: orders
        });
    } catch (error: any) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch orders',
                code: 'ORDERS_FETCH_ERROR'
            }
        });
    }
});

// Cleanup endpoint for abandoned orders (orders that were created but never paid)
router.post('/cleanup-abandoned', ensureDatabaseConnection, async (req: Request, res: Response): Promise<void> => {
    try {
        // Find orders that are older than 30 minutes and still pending
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        
        const abandonedOrders = await Order.find({
            status: 'pending',
            createdAt: { $lt: thirtyMinutesAgo }
        });

        let cleanedCount = 0;
        
        for (const order of abandonedOrders) {
            // Mark as cancelled
            await Order.findByIdAndUpdate(order._id, {
                status: 'cancelled',
                paymentStatus: 'failed',
                failureReason: 'Order abandoned - no payment received within 30 minutes'
            });
            
            cleanedCount++;
            console.log(`Cleaned up abandoned order: ${order._id}`);
        }

        res.status(200).json({
            success: true,
            data: {
                message: `Cleaned up ${cleanedCount} abandoned orders`,
                cleanedCount
            }
        });
    } catch (error: any) {
        console.error('Error cleaning up abandoned orders:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to cleanup abandoned orders',
                code: 'CLEANUP_ERROR'
            }
        });
    }
});

export default router;
