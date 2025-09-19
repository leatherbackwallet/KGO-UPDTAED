"use strict";
/**
 * Payment Service - Razorpay integration
 * Handles payment processing and verification
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const razorpay_1 = __importDefault(require("razorpay"));
class PaymentService {
    constructor() {
        this.razorpay = new razorpay_1.default({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
    }
    /**
     * Create a Razorpay order
     */
    async createOrder(amount, currency, receipt) {
        try {
            const options = {
                amount: amount * 100, // Razorpay expects amount in paise
                currency,
                receipt: receipt || `receipt_${Date.now()}`,
                notes: {
                    source: 'OnYourBehlf - Kerala Gifts Online'
                }
            };
            const order = await this.razorpay.orders.create(options);
            return order;
        }
        catch (error) {
            console.error('Error creating Razorpay order:', error);
            throw new Error(`Failed to create payment order: ${error.message}`);
        }
    }
    /**
     * Verify payment signature
     */
    verifyPayment(orderId, paymentId, signature) {
        try {
            const body = orderId + '|' + paymentId;
            const expectedSignature = crypto_1.default
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(body.toString())
                .digest('hex');
            return expectedSignature === signature;
        }
        catch (error) {
            console.error('Error verifying payment signature:', error);
            return false;
        }
    }
    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(body, signature) {
        try {
            const expectedSignature = crypto_1.default
                .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
                .update(body)
                .digest('hex');
            return expectedSignature === signature;
        }
        catch (error) {
            console.error('Error verifying webhook signature:', error);
            return false;
        }
    }
    /**
     * Get payment details
     */
    async getPaymentDetails(paymentId) {
        try {
            const payment = await this.razorpay.payments.fetch(paymentId);
            return payment;
        }
        catch (error) {
            console.error('Error fetching payment details:', error);
            throw new Error(`Failed to fetch payment details: ${error.message}`);
        }
    }
    /**
     * Get order details
     */
    async getOrderDetails(orderId) {
        try {
            const order = await this.razorpay.orders.fetch(orderId);
            return order;
        }
        catch (error) {
            console.error('Error fetching order details:', error);
            throw new Error(`Failed to fetch order details: ${error.message}`);
        }
    }
    /**
     * Capture payment
     */
    async capturePayment(paymentId, amount, currency) {
        try {
            const capture = await this.razorpay.payments.capture(paymentId, amount * 100, currency);
            return capture;
        }
        catch (error) {
            console.error('Error capturing payment:', error);
            throw new Error(`Failed to capture payment: ${error.message}`);
        }
    }
    /**
     * Refund payment
     */
    async refundPayment(paymentId, amount, notes) {
        try {
            const refundOptions = {
                payment_id: paymentId,
                notes: notes || { reason: 'Customer requested refund' }
            };
            if (amount) {
                refundOptions.amount = amount * 100; // Convert to paise
            }
            const refund = await this.razorpay.payments.refund(paymentId, refundOptions);
            return refund;
        }
        catch (error) {
            console.error('Error processing refund:', error);
            throw new Error(`Failed to process refund: ${error.message}`);
        }
    }
}
exports.default = new PaymentService();
