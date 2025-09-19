/**
 * Occasions Model - Enhanced with date ranges and seasonal prioritization
 * Supports recurring and one-time occasions with smart product prioritization
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IOccasion extends Document {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  
  // Date Range Fields
  dateRange: {
    startMonth: number;            // 1-12 (January = 1)
    startDay: number;              // 1-31
    endMonth: number;              // 1-12
    endDay: number;                // 1-31
    isRecurring: boolean;          // true for annual events
    specificYear?: number;         // for one-time events
  };
  
  // Priority & Seasonal Fields
  priority: {
    level: 'low' | 'medium' | 'high' | 'peak';  // seasonal priority
    boostMultiplier: number;       // 1.0-3.0 for product scoring
  };
  
  seasonalFlags: {
    isFestival: boolean;           // religious/cultural festivals
    isHoliday: boolean;            // national holidays
    isPersonal: boolean;           // birthdays, anniversaries
    isSeasonal: boolean;           // weather-based seasons
  };
  
  // Standard fields
  isActive: boolean;
  sortOrder: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const occasionSchema = new Schema<IOccasion>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  icon: {
    type: String,
    trim: true,
    maxlength: 50
  },
  color: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Allow empty
        return /^#[0-9A-F]{6}$/i.test(v); // Hex color validation
      },
      message: 'Color must be a valid hex color code (e.g., #FF5733)'
    }
  },
  
  // Date Range Schema
  dateRange: {
    startMonth: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    startDay: {
      type: Number,
      required: true,
      min: 1,
      max: 31
    },
    endMonth: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    endDay: {
      type: Number,
      required: true,
      min: 1,
      max: 31
    },
    isRecurring: {
      type: Boolean,
      default: true
    },
    specificYear: {
      type: Number,
      min: 2020,
      max: 2030
    }
  },
  
  // Priority Schema
  priority: {
    level: {
      type: String,
      enum: ['low', 'medium', 'high', 'peak'],
      default: 'medium'
    },
    boostMultiplier: {
      type: Number,
      min: 1.0,
      max: 3.0,
      default: 1.5
    }
  },
  
  // Seasonal Flags Schema
  seasonalFlags: {
    isFestival: {
      type: Boolean,
      default: false
    },
    isHoliday: {
      type: Boolean,
      default: false
    },
    isPersonal: {
      type: Boolean,
      default: false
    },
    isSeasonal: {
      type: Boolean,
      default: false
    }
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate slug from name before saving
occasionSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Validate date range
occasionSchema.pre('save', function(next) {
  const { startMonth, startDay, endMonth, endDay } = this.dateRange;
  
  // Basic validation
  if (startMonth < 1 || startMonth > 12 || endMonth < 1 || endMonth > 12) {
    return next(new Error('Invalid month values'));
  }
  
  if (startDay < 1 || startDay > 31 || endDay < 1 || endDay > 31) {
    return next(new Error('Invalid day values'));
  }
  
  // Check if start date is before end date (considering year rollover)
  const startDate = new Date(2024, startMonth - 1, startDay);
  const endDate = new Date(2024, endMonth - 1, endDay);
  
  // Handle year rollover (e.g., Dec 25 to Jan 5)
  if (endDate < startDate) {
    endDate.setFullYear(2025);
  }
  
  if (startDate > endDate) {
    return next(new Error('Start date must be before or equal to end date'));
  }
  
  next();
});

// Indexes for performance
occasionSchema.index({ slug: 1 });
occasionSchema.index({ isActive: 1, isDeleted: 1 });
occasionSchema.index({ sortOrder: 1 });
occasionSchema.index({ 'dateRange.startMonth': 1, 'dateRange.startDay': 1 });
occasionSchema.index({ 'dateRange.endMonth': 1, 'dateRange.endDay': 1 });
occasionSchema.index({ 'priority.level': 1 });
occasionSchema.index({ 'seasonalFlags.isFestival': 1 });
occasionSchema.index({ 'seasonalFlags.isHoliday': 1 });
occasionSchema.index({ 'seasonalFlags.isPersonal': 1 });
occasionSchema.index({ 'seasonalFlags.isSeasonal': 1 });

// Text search index
occasionSchema.index({ name: 'text', description: 'text' });

export const Occasion = mongoose.model<IOccasion>('Occasion', occasionSchema);
