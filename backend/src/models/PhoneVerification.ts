import mongoose, { Document, Schema } from 'mongoose';

export interface IPhoneVerification extends Document {
  phoneNumber: string;
  code: string;
  createdAt: Date;
  expiresAt: Date;
  attempts: number;
}

const PhoneVerificationSchema = new Schema<IPhoneVerification>(
  {
    phoneNumber: {
      type: String,
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: false,
  }
);

const PhoneVerification = mongoose.model<IPhoneVerification>('PhoneVerification', PhoneVerificationSchema);

export default PhoneVerification;

