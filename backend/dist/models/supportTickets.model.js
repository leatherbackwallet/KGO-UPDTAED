"use strict";
/**
 * SupportTicket Model - Customer support ticket management
 * Handles customer issues, support conversations, and ticket assignment
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
exports.SupportTicket = exports.TicketStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Ticket status enum
var TicketStatus;
(function (TicketStatus) {
    TicketStatus["OPEN"] = "open";
    TicketStatus["IN_PROGRESS"] = "in_progress";
    TicketStatus["CLOSED"] = "closed";
})(TicketStatus || (exports.TicketStatus = TicketStatus = {}));
// SupportTicket schema definition
const supportTicketSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    orderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Order',
        index: true
    },
    issue: {
        type: String,
        required: [true, 'Issue description is required'],
        trim: true,
        maxlength: [200, 'Issue cannot exceed 200 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    status: {
        type: String,
        enum: Object.values(TicketStatus),
        required: [true, 'Ticket status is required'],
        default: TicketStatus.OPEN,
        index: true
    },
    assignedTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    conversation: {
        type: [{
                byUser: {
                    type: mongoose_1.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true
                },
                message: {
                    type: String,
                    required: true,
                    trim: true,
                    maxlength: [1000, 'Message cannot exceed 1000 characters']
                },
                timestamp: {
                    type: Date,
                    default: Date.now
                }
            }],
        default: []
    }
}, {
    timestamps: true
});
// Indexes for performance
supportTicketSchema.index({ userId: 1, status: 1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });
supportTicketSchema.index({ status: 1, createdAt: -1 });
supportTicketSchema.index({ orderId: 1 });
// Compound index for support agent queries
supportTicketSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });
// Virtual for conversation count
supportTicketSchema.virtual('conversationCount').get(function () {
    return this.conversation.length;
});
// Virtual for is open
supportTicketSchema.virtual('isOpen').get(function () {
    return this.status === TicketStatus.OPEN;
});
// Virtual for is in progress
supportTicketSchema.virtual('isInProgress').get(function () {
    return this.status === TicketStatus.IN_PROGRESS;
});
// Virtual for is closed
supportTicketSchema.virtual('isClosed').get(function () {
    return this.status === TicketStatus.CLOSED;
});
// Virtual for last message
supportTicketSchema.virtual('lastMessage').get(function () {
    if (this.conversation.length > 0) {
        const lastMsg = this.conversation[this.conversation.length - 1];
        if (lastMsg) {
            return {
                message: lastMsg.message,
                timestamp: lastMsg.timestamp,
                byUser: lastMsg.byUser
            };
        }
    }
    return null;
});
// Ensure virtual fields are serialized
supportTicketSchema.set('toJSON', { virtuals: true });
// Instance method to add message
supportTicketSchema.methods.addMessage = function (userId, message) {
    this.conversation.push({
        byUser: userId,
        message: message,
        timestamp: new Date()
    });
    return this.save();
};
// Instance method to assign ticket
supportTicketSchema.methods.assignTo = function (agentId) {
    this.assignedTo = agentId;
    this.status = TicketStatus.IN_PROGRESS;
    return this.save();
};
// Instance method to close ticket
supportTicketSchema.methods.closeTicket = function () {
    this.status = TicketStatus.CLOSED;
    return this.save();
};
exports.SupportTicket = mongoose_1.default.model('SupportTicket', supportTicketSchema);
