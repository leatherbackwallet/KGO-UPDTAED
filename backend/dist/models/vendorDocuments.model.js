"use strict";
/**
 * VendorDocument Model - Vendor verification document management
 * Handles GSTIN, FSSAI, PAN, and bank account document verification
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
exports.VendorDocument = exports.DocumentStatus = exports.DocumentType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Document type enum
var DocumentType;
(function (DocumentType) {
    DocumentType["GSTIN"] = "GSTIN";
    DocumentType["FSSAI"] = "FSSAI";
    DocumentType["PAN"] = "PAN";
    DocumentType["BANK_ACCOUNT"] = "BANK_ACCOUNT";
})(DocumentType || (exports.DocumentType = DocumentType = {}));
// Document status enum
var DocumentStatus;
(function (DocumentStatus) {
    DocumentStatus["PENDING"] = "pending";
    DocumentStatus["APPROVED"] = "approved";
    DocumentStatus["REJECTED"] = "rejected";
})(DocumentStatus || (exports.DocumentStatus = DocumentStatus = {}));
// VendorDocument schema definition
const vendorDocumentSchema = new mongoose_1.Schema({
    vendorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: [true, 'Vendor ID is required'],
        index: true
    },
    documentType: {
        type: String,
        enum: Object.values(DocumentType),
        required: [true, 'Document type is required'],
        index: true
    },
    fileUrl: {
        type: String,
        required: [true, 'Document file URL is required'],
        trim: true
    },
    status: {
        type: String,
        enum: Object.values(DocumentStatus),
        required: [true, 'Document status is required'],
        default: DocumentStatus.PENDING,
        index: true
    },
    rejectionReason: {
        type: String,
        trim: true,
        maxlength: [500, 'Rejection reason cannot exceed 500 characters']
    }
}, {
    timestamps: true
});
// Indexes for performance
vendorDocumentSchema.index({ vendorId: 1, documentType: 1 }, { unique: true });
vendorDocumentSchema.index({ status: 1, documentType: 1 });
// Pre-save middleware to validate unique vendor-document type combination
vendorDocumentSchema.pre('save', async function (next) {
    if (this.isNew || this.isModified('vendorId') || this.isModified('documentType')) {
        const existing = await mongoose_1.default.model('VendorDocument').findOne({
            vendorId: this.vendorId,
            documentType: this.documentType,
            _id: { $ne: this._id }
        });
        if (existing) {
            return next(new Error('Document of this type already exists for this vendor'));
        }
    }
    next();
});
// Pre-save middleware to clear rejection reason when status changes to approved
vendorDocumentSchema.pre('save', function (next) {
    if (this.status === DocumentStatus.APPROVED && this.rejectionReason) {
        this.rejectionReason = '';
    }
    next();
});
exports.VendorDocument = mongoose_1.default.model('VendorDocument', vendorDocumentSchema);
