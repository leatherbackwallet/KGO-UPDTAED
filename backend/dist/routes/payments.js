"use strict";
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
const router = express_1.default.Router();
const validatePaymentOrder = [
    (0, express_validator_1.body)('products').isArray().withMessage('Products must be an array'),
    (0, express_validator_1.body)('products.*.product').isMongoId().withMessage('Invalid product ID'),
    (0, express_validator_1.body)('products.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
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
        const { products, recipientAddress, orderNotes } = req.body;
        const userId = req.user.id;
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
            const itemTotal = product.price * item.quantity;
            totalAmount += itemTotal;
            orderItems.push({
                productId: product._id,
                quantity: item.quantity,
                price: product.price,
                total: itemTotal
            });
        }
        const razorpayOrder = await payment_service_1.default.createOrder(totalAmount, 'INR');
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
//# sourceMappingURL=payments.js.map