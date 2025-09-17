import mongoose, { Document } from 'mongoose';
export interface IComboItemConfiguration {
    name: string;
    unitPrice: number;
    quantity: number;
    unit: string;
}
export interface IOrderItem {
    productId: mongoose.Types.ObjectId;
    quantity: number;
    price: number;
    personalizationOptions?: Record<string, any>;
    isCombo?: boolean;
    comboBasePrice?: number;
    comboItemConfigurations?: IComboItemConfiguration[];
}
export interface IShippingDetails {
    recipientName: string;
    recipientPhone: string;
    address: {
        streetName: string;
        houseNumber: string;
        postalCode: string;
        city: string;
        countryCode: string;
    };
    specialInstructions?: string;
}
export interface IStatusHistory {
    status: string;
    timestamp: Date;
    notes?: string;
    updatedBy?: mongoose.Types.ObjectId;
}
export interface IPaymentDetails {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    paymentStatus: 'pending' | 'captured' | 'failed' | 'refunded';
    paymentMethod?: string;
    paidAt?: Date;
    failedAt?: Date;
    refundedAt?: Date;
    refundAmount?: number;
    currency: string;
}
export interface IOrder extends Document {
    orderId: string;
    userId: mongoose.Types.ObjectId;
    requestedDeliveryDate: Date;
    shippingDetails: IShippingDetails;
    orderItems: IOrderItem[];
    totalPrice: number;
    orderStatus: 'pending_payment' | 'payment_verified' | 'payment_failed' | 'order_received' | 'collecting_items' | 'packing' | 'en_route' | 'delivered' | 'cancelled';
    statusHistory: IStatusHistory[];
    paymentDetails: IPaymentDetails;
    promotionId?: mongoose.Types.ObjectId;
    discountAmount: number;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Order: mongoose.Model<IOrder, {}, {}, {}, mongoose.Document<unknown, {}, IOrder> & IOrder & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=orders.model.d.ts.map