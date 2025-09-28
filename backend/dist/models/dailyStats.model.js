"use strict";
/**
 * DailyStats Model - Business Intelligence reporting and analytics
 * Tracks daily metrics, top performers, and provides data for business insights
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyStats = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// DailyStats schema definition
const dailyStatsSchema = new mongoose_1.Schema({
    date: {
        type: Date,
        required: [true, 'Date is required'],
        unique: true,
        index: true
    },
    totalSales: {
        type: Number,
        default: 0,
        min: [0, 'Total sales cannot be negative']
    },
    totalOrders: {
        type: Number,
        default: 0,
        min: [0, 'Total orders cannot be negative']
    },
    newUsers: {
        type: Number,
        default: 0,
        min: [0, 'New users cannot be negative']
    },
    topSellingProducts: {
        type: [{
                productId: {
                    type: mongoose_1.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true
                },
                name: {
                    type: String,
                    required: true,
                    trim: true,
                    maxlength: [200, 'Product name cannot exceed 200 characters']
                },
                unitsSold: {
                    type: Number,
                    required: true,
                    min: [0, 'Units sold cannot be negative']
                }
            }],
        default: [],
        validate: {
            validator: function (products) {
                return products.length <= 10; // Limit to top 10
            },
            message: 'Cannot have more than 10 top selling products'
        }
    },
    topPerformingVendors: {
        type: [{
                vendorId: {
                    type: mongoose_1.Schema.Types.ObjectId,
                    ref: 'Vendor',
                    required: true
                },
                storeName: {
                    type: String,
                    required: true,
                    trim: true,
                    maxlength: [100, 'Store name cannot exceed 100 characters']
                },
                totalRevenue: {
                    type: Number,
                    required: true,
                    min: [0, 'Total revenue cannot be negative']
                }
            }],
        default: [],
        validate: {
            validator: function (vendors) {
                return vendors.length <= 10; // Limit to top 10
            },
            message: 'Cannot have more than 10 top performing vendors'
        }
    }
}, {
    timestamps: true
});
// Indexes for performance
dailyStatsSchema.index({ date: 1 });
dailyStatsSchema.index({ totalSales: -1 });
dailyStatsSchema.index({ totalOrders: -1 });
dailyStatsSchema.index({ newUsers: -1 });
// Compound index for date range queries
dailyStatsSchema.index({ date: 1, totalSales: -1 });
// Virtual for average order value
dailyStatsSchema.virtual('averageOrderValue').get(function () {
    if (this.totalOrders > 0) {
        return this.totalSales / this.totalOrders;
    }
    return 0;
});
// Virtual for conversion rate (orders per user)
dailyStatsSchema.virtual('conversionRate').get(function () {
    if (this.newUsers > 0) {
        return (this.totalOrders / this.newUsers) * 100;
    }
    return 0;
});
// Virtual for stats summary
dailyStatsSchema.virtual('summary').get(function () {
    const averageOrderValue = this.totalOrders > 0 ? this.totalSales / this.totalOrders : 0;
    const conversionRate = this.newUsers > 0 ? (this.totalOrders / this.newUsers) * 100 : 0;
    return {
        date: this.date,
        totalSales: this.totalSales,
        totalOrders: this.totalOrders,
        newUsers: this.newUsers,
        averageOrderValue,
        conversionRate
    };
});
// Ensure virtual fields are serialized
dailyStatsSchema.set('toJSON', { virtuals: true });
// Pre-save middleware to validate date format
dailyStatsSchema.pre('save', function (next) {
    // Ensure date is set to start of day
    if (this.date) {
        this.date = new Date(this.date.getFullYear(), this.date.getMonth(), this.date.getDate());
    }
    next();
});
// Pre-save middleware to sort top performers
dailyStatsSchema.pre('save', function (next) {
    // Sort top selling products by units sold
    if (this.topSellingProducts) {
        this.topSellingProducts.sort((a, b) => b.unitsSold - a.unitsSold);
    }
    // Sort top performing vendors by revenue
    if (this.topPerformingVendors) {
        this.topPerformingVendors.sort((a, b) => b.totalRevenue - a.totalRevenue);
    }
    next();
});
// Static method to get stats for date range
dailyStatsSchema.statics.getStatsForRange = function (startDate, endDate) {
    return this.find({
        date: {
            $gte: startDate,
            $lte: endDate
        }
    }).sort({ date: 1 });
};
// Static method to get latest stats
dailyStatsSchema.statics.getLatestStats = function () {
    return this.findOne().sort({ date: -1 });
};
exports.DailyStats = mongoose_1.default.model('DailyStats', dailyStatsSchema);
