"use strict";
/**
 * Payout Model - Vendor payout management and tracking
 * Handles vendor earnings, payout periods, and transaction references
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
exports.Payout = exports.PayoutStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Payout status enum
var PayoutStatus;
(function (PayoutStatus) {
    PayoutStatus["PENDING"] = "pending";
    PayoutStatus["COMPLETED"] = "completed";
    PayoutStatus["FAILED"] = "failed";
})(PayoutStatus || (exports.PayoutStatus = PayoutStatus = {}));
// Payout schema definition
const payoutSchema = new mongoose_1.Schema({
    vendorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: [true, 'Vendor ID is required'],
        index: true
    },
    amount: {
        type: Number,
        required: [true, 'Payout amount is required'],
        min: [0, 'Payout amount cannot be negative']
    },
    periodStartDate: {
        type: Date,
        index: true
    },
    periodEndDate: {
        type: Date,
        index: true
    },
    orderIds: {
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: 'Order',
        default: [],
        index: true
    },
    status: {
        type: String,
        enum: Object.values(PayoutStatus),
        required: [true, 'Payout status is required'],
        default: PayoutStatus.PENDING,
        index: true
    },
    transactionReference: {
        type: String,
        trim: true,
        unique: true,
        sparse: true
    }
}, {
    timestamps: true
});
// Indexes for performance
payoutSchema.index({ vendorId: 1, status: 1 });
payoutSchema.index({ periodStartDate: 1, periodEndDate: 1 });
payoutSchema.index({ status: 1, createdAt: -1 });
// Compound index for vendor period queries
payoutSchema.index({ vendorId: 1, periodStartDate: 1, periodEndDate: 1 });
// Virtual for period duration
payoutSchema.virtual('periodDuration').get(function () {
    if (this.periodStartDate && this.periodEndDate) {
        const duration = this.periodEndDate.getTime() - this.periodStartDate.getTime();
        return Math.ceil(duration / (1000 * 60 * 60 * 24)); // Days
    }
    return null;
});
// Virtual for payout summary
payoutSchema.virtual('summary').get(function () {
    return `Payout ${this.status.toUpperCase()} - ₹${this.amount} - ${this.orderIds.length} orders`;
});
// Virtual for is completed
payoutSchema.virtual('isCompleted').get(function () {
    return this.status === PayoutStatus.COMPLETED;
});
// Ensure virtual fields are serialized
payoutSchema.set('toJSON', { virtuals: true });
// Pre-save middleware to validate payout data
payoutSchema.pre('save', function (next) {
    // If period dates are provided, end date should be after start date
    if (this.periodStartDate && this.periodEndDate) {
        if (this.periodEndDate <= this.periodStartDate) {
            return next(new Error('Period end date must be after start date'));
        }
    }
    // For completed payouts, transaction reference should be present
    if (this.status === PayoutStatus.COMPLETED && !this.transactionReference) {
        return next(new Error('Transaction reference is required for completed payouts'));
    }
    next();
});
exports.Payout = mongoose_1.default.model('Payout', payoutSchema);
