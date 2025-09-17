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

const router = express.Router();

const validatePaymentOrder = [
    body('products').isArray().withMessage('Products must be an array'),
    body('products.*.product').isMongoId().withMessage('Invalid product ID'),
    body('products.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
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

            const itemTotal = product.price * item.quantity;
            totalAmount += itemTotal;

            orderItems.push({
                productId: product._id,
                quantity: item.quantity,
                price: product.price,
                total: itemTotal
            });
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
