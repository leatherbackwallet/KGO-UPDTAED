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
exports.Product = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const productSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: false,
        unique: true,
        trim: true,
        lowercase: true
    },
    categories: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Category',
            required: true
        }],
    price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative'],
        validate: {
            validator: function (v) {
                return Number.isInteger(v);
            },
            message: 'Price must be a whole number'
        }
    },
    costPrice: {
        type: Number,
        required: true,
        min: [0, 'Cost price cannot be negative'],
        default: 0
    },
    stock: {
        type: Number,
        required: true,
        min: [0, 'Stock cannot be negative'],
        default: 200
    },
    images: [{
            type: String,
            trim: true,
            validate: {
                validator: function (v) {
                    if (v && v.startsWith('keralagiftsonline/products/')) {
                        return true;
                    }
                    return /^[a-zA-Z0-9._-]+$/.test(v);
                },
                message: 'Invalid image path format. Must be a Cloudinary public ID or valid filename.'
            }
        }],
    defaultImage: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                if (!v)
                    return true;
                if (v && v.startsWith('keralagiftsonline/products/')) {
                    return true;
                }
                return /^[a-zA-Z0-9._-]+$/.test(v);
            },
            message: 'Invalid image path format. Must be a Cloudinary public ID or valid filename.'
        }
    },
    occasions: [{
            type: String,
            trim: true,
            enum: [
                'DIWALI', 'ANNIVERSARY', 'BIRTHDAY', 'CONDOLENCES', 'CONGRATULATION',
                'FATHERS DAY', 'GET WELL SOON', 'HOUSE WARMING', 'JUST BECAUSE',
                'MISS YOU', 'NEW BORN', 'ONAM', 'SYMPATHY', 'THANK YOU',
                'TRADITIONAL', 'WEDDING'
            ]
        }],
    vendors: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Vendor'
        }],
    isFeatured: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    isCombo: {
        type: Boolean,
        default: false
    },
    comboBasePrice: {
        type: Number,
        min: [0, 'Combo base price cannot be negative'],
        default: 0,
        validate: {
            validator: function (v) {
                return Number.isInteger(v);
            },
            message: 'Combo base price must be a whole number'
        }
    },
    comboItems: [{
            name: {
                type: String,
                required: true,
                trim: true
            },
            unitPrice: {
                type: Number,
                required: true,
                min: [0, 'Unit price cannot be negative'],
                validate: {
                    validator: function (v) {
                        return Number.isInteger(v);
                    },
                    message: 'Unit price must be a whole number'
                }
            },
            defaultQuantity: {
                type: Number,
                required: true,
                min: [0, 'Default quantity cannot be negative'],
                default: 1
            },
            unit: {
                type: String,
                required: true,
                trim: true,
                enum: ['kg', 'set', 'piece', 'dozen', 'gram', 'liter', 'box', 'pack']
            }
        }]
}, {
    timestamps: true
});
productSchema.pre('save', async function (next) {
    if (!this.slug && this.name) {
        let baseSlug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        let slug = baseSlug;
        let counter = 1;
        while (await mongoose_1.default.model('Product').findOne({ slug, _id: { $ne: this._id } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        this.slug = slug;
    }
    next();
});
productSchema.index({ categories: 1 });
productSchema.index({ price: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ isFeatured: 1, createdAt: -1 });
productSchema.index({ isDeleted: 1 });
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ occasions: 1 });
productSchema.index({ vendors: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ updatedAt: -1 });
exports.Product = mongoose_1.default.model('Product', productSchema);
//# sourceMappingURL=products.model.js.map