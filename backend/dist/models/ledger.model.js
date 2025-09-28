"use strict";
/**
 * Ledger Model - Financial core for income and expense tracking
 * Comprehensive financial record keeping with categorization and audit trail
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
exports.Ledger = exports.LedgerCategory = exports.LedgerType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Ledger type enum
var LedgerType;
(function (LedgerType) {
    LedgerType["INCOME"] = "income";
    LedgerType["EXPENSE"] = "expense";
})(LedgerType || (exports.LedgerType = LedgerType = {}));
// Ledger category enum
var LedgerCategory;
(function (LedgerCategory) {
    LedgerCategory["SALES_REVENUE"] = "sales_revenue";
    LedgerCategory["DELIVERY_FEE"] = "delivery_fee";
    LedgerCategory["VENDOR_PAYOUT"] = "vendor_payout";
    LedgerCategory["PAYMENT_GATEWAY_FEE"] = "payment_gateway_fee";
    LedgerCategory["MARKETING"] = "marketing";
    LedgerCategory["REFUND"] = "refund";
    LedgerCategory["SALARIES"] = "salaries";
    LedgerCategory["OTHER"] = "other";
})(LedgerCategory || (exports.LedgerCategory = LedgerCategory = {}));
// Ledger schema definition
const ledgerSchema = new mongoose_1.Schema({
    date: {
        type: Date,
        required: [true, 'Ledger date is required'],
        index: true,
        default: Date.now
    },
    type: {
        type: String,
        enum: Object.values(LedgerType),
        required: [true, 'Ledger type is required'],
        index: true
    },
    category: {
        type: String,
        enum: Object.values(LedgerCategory),
        required: [true, 'Ledger category is required'],
        index: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    relatedDocument: {
        modelName: {
            type: String,
            required: true,
            enum: ['Order', 'Transaction', 'Payout', 'Coupon', 'User']
        },
        docId: {
            type: mongoose_1.Schema.Types.ObjectId,
            required: true
        }
    },
    recordedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    }
}, {
    timestamps: true
});
// Indexes for performance
ledgerSchema.index({ date: 1, type: 1 });
ledgerSchema.index({ category: 1, date: -1 });
ledgerSchema.index({ type: 1, category: 1, date: -1 });
// Compound index for financial reporting
ledgerSchema.index({ date: 1, type: 1, category: 1 });
// Virtual for formatted amount
ledgerSchema.virtual('formattedAmount').get(function () {
    const prefix = this.type === LedgerType.INCOME ? '+' : '-';
    return `${prefix}₹${this.amount.toFixed(2)}`;
});
// Virtual for entry summary
ledgerSchema.virtual('summary').get(function () {
    const prefix = this.type === LedgerType.INCOME ? '+' : '-';
    const formattedAmount = `${prefix}₹${this.amount.toFixed(2)}`;
    return `${this.type.toUpperCase()} - ${this.category.replace('_', ' ').toUpperCase()} - ${formattedAmount}`;
});
// Virtual for is income
ledgerSchema.virtual('isIncome').get(function () {
    return this.type === LedgerType.INCOME;
});
// Virtual for is expense
ledgerSchema.virtual('isExpense').get(function () {
    return this.type === LedgerType.EXPENSE;
});
// Ensure virtual fields are serialized
ledgerSchema.set('toJSON', { virtuals: true });
// Pre-save middleware to validate ledger data
ledgerSchema.pre('save', function (next) {
    // Validate category matches type
    const incomeCategories = [
        LedgerCategory.SALES_REVENUE,
        LedgerCategory.DELIVERY_FEE
    ];
    const expenseCategories = [
        LedgerCategory.VENDOR_PAYOUT,
        LedgerCategory.PAYMENT_GATEWAY_FEE,
        LedgerCategory.MARKETING,
        LedgerCategory.REFUND,
        LedgerCategory.SALARIES,
        LedgerCategory.OTHER
    ];
    if (this.type === LedgerType.INCOME && !incomeCategories.includes(this.category)) {
        return next(new Error('Invalid category for income type'));
    }
    if (this.type === LedgerType.EXPENSE && !expenseCategories.includes(this.category)) {
        return next(new Error('Invalid category for expense type'));
    }
    next();
});
exports.Ledger = mongoose_1.default.model('Ledger', ledgerSchema);
