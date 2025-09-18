"use strict";
/**
 * Review Model - Product and vendor review management
 * Handles customer reviews, ratings, and vendor replies for products and vendors
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
exports.Review = exports.ReviewType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Review type enum
var ReviewType;
(function (ReviewType) {
    ReviewType["PRODUCT"] = "product";
    ReviewType["VENDOR"] = "vendor";
    ReviewType["DELIVERY"] = "delivery";
})(ReviewType || (exports.ReviewType = ReviewType = {}));
// Review schema definition
const reviewSchema = new mongoose_1.Schema({
    reviewType: {
        type: String,
        enum: Object.values(ReviewType),
        required: [true, 'Review type is required'],
        index: true
    },
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Product',
        index: true,
        required: function () {
            return this.reviewType === ReviewType.PRODUCT;
        }
    },
    vendorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Vendor',
        index: true,
        required: function () {
            return this.reviewType === ReviewType.VENDOR;
        }
    },
    deliveryAgentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
        required: function () {
            return this.reviewType === ReviewType.DELIVERY;
        }
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    orderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Order',
        required: [true, 'Order ID is required'],
        index: true
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
    },
    comment: {
        type: String,
        trim: true,
        maxlength: [1000, 'Review comment cannot exceed 1000 characters']
    },
    reply: {
        userId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        comment: {
            type: String,
            required: true,
            trim: true,
            maxlength: [500, 'Reply comment cannot exceed 500 characters']
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }
}, {
    timestamps: true
});
// Indexes for performance
reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ vendorId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, reviewType: 1 });
reviewSchema.index({ rating: 1 });
// Compound index to prevent duplicate reviews
reviewSchema.index({
    userId: 1,
    orderId: 1,
    reviewType: 1,
    productId: 1
}, {
    unique: true,
    partialFilterExpression: { productId: { $exists: true } }
});
reviewSchema.index({
    userId: 1,
    orderId: 1,
    reviewType: 1,
    vendorId: 1
}, {
    unique: true,
    partialFilterExpression: { vendorId: { $exists: true } }
});
// Pre-save middleware to validate review type and required fields
reviewSchema.pre('save', function (next) {
    if (this.reviewType === ReviewType.PRODUCT && !this.productId) {
        return next(new Error('Product ID is required for product reviews'));
    }
    if (this.reviewType === ReviewType.VENDOR && !this.vendorId) {
        return next(new Error('Vendor ID is required for vendor reviews'));
    }
    if (this.reviewType === ReviewType.DELIVERY && !this.deliveryAgentId) {
        return next(new Error('Delivery agent ID is required for delivery reviews'));
    }
    next();
});
// Virtual for review summary
reviewSchema.virtual('summary').get(function () {
    if (this.comment && this.comment.length > 100) {
        return this.comment.substring(0, 100) + '...';
    }
    return this.comment;
});
// Ensure virtual fields are serialized
reviewSchema.set('toJSON', { virtuals: true });
exports.Review = mongoose_1.default.model('Review', reviewSchema);
