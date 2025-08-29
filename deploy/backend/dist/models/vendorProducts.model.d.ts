import mongoose, { Document } from 'mongoose';
export interface IVendorProduct extends Document {
    vendorId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    price: number;
    hsnCode: string;
    taxRate: number;
    stockType: 'infinite' | 'finite' | 'daily_capacity';
    stockLevel?: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const VendorProduct: mongoose.Model<IVendorProduct, {}, {}, {}, mongoose.Document<unknown, {}, IVendorProduct> & IVendorProduct & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=vendorProducts.model.d.ts.map