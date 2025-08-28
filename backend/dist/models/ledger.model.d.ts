import mongoose, { Document } from 'mongoose';
export declare enum LedgerType {
    INCOME = "income",
    EXPENSE = "expense"
}
export declare enum LedgerCategory {
    SALES_REVENUE = "sales_revenue",
    DELIVERY_FEE = "delivery_fee",
    VENDOR_PAYOUT = "vendor_payout",
    PAYMENT_GATEWAY_FEE = "payment_gateway_fee",
    MARKETING = "marketing",
    REFUND = "refund",
    SALARIES = "salaries",
    OTHER = "other"
}
export interface IRelatedDocument {
    modelName: string;
    docId: mongoose.Types.ObjectId;
}
export interface ILedger extends Document {
    date: Date;
    type: LedgerType;
    category: LedgerCategory;
    description?: string;
    amount: number;
    relatedDocument?: IRelatedDocument;
    recordedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Ledger: mongoose.Model<ILedger, {}, {}, {}, mongoose.Document<unknown, {}, ILedger, {}, {}> & ILedger & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=ledger.model.d.ts.map