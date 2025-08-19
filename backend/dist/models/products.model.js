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
        en: {
            type: String,
            required: true,
            trim: true
        },
        de: {
            type: String,
            required: true,
            trim: true
        }
    },
    description: {
        en: {
            type: String,
            required: true,
            trim: true
        },
        de: {
            type: String,
            required: true,
            trim: true
        }
    },
    slug: {
        type: String,
        required: true,
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
        min: [0, 'Price cannot be negative']
    },
    stock: {
        type: Number,
        required: true,
        min: [0, 'Stock cannot be negative']
    },
    images: [{
            type: String,
            trim: true
        }],
    defaultImage: {
        type: String,
        trim: true
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
    }
}, {
    timestamps: true
});
productSchema.pre('save', function (next) {
    if (this.isModified('name') && !this.slug) {
        const englishName = this.name.en || this.name.de;
        this.slug = englishName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    next();
});
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ categories: 1 });
productSchema.index({ vendors: 1 });
productSchema.index({ occasions: 1 });
productSchema.index({ isFeatured: 1, isDeleted: 1 });
productSchema.index({ 'name.en': 'text', 'name.de': 'text', 'description.en': 'text', 'description.de': 'text' });
productSchema.index({ occasions: 1 });
productSchema.index({ categories: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isFeatured: 1, createdAt: -1 });
productSchema.index({ slug: 1 });
exports.Product = mongoose_1.default.model('Product', productSchema);
//# sourceMappingURL=products.model.js.map