import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMessage extends Document {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  content: string;
  attachments?: Array<{
    type: 'image' | 'file';
    url: string;
    filename?: string;
  }>;
  reactions?: Array<{
    emoji: string;
    users: Types.ObjectId[];
  }>;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: false, // Not strictly required - can be empty if attachments exist
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
      trim: true,
      default: '',
      validate: {
        validator: function(value: string) {
          // Content must be provided OR attachments must be provided
          const hasContent = value && value.trim().length > 0;
          // Access parent document via 'this' context
          const doc = this as any;
          const hasAttachments = doc.attachments && doc.attachments.length > 0;
          return hasContent || hasAttachments;
        },
        message: 'Message must have either content or attachments',
      },
    },
    attachments: [{
      type: {
        type: String,
        enum: ['image', 'file', 'audio'],
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      filename: {
        type: String,
      },
      duration: {
        type: Number,
      },
    }],
    reactions: [{
      emoji: {
        type: String,
        required: true,
      },
      users: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
      }],
    }],
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient conversation queries
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
MessageSchema.index({ receiver: 1, readAt: 1 });

export default mongoose.model<IMessage>('Message', MessageSchema);






