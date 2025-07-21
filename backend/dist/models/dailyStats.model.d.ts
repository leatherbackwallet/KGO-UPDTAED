import mongoose, { Document } from 'mongoose';
export interface ITopSellingProduct {
    productId: mongoose.Types.ObjectId;
    name: string;
    unitsSold: number;
}
export interface ITopPerformingVendor {
    vendorId: mongoose.Types.ObjectId;
    storeName: string;
    totalRevenue: number;
}
export interface IDailyStats extends Document {
    date: Date;
    totalSales: number;
    totalOrders: number;
    newUsers: number;
    topSellingProducts: ITopSellingProduct[];
    topPerformingVendors: ITopPerformingVendor[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const DailyStats: mongoose.Model<IDailyStats, {}, {}, {}, mongoose.Document<unknown, {}, IDailyStats, {}> & IDailyStats & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=dailyStats.model.d.ts.map