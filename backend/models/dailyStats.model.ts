/**
 * DailyStats Model - Business Intelligence reporting and analytics
 * Tracks daily metrics, top performers, and provides data for business insights
 */

import mongoose, { Document, Schema } from 'mongoose';

// Top selling product interface
export interface ITopSellingProduct {
  productId: mongoose.Types.ObjectId;
  name: string;
  unitsSold: number;
}

// Top performing vendor interface
export interface ITopPerformingVendor {
  vendorId: mongoose.Types.ObjectId;
  storeName: string;
  totalRevenue: number;
}

// TypeScript interface for DailyStats document
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

// DailyStats schema definition
const dailyStatsSchema = new Schema<IDailyStats>(
  {
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
          type: Schema.Types.ObjectId,
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
        validator: function(products: ITopSellingProduct[]) {
          return products.length <= 10; // Limit to top 10
        },
        message: 'Cannot have more than 10 top selling products'
      }
    },
    topPerformingVendors: {
      type: [{
        vendorId: {
          type: Schema.Types.ObjectId,
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
        validator: function(vendors: ITopPerformingVendor[]) {
          return vendors.length <= 10; // Limit to top 10
        },
        message: 'Cannot have more than 10 top performing vendors'
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
dailyStatsSchema.index({ date: 1 });
dailyStatsSchema.index({ totalSales: -1 });
dailyStatsSchema.index({ totalOrders: -1 });
dailyStatsSchema.index({ newUsers: -1 });

// Compound index for date range queries
dailyStatsSchema.index({ date: 1, totalSales: -1 });

// Virtual for average order value
dailyStatsSchema.virtual('averageOrderValue').get(function(this: IDailyStats) {
  if (this.totalOrders > 0) {
    return this.totalSales / this.totalOrders;
  }
  return 0;
});

// Virtual for conversion rate (orders per user)
dailyStatsSchema.virtual('conversionRate').get(function(this: IDailyStats) {
  if (this.newUsers > 0) {
    return (this.totalOrders / this.newUsers) * 100;
  }
  return 0;
});

// Virtual for stats summary
dailyStatsSchema.virtual('summary').get(function(this: IDailyStats) {
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
dailyStatsSchema.pre('save', function(next) {
  // Ensure date is set to start of day
  if (this.date) {
    this.date = new Date(this.date.getFullYear(), this.date.getMonth(), this.date.getDate());
  }
  next();
});

// Pre-save middleware to sort top performers
dailyStatsSchema.pre('save', function(next) {
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
dailyStatsSchema.statics.getStatsForRange = function(startDate: Date, endDate: Date) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: 1 });
};

// Static method to get latest stats
dailyStatsSchema.statics.getLatestStats = function() {
  return this.findOne().sort({ date: -1 });
};

export const DailyStats = mongoose.model<IDailyStats>('DailyStats', dailyStatsSchema); 