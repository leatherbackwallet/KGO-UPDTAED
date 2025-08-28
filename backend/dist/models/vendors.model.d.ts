import mongoose, { Document } from 'mongoose';
export declare enum VendorStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    PENDING_APPROVAL = "pending_approval",
    REJECTED = "rejected"
}
export interface IVendorAddress {
    street: string;
    city: string;
    state: string;
    postalCode: string;
}
export interface IVendor extends Document {
    ownerId: mongoose.Types.ObjectId;
    storeName: string;
    status: VendorStatus;
    address: IVendorAddress;
    serviceablePincodes: string[];
    averageRating: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Vendor: mongoose.Model<IVendor, {}, {}, {}, mongoose.Document<unknown, {}, IVendor, {}, {}> & IVendor & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=vendors.model.d.ts.map