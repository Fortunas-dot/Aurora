import mongoose, { Document, Schema, Types } from 'mongoose';

export type SeverityLevel = 'mild' | 'moderate' | 'severe';

export interface ISymptom {
  condition: string;
  type?: string;
  severity: SeverityLevel;
}

export interface IAIInsights {
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  themes: string[];
  cognitivePatterns?: string[];
  therapeuticFeedback?: string;
  followUpQuestions?: string[];
  analyzedAt?: Date;
}

export interface IJournalEntry extends Document {
  author: Types.ObjectId;
  content: string;
  audioUrl?: string;
  transcription?: string;
  mood: number;
  symptoms: ISymptom[];
  tags: string[];
  promptId?: string;
  promptText?: string;
  aiInsights?: IAIInsights;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const JournalEntrySchema = new Schema<IJournalEntry>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      maxlength: [10000, 'Content cannot exceed 10000 characters'],
      trim: true,
    },
    audioUrl: {
      type: String,
      trim: true,
    },
    transcription: {
      type: String,
      maxlength: [10000, 'Transcription cannot exceed 10000 characters'],
      trim: true,
    },
    mood: {
      type: Number,
      required: [true, 'Mood rating is required'],
      min: [1, 'Mood must be at least 1'],
      max: [10, 'Mood cannot exceed 10'],
    },
    symptoms: [{
      condition: {
        type: String,
        required: true,
        trim: true,
      },
      type: {
        type: String,
        trim: true,
      },
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe'],
        default: 'moderate',
      },
    }],
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    promptId: {
      type: String,
      trim: true,
    },
    promptText: {
      type: String,
      maxlength: [500, 'Prompt text cannot exceed 500 characters'],
      trim: true,
    },
    aiInsights: {
      sentiment: {
        type: String,
        enum: ['positive', 'neutral', 'negative', 'mixed'],
      },
      themes: [{
        type: String,
        trim: true,
      }],
      cognitivePatterns: [{
        type: String,
        trim: true,
      }],
      therapeuticFeedback: {
        type: String,
        maxlength: [2000, 'Therapeutic feedback cannot exceed 2000 characters'],
        trim: true,
      },
      followUpQuestions: [{
        type: String,
        trim: true,
      }],
      analyzedAt: {
        type: Date,
      },
    },
    isPrivate: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
JournalEntrySchema.index({ author: 1, createdAt: -1 });
JournalEntrySchema.index({ author: 1, mood: 1 });
JournalEntrySchema.index({ tags: 1 });
JournalEntrySchema.index({ createdAt: -1 });
JournalEntrySchema.index({ 'symptoms.condition': 1 });

export default mongoose.model<IJournalEntry>('JournalEntry', JournalEntrySchema);





