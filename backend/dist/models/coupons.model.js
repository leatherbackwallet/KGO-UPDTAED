"use strict";
/**
 * Coupon Model - Promotional coupon and discount management
 * Handles percentage, fixed amount, and free shipping coupons with validation rules
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
exports.Coupon = exports.CouponType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Coupon type enum
var CouponType;
(function (CouponType) {
    CouponType["PERCENTAGE"] = "percentage";
    CouponType["FIXED_AMOUNT"] = "fixed_amount";
    CouponType["FREE_SHIPPING"] = "free_shipping";
})(CouponType || (exports.CouponType = CouponType = {}));
// Coupon schema definition
const couponSchema = new mongoose_1.Schema({
    code: {
        type: String,
        required: [true, 'Coupon code is required'],
        unique: true,
        uppercase: true,
        trim: true,
        match: [/^[A-Z0-9]+$/, 'Coupon code can only contain uppercase letters and numbers'],
        minlength: [3, 'Coupon code must be at least 3 characters'],
        maxlength: [20, 'Coupon code cannot exceed 20 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Coupon description cannot exceed 500 characters']
    },
    type: {
        type: String,
        enum: Object.values(CouponType),
        required: [true, 'Coupon type is required']
    },
    value: {
        type: Number,
        required: [true, 'Coupon value is required'],
        min: [0, 'Coupon value cannot be negative'],
        validate: {
            validator: function (value) {
                if (this.type === CouponType.PERCENTAGE) {
                    return value >= 0 && value <= 100;
                }
                return value >= 0;
            },
            message: 'Percentage coupons must be between 0 and 100, other types must be positive'
        }
    },
    minOrderAmount: {
        type: Number,
        min: [0, 'Minimum order amount cannot be negative']
    },
    validUntil: {
        type: Date,
        required: [true, 'Coupon expiry date is required'],
        validate: {
            validator: function (date) {
                return date > new Date();
            },
            message: 'Coupon expiry date must be in the future'
        }
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true
});
// Indexes for performance
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, validUntil: 1 });
couponSchema.index({ type: 1, isActive: 1 });
// Virtual for discount calculation
couponSchema.virtual('calculateDiscount').get(function (orderAmount) {
    if (!this.isActive || new Date() > this.validUntil) {
        return 0;
    }
    if (this.minOrderAmount && orderAmount < this.minOrderAmount) {
        return 0;
    }
    switch (this.type) {
        case CouponType.PERCENTAGE:
            return (orderAmount * this.value) / 100;
        case CouponType.FIXED_AMOUNT:
            return Math.min(this.value, orderAmount);
        case CouponType.FREE_SHIPPING:
            return 0; // Free shipping logic handled separately
        default:
            return 0;
    }
});
// Virtual for coupon status
couponSchema.virtual('isValid').get(function () {
    return this.isActive && new Date() < this.validUntil;
});
// Ensure virtual fields are serialized
couponSchema.set('toJSON', { virtuals: true });
// Pre-save middleware to validate coupon code uniqueness
couponSchema.pre('save', async function (next) {
    if (this.isNew || this.isModified('code')) {
        const existing = await mongoose_1.default.model('Coupon').findOne({
            code: this.code,
            _id: { $ne: this._id }
        });
        if (existing) {
            return next(new Error('Coupon code already exists'));
        }
    }
    next();
});
exports.Coupon = mongoose_1.default.model('Coupon', couponSchema);
