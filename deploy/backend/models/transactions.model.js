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
exports.Transaction = exports.TransactionStatus = exports.TransactionType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var TransactionType;
(function (TransactionType) {
    TransactionType["CAPTURE"] = "capture";
    TransactionType["REFUND"] = "refund";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["SUCCESS"] = "success";
    TransactionStatus["FAILED"] = "failed";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
const transactionSchema = new mongoose_1.Schema({
    orderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Order',
        index: true
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    amount: {
        type: Number,
        required: [true, 'Transaction amount is required'],
        min: [0, 'Transaction amount cannot be negative']
    },
    gatewayTransactionId: {
        type: String,
        trim: true,
        index: true
    },
    type: {
        type: String,
        enum: Object.values(TransactionType),
        required: [true, 'Transaction type is required'],
        index: true
    },
    status: {
        type: String,
        enum: Object.values(TransactionStatus),
        required: [true, 'Transaction status is required'],
        default: TransactionStatus.FAILED,
        index: true
    }
}, {
    timestamps: true
});
transactionSchema.index({ orderId: 1, type: 1 });
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, type: 1 });
transactionSchema.index({ gatewayTransactionId: 1 }, { sparse: true });
transactionSchema.index({ type: 1, status: 1, createdAt: -1 });
transactionSchema.virtual('summary').get(function () {
    return `${this.type.toUpperCase()} - ${this.status.toUpperCase()} - ₹${this.amount}`;
});
transactionSchema.virtual('isRefund').get(function () {
    return this.type === TransactionType.REFUND;
});
transactionSchema.virtual('isCapture').get(function () {
    return this.type === TransactionType.CAPTURE;
});
transactionSchema.set('toJSON', { virtuals: true });
transactionSchema.pre('save', function (next) {
    if (this.type === TransactionType.REFUND && !this.orderId) {
        return next(new Error('Order ID is required for refund transactions'));
    }
    if (this.type === TransactionType.CAPTURE && (!this.orderId || !this.userId)) {
        return next(new Error('Order ID and User ID are required for capture transactions'));
    }
    next();
});
exports.Transaction = mongoose_1.default.model('Transaction', transactionSchema);
//# sourceMappingURL=transactions.model.js.map