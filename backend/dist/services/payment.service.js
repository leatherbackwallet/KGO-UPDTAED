"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const index_1 = require("../models/index");
class PaymentService {
    constructor() {
        this.razorpay = new razorpay_1.default({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
        this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    }
    async createPaymentOrder(data) {
        try {
            const options = {
                amount: data.amount * 100,
                currency: data.currency,
                receipt: data.receipt,
                notes: data.notes || {}
            };
            const order = await this.razorpay.orders.create(options);
            return {
                success: true,
                data: {
                    id: order.id,
                    amount: order.amount,
                    currency: order.currency,
                    receipt: order.receipt,
                    status: order.status,
                    created_at: order.created_at
                }
            };
        }
        catch (error) {
            console.error('Razorpay order creation error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to create payment order',
                    code: 'PAYMENT_ORDER_CREATION_FAILED',
                    details: error.message
                }
            };
        }
    }
    verifyPaymentSignature(data) {
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;
            const body = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSignature = crypto_1.default
                .createHmac('sha256', this.webhookSecret)
                .update(body.toString())
                .digest('hex');
            return expectedSignature === razorpay_signature;
        }
        catch (error) {
            console.error('Payment signature verification error:', error);
            return false;
        }
    }
    verifyWebhookSignature(body, signature) {
        try {
            const expectedSignature = crypto_1.default
                .createHmac('sha256', this.webhookSecret)
                .update(body)
                .digest('hex');
            return expectedSignature === signature;
        }
        catch (error) {
            console.error('Webhook signature verification error:', error);
            return false;
        }
    }
    async processWebhookEvent(event) {
        try {
            const { event: eventType, payload } = event;
            switch (eventType) {
                case 'payment.captured':
                    await this.handlePaymentCaptured(payload);
                    break;
                case 'payment.failed':
                    await this.handlePaymentFailed(payload);
                    break;
                case 'order.paid':
                    await this.handleOrderPaid(payload);
                    break;
                default:
                    console.log(`Unhandled webhook event: ${eventType}`);
            }
        }
        catch (error) {
            console.error('Webhook processing error:', error);
            throw error;
        }
    }
    async handlePaymentCaptured(payload) {
        const payment = payload.payment.entity;
        const order = payload.order.entity;
        console.log(`Payment captured: ${payment.id} for order: ${order.id}`);
        const dbOrder = await index_1.Order.findOne({
            'paymentDetails.razorpayOrderId': order.id
        });
        if (!dbOrder) {
            console.error(`Order not found for Razorpay order ID: ${order.id}`);
            return;
        }
        dbOrder.orderStatus = 'payment_verified';
        dbOrder.paymentDetails = {
            ...dbOrder.paymentDetails,
            razorpayPaymentId: payment.id,
            paymentStatus: 'captured',
            paymentMethod: payment.method,
            paidAt: new Date(payment.created_at * 1000)
        };
        dbOrder.statusHistory.push({
            status: 'payment_verified',
            timestamp: new Date(),
            notes: `Payment captured via ${payment.method}. Razorpay Payment ID: ${payment.id}`
        });
        await dbOrder.save();
        console.log(`Order ${dbOrder.orderId} payment verified successfully`);
    }
    async handlePaymentFailed(payload) {
        const payment = payload.payment.entity;
        const order = payload.order.entity;
        console.log(`Payment failed: ${payment.id} for order: ${order.id}`);
        const dbOrder = await index_1.Order.findOne({
            'paymentDetails.razorpayOrderId': order.id
        });
        if (!dbOrder) {
            console.error(`Order not found for Razorpay order ID: ${order.id}`);
            return;
        }
        dbOrder.orderStatus = 'payment_failed';
        dbOrder.paymentDetails = {
            ...dbOrder.paymentDetails,
            razorpayPaymentId: payment.id,
            paymentStatus: 'failed',
            paymentMethod: payment.method,
            failedAt: new Date(payment.created_at * 1000)
        };
        dbOrder.statusHistory.push({
            status: 'payment_failed',
            timestamp: new Date(),
            notes: `Payment failed via ${payment.method}. Razorpay Payment ID: ${payment.id}`
        });
        await dbOrder.save();
        console.log(`Order ${dbOrder.orderId} payment failed`);
    }
    async handleOrderPaid(payload) {
        const order = payload.order.entity;
        console.log(`Order paid: ${order.id}`);
        const dbOrder = await index_1.Order.findOne({
            'paymentDetails.razorpayOrderId': order.id
        });
        if (!dbOrder) {
            console.error(`Order not found for Razorpay order ID: ${order.id}`);
            return;
        }
        dbOrder.orderStatus = 'order_received';
        dbOrder.statusHistory.push({
            status: 'order_received',
            timestamp: new Date(),
            notes: 'Order payment completed and ready for processing'
        });
        await dbOrder.save();
        console.log(`Order ${dbOrder.orderId} marked as received and ready for processing`);
    }
    async getPaymentDetails(orderId) {
        try {
            const order = await index_1.Order.findOne({ orderId }).select('paymentDetails');
            return order?.paymentDetails || null;
        }
        catch (error) {
            console.error('Error fetching payment details:', error);
            return null;
        }
    }
}
exports.default = new PaymentService();
//# sourceMappingURL=payment.service.js.map