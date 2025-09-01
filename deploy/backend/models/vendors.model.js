"use strict";
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
exports.Vendor = exports.VendorStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var VendorStatus;
(function (VendorStatus) {
    VendorStatus["ACTIVE"] = "active";
    VendorStatus["INACTIVE"] = "inactive";
    VendorStatus["PENDING_APPROVAL"] = "pending_approval";
    VendorStatus["REJECTED"] = "rejected";
})(VendorStatus || (exports.VendorStatus = VendorStatus = {}));
const vendorSchema = new mongoose_1.Schema({
    ownerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Vendor owner is required'],
        index: true
    },
    storeName: {
        type: String,
        required: [true, 'Store name is required'],
        unique: true,
        trim: true,
        maxlength: [100, 'Store name cannot exceed 100 characters']
    },
    status: {
        type: String,
        enum: Object.values(VendorStatus),
        required: [true, 'Vendor status is required'],
        default: VendorStatus.PENDING_APPROVAL,
        index: true
    },
    address: {
        street: {
            type: String,
            required: [true, 'Street address is required'],
            trim: true
        },
        city: {
            type: String,
            required: [true, 'City is required'],
            trim: true
        },
        state: {
            type: String,
            required: [true, 'State is required'],
            trim: true
        },
        postalCode: {
            type: String,
            required: [true, 'Postal code is required'],
            trim: true,
            match: [/^\d{6}$/, 'Postal code must be 6 digits']
        }
    },
    serviceablePincodes: {
        type: [String],
        required: [true, 'At least one serviceable pincode is required'],
        index: true,
        validate: {
            validator: function (pincodes) {
                return pincodes.length > 0 && pincodes.every(pincode => /^\d{6}$/.test(pincode));
            },
            message: 'All pincodes must be 6 digits and at least one is required'
        }
    },
    averageRating: {
        type: Number,
        default: 0,
        min: [0, 'Rating cannot be negative'],
        max: [5, 'Rating cannot exceed 5']
    }
}, {
    timestamps: true
});
vendorSchema.index({ storeName: 1 });
vendorSchema.index({ status: 1, averageRating: -1 });
vendorSchema.index({ 'address.city': 1, 'address.state': 1 });
vendorSchema.virtual('fullAddress').get(function () {
    const addr = this.address;
    return `${addr.street}, ${addr.city}, ${addr.state} - ${addr.postalCode}`;
});
vendorSchema.set('toJSON', { virtuals: true });
exports.Vendor = mongoose_1.default.model('Vendor', vendorSchema);
//# sourceMappingURL=vendors.model.js.map