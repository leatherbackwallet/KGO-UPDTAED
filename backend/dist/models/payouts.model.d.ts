import mongoose, { Document } from 'mongoose';
export declare enum PayoutStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    FAILED = "failed"
}
export interface IPayout extends Document {
    vendorId: mongoose.Types.ObjectId;
    amount: number;
    periodStartDate?: Date;
    periodEndDate?: Date;
    orderIds: mongoose.Types.ObjectId[];
    status: PayoutStatus;
    transactionReference?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Payout: mongoose.Model<IPayout, {}, {}, {}, mongoose.Document<unknown, {}, IPayout, {}, {}> & IPayout & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=payouts.model.d.ts.map