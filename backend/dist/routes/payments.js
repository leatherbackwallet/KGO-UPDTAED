"use strict";
/**
 * Payments Routes - Payment processing and order management
 * Handles Razorpay integration and payment verification
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const payment_service_1 = __importDefault(require("../services/payment.service"));
const index_1 = require("../models/index");
const database_1 = require("../middleware/database");
const auth_1 = require("../middleware/auth");
const comboUtils_1 = require("../utils/comboUtils");
const stockService_1 = __importDefault(require("../services/stockService"));
const router = express_1.default.Router();
// Validation removed for simplicity - basic validation handled in route logic
router.post('/create-order', auth_1.auth, database_1.ensureDatabaseConnection, async (req, res) => {
    const session = await mongoose_1.default.startSession();
    try {
        await session.withTransaction(async () => {
            console.log('🔍 [Payment Route] Create order request received');
            console.log('🔍 [Payment Route] Request body:', JSON.stringify(req.body, null, 2));
            // Basic validation - check required fields
            if (!req.body.products || !Array.isArray(req.body.products) || req.body.products.length === 0) {
                throw new Error('VALIDATION_ERROR: Products array is required');
            }
            if (!req.body.recipientAddress) {
                throw new Error('VALIDATION_ERROR: Recipient address is required');
            }
            const { products, recipientAddress, orderNotes } = req.body;
            const userId = req.user.id;
            console.log('🔍 [Payment Route] User ID:', userId);
            console.log('🔍 [Payment Route] Products:', products);
            // Transform products data for stock service (frontend sends 'product', stock service expects 'productId')
            const transformedProducts = products.map((item) => ({
                productId: item.product, // Transform 'product' field to 'productId'
                quantity: item.quantity
            }));
            console.log('🔍 [Payment Route] Transformed products for stock service:', transformedProducts);
            // Validate that all products exist before stock check
            for (const item of transformedProducts) {
                const product = await index_1.Product.findById(item.productId).session(session);
                if (!product) {
                    throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`);
                }
                console.log(`✅ [Payment Route] Product found: ${product.name} (ID: ${item.productId})`);
            }
            // Check stock availability using stock service
            const stockCheck = await stockService_1.default.checkStockAvailability(transformedProducts, session);
            if (!stockCheck.available) {
                const errorMessage = stockCheck.results
                    .filter(r => !r.available)
                    .map(r => `${r.productName}: ${r.currentStock} available, ${r.requestedQuantity} requested`)
                    .join('; ');
                throw new Error(`INSUFFICIENT_STOCK:${errorMessage}`);
            }
            // Reserve stock for this order
            const sessionId = `payment_${Date.now()}_${userId}`;
            const reservationResult = await stockService_1.default.reserveStock(transformedProducts, userId, sessionId, session);
            if (!reservationResult.success) {
                throw new Error(`STOCK_RESERVATION_FAILED:${reservationResult.errors.join('; ')}`);
            }
            // Calculate total amount
            let totalAmount = 0;
            const orderItems = [];
            for (const item of products) {
                const product = await index_1.Product.findById(item.product).session(session);
                if (!product) {
                    throw new Error(`PRODUCT_NOT_FOUND:${item.product}`);
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
    }
    catch (error) {
        console.error('Error creating payment order:', error);
        // Handle specific error types
        if (error.message.startsWith('VALIDATION_ERROR')) {
            res.status(400).json({
                success: false,
                error: {
                    message: error.message.replace('VALIDATION_ERROR: ', ''),
                    code: 'VALIDATION_ERROR'
                }
            });
            return;
        }
        if (error.message.startsWith('INSUFFICIENT_STOCK:')) {
            const stockMessage = error.message.split(':')[1];
            res.status(400).json({
                success: false,
                error: {
                    message: `Insufficient stock: ${stockMessage}. Please reduce quantity or remove items from cart.`,
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
                    message: `Product not found (ID: ${productId}). Please refresh the page and try again.`,
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
    }
    finally {
        await session.endSession();
    }
});
router.post('/verify', auth_1.auth, database_1.ensureDatabaseConnection, async (req, res) => {
    const session = await mongoose_1.default.startSession();
    try {
        await session.withTransaction(async () => {
            // Basic validation - check required fields
            if (!req.body.razorpay_order_id || !req.body.razorpay_payment_id || !req.body.razorpay_signature) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'Missing required payment verification fields',
                        code: 'VALIDATION_ERROR'
                    }
                });
                return;
            }
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
            // IDEMPOTENCY PROTECTION: Check if payment already verified
            const existingOrder = await index_1.Order.findOne({
                razorpayOrderId: razorpay_order_id,
                paymentStatus: 'captured',
                orderStatus: 'payment_done'
            }).session(session);
            if (existingOrder) {
                res.status(200).json({
                    success: true,
                    data: {
                        orderId: existingOrder._id,
                        status: 'already_verified',
                        message: 'Payment already verified',
                        paymentStatus: existingOrder.paymentStatus,
                        orderStatus: existingOrder.orderStatus
                    }
                });
                return;
            }
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
            // ATOMIC UPDATE: Use findOneAndUpdate with session for transaction safety
            const order = await index_1.Order.findOneAndUpdate({
                razorpayOrderId: razorpay_order_id,
                paymentStatus: { $ne: 'captured' } // Only update if not already captured
            }, transactionData, {
                new: true,
                session: session,
                runValidators: true
            });
            if (!order) {
                // Check if order exists but already processed
                const existingOrder = await index_1.Order.findOne({
                    razorpayOrderId: razorpay_order_id
                }).session(session);
                if (existingOrder && existingOrder.paymentStatus === 'captured') {
                    res.status(200).json({
                        success: true,
                        data: {
                            orderId: existingOrder._id,
                            status: 'already_verified',
                            message: 'Payment already verified',
                            paymentStatus: existingOrder.paymentStatus,
                            orderStatus: existingOrder.orderStatus
                        }
                    });
                    return;
                }
                res.status(404).json({
                    success: false,
                    error: {
                        message: 'Order not found or already processed',
                        code: 'ORDER_NOT_FOUND'
                    }
                });
                return;
            }
            // NOTE: Stock was already deducted during reservation in /create-order
            // DO NOT deduct stock again here to avoid double deduction
            // Stock deduction happens in:
            // 1. stockService.reserveStock() during /create-order
            // 2. Webhook handlers for redundancy/verification
            res.status(200).json({
                success: true,
                data: {
                    orderId: order._id,
                    status: 'confirmed',
                    message: 'Payment verified successfully'
                }
            });
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
    finally {
        await session.endSession();
    }
});
// Refund endpoint - Process refunds for captured payments
router.post('/refund', auth_1.auth, database_1.ensureDatabaseConnection, async (req, res) => {
    const session = await mongoose_1.default.startSession();
    try {
        await session.withTransaction(async () => {
            const { orderId, amount, reason } = req.body;
            const userId = req.user.id;
            const userRole = req.user.roleName;
            // Validate input
            if (!orderId) {
                throw new Error('ORDER_ID_REQUIRED');
            }
            // Find order
            const order = await index_1.Order.findById(orderId).session(session);
            if (!order) {
                throw new Error('ORDER_NOT_FOUND');
            }
            // Authorization check - only admin or order owner can request refund
            if (userRole !== 'admin' && order.userId.toString() !== userId) {
                throw new Error('UNAUTHORIZED');
            }
            // Validate payment status
            if (order.paymentStatus !== 'captured') {
                throw new Error('PAYMENT_NOT_CAPTURED');
            }
            if (!order.razorpayPaymentId) {
                throw new Error('RAZORPAY_PAYMENT_ID_MISSING');
            }
            // Calculate refund amount
            const refundAmount = amount || order.totalPrice;
            const alreadyRefunded = order.amountRefunded || 0;
            if (alreadyRefunded + refundAmount > (order.amountPaid || order.totalPrice || 0)) {
                throw new Error('REFUND_EXCEEDS_PAYMENT');
            }
            // Call Razorpay refund API
            console.log(`Processing refund for order ${orderId}: ₹${refundAmount}`);
            const refund = await payment_service_1.default.refundPayment(order.razorpayPaymentId, refundAmount, { reason: reason || 'Customer requested refund', orderId: order.orderId });
            // Calculate refund status
            const totalRefunded = alreadyRefunded + refundAmount;
            const refundStatus = totalRefunded >= (order.amountPaid || order.totalPrice || 0) ? 'full' : 'partial';
            // Update order with refund details
            await index_1.Order.findByIdAndUpdate(orderId, {
                $set: {
                    amountRefunded: totalRefunded,
                    refundStatus: refundStatus,
                    refundDetails: refund,
                    orderStatus: refundStatus === 'full' ? 'cancelled' : order.orderStatus
                }
            }, { session });
            // Restore stock if full refund
            if (refundStatus === 'full') {
                for (const item of order.orderItems) {
                    await index_1.Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } }, { session });
                }
                console.log(`Stock restored for order ${orderId} after full refund`);
            }
            res.status(200).json({
                success: true,
                data: {
                    refund,
                    refundAmount,
                    totalRefunded,
                    refundStatus,
                    message: `Refund of ₹${refundAmount} processed successfully`
                }
            });
        });
    }
    catch (error) {
        console.error('Refund error:', error);
        let errorMessage = 'Failed to process refund';
        let errorCode = 'REFUND_ERROR';
        if (error.message === 'ORDER_ID_REQUIRED') {
            errorMessage = 'Order ID is required';
            errorCode = 'ORDER_ID_REQUIRED';
        }
        else if (error.message === 'ORDER_NOT_FOUND') {
            errorMessage = 'Order not found';
            errorCode = 'ORDER_NOT_FOUND';
        }
        else if (error.message === 'UNAUTHORIZED') {
            errorMessage = 'You are not authorized to refund this order';
            errorCode = 'UNAUTHORIZED';
        }
        else if (error.message === 'PAYMENT_NOT_CAPTURED') {
            errorMessage = 'Payment was not captured, cannot refund';
            errorCode = 'PAYMENT_NOT_CAPTURED';
        }
        else if (error.message === 'RAZORPAY_PAYMENT_ID_MISSING') {
            errorMessage = 'Razorpay payment ID is missing from order';
            errorCode = 'RAZORPAY_PAYMENT_ID_MISSING';
        }
        else if (error.message === 'REFUND_EXCEEDS_PAYMENT') {
            errorMessage = 'Refund amount exceeds payment amount';
            errorCode = 'REFUND_EXCEEDS_PAYMENT';
        }
        else if (error.message) {
            errorMessage = error.message;
        }
        res.status(400).json({
            success: false,
            error: {
                message: errorMessage,
                code: errorCode
            }
        });
    }
    finally {
        await session.endSession();
    }
});
// New endpoint to check payment status without full verification
router.post('/check-status', auth_1.auth, database_1.ensureDatabaseConnection, async (req, res) => {
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
        const order = await index_1.Order.findOne({
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
                const paymentDetails = await payment_service_1.default.getPaymentDetails(razorpay_payment_id);
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
                }
                else if (paymentDetails.status === 'failed') {
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
            }
            catch (error) {
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
    }
    catch (error) {
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
// Payment status polling endpoint (optimized for client-side polling)
// NOTE: This endpoint performs SHORT polling (single check) instead of LONG polling
// to avoid blocking the server. Clients should poll this endpoint repeatedly with delays.
// For production, consider implementing Server-Sent Events (SSE) or WebSockets for real-time updates.
router.post('/poll-status', auth_1.auth, database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, maxAttempts = 3, intervalMs = 1000 } = req.body;
        // Enforce maximum timeout to prevent request blocking (max 5 seconds)
        const MAX_TIMEOUT_MS = 5000;
        const effectiveMaxAttempts = Math.min(maxAttempts, Math.floor(MAX_TIMEOUT_MS / intervalMs));
        const effectiveInterval = Math.min(intervalMs, 2000); // Max 2 second intervals
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
        while (attempts < effectiveMaxAttempts) {
            try {
                // Find order
                order = await index_1.Order.findOne({
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
                        const paymentDetails = await payment_service_1.default.getPaymentDetails(razorpay_payment_id);
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
                        }
                        else if (paymentDetails.status === 'failed') {
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
                    }
                    catch (error) {
                        console.error('Error fetching payment details in poll:', error);
                    }
                }
                attempts++;
                if (attempts < effectiveMaxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, effectiveInterval));
                }
            }
            catch (error) {
                console.error('Error in polling attempt:', error);
                attempts++;
                if (attempts < effectiveMaxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, effectiveInterval));
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
    }
    catch (error) {
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
router.post('/webhook', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
    const session = await mongoose_1.default.startSession();
    try {
        await session.withTransaction(async () => {
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
            // IDEMPOTENCY PROTECTION: Check if webhook already processed
            const webhookId = `${event.event}_${event.payload.payment?.entity?.id || event.payload.order?.entity?.id}_${Date.now()}`;
            const existingWebhook = await index_1.Order.findOne({
                'webhookEvents.event': event.event,
                'webhookEvents.timestamp': { $gte: new Date(Date.now() - 60000) } // Within last minute
            }).session(session);
            if (existingWebhook) {
                console.log('Webhook already processed, skipping duplicate');
                res.status(200).json({ success: true, message: 'Webhook already processed' });
                return;
            }
            // Handle different webhook events
            switch (event.event) {
                case 'payment.captured':
                    await handlePaymentCaptured(event.payload.payment.entity, session);
                    break;
                case 'payment.failed':
                    await handlePaymentFailed(event.payload.payment.entity, session);
                    break;
                case 'order.paid':
                    await handleOrderPaid(event.payload.order.entity, session);
                    break;
                default:
                    console.log('Unhandled webhook event:', event.event);
            }
            res.status(200).json({ success: true });
        });
    }
    catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ success: false, error: 'Webhook processing failed' });
    }
    finally {
        await session.endSession();
    }
});
// Helper function to handle payment captured event
async function handlePaymentCaptured(payment, session) {
    try {
        const webhookEvent = {
            event: 'payment.captured',
            timestamp: new Date(),
            data: payment
        };
        // IDEMPOTENCY CHECK: Only update if not already captured
        const order = await index_1.Order.findOneAndUpdate({
            razorpayPaymentId: payment.id,
            paymentStatus: { $ne: 'captured' } // Only update if not already captured
        }, {
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
        }, {
            new: true,
            session: session
        });
        if (order) {
            console.log(`Payment captured for order: ${order._id}`);
            console.log(`Transaction ID: ${payment.id}, Amount: ₹${payment.amount ? payment.amount / 100 : 0}`);
            // NOTE: Stock was already deducted during reservation in /create-order
            // DO NOT deduct stock again here to avoid double deduction
            // Stock deduction happens in:
            // 1. stockService.reserveStock() during /create-order
            // 2. This webhook handler is for redundancy/verification only
        }
        else {
            console.log(`Payment already processed for payment ID: ${payment.id}`);
        }
    }
    catch (error) {
        console.error('Error handling payment captured:', error);
    }
}
// Helper function to handle payment failed event
async function handlePaymentFailed(payment, session) {
    try {
        const webhookEvent = {
            event: 'payment.failed',
            timestamp: new Date(),
            data: payment
        };
        // IDEMPOTENCY CHECK: Only update if not already failed
        const order = await index_1.Order.findOneAndUpdate({
            razorpayPaymentId: payment.id,
            paymentStatus: { $nin: ['failed', 'captured'] } // Only update if not already processed
        }, {
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
        }, {
            new: true,
            session: session
        });
        if (order) {
            console.log(`Payment failed for order: ${order._id}, Reason: ${payment.error_code || 'Unknown'}`);
            console.log(`Transaction ID: ${payment.id}, Error: ${payment.error_description || 'Unknown error'}`);
            // NOTE: Stock was already deducted during reservation in /create-order
            // Stock restoration should be handled by the stock service, not here
            // This webhook handler is for status updates only
        }
        else {
            console.log(`Payment already processed for payment ID: ${payment.id}`);
        }
    }
    catch (error) {
        console.error('Error handling payment failed:', error);
    }
}
// Helper function to handle order paid event
async function handleOrderPaid(order, session) {
    try {
        // IDEMPOTENCY CHECK: Only update if not already paid
        const dbOrder = await index_1.Order.findOneAndUpdate({
            razorpayOrderId: order.id,
            paymentStatus: { $ne: 'paid' } // Only update if not already paid
        }, {
            status: 'confirmed',
            paymentStatus: 'paid',
            paymentDate: new Date(),
            razorpayOrderDetails: order
        }, {
            new: true,
            session: session
        });
        if (dbOrder) {
            console.log(`Order paid: ${dbOrder._id}`);
        }
        else {
            console.log(`Order already processed for order ID: ${order.id}`);
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
