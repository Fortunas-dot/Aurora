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

// Pre-save validation: message must have either content or attachments
MessageSchema.pre('save', function(next) {
  const message = this as any;
  const content = message.content || '';
  const hasContent = typeof content === 'string' && content.trim().length > 0;
  
  // Check attachments - can be array or undefined
  const attachments = message.attachments;
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
  
  // Debug logging (can be removed in production)
  if (!hasContent && !hasAttachments) {
    console.log('Message validation failed:', {
      content: content,
      contentLength: content?.length,
      attachments: attachments,
      attachmentsLength: attachments?.length,
      attachmentsIsArray: Array.isArray(attachments),
    });
    const error = new Error('Message must have either content or attachments');
    return next(error);
  }
  
  next();
});

// Index for efficient conversation queries
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
MessageSchema.index({ receiver: 1, readAt: 1 });

export default mongoose.model<IMessage>('Message', MessageSchema);






