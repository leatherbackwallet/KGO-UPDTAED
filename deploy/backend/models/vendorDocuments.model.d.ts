import mongoose, { Document } from 'mongoose';
export declare enum DocumentType {
    GSTIN = "GSTIN",
    FSSAI = "FSSAI",
    PAN = "PAN",
    BANK_ACCOUNT = "BANK_ACCOUNT"
}
export declare enum DocumentStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export interface IVendorDocument extends Document {
    vendorId: mongoose.Types.ObjectId;
    documentType: DocumentType;
    fileUrl: string;
    status: DocumentStatus;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const VendorDocument: mongoose.Model<IVendorDocument, {}, {}, {}, mongoose.Document<unknown, {}, IVendorDocument> & IVendorDocument & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=vendorDocuments.model.d.ts.map