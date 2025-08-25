import mongoose, { Document } from 'mongoose';
export interface IProductAttribute extends Document {
    productId: mongoose.Types.ObjectId;
    attributeId: mongoose.Types.ObjectId;
    value: any;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ProductAttribute: mongoose.Model<IProductAttribute, {}, {}, {}, mongoose.Document<unknown, {}, IProductAttribute, {}> & IProductAttribute & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=productAttributes.model.d.ts.map