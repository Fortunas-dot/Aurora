import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  description: string;
  tags: string[];
  members: Types.ObjectId[];
  admins: Types.ObjectId[];
  isPrivate: boolean;
  avatar?: string;
  country?: string; // Country code or 'global'
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: [100, 'Group name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    members: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    admins: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    isPrivate: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: null,
    },
    country: {
      type: String,
      default: 'global',
      enum: ['global', 'NL', 'BE', 'DE', 'FR', 'GB', 'US', 'CA', 'AU', 'ES', 'IT', 'PT', 'PL', 'SE', 'NO', 'DK', 'FI', 'IE', 'AT', 'CH', 'CZ', 'GR', 'HU', 'RO', 'BG', 'HR', 'SK', 'SI', 'LT', 'LV', 'EE', 'LU', 'MT', 'CY'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for searching
GroupSchema.index({ name: 'text', description: 'text' });
GroupSchema.index({ tags: 1 });

export default mongoose.model<IGroup>('Group', GroupSchema);






