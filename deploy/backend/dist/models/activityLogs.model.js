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
exports.ActivityLog = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const activityLogSchema = new mongoose_1.Schema({
    actorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    actionType: {
        type: String,
        required: [true, 'Action type is required'],
        trim: true,
        maxlength: [100, 'Action type cannot exceed 100 characters'],
        index: true
    },
    target: {
        type: {
            type: String,
            required: true,
            trim: true,
            maxlength: [50, 'Target type cannot exceed 50 characters']
        },
        id: {
            type: mongoose_1.Schema.Types.ObjectId,
            required: true
        }
    },
    details: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});
activityLogSchema.index({ actorId: 1, createdAt: -1 });
activityLogSchema.index({ actionType: 1, createdAt: -1 });
activityLogSchema.index({ 'target.type': 1, 'target.id': 1 });
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ actorId: 1, actionType: 1, createdAt: -1 });
activityLogSchema.virtual('actionSummary').get(function () {
    const actor = this.actorId ? `User ${this.actorId}` : 'System';
    const target = this.target ? `${this.target.type} ${this.target.id}` : 'N/A';
    return `${actor} performed ${this.actionType} on ${target}`;
});
activityLogSchema.virtual('isSystemAction').get(function () {
    return !this.actorId;
});
activityLogSchema.virtual('isUserAction').get(function () {
    return !!this.actorId;
});
activityLogSchema.set('toJSON', { virtuals: true });
activityLogSchema.statics.logUserAction = function (actorId, actionType, target, details) {
    return this.create({
        actorId,
        actionType,
        target,
        details
    });
};
activityLogSchema.statics.logSystemAction = function (actionType, target, details) {
    return this.create({
        actionType,
        target,
        details
    });
};
activityLogSchema.pre('save', function (next) {
    const commonActions = [
        'create', 'update', 'delete', 'login', 'logout', 'register',
        'order_placed', 'order_cancelled', 'payment_success', 'payment_failed',
        'vendor_approved', 'vendor_rejected', 'product_added', 'product_updated'
    ];
    if (!commonActions.includes(this.actionType.toLowerCase())) {
        console.log(`Custom action type logged: ${this.actionType}`);
    }
    next();
});
exports.ActivityLog = mongoose_1.default.model('ActivityLog', activityLogSchema);
//# sourceMappingURL=activityLogs.model.js.map