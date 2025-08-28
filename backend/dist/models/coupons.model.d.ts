import mongoose, { Document } from 'mongoose';
export declare enum CouponType {
    PERCENTAGE = "percentage",
    FIXED_AMOUNT = "fixed_amount",
    FREE_SHIPPING = "free_shipping"
}
export interface ICoupon extends Document {
    code: string;
    description?: string;
    type: CouponType;
    value: number;
    minOrderAmount?: number;
    validUntil: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Coupon: mongoose.Model<ICoupon, {}, {}, {}, mongoose.Document<unknown, {}, ICoupon, {}, {}> & ICoupon & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=coupons.model.d.ts.map