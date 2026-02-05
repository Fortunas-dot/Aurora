import mongoose, { Document, Schema } from 'mongoose';

export interface ICalendarEvent extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  allDay: boolean;
  location?: string;
  type: 'appointment' | 'therapy' | 'medication' | 'reminder' | 'other';
  reminder?: {
    enabled: boolean;
    minutesBefore: number;
  };
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'none';
    interval: number;
    endDate?: Date;
    count?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CalendarEventSchema = new Schema<ICalendarEvent>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
    },
    allDay: {
      type: Boolean,
      default: false,
    },
    location: {
      type: String,
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },
    type: {
      type: String,
      enum: ['appointment', 'therapy', 'medication', 'reminder', 'other'],
      default: 'other',
    },
    reminder: {
      enabled: {
        type: Boolean,
        default: false,
      },
      minutesBefore: {
        type: Number,
        default: 15,
        min: 0,
        max: 10080, // 7 days in minutes
      },
    },
    recurrence: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly', 'none'],
        default: 'none',
      },
      interval: {
        type: Number,
        default: 1,
        min: 1,
      },
      endDate: {
        type: Date,
      },
      count: {
        type: Number,
        min: 1,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
CalendarEventSchema.index({ user: 1, startDate: 1 });
CalendarEventSchema.index({ user: 1, type: 1 });

const CalendarEvent = mongoose.model<ICalendarEvent>('CalendarEvent', CalendarEventSchema);

export default CalendarEvent;
