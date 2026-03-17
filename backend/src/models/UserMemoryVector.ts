import { Schema, model, Document, Types } from 'mongoose';

/**
 * UserMemoryVector — per-user semantic memory store.
 *
 * Each document represents one "important point" extracted from a chat session,
 * stored alongside its vector embedding so Aurora can semantically search
 * across ALL past sessions (not just the last 10).
 *
 * At session end  → importantPoints are embedded and stored here.
 * At chat time    → the user's current message is embedded and compared
 *                   against their stored vectors (cosine similarity).
 *                   Top-K most relevant memories are injected into Aurora's
 *                   system prompt alongside the standard context.
 */
export interface IUserMemoryVector extends Document {
  user: Types.ObjectId;
  /** The original memory text (one importantPoint from ChatContext). */
  text: string;
  /** 1536-dimension embedding from OpenAI text-embedding-3-small. */
  embedding: number[];
  /** Where this memory came from. */
  source: 'chat' | 'journal';
  /** Which ChatContext session this memory belongs to (if source = 'chat'). */
  sessionId?: Types.ObjectId;
  createdAt: Date;
}

const UserMemoryVectorSchema = new Schema<IUserMemoryVector>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    embedding: {
      type: [Number],
      required: true,
    },
    source: {
      type: String,
      enum: ['chat', 'journal'],
      default: 'chat',
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'ChatContext',
    },
  },
  {
    // Only track createdAt — no updatedAt needed (memories are immutable).
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index for fast per-user retrieval sorted by recency.
UserMemoryVectorSchema.index({ user: 1, createdAt: -1 });

export default model<IUserMemoryVector>('UserMemoryVector', UserMemoryVectorSchema);
