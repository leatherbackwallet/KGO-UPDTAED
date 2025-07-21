import mongoose, { Document } from 'mongoose';
export interface IProduct extends Document {
    name: {
        en: string;
        de: string;
    };
    description: {
        en: string;
        de: string;
    };
    slug: string;
    category: mongoose.Types.ObjectId;
    images?: string[];
    defaultImage?: string;
    isFeatured: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Product: mongoose.Model<IProduct, {}, {}, {}, mongoose.Document<unknown, {}, IProduct, {}> & IProduct & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=products.model.d.ts.map