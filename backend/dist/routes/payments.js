"use strict";
// @ts-nocheck
/**
 * Payments Routes - Payment processing and order management
 * Handles Razorpay integration and payment verification
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const payment_service_1 = __importDefault(require("../services/payment.service"));
const index_1 = require("../models/index");
const database_1 = require("../middleware/database");
const auth_1 = require("../middleware/auth");
const comboUtils_1 = require("../utils/comboUtils");
const router = express_1.default.Router();
const validatePaymentOrder = [
    (0, express_validator_1.body)('products').isArray().withMessage('Products must be an array'),
    (0, express_validator_1.body)('products.*.product').isMongoId().withMessage('Invalid product ID'),
    (0, express_validator_1.body)('products.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    // Combo product validation
    (0, express_validator_1.body)('products.*.isCombo').optional().isBoolean().withMessage('isCombo must be a boolean'),
    (0, express_validator_1.body)('products.*.comboBasePrice').optional().isNumeric().withMessage('comboBasePrice must be a number'),
    (0, express_validator_1.body)('products.*.comboItemConfigurations').optional().isArray().withMessage('comboItemConfigurations must be an array'),
    (0, express_validator_1.body)('products.*.comboItemConfigurations.*.name').optional().notEmpty().withMessage('Combo item name is required'),
    (0, express_validator_1.body)('products.*.comboItemConfigurations.*.unitPrice').optional().isNumeric().withMessage('Combo item unit price must be a number'),
    (0, express_validator_1.body)('products.*.comboItemConfigurations.*.quantity').optional().isNumeric().withMessage('Combo item quantity must be a number'),
    (0, express_validator_1.body)('products.*.comboItemConfigurations.*.unit').optional().notEmpty().withMessage('Combo item unit is required'),
    (0, express_validator_1.body)('recipientAddress').isObject().withMessage('Recipient address is required'),
    (0, express_validator_1.body)('recipientAddress.name').notEmpty().withMessage('Recipient name is required'),
    (0, express_validator_1.body)('recipientAddress.phone').notEmpty().withMessage('Recipient phone is required'),
    (0, express_validator_1.body)('recipientAddress.address').isObject().withMessage('Address details are required'),
    (0, express_validator_1.body)('recipientAddress.address.streetName').notEmpty().withMessage('Street name is required'),
    (0, express_validator_1.body)('recipientAddress.address.postalCode').notEmpty().withMessage('Postal code is required'),
    (0, express_validator_1.body)('recipientAddress.address.city').notEmpty().withMessage('City is required')
];
const validatePaymentVerification = [
    (0, express_validator_1.body)('razorpay_order_id').notEmpty().withMessage('Razorpay order ID is required'),
    (0, express_validator_1.body)('razorpay_payment_id').notEmpty().withMessage('Razorpay payment ID is required'),
    (0, express_validator_1.body)('razorpay_signature').notEmpty().withMessage('Razorpay signature is required')
];
router.post('/create-order', auth_1.auth, database_1.ensureDatabaseConnection, validatePaymentOrder, async (req, res) => {
    try {
        console.log('🔍 [Payment Route] Create order request received');
        console.log('🔍 [Payment Route] Request body:', JSON.stringify(req.body, null, 2));
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            console.log('❌ [Payment Route] Validation errors:', errors.array());
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
        const userId = req.user.id;
        console.log('🔍 [Payment Route] User ID:', userId);
        console.log('🔍 [Payment Route] Products:', products);
        // Calculate total amount
        let totalAmount = 0;
        const orderItems = [];
        for (const item of products) {
            const product = await index_1.Product.findById(item.product);
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
            let itemTotal;
            let itemPrice;
            let orderItemData = {
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
                itemPrice = (0, comboUtils_1.calculateComboPrice)(product.comboBasePrice || 0, item.comboItemConfigurations);
                itemTotal = itemPrice * item.quantity;
                // Store combo configuration
                orderItemData.isCombo = true;
                orderItemData.comboBasePrice = product.comboBasePrice || 0;
                orderItemData.comboItemConfigurations = item.comboItemConfigurations;
                orderItemData.price = itemPrice;
                orderItemData.total = itemTotal;
            }
            else if (product.isCombo && !item.isCombo) {
                // Combo product but not sent as combo - use base price
                itemPrice = product.comboBasePrice || 0;
                itemTotal = itemPrice * item.quantity;
                orderItemData.price = itemPrice;
                orderItemData.total = itemTotal;
            }
            else {
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
        const razorpayOrder = await payment_service_1.default.createOrder(totalAmount, 'INR');
        // Create order in database with PENDING status
        const order = new index_1.Order({
            userId,
            orderItems,
            recipientAddress,
            totalAmount,
            orderNotes,
            razorpayOrderId: razorpayOrder.id,
            orderStatus: 'pending', // Changed from 'payment_done' to 'pending'
            paymentStatus: 'pending', // Explicitly set payment status
            // Add required fields for guest users
            totalPrice: totalAmount,
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
                key: process.env.RAZORPAY_KEY_ID
            }
        });
    }
    catch (error) {
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
router.post('/verify', auth_1.auth, database_1.ensureDatabaseConnection, validatePaymentVerification, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
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
        const isValidSignature = payment_service_1.default.verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
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
        const paymentDetails = await payment_service_1.default.getPaymentDetails(razorpay_payment_id);
        const orderDetails = await payment_service_1.default.getOrderDetails(razorpay_order_id);
        // Update order status with proper payment verification
        const order = await index_1.Order.findOneAndUpdate({ razorpayOrderId: razorpay_order_id }, {
            orderStatus: 'payment_done', // Only set to payment_done after successful verification
            paymentStatus: 'captured', // Set payment status to captured
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            paymentDate: new Date(),
            paymentVerifiedAt: new Date(),
            // Store detailed Razorpay information
            razorpayPaymentDetails: paymentDetails,
            razorpayOrderDetails: orderDetails
        }, { new: true });
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
            await index_1.Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
        }
        res.status(200).json({
            success: true,
            data: {
                orderId: order._id,
                status: 'confirmed',
                message: 'Payment verified successfully'
            }
        });
    }
    catch (error) {
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
router.post('/webhook', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const body = req.body;
        if (!signature) {
            console.error('Missing Razorpay signature in webhook');
            res.status(400).json({ success: false, error: 'Missing signature' });
            return;
        }
        // Verify webhook signature
        const isValidSignature = payment_service_1.default.verifyWebhookSignature(body.toString(), signature);
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
    }
    catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ success: false, error: 'Webhook processing failed' });
    }
});
// Helper function to handle payment captured event
async function handlePaymentCaptured(payment) {
    try {
        const order = await index_1.Order.findOneAndUpdate({ razorpayPaymentId: payment.id }, {
            status: 'confirmed',
            paymentStatus: 'captured',
            paymentDate: new Date(),
            razorpayPaymentDetails: payment
        }, { new: true });
        if (order) {
            console.log(`Payment captured for order: ${order._id}`);
            // Update product stock
            for (const item of order.orderItems) {
                await index_1.Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
            }
        }
    }
    catch (error) {
        console.error('Error handling payment captured:', error);
    }
}
// Helper function to handle payment failed event
async function handlePaymentFailed(payment) {
    try {
        const order = await index_1.Order.findOneAndUpdate({ razorpayPaymentId: payment.id }, {
            status: 'failed',
            paymentStatus: 'failed',
            paymentDate: new Date(),
            razorpayPaymentDetails: payment,
            // Add failure reason for better tracking
            failureReason: payment.error_code || payment.error_description || 'Payment failed',
            // Restore stock if it was decremented
            stockRestored: false
        }, { new: true });
        if (order) {
            console.log(`Payment failed for order: ${order._id}, Reason: ${payment.error_code || 'Unknown'}`);
            // Restore product stock if it was decremented
            if (!order.stockRestored) {
                for (const item of order.orderItems) {
                    await index_1.Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
                }
                // Mark stock as restored
                await index_1.Order.findByIdAndUpdate(order._id, { stockRestored: true });
                console.log(`Stock restored for failed order: ${order._id}`);
            }
        }
    }
    catch (error) {
        console.error('Error handling payment failed:', error);
    }
}
// Helper function to handle order paid event
async function handleOrderPaid(order) {
    try {
        const dbOrder = await index_1.Order.findOneAndUpdate({ razorpayOrderId: order.id }, {
            status: 'confirmed',
            paymentStatus: 'paid',
            paymentDate: new Date(),
            razorpayOrderDetails: order
        }, { new: true });
        if (dbOrder) {
            console.log(`Order paid: ${dbOrder._id}`);
        }
    }
    catch (error) {
        console.error('Error handling order paid:', error);
    }
}
router.get('/orders', auth_1.auth, database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await index_1.Order.find({ userId })
            .populate('orderItems.productId', 'name price images')
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: orders
        });
    }
    catch (error) {
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
router.post('/cleanup-abandoned', database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        // Find orders that are older than 30 minutes and still pending
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        const abandonedOrders = await index_1.Order.find({
            status: 'pending',
            createdAt: { $lt: thirtyMinutesAgo }
        });
        let cleanedCount = 0;
        for (const order of abandonedOrders) {
            // Mark as cancelled
            await index_1.Order.findByIdAndUpdate(order._id, {
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
    }
    catch (error) {
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
exports.default = router;
