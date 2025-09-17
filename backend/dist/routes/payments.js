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
const auth = require('../middleware/auth.js');
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
router.post('/create-order', auth, database_1.ensureDatabaseConnection, validatePaymentOrder, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: errors.array()
                }
            });
        }
        const { products, recipientAddress, deliveryAddress, shippingAddress } = req.body;
        const address = recipientAddress || deliveryAddress || shippingAddress;
        let totalPrice = 0;
        const orderItems = [];
        for (const item of products) {
            const product = await index_1.Product.findById(item.product);
            if (!product) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'Product not found', code: 'PRODUCT_NOT_FOUND' }
                });
            }
            const itemPrice = product.price * item.quantity;
            totalPrice += itemPrice;
            orderItems.push({
                productId: item.product,
                quantity: item.quantity,
                price: product.price
            });
        }
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
        const tempOrder = await index_1.Order.create({
            userId: req.user.id,
            requestedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            shippingDetails,
            orderItems,
            totalPrice,
            orderStatus: 'pending_payment',
            paymentDetails: {
                paymentStatus: 'pending',
                currency: 'INR'
            },
            statusHistory: [{
                    status: 'pending_payment',
                    timestamp: new Date(),
                    notes: 'Order created, awaiting payment'
                }]
        });
        const paymentOrderResult = await payment_service_1.default.createPaymentOrder({
            amount: totalPrice,
            currency: 'INR',
            receipt: tempOrder.orderId,
            notes: {
                orderId: tempOrder.orderId,
                userId: req.user.id.toString()
            }
        });
        if (!paymentOrderResult.success) {
            await index_1.Order.findByIdAndDelete(tempOrder._id);
            return res.status(400).json(paymentOrderResult);
        }
        if (paymentOrderResult.data) {
            tempOrder.paymentDetails.razorpayOrderId = paymentOrderResult.data.id;
            await tempOrder.save();
            return res.status(201).json({
                success: true,
                data: {
                    message: 'Payment order created successfully',
                    order: {
                        id: tempOrder._id,
                        orderId: tempOrder.orderId,
                        totalPrice: tempOrder.totalPrice,
                        status: tempOrder.orderStatus
                    },
                    payment: {
                        id: paymentOrderResult.data.id,
                        amount: paymentOrderResult.data.amount,
                        currency: paymentOrderResult.data.currency,
                        key: process.env.RAZORPAY_KEY_ID
                    }
                }
            });
        }
        else {
            await index_1.Order.findByIdAndDelete(tempOrder._id);
            return res.status(400).json({
                success: false,
                error: { message: 'Payment order creation failed', code: 'PAYMENT_ORDER_FAILED' }
            });
        }
    }
    catch (err) {
        console.error('Payment order creation error:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error', code: 'SERVER_ERROR' }
        });
    }
});
router.post('/verify', auth, database_1.ensureDatabaseConnection, validatePaymentVerification, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: errors.array()
                }
            });
        }
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const isSignatureValid = payment_service_1.default.verifyPaymentSignature({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        });
        if (!isSignatureValid) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid payment signature',
                    code: 'INVALID_PAYMENT_SIGNATURE'
                }
            });
        }
        const order = await index_1.Order.findOne({
            'paymentDetails.razorpayOrderId': razorpay_order_id,
            userId: req.user.id
        });
        if (!order) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Order not found',
                    code: 'ORDER_NOT_FOUND'
                }
            });
        }
        order.orderStatus = 'payment_verified';
        order.paymentDetails = {
            ...order.paymentDetails,
            razorpayPaymentId: razorpay_payment_id,
            paymentStatus: 'captured',
            paidAt: new Date()
        };
        order.statusHistory.push({
            status: 'payment_verified',
            timestamp: new Date(),
            notes: `Payment verified. Razorpay Payment ID: ${razorpay_payment_id}`
        });
        await order.save();
        return res.status(200).json({
            success: true,
            data: {
                message: 'Payment verified successfully',
                order: {
                    id: order._id,
                    orderId: order.orderId,
                    totalPrice: order.totalPrice,
                    status: order.orderStatus
                }
            }
        });
    }
    catch (err) {
        console.error('Payment verification error:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error', code: 'SERVER_ERROR' }
        });
    }
});
router.post('/webhook', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const body = req.body;
        if (!signature) {
            return res.status(400).json({
                success: false,
                error: { message: 'Missing webhook signature', code: 'MISSING_SIGNATURE' }
            });
        }
        const isSignatureValid = payment_service_1.default.verifyWebhookSignature(body, signature);
        if (!isSignatureValid) {
            return res.status(400).json({
                success: false,
                error: { message: 'Invalid webhook signature', code: 'INVALID_SIGNATURE' }
            });
        }
        const event = JSON.parse(body.toString());
        await payment_service_1.default.processWebhookEvent(event);
        return res.status(200).json({ success: true, message: 'Webhook processed successfully' });
    }
    catch (err) {
        console.error('Webhook processing error:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Webhook processing failed', code: 'WEBHOOK_ERROR' }
        });
    }
});
router.get('/order/:orderId', auth, database_1.ensureDatabaseConnection, async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await index_1.Order.findOne({
            orderId,
            userId: req.user.id
        }).select('orderId paymentDetails orderStatus totalPrice');
        if (!order) {
            return res.status(404).json({
                success: false,
                error: { message: 'Order not found', code: 'ORDER_NOT_FOUND' }
            });
        }
        return res.status(200).json({
            success: true,
            data: {
                order: {
                    orderId: order.orderId,
                    status: order.orderStatus,
                    totalPrice: order.totalPrice,
                    paymentDetails: order.paymentDetails
                }
            }
        });
    }
    catch (err) {
        console.error('Get payment details error:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Server error', code: 'SERVER_ERROR' }
        });
    }
});
exports.default = router;
//# sourceMappingURL=payments.js.map