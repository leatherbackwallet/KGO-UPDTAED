import mongoose, { Document } from 'mongoose';
export interface IComboItem {
    name: string;
    unitPrice: number;
    defaultQuantity: number;
    unit: string;
}
export interface IProduct extends Document {
    name: string;
    description: string;
    slug: string;
    categories: mongoose.Types.ObjectId[];
    price: number;
    costPrice: number;
    stock: number;
    images?: string[];
    defaultImage?: string;
    occasions?: string[];
    vendors?: mongoose.Types.ObjectId[];
    isFeatured: boolean;
    isDeleted: boolean;
    isCombo: boolean;
    comboBasePrice?: number;
    comboItems?: IComboItem[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const Product: mongoose.Model<IProduct, {}, {}, {}, mongoose.Document<unknown, {}, IProduct> & IProduct & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=products.model.d.ts.map