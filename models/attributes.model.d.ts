import mongoose, { Document } from 'mongoose';
export interface IAttributeOption {
    label: {
        en: string;
        de: string;
    };
    value: string;
}
export interface IAttribute extends Document {
    name: {
        en: string;
        de: string;
    };
    type: 'text' | 'dropdown' | 'checkbox_group' | 'number' | 'boolean';
    options?: IAttributeOption[];
    isRequired: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Attribute: mongoose.Model<IAttribute, {}, {}, {}, mongoose.Document<unknown, {}, IAttribute> & IAttribute & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=attributes.model.d.ts.map