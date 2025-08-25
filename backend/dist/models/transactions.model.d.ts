import mongoose, { Document } from 'mongoose';
export declare enum TransactionType {
    CAPTURE = "capture",
    REFUND = "refund"
}
export declare enum TransactionStatus {
    SUCCESS = "success",
    FAILED = "failed"
}
export interface ITransaction extends Document {
    orderId?: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    amount: number;
    gatewayTransactionId?: string;
    type: TransactionType;
    status: TransactionStatus;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Transaction: mongoose.Model<ITransaction, {}, {}, {}, mongoose.Document<unknown, {}, ITransaction, {}> & ITransaction & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=transactions.model.d.ts.map