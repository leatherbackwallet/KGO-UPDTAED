import mongoose, { Document } from 'mongoose';
export declare enum DeliveryRunStatus {
    PLANNING = "planning",
    COLLECTING_ITEMS = "collecting_items",
    AT_HUB_PACKING = "at_hub_packing",
    OUT_FOR_DELIVERY = "out_for_delivery",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare enum StopType {
    PICKUP = "pickup",
    HUB = "hub",
    DROPOFF = "dropoff"
}
export declare enum StopStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    SKIPPED = "skipped"
}
export interface IRouteStop {
    stopType: StopType;
    location: {
        address: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
    relatedDocument: {
        modelName: 'Vendor' | 'Hub' | 'Order';
        docId: mongoose.Types.ObjectId;
    };
    status: StopStatus;
    estimatedTime?: Date;
    actualTime?: Date;
    notes?: string;
}
export interface IDeliveryRun extends Document {
    runId: string;
    deliveryAgentId: mongoose.Types.ObjectId;
    assignedHubId: mongoose.Types.ObjectId;
    status: DeliveryRunStatus;
    orders: mongoose.Types.ObjectId[];
    routePlan: IRouteStop[];
    estimatedStartTime?: Date;
    actualStartTime?: Date;
    estimatedCompletionTime?: Date;
    actualCompletionTime?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const DeliveryRun: mongoose.Model<IDeliveryRun, {}, {}, {}, mongoose.Document<unknown, {}, IDeliveryRun> & IDeliveryRun & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=deliveryRuns.model.d.ts.map