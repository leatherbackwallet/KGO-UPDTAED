"use strict";
/**
 * Shipments Model - Partial fulfillment and split shipments management
 * Manages individual shipments that fulfill parts of an order
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
exports.Shipment = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const shipmentItemSchema = new mongoose_1.Schema({
    orderItemId: {
        type: String,
        required: true
    },
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
});
const shipmentSchema = new mongoose_1.Schema({
    shipmentId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    orderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true
    },
    items: [shipmentItemSchema],
    deliveryRunId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'DeliveryRun',
        index: true
    },
    status: {
        type: String,
        enum: ['pending_fulfillment', 'in_transit', 'delivered', 'failed_delivery'],
        default: 'pending_fulfillment',
        index: true
    },
    trackingNumber: {
        type: String,
        trim: true
    },
    estimatedDeliveryDate: {
        type: Date
    },
    actualDeliveryDate: {
        type: Date
    },
    notes: {
        type: String,
        trim: true
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true
});
// Generate shipmentId before saving
shipmentSchema.pre('save', function (next) {
    if (this.isNew && !this.shipmentId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 5).toUpperCase();
        this.shipmentId = `SHP-${timestamp}-${random}`;
    }
    next();
});
// Indexes
shipmentSchema.index({ orderId: 1, status: 1 });
shipmentSchema.index({ deliveryRunId: 1, status: 1 });
shipmentSchema.index({ createdAt: -1 });
exports.Shipment = mongoose_1.default.model('Shipment', shipmentSchema);
