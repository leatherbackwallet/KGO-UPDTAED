"use strict";
/**
 * VendorProduct Model - Vendor-specific product pricing and tax information
 * Links vendors to products with custom pricing, HSN codes, and tax rates
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
exports.VendorProduct = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// VendorProduct schema definition
const vendorProductSchema = new mongoose_1.Schema({
    vendorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: [true, 'Vendor ID is required'],
        index: true
    },
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product ID is required'],
        index: true
    },
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price cannot be negative']
    },
    hsnCode: {
        type: String,
        required: [true, 'HSN code is required for GST compliance'],
        trim: true,
        match: [/^\d{4,8}$/, 'HSN code must be 4-8 digits']
    },
    taxRate: {
        type: Number,
        required: [true, 'Tax rate is required'],
        min: [0, 'Tax rate cannot be negative'],
        max: [100, 'Tax rate cannot exceed 100%'],
        enum: [0, 5, 12, 18, 28] // Common GST rates in India
    },
    stockType: {
        type: String,
        enum: ['infinite', 'finite', 'daily_capacity'],
        default: 'infinite'
    },
    stockLevel: {
        type: Number,
        min: [0, 'Stock level cannot be negative']
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true
});
// Compound index for vendor-product uniqueness and performance
vendorProductSchema.index({ vendorId: 1, productId: 1 }, { unique: true });
// Indexes for performance
vendorProductSchema.index({ productId: 1, isActive: 1 });
vendorProductSchema.index({ vendorId: 1, isActive: 1 });
vendorProductSchema.index({ price: 1 });
// Virtual for tax amount
vendorProductSchema.virtual('taxAmount').get(function () {
    return (this.price * this.taxRate) / 100;
});
// Virtual for total price with tax
vendorProductSchema.virtual('totalPrice').get(function () {
    return this.price + ((this.price * this.taxRate) / 100);
});
// Ensure virtual fields are serialized
vendorProductSchema.set('toJSON', { virtuals: true });
// Pre-save middleware to validate unique vendor-product combination
vendorProductSchema.pre('save', async function (next) {
    if (this.isNew || this.isModified('vendorId') || this.isModified('productId')) {
        const existing = await mongoose_1.default.model('VendorProduct').findOne({
            vendorId: this.vendorId,
            productId: this.productId,
            _id: { $ne: this._id }
        });
        if (existing) {
            return next(new Error('Vendor already has this product listed'));
        }
    }
    next();
});
exports.VendorProduct = mongoose_1.default.model('VendorProduct', vendorProductSchema);
