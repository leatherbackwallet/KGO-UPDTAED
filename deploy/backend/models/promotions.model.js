"use strict";
/**
 * Promotions Model - Advanced promotions engine with complex rules and actions
 * Manages promotional campaigns with flexible rule-based logic
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
exports.Promotion = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const promotionConditionSchema = new mongoose_1.Schema({
    type: {
        type: String,
        required: true,
        trim: true
    },
    config: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true
    }
});
const promotionActionSchema = new mongoose_1.Schema({
    type: {
        type: String,
        required: true,
        trim: true
    },
    config: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true
    }
});
const promotionSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        uppercase: true
    },
    conditions: [promotionConditionSchema],
    actions: [promotionActionSchema],
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true
});
// Indexes
promotionSchema.index({ code: 1 });
promotionSchema.index({ isActive: 1, isDeleted: 1 });
promotionSchema.index({ startDate: 1, endDate: 1 });
promotionSchema.index({ createdAt: -1 });
// Validation: Ensure at least one condition and action
promotionSchema.pre('save', function (next) {
    if (this.conditions.length === 0) {
        return next(new Error('Promotion must have at least one condition'));
    }
    if (this.actions.length === 0) {
        return next(new Error('Promotion must have at least one action'));
    }
    next();
});
exports.Promotion = mongoose_1.default.model('Promotion', promotionSchema);
