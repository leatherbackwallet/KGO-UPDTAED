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
exports.Hub = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const hubSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Hub name is required'],
        unique: true,
        trim: true,
        maxlength: [100, 'Hub name cannot exceed 100 characters'],
        description: 'e.g., Eschweiler Central Hub'
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
            trim: true,
            default: 'Eschweiler'
        },
        state: {
            type: String,
            required: [true, 'State is required'],
            trim: true,
            default: 'North Rhine-Westphalia'
        },
        postalCode: {
            type: String,
            required: [true, 'Postal code is required'],
            trim: true
        }
    },
    operatingHours: {
        type: String,
        trim: true,
        description: 'e.g., 9:00 AM - 6:00 PM'
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true
});
hubSchema.index({ name: 1 });
hubSchema.index({ 'address.city': 1, 'address.state': 1 });
hubSchema.index({ isActive: 1 });
hubSchema.virtual('fullAddress').get(function () {
    const addr = this.address;
    return `${addr.street}, ${addr.city}, ${addr.state} - ${addr.postalCode}`;
});
hubSchema.virtual('summary').get(function () {
    return `${this.name} - ${this.address.city}, ${this.address.state}`;
});
hubSchema.set('toJSON', { virtuals: true });
hubSchema.pre('save', function (next) {
    if (this.address.postalCode && !/^\d{5}$/.test(this.address.postalCode)) {
        return next(new Error('Postal code must be 5 digits'));
    }
    next();
});
exports.Hub = mongoose_1.default.model('Hub', hubSchema);
//# sourceMappingURL=hubs.model.js.map