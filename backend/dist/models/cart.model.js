"use strict";
/**
 * Cart Model - Shopping cart management
 * Handles user cart persistence and guest cart merging
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
exports.Cart = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const comboItemConfigurationSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    unit: {
        type: String,
        required: true,
        trim: true
    },
    defaultQuantity: {
        type: Number,
        min: 0
    }
}, { _id: false });
const cartItemSchema = new mongoose_1.Schema({
    productId: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    image: {
        type: String,
        required: true,
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    stock: {
        type: Number,
        required: true,
        min: 0
    },
    isCombo: {
        type: Boolean,
        default: false
    },
    comboBasePrice: {
        type: Number,
        min: 0,
        default: 0
    },
    comboItemConfigurations: [comboItemConfigurationSchema]
}, { _id: false });
const cartSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    items: [cartItemSchema],
    totalItems: {
        type: Number,
        default: 0,
        min: 0
    },
    totalPrice: {
        type: Number,
        default: 0,
        min: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expireAfterSeconds: 0 } // TTL index
    },
    isGuest: {
        type: Boolean,
        default: false,
        index: true
    },
    sessionId: {
        type: String,
        trim: true,
        index: true
    }
}, {
    timestamps: true,
    collection: 'carts'
});
// Indexes for performance
cartSchema.index({ userId: 1, isGuest: 1 });
cartSchema.index({ sessionId: 1, isGuest: 1 });
cartSchema.index({ expiresAt: 1 });
// Pre-save middleware to calculate totals
cartSchema.pre('save', function (next) {
    this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
    this.totalPrice = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    this.lastUpdated = new Date();
    next();
});
// Static method to find or create cart
cartSchema.statics.findOrCreateCart = async function (userId, isGuest = false, sessionId) {
    const query = isGuest ? { sessionId, isGuest: true } : { userId, isGuest: false };
    let cart = await this.findOne(query);
    if (!cart) {
        const expirationDays = isGuest ? 7 : 30; // Guest carts expire in 7 days, user carts in 30 days
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expirationDays);
        cart = new this({
            userId,
            items: [],
            isGuest,
            sessionId,
            expiresAt
        });
        await cart.save();
    }
    return cart;
};
// Method to add item to cart
cartSchema.methods.addItem = function (item) {
    const existingItemIndex = this.items.findIndex((cartItem) => cartItem.productId === item.productId);
    if (existingItemIndex >= 0) {
        // Update existing item
        this.items[existingItemIndex].quantity += item.quantity;
    }
    else {
        // Add new item
        this.items.push(item);
    }
    return this.save();
};
// Method to remove item from cart
cartSchema.methods.removeItem = function (productId) {
    this.items = this.items.filter((item) => item.productId !== productId);
    return this.save();
};
// Method to update item quantity
cartSchema.methods.updateItemQuantity = function (productId, quantity) {
    const item = this.items.find((cartItem) => cartItem.productId === productId);
    if (item) {
        if (quantity <= 0) {
            return this.removeItem(productId);
        }
        else {
            item.quantity = quantity;
            return this.save();
        }
    }
    return Promise.resolve(this);
};
// Method to clear cart
cartSchema.methods.clearCart = function () {
    this.items = [];
    return this.save();
};
// Method to merge with another cart
cartSchema.methods.mergeCart = function (otherCart) {
    otherCart.items.forEach((item) => {
        this.addItem(item);
    });
    return this.save();
};
exports.Cart = mongoose_1.default.model('Cart', cartSchema);
