/**
 * Attributes Model - Extensible product attribute system
 * Defines custom fields or properties that products can have
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IAttributeOption {
  label: {
    en: string;
    de: string;
  };
  value: string;
}

export interface IAttribute extends Document {
  name: {
    en: string;
    de: string;
  };
  type: 'text' | 'dropdown' | 'checkbox_group' | 'number' | 'boolean';
  options?: IAttributeOption[];
  isRequired: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const attributeOptionSchema = new Schema<IAttributeOption>({
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

const attributeSchema = new Schema<IAttribute>({
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

// Indexes
attributeSchema.index({ 'name.en': 1 });
attributeSchema.index({ 'name.de': 1 });
attributeSchema.index({ type: 1, isDeleted: 1 });

export const Attribute = mongoose.model<IAttribute>('Attribute', attributeSchema); 