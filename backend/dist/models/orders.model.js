"use strict";
/**
 * Orders Model - Parent order management with shipment and promotion support
 * Orders can be fulfilled by one or more shipments
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
exports.Order = void 0;
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
    }
});
const orderItemSchema = new mongoose_1.Schema({
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    personalizationOptions: {
        type: mongoose_1.Schema.Types.Mixed
    },
    // Combo-specific fields
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
});
const shippingDetailsSchema = new mongoose_1.Schema({
    recipientName: {
        type: String,
        required: true,
        trim: true
    },
    recipientPhone: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        streetName: {
            type: String,
            required: true,
            trim: true
        },
        houseNumber: {
            type: String,
            required: false,
            trim: true
        },
        postalCode: {
            type: String,
            required: true,
            trim: true
        },
        city: {
            type: String,
            required: true,
            trim: true
        },
        countryCode: {
            type: String,
            required: true,
            default: 'DE'
        }
    },
    specialInstructions: {
        type: String,
        trim: true
    }
});
const statusHistorySchema = new mongoose_1.Schema({
    status: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String,
        trim: true
    },
    updatedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    }
});
const orderSchema = new mongoose_1.Schema({
    orderId: {
        type: String,
        unique: true
    },
    userId: {
        type: mongoose_1.Schema.Types.Mixed, // Allow both ObjectId and string for guest users
        required: true
    },
    requestedDeliveryDate: {
        type: Date,
        required: false // Make optional for guest users
    },
    shippingDetails: {
        type: shippingDetailsSchema,
        required: false // Make optional for guest users
    },
    orderItems: [orderItemSchema],
    totalPrice: {
        type: Number,
        required: false, // Make optional, will be calculated
        min: 0
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'payment_done', 'order_received', 'collecting_items', 'packing', 'en_route', 'delivered', 'cancelled'],
        default: 'pending'
    },
    statusHistory: [statusHistorySchema],
    promotionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Promotion'
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    // Razorpay payment fields
    razorpayOrderId: {
        type: String,
        trim: true
    },
    razorpayPaymentId: {
        type: String,
        trim: true
    },
    razorpaySignature: {
        type: String,
        trim: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'captured', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentDate: {
        type: Date
    },
    paymentVerifiedAt: {
        type: Date
    },
    // Comprehensive Razorpay transaction tracking
    razorpayPaymentDetails: {
        type: mongoose_1.Schema.Types.Mixed
    },
    razorpayOrderDetails: {
        type: mongoose_1.Schema.Types.Mixed
    },
    // Additional tracking fields for better transaction monitoring
    transactionId: {
        type: String,
        trim: true
    },
    paymentMethod: {
        type: String,
        trim: true
    },
    paymentGateway: {
        type: String,
        default: 'razorpay'
    },
    currency: {
        type: String,
        default: 'INR'
    },
    amountPaid: {
        type: Number,
        min: 0
    },
    amountRefunded: {
        type: Number,
        default: 0,
        min: 0
    },
    refundStatus: {
        type: String,
        enum: ['none', 'partial', 'full'],
        default: 'none'
    },
    refundDetails: {
        type: mongoose_1.Schema.Types.Mixed
    },
    failureReason: {
        type: String
    },
    stockRestored: {
        type: Boolean,
        default: false
    },
    // Webhook tracking
    webhookReceived: {
        type: Boolean,
        default: false
    },
    webhookEvents: [{
            event: String,
            timestamp: Date,
            data: mongoose_1.Schema.Types.Mixed
        }]
}, {
    timestamps: true
});
// Generate orderId before saving
orderSchema.pre('save', function (next) {
    if (this.isNew && !this.orderId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 5).toUpperCase();
        this.orderId = `ORD-${timestamp}-${random}`;
    }
    next();
});
// Add status to history when status changes
orderSchema.pre('save', function (next) {
    if (this.isModified('orderStatus')) {
        this.statusHistory.push({
            status: this.orderStatus,
            timestamp: new Date()
        });
    }
    next();
});
// Indexes
orderSchema.index({ userId: 1 });
orderSchema.index({ orderStatus: 1, isDeleted: 1 });
orderSchema.index({ requestedDeliveryDate: 1 });
orderSchema.index({ promotionId: 1 });
orderSchema.index({ createdAt: -1 });
exports.Order = mongoose_1.default.model('Order', orderSchema);
