// @ts-nocheck
/**
 * Payments Routes - Payment processing and order management
 * Handles Razorpay integration and payment verification
 */

import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import paymentService from '../services/payment.service';
import { Order, Product } from '../models/index';
import { ensureDatabaseConnection } from '../middleware/database';
import { auth } from '../middleware/auth';
import { calculateComboPrice } from '../utils/comboUtils';

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

        const { products, recipientAddress, orderNotes } = req.body;
        const userId = (req as any).user.id;

        // Calculate total amount
        let totalAmount = 0;
        const orderItems = [];

        for (const item of products) {
            const product = await Product.findById(item.product);
            if (!product) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: `Product with ID ${item.product} not found`,
                        code: 'PRODUCT_NOT_FOUND'
                    }
                });
                return;
            }

            if (product.stock < item.quantity) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: `Insufficient stock for product ${product.name}`,
                        code: 'INSUFFICIENT_STOCK'
                    }
                });
                return;
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

        // Create order in database
        const order = new Order({
            userId,
            orderItems,
            recipientAddress,
            totalAmount,
            orderNotes,
            razorpayOrderId: razorpayOrder.id,
            status: 'pending'
        });

        await order.save();

        res.status(200).json({
            success: true,
            data: {
                orderId: order._id,
                razorpayOrderId: razorpayOrder.id,
                amount: totalAmount,
                currency: 'INR',
                key: process.env.RAZORPAY_KEY_ID
            }
        });
    } catch (error: any) {
        console.error('Error creating payment order:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to create payment order',
                code: 'PAYMENT_ORDER_ERROR'
            }
        });
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

        // Update order status
        const order = await Order.findOneAndUpdate(
            { razorpayOrderId: razorpay_order_id },
            {
                status: 'confirmed',
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                paymentDate: new Date()
            },
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
        const order = await Order.findOneAndUpdate(
            { razorpayPaymentId: payment.id },
            {
                status: 'confirmed',
                paymentStatus: 'captured',
                paymentDate: new Date(),
                razorpayPaymentDetails: payment
            },
            { new: true }
        );

        if (order) {
            console.log(`Payment captured for order: ${order._id}`);
            
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
        const order = await Order.findOneAndUpdate(
            { razorpayPaymentId: payment.id },
            {
                status: 'failed',
                paymentStatus: 'failed',
                paymentDate: new Date(),
                razorpayPaymentDetails: payment
            },
            { new: true }
        );

        if (order) {
            console.log(`Payment failed for order: ${order._id}`);
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

export default router;
