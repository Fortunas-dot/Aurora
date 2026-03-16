import { Schema, model, Document, Types } from 'mongoose';

export interface IUserProfileMemory extends Document {
  user: Types.ObjectId;
  /**
   * Core, relatively stable points about the user
   * (e.g. work, relationships, long‑term struggles, values).
   */
  coreFacts: string[];
  /**
   * Short narrative summary of who this person is and what tends to matter to them.
   */
  narrativeSummary: string;
  updatedAt: Date;
  createdAt: Date;
}

const UserProfileMemorySchema = new Schema<IUserProfileMemory>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    coreFacts: {
      type: [String],
      default: [],
    },
    narrativeSummary: {
      type: String,
      default: '',
      maxlength: 4000,
    },
  },
  {
    timestamps: true,
  }
);

export default model<IUserProfileMemory>('UserProfileMemory', UserProfileMemorySchema);

