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
const express_validator_1 = __importDefault(require("express-validator"));
const payment_service_1 = __importDefault(require("../services/payment.service"));
const index_1 = require("../models/index");
const database_1 = require("../middleware/database");
const auth_1 = require("../middleware/auth");
const comboUtils_1 = require("../utils/comboUtils");
const router = express_1.default.Router();
const validatePaymentOrder = [
    express_validator_1.default.body('products').isArray().withMessage('Products must be an array'),
    express_validator_1.default.body('products.*.product').isMongoId().withMessage('Invalid product ID'),
    express_validator_1.default.body('products.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    // Combo product validation
    express_validator_1.default.body('products.*.isCombo').optional().isBoolean().withMessage('isCombo must be a boolean'),
    express_validator_1.default.body('products.*.comboBasePrice').optional().isNumeric().withMessage('comboBasePrice must be a number'),
    express_validator_1.default.body('products.*.comboItemConfigurations').optional().isArray().withMessage('comboItemConfigurations must be an array'),
    express_validator_1.default.body('products.*.comboItemConfigurations.*.name').optional().notEmpty().withMessage('Combo item name is required'),
    express_validator_1.default.body('products.*.comboItemConfigurations.*.unitPrice').optional().isNumeric().withMessage('Combo item unit price must be a number'),
    express_validator_1.default.body('products.*.comboItemConfigurations.*.quantity').optional().isNumeric().withMessage('Combo item quantity must be a number'),
    express_validator_1.default.body('products.*.comboItemConfigurations.*.unit').optional().notEmpty().withMessage('Combo item unit is required'),
    express_validator_1.default.body('recipientAddress').isObject().withMessage('Recipient address is required'),
    express_validator_1.default.body('recipientAddress.name').notEmpty().withMessage('Recipient name is required'),
    express_validator_1.default.body('recipientAddress.phone').notEmpty().withMessage('Recipient phone is required'),
    express_validator_1.default.body('recipientAddress.address').isObject().withMessage('Address details are required'),
    express_validator_1.default.body('recipientAddress.address.streetName').notEmpty().withMessage('Street name is required'),
    express_validator_1.default.body('recipientAddress.address.postalCode').notEmpty().withMessage('Postal code is required'),
    express_validator_1.default.body('recipientAddress.address.city').notEmpty().withMessage('City is required')
];
const validatePaymentVerification = [
    express_validator_1.default.body('razorpay_order_id').notEmpty().withMessage('Razorpay order ID is required'),
    express_validator_1.default.body('razorpay_payment_id').notEmpty().withMessage('Razorpay payment ID is required'),
    express_validator_1.default.body('razorpay_signature').notEmpty().withMessage('Razorpay signature is required')
];
router.post('/create-order', auth_1.auth, database_1.ensureDatabaseConnection, validatePaymentOrder, async (req, res) => {
    try {
        const errors = express_validator_1.default.validationResult(req);
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
        const userId = req.user.id;
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
        // Create order in database
        const order = new index_1.Order({
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
        const errors = express_validator_1.default.validationResult(req);
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
        // Update order status
        const order = await index_1.Order.findOneAndUpdate({ razorpayOrderId: razorpay_order_id }, {
            status: 'confirmed',
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            paymentDate: new Date()
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
exports.default = router;
