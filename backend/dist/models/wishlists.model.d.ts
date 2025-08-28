import mongoose, { Document } from 'mongoose';
export interface IWishlist extends Document {
    userId: mongoose.Types.ObjectId;
    products: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const Wishlist: mongoose.Model<IWishlist, {}, {}, {}, mongoose.Document<unknown, {}, IWishlist> & IWishlist & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=wishlists.model.d.ts.map