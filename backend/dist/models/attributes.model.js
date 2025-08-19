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
exports.Attribute = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const attributeOptionSchema = new mongoose_1.Schema({
    label: {
        en: {
            type: String,
            required: true
        },
        de: {
            type: String,
            required: true
        }
    },
    value: {
        type: String,
        required: true
    }
});
const attributeSchema = new mongoose_1.Schema({
    name: {
        en: {
            type: String,
            required: true,
            trim: true
        },
        de: {
            type: String,
            required: true,
            trim: true
        }
    },
    type: {
        type: String,
        enum: ['text', 'dropdown', 'checkbox_group', 'number', 'boolean'],
        required: true
    },
    options: [attributeOptionSchema],
    isRequired: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true
});
attributeSchema.index({ 'name.en': 1 });
attributeSchema.index({ 'name.de': 1 });
attributeSchema.index({ type: 1, isDeleted: 1 });
exports.Attribute = mongoose_1.default.model('Attribute', attributeSchema);
//# sourceMappingURL=attributes.model.js.map