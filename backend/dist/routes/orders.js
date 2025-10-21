"use strict";
/**
 * Orders Routes - Order management for customers and admins
 * Supports guest checkout and order tracking
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = require("../models/index");
const database_1 = require("../middleware/database");
const auth_1 = require("../middleware/auth");
const optionalAuth_1 = require("../middleware/optionalAuth");
const role_1 = require("../middleware/role");
const comboUtils_1 = require("../utils/comboUtils");
const notificationService_1 = require("../services/notificationService");
const router = express_1.default.Router();
// Create order (customer) - WITH TRANSACTION SUPPORT
router.post('/', auth_1.auth, database_1.ensureDatabaseConnection, async (req, res) => {
    const session = await mongoose_1.default.startSession();
    try {
        await session.withTransaction(async () => {
            const { products, recipientAddress, deliveryAddress, shippingAddress, paymentMethod } = req.body;
            // Use recipientAddress if provided, otherwise fall back to other address formats
            const address = recipientAddress || deliveryAddress || shippingAddress;
            if (!address) {
                throw new Error('MISSING_ADDRESS');
            }
            // Calculate total and prepare order items with stock validation
            let totalPrice = 0;
            const orderItems = [];
            const productUpdates = [];
            for (const item of products) {
                // Use findById with session for transaction consistency
                const product = await index_1.Product.findById(item.product).session(session);
                if (!product) {
                    throw new Error('PRODUCT_NOT_FOUND');
                }
                // Check stock availability with atomic operation
                if (product.stock < item.quantity) {
                    throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
                }
                let itemPrice;
                let orderItemData = {
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
                        throw new Error(`MISSING_COMBO_CONFIG:${product.name}`);
                    }
                    // Validate combo base price matches
                    if (item.comboBasePrice !== product.comboBasePrice) {
                        throw new Error(`COMBO_PRICE_MISMATCH:${product.name}`);
                    }
                    // Recalculate combo price server-side
                    itemPrice = (0, comboUtils_1.calculateComboPrice)(product.comboBasePrice || 0, item.comboItemConfigurations);
                    // Store combo configuration
                    orderItemData.isCombo = true;
                    orderItemData.comboBasePrice = product.comboBasePrice || 0;
                    orderItemData.comboItemConfigurations = item.comboItemConfigurations;
                    orderItemData.price = itemPrice;
                }
                else if (product.isCombo && !item.isCombo) {
                    // Combo product but not sent as combo - use base price
                    itemPrice = product.comboBasePrice || 0;
                    orderItemData.price = itemPrice;
                }
                else {
                    // Regular product
                    itemPrice = product.price;
                    orderItemData.price = itemPrice;
                }
                const itemTotal = itemPrice * item.quantity;
                totalPrice += itemTotal;
                orderItems.push(orderItemData);
                // Prepare stock update for transaction
                productUpdates.push({
                    productId: product._id,
                    quantity: item.quantity,
                    currentStock: product.stock
                });
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
            // Validate payment method BEFORE deducting stock
            // Reject COD payment method in production
            if ((paymentMethod === 'cod-test' || paymentMethod === 'cod') && process.env.NODE_ENV !== 'development') {
                throw new Error('COD_NOT_AVAILABLE');
            }
            // Update product stock atomically within transaction
            // Only deduct stock AFTER payment method validation to ensure proper rollback
            for (const update of productUpdates) {
                await index_1.Product.findByIdAndUpdate(update.productId, { $inc: { stock: -update.quantity } }, { session });
            }
            // Handle COD payment method (development only)
            if ((paymentMethod === 'cod-test' || paymentMethod === 'cod') && process.env.NODE_ENV === 'development') {
                // Create COD order with specific status and payment details
                const order = await index_1.Order.create([{
                        userId: req.user.id,
                        requestedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                        shippingDetails,
                        orderItems,
                        totalPrice,
                        orderStatus: 'payment_done', // COD orders are considered paid
                        paymentStatus: 'captured', // COD is considered captured
                        paymentMethod: paymentMethod === 'cod-test' ? 'cod-test' : 'cod',
                        paymentGateway: 'cod',
                        paymentDate: new Date(),
                        paymentVerifiedAt: new Date(),
                        statusHistory: [{
                                status: 'payment_done',
                                timestamp: new Date(),
                                notes: 'COD order created - payment will be collected on delivery'
                            }]
                    }], { session });
                const createdOrder = order[0];
                // Create notification for admin users about new order (outside transaction)
                setImmediate(async () => {
                    try {
                        await notificationService_1.NotificationService.createNewOrderNotification({
                            orderId: createdOrder.orderId,
                            customerName: shippingDetails.recipientName,
                            totalPrice: createdOrder.totalPrice,
                            orderStatus: createdOrder.orderStatus
                        });
                    }
                    catch (notificationError) {
                        console.error('Error creating notification for new order:', notificationError);
                    }
                });
                return res.status(201).json({
                    success: true,
                    data: {
                        message: 'COD order created successfully',
                        order: {
                            id: createdOrder._id,
                            orderId: createdOrder.orderId,
                            totalPrice: createdOrder.totalPrice,
                            orderStatus: createdOrder.orderStatus,
                            paymentMethod: 'cod-test'
                        }
                    }
                });
            }
            // Create regular order (Razorpay)
            const order = await index_1.Order.create([{
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
                }], { session });
            const createdOrder = order[0];
            // Create notification for admin users about new order (outside transaction)
            setImmediate(async () => {
                try {
                    await notificationService_1.NotificationService.createNewOrderNotification({
                        orderId: createdOrder.orderId,
                        customerName: shippingDetails.recipientName,
                        totalPrice: createdOrder.totalPrice,
                        orderStatus: createdOrder.orderStatus
                    });
                }
                catch (notificationError) {
                    console.error('Error creating notification for new order:', notificationError);
                }
            });
            return res.status(201).json({
                success: true,
                data: {
                    message: 'Order created successfully',
                    order: {
                        id: createdOrder._id,
                        orderId: createdOrder.orderId,
                        totalPrice: createdOrder.totalPrice,
                        orderStatus: createdOrder.orderStatus
                    }
                }
            });
        });
    }
    catch (err) {
        console.error('Order creation error:', err);
        // Handle specific error types
        if (err.message === 'MISSING_ADDRESS') {
            return res.status(400).json({
                success: false,
                error: { message: 'Recipient address is required', code: 'MISSING_ADDRESS' }
            });
        }
        if (err.message === 'PRODUCT_NOT_FOUND') {
            return res.status(400).json({
                success: false,
                error: { message: 'Product not found', code: 'PRODUCT_NOT_FOUND' }
            });
        }
        if (err.message.startsWith('INSUFFICIENT_STOCK:')) {
            const productName = err.message.split(':')[1];
            return res.status(400).json({
                success: false,
                error: { message: `Insufficient stock for product ${productName}`, code: 'INSUFFICIENT_STOCK' }
            });
        }
        if (err.message.startsWith('MISSING_COMBO_CONFIG:')) {
            const productName = err.message.split(':')[1];
            return res.status(400).json({
                success: false,
                error: {
                    message: `Combo product ${productName} requires comboItemConfigurations`,
                    code: 'MISSING_COMBO_CONFIG'
                }
            });
        }
        if (err.message.startsWith('COMBO_PRICE_MISMATCH:')) {
            const productName = err.message.split(':')[1];
            return res.status(400).json({
                success: false,
                error: {
                    message: `Combo base price mismatch for product ${productName}`,
                    code: 'COMBO_PRICE_MISMATCH'
                }
            });
        }
        if (err.message === 'COD_NOT_AVAILABLE') {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'COD payment method is only available in development environment',
                    code: 'COD_NOT_AVAILABLE'
                }
            });
        }
        return res.status(500).json({
            success: false,
            error: { message: 'Server error', code: 'SERVER_ERROR' }
        });
    }
    finally {
        await session.endSession();
    }
});
// Get my orders (customer)
router.get('/my', auth_1.auth, async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', code: 'NOT_AUTHENTICATED' }
            });
        }
        // Handle guest users - they don't have order history
        if (req.user.id.toString().startsWith('guest_')) {
            return res.json({
                success: true,
                data: []
            });
        }
        const orders = await index_1.Order.find({ userId: req.user.id, isDeleted: false })
            .populate({
            path: 'orderItems.productId',
            select: 'name price images description categories',
            populate: {
                path: 'categories',
                select: 'name'
            }
        })
            .sort({ createdAt: -1 });
        return res.json({
            success: true,
            data: orders || []
        });
    }
    catch (err) {
        console.error('Error fetching orders:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});
// Get order by ID with comprehensive transaction details (public endpoint for guest users)
router.get('/:orderId', optionalAuth_1.optionalAuth, database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await index_1.Order.findById(orderId)
            .populate('userId', 'firstName lastName email phone')
            .populate('orderItems.productId', 'name description images categories price')
            .lean();
        if (!order) {
            return res.status(404).json({
                success: false,
                error: { message: 'Order not found', code: 'ORDER_NOT_FOUND' }
            });
        }
        // Check if user can access this order (own order, admin, or guest with valid token)
        if (req.user) {
            const userId = typeof order.userId === 'string' ? order.userId : order.userId._id.toString();
            if (userId !== req.user.id && req.user.roleName !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: { message: 'Access denied', code: 'ACCESS_DENIED' }
                });
            }
        }
        else {
            // For guest users, allow access to orders with guest user IDs
            const userId = typeof order.userId === 'string' ? order.userId : order.userId._id.toString();
            if (!userId.startsWith('guest_')) {
                return res.status(403).json({
                    success: false,
                    error: { message: 'Access denied - guest orders only', code: 'ACCESS_DENIED' }
                });
            }
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
    }
    catch (err) {
        console.error('Error fetching order details:', err);
        res.status(500).json({
            success: false,
            error: { message: 'Server error', code: 'SERVER_ERROR' }
        });
    }
});
// Get all orders (admin)
router.get('/', auth_1.auth, (0, role_1.requireRole)('admin'), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const orders = await index_1.Order.find({ isDeleted: false })
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
        return res.json({
            success: true,
            data: orders || []
        });
    }
    catch (err) {
        console.error('Error fetching orders:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});
// Update order status with timeline tracking (admin)
router.put('/:id/status', auth_1.auth, (0, role_1.requireRole)('admin'), database_1.ensureDatabaseConnection, async (req, res) => {
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
        const order = await index_1.Order.findById(req.params.id);
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
        const updatedOrder = await index_1.Order.findById(req.params.id)
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
    }
    catch (err) {
        console.error('Error updating order status:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error', code: 'SERVER_ERROR' }
        });
    }
});
// Update order recipient (admin or order owner)
router.put('/:id/recipient', auth_1.auth, database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const { recipientAddress } = req.body;
        if (!recipientAddress || !recipientAddress.name || !recipientAddress.phone || !recipientAddress.address) {
            return res.status(400).json({
                success: false,
                error: { message: 'Recipient address information is required', code: 'MISSING_RECIPIENT_INFO' }
            });
        }
        // Check if order exists and user has permission to update it
        const existingOrder = await index_1.Order.findById(req.params.id);
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
        const updatedOrder = await index_1.Order.findByIdAndUpdate(req.params.id, { shippingDetails }, { new: true }).populate('userId', 'firstName lastName email phone')
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
    }
    catch (err) {
        console.error('Error updating order recipient:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error', code: 'SERVER_ERROR' }
        });
    }
});
// Delete order (admin)
router.delete('/:id', auth_1.auth, (0, role_1.requireRole)('admin'), database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const order = await index_1.Order.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
        if (!order)
            return res.status(404).json({ message: 'Order not found' });
        return res.json({ message: 'Order deleted' });
    }
    catch (err) {
        console.error('Error deleting order:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
