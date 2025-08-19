import mongoose, { Document } from 'mongoose';
export interface ICategory extends Document {
    name: {
        en: string;
        de: string;
    };
    slug: string;
    description?: {
        en: string;
        de: string;
    };
    parentCategory?: mongoose.Types.ObjectId;
    sortOrder: number;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Category: mongoose.Model<ICategory, {}, {}, {}, mongoose.Document<unknown, {}, ICategory, {}> & ICategory & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=categories.model.d.ts.map