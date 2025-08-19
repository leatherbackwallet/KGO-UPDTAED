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
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const userLocationSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
    },
    coordinates: [{
            type: Number
        }]
});
const userScheduleSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ['work_shift', 'time_off'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    isRecurring: {
        type: Boolean,
        default: false
    }
});
const recipientAddressSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
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
            required: true,
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
    additionalInstructions: {
        type: String,
        trim: true,
        maxlength: [500, 'Additional instructions cannot exceed 500 characters']
    },
    isDefault: {
        type: Boolean,
        default: false
    }
});
const userSchema = new mongoose_1.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    roleId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Role',
        required: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    avatar: {
        type: String,
        trim: true,
        required: false
    },
    location: userLocationSchema,
    schedules: [userScheduleSchema],
    recipientAddresses: [recipientAddressSchema],
    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ location: '2dsphere' });
userSchema.index({ roleId: 1 });
userSchema.index({ isActive: 1, isDeleted: 1 });
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});
userSchema.set('toJSON', { virtuals: true });
exports.User = mongoose_1.default.model('User', userSchema);
//# sourceMappingURL=users.model.js.map