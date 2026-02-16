import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IChatContext extends Document {
  user: Types.ObjectId;
  importantPoints: string[]; // Array of important points extracted from chat
  summary?: string; // Brief summary of the session
  sessionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatContextSchema = new Schema<IChatContext>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    importantPoints: [{
      type: String,
      required: true,
      trim: true,
    }],
    summary: {
      type: String,
      trim: true,
      maxlength: [1000, 'Summary cannot exceed 1000 characters'],
    },
    sessionDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
ChatContextSchema.index({ user: 1, sessionDate: -1 });

export default mongoose.model<IChatContext>('ChatContext', ChatContextSchema);
