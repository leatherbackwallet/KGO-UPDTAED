"use strict";
/**
 * Returns Model - Return Merchandise Authorization (RMA) workflows
 * Manages the complete return process from request to resolution
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
exports.Return = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const returnSchema = new mongoose_1.Schema({
    returnId: {
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
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderItems: [{
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
        }],
    reason: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['requested', 'approved', 'rejected', 'shipped_by_customer', 'received_at_hub', 'completed'],
        default: 'requested',
        index: true
    },
    resolution: {
        type: String,
        enum: ['refund', 'replacement'],
        description: 'The final outcome of the return'
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});
// Generate returnId before saving
returnSchema.pre('save', function (next) {
    if (this.isNew && !this.returnId) {
        this.returnId = `RMA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    }
    next();
});
// Indexes
returnSchema.index({ orderId: 1, status: 1 });
returnSchema.index({ userId: 1, status: 1 });
returnSchema.index({ createdAt: -1 });
exports.Return = mongoose_1.default.model('Return', returnSchema);
