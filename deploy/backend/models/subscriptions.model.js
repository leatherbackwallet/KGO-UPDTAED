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
exports.Subscription = exports.SubscriptionStatus = exports.SubscriptionTier = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var SubscriptionTier;
(function (SubscriptionTier) {
    SubscriptionTier["FREE"] = "free";
    SubscriptionTier["SILVER"] = "silver";
    SubscriptionTier["GOLD"] = "gold";
    SubscriptionTier["PLATINUM"] = "platinum";
})(SubscriptionTier || (exports.SubscriptionTier = SubscriptionTier = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["CANCELLED"] = "cancelled";
    SubscriptionStatus["EXPIRED"] = "expired";
    SubscriptionStatus["PENDING"] = "pending";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
const subscriptionSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    tier: {
        type: String,
        enum: Object.values(SubscriptionTier),
        default: SubscriptionTier.FREE,
        required: true
    },
    status: {
        type: String,
        enum: Object.values(SubscriptionStatus),
        default: SubscriptionStatus.ACTIVE,
        required: true
    },
    billing: {
        amount: {
            type: Number,
            default: 0
        },
        currency: {
            type: String,
            default: 'INR'
        },
        billingCycle: {
            type: String,
            enum: ['monthly', 'quarterly', 'yearly'],
            default: 'monthly'
        },
        nextBillingDate: Date,
        lastBillingDate: Date,
        paymentMethod: String,
        autoRenew: {
            type: Boolean,
            default: true
        }
    },
    benefits: {
        freeDelivery: {
            type: Boolean,
            default: false
        },
        prioritySupport: {
            type: Boolean,
            default: false
        },
        exclusiveProducts: {
            type: Boolean,
            default: false
        },
        earlyAccess: {
            type: Boolean,
            default: false
        },
        discountPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        monthlyCredits: {
            type: Number,
            default: 0
        },
        usedCredits: {
            type: Number,
            default: 0
        },
        referralBonus: {
            type: Number,
            default: 0
        }
    },
    loyaltyPoints: {
        currentPoints: {
            type: Number,
            default: 0
        },
        totalEarned: {
            type: Number,
            default: 0
        },
        totalRedeemed: {
            type: Number,
            default: 0
        },
        tierMultiplier: {
            type: Number,
            default: 1
        },
        nextTierPoints: {
            type: Number,
            default: 1000
        }
    },
    usage: {
        ordersThisMonth: {
            type: Number,
            default: 0
        },
        totalOrders: {
            type: Number,
            default: 0
        },
        totalSpent: {
            type: Number,
            default: 0
        },
        averageOrderValue: {
            type: Number,
            default: 0
        },
        lastOrderDate: Date
    },
    referrals: {
        referralCode: {
            type: String,
            unique: true,
            sparse: true
        },
        referredUsers: [{
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User'
            }],
        totalReferrals: {
            type: Number,
            default: 0
        },
        referralEarnings: {
            type: Number,
            default: 0
        }
    },
    culturalFeatures: {
        festivalAlerts: {
            type: Boolean,
            default: true
        },
        traditionalRecipeAccess: {
            type: Boolean,
            default: false
        },
        culturalEventNotifications: {
            type: Boolean,
            default: true
        },
        languageLearningContent: {
            type: Boolean,
            default: false
        },
        communityAccess: {
            type: Boolean,
            default: false
        }
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
subscriptionSchema.pre('save', function (next) {
    if (this.isNew && !this.referrals.referralCode) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5).toUpperCase();
        this.referrals.referralCode = `KGO${timestamp}${random}`;
    }
    next();
});
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ tier: 1, status: 1 });
subscriptionSchema.index({ 'referrals.referralCode': 1 });
subscriptionSchema.index({ 'billing.nextBillingDate': 1 });
exports.Subscription = mongoose_1.default.model('Subscription', subscriptionSchema);
//# sourceMappingURL=subscriptions.model.js.map