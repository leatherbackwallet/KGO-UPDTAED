import mongoose, { Document } from 'mongoose';
export declare enum ReviewType {
    PRODUCT = "product",
    VENDOR = "vendor",
    DELIVERY = "delivery"
}
export interface IReply {
    userId: mongoose.Types.ObjectId;
    comment: string;
    createdAt: Date;
}
export interface IReview extends Document {
    reviewType: ReviewType;
    productId?: mongoose.Types.ObjectId;
    vendorId?: mongoose.Types.ObjectId;
    deliveryAgentId?: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    orderId: mongoose.Types.ObjectId;
    rating: number;
    comment?: string;
    reply?: IReply;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Review: mongoose.Model<IReview, {}, {}, {}, mongoose.Document<unknown, {}, IReview> & IReview & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=reviews.model.d.ts.map