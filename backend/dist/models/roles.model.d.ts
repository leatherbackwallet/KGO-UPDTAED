import mongoose, { Document } from 'mongoose';
export interface IRole extends Document {
    name: string;
    description?: string;
    permissions: string[];
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Role: mongoose.Model<IRole, {}, {}, {}, mongoose.Document<unknown, {}, IRole> & IRole & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=roles.model.d.ts.map