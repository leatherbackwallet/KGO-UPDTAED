/**
 * Page Model - Simple CMS for static page management
 * Handles content pages, about us, terms, privacy policy, etc.
 */

import mongoose, { Document, Schema } from 'mongoose';

// Page status enum
export enum PageStatus {
  PUBLISHED = 'published',
  DRAFT = 'draft'
}

// TypeScript interface for Page document
export interface IPage extends Document {
  title: string;
  slug: string;
  body: string;
  status: PageStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Page schema definition
const pageSchema = new Schema<IPage>(
  {
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
  },
  {
    timestamps: true
  }
);

// Indexes for performance
pageSchema.index({ slug: 1 });
pageSchema.index({ status: 1, slug: 1 });

// Virtual for page summary
pageSchema.virtual('summary').get(function(this: IPage) {
  // Remove HTML tags and get first 150 characters
  const plainText = this.body.replace(/<[^>]*>/g, '');
  if (plainText.length > 150) {
    return plainText.substring(0, 150) + '...';
  }
  return plainText;
});

// Virtual for word count
pageSchema.virtual('wordCount').get(function(this: IPage) {
  const plainText = this.body.replace(/<[^>]*>/g, '');
  return plainText.split(/\s+/).filter(word => word.length > 0).length;
});

// Virtual for is published
pageSchema.virtual('isPublished').get(function(this: IPage) {
  return this.status === PageStatus.PUBLISHED;
});

// Ensure virtual fields are serialized
pageSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to generate slug if not provided
pageSchema.pre('save', function(next) {
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

// Pre-save middleware to validate slug uniqueness
pageSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('slug')) {
    const existing = await mongoose.model('Page').findOne({
      slug: this.slug,
      _id: { $ne: this._id }
    });
    
    if (existing) {
      return next(new Error('Page with this slug already exists'));
    }
  }
  next();
});

export const Page = mongoose.model<IPage>('Page', pageSchema); 