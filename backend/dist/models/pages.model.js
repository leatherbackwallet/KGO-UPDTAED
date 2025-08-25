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
exports.Page = exports.PageStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var PageStatus;
(function (PageStatus) {
    PageStatus["PUBLISHED"] = "published";
    PageStatus["DRAFT"] = "draft";
})(PageStatus || (exports.PageStatus = PageStatus = {}));
const pageSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Page title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    slug: {
        type: String,
        required: [true, 'Page slug is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
    },
    body: {
        type: String,
        required: [true, 'Page body content is required'],
        trim: true,
        maxlength: [50000, 'Page body cannot exceed 50000 characters']
    },
    status: {
        type: String,
        enum: Object.values(PageStatus),
        required: [true, 'Page status is required'],
        default: PageStatus.DRAFT,
        index: true
    }
}, {
    timestamps: true
});
pageSchema.index({ slug: 1 });
pageSchema.index({ status: 1, slug: 1 });
pageSchema.virtual('summary').get(function () {
    const plainText = this.body.replace(/<[^>]*>/g, '');
    if (plainText.length > 150) {
        return plainText.substring(0, 150) + '...';
    }
    return plainText;
});
pageSchema.virtual('wordCount').get(function () {
    const plainText = this.body.replace(/<[^>]*>/g, '');
    return plainText.split(/\s+/).filter(word => word.length > 0).length;
});
pageSchema.virtual('isPublished').get(function () {
    return this.status === PageStatus.PUBLISHED;
});
pageSchema.set('toJSON', { virtuals: true });
pageSchema.pre('save', function (next) {
    if (!this.slug && this.title) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }
    next();
});
pageSchema.pre('save', async function (next) {
    if (this.isNew || this.isModified('slug')) {
        const existing = await mongoose_1.default.model('Page').findOne({
            slug: this.slug,
            _id: { $ne: this._id }
        });
        if (existing) {
            return next(new Error('Page with this slug already exists'));
        }
    }
    next();
});
exports.Page = mongoose_1.default.model('Page', pageSchema);
//# sourceMappingURL=pages.model.js.map