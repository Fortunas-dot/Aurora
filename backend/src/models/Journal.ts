import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IJournal extends Document {
  name: string;
  description?: string;
  owner: Types.ObjectId;
  isPublic: boolean;
  topics?: string[]; // Mental health topics this journal focuses on
  followers: Types.ObjectId[];
  followersCount: number;
  entriesCount: number;
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const JournalSchema = new Schema<IJournal>(
  {
    name: {
      type: String,
      required: [true, 'Journal name is required'],
      trim: true,
      maxlength: [100, 'Journal name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    followers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    followersCount: {
      type: Number,
      default: 0,
    },
    entriesCount: {
      type: Number,
      default: 0,
    },
    coverImage: {
      type: String,
      trim: true,
    },
    topics: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
JournalSchema.index({ owner: 1, createdAt: -1 });
JournalSchema.index({ isPublic: 1, createdAt: -1 });
JournalSchema.index({ followers: 1 });
JournalSchema.index({ topics: 1 });

// Update followersCount when followers array changes
JournalSchema.pre('save', function(next) {
  if (this.isModified('followers')) {
    this.followersCount = this.followers.length;
  }
  next();
});

export default mongoose.model<IJournal>('Journal', JournalSchema);
