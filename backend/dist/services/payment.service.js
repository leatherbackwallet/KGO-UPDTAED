"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PaymentService {
    async createOrder(amount, currency) {
        return {
            id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount: amount * 100,
            currency,
            status: 'created'
        };
    }
    verifyPayment(orderId, paymentId, signature) {
        return true;
    }
    async getPaymentDetails(paymentId) {
        return {
            id: paymentId,
            status: 'captured',
            amount: 0,
            currency: 'INR'
        };
    }
}
exports.default = new PaymentService();
//# sourceMappingURL=payment.service.js.map