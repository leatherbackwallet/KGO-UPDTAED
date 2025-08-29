/**
 * Users Model - Core user management with roles, schedules, and recipient address book
 * Supports RBAC, delivery agent locations, and customer address management
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IUserLocation {
  type: 'Point';
  coordinates: number[];
}

export interface IUserSchedule {
  type: 'work_shift' | 'time_off';
  startDate: Date;
  endDate: Date;
  isRecurring: boolean;
}

export interface IRecipientAddress {
  name: string;
  phone: string;
  address: {
    streetName: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    countryCode: string;
  };
  additionalInstructions?: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId: mongoose.Types.ObjectId;
  phone: string;
  avatar?: string; // Avatar image filename
  location?: IUserLocation;
  schedules?: IUserSchedule[];
  recipientAddresses?: IRecipientAddress[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userLocationSchema = new Schema<IUserLocation>({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: [{
    type: Number
  }]
});

const userScheduleSchema = new Schema<IUserSchedule>({
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

const recipientAddressSchema = new Schema<IRecipientAddress>({
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

const userSchema = new Schema<IUser>({
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
    type: Schema.Types.ObjectId,
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

// Indexes
userSchema.index({ location: '2dsphere' });
userSchema.index({ roleId: 1 });
userSchema.index({ isActive: 1, isDeleted: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are serialized
userSchema.set('toJSON', { virtuals: true });

export const User = mongoose.model<IUser>('User', userSchema); 