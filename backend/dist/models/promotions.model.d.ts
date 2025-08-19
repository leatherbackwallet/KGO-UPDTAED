import mongoose, { Document } from 'mongoose';
export interface IPromotionCondition {
    type: string;
    config: Record<string, any>;
}
export interface IPromotionAction {
    type: string;
    config: Record<string, any>;
}
export interface IPromotion extends Document {
    name: string;
    code?: string;
    conditions: IPromotionCondition[];
    actions: IPromotionAction[];
    startDate?: Date;
    endDate?: Date;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Promotion: mongoose.Model<IPromotion, {}, {}, {}, mongoose.Document<unknown, {}, IPromotion, {}> & IPromotion & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=promotions.model.d.ts.map