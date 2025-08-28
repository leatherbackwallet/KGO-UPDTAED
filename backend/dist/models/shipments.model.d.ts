import mongoose, { Document } from 'mongoose';
export interface IShipmentItem {
    orderItemId: string;
    productId: mongoose.Types.ObjectId;
    quantity: number;
}
export interface IShipment extends Document {
    shipmentId: string;
    orderId: mongoose.Types.ObjectId;
    items: IShipmentItem[];
    deliveryRunId?: mongoose.Types.ObjectId;
    status: 'pending_fulfillment' | 'in_transit' | 'delivered' | 'failed_delivery';
    trackingNumber?: string;
    estimatedDeliveryDate?: Date;
    actualDeliveryDate?: Date;
    notes?: string;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Shipment: mongoose.Model<IShipment, {}, {}, {}, mongoose.Document<unknown, {}, IShipment> & IShipment & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=shipments.model.d.ts.map