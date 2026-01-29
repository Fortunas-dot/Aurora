import mongoose, { Document, Schema, Types } from 'mongoose';

export type NotificationType = 'like' | 'comment' | 'message' | 'follow' | 'group_invite' | 'group_join';

export interface INotification extends Document {
  user: Types.ObjectId;
  type: NotificationType;
  relatedUser?: Types.ObjectId;
  relatedPost?: Types.ObjectId;
  relatedGroup?: Types.ObjectId;
  message: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['like', 'comment', 'message', 'follow', 'group_invite', 'group_join'],
      required: true,
    },
    relatedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    relatedPost: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
    relatedGroup: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for user notifications
NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, read: 1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);





