export interface PaymentOrderData {
    amount: number;
    currency: string;
    receipt: string;
    notes?: Record<string, any>;
}
export interface PaymentVerificationData {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}
export interface WebhookEvent {
    event: string;
    created_at: number;
    payload: {
        payment: {
            entity: {
                id: string;
                amount: number;
                currency: string;
                status: string;
                order_id: string;
                method: string;
                created_at: number;
            };
        };
        order: {
            entity: {
                id: string;
                amount: number;
                currency: string;
                status: string;
                receipt: string;
                created_at: number;
            };
        };
    };
}
declare class PaymentService {
    private razorpay;
    private webhookSecret;
    constructor();
    createPaymentOrder(data: PaymentOrderData): Promise<{
        success: boolean;
        data: {
            id: string;
            amount: string | number;
            currency: string;
            receipt: string | undefined;
            status: "created" | "attempted" | "paid";
            created_at: number;
        };
        error?: never;
    } | {
        success: boolean;
        error: {
            message: string;
            code: string;
            details: any;
        };
        data?: never;
    }>;
    verifyPaymentSignature(data: PaymentVerificationData): boolean;
    verifyWebhookSignature(body: string, signature: string): boolean;
    processWebhookEvent(event: WebhookEvent): Promise<void>;
    private handlePaymentCaptured;
    private handlePaymentFailed;
    private handleOrderPaid;
    getPaymentDetails(orderId: string): Promise<import("../models/orders.model").IPaymentDetails | null>;
}
declare const _default: PaymentService;
export default _default;
//# sourceMappingURL=payment.service.d.ts.map