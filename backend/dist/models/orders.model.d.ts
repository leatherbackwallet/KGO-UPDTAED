import mongoose, { Document } from 'mongoose';
export interface IOrderItem {
    productId: mongoose.Types.ObjectId;
    quantity: number;
    price: number;
    personalizationOptions?: Record<string, any>;
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
export interface IOrder extends Document {
    orderId: string;
    userId: mongoose.Types.ObjectId;
    requestedDeliveryDate: Date;
    shippingDetails: IShippingDetails;
    orderItems: IOrderItem[];
    totalPrice: number;
    orderStatus: 'payment_done' | 'order_received' | 'collecting_items' | 'packing' | 'en_route' | 'delivered' | 'cancelled';
    statusHistory: IStatusHistory[];
    promotionId?: mongoose.Types.ObjectId;
    discountAmount: number;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Order: mongoose.Model<IOrder, {}, {}, {}, mongoose.Document<unknown, {}, IOrder, {}, {}> & IOrder & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=orders.model.d.ts.map