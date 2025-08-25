import mongoose, { Document } from 'mongoose';
export interface IWishlist extends Document {
    userId: mongoose.Types.ObjectId;
    products: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const Wishlist: mongoose.Model<IWishlist, {}, {}, {}, mongoose.Document<unknown, {}, IWishlist, {}> & IWishlist & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=wishlists.model.d.ts.map