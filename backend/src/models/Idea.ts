import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IIdea extends Document {
  author: Types.ObjectId;
  title: string;
  description: string;
  category: 'feature' | 'improvement' | 'bug-fix' | 'design' | 'other';
  status: 'open' | 'in-progress' | 'completed' | 'rejected';
  upvotes: Types.ObjectId[];
  downvotes: Types.ObjectId[];
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const IdeaSchema = new Schema<IIdea>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['feature', 'improvement', 'bug-fix', 'design', 'other'],
      default: 'feature',
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'completed', 'rejected'],
      default: 'open',
    },
    upvotes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    downvotes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    commentsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for sorting by votes
IdeaSchema.index({ createdAt: -1 });
IdeaSchema.index({ upvotes: -1, downvotes: 1 });

export default mongoose.model<IIdea>('Idea', IdeaSchema);

