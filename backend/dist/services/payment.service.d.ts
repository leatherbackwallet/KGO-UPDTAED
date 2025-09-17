declare class PaymentService {
    createOrder(amount: number, currency: string): Promise<any>;
    verifyPayment(orderId: string, paymentId: string, signature: string): boolean;
    getPaymentDetails(paymentId: string): Promise<any>;
}
declare const _default: PaymentService;
export default _default;
//# sourceMappingURL=payment.service.d.ts.map