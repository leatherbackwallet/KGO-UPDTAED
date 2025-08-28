import mongoose, { Document } from 'mongoose';
export interface IReturn extends Document {
    returnId: string;
    orderId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    orderItems: Array<{
        productId: mongoose.Types.ObjectId;
        quantity: number;
    }>;
    reason: string;
    status: 'requested' | 'approved' | 'rejected' | 'shipped_by_customer' | 'received_at_hub' | 'completed';
    resolution?: 'refund' | 'replacement';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Return: mongoose.Model<IReturn, {}, {}, {}, mongoose.Document<unknown, {}, IReturn> & IReturn & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=returns.model.d.ts.map