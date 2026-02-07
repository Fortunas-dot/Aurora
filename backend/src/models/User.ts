import mongoose, { Document, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface PushToken {
  token: string;
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  createdAt: Date;
}

export interface IUser extends Document {
  email: string;
  password: string;
  username: string;
  displayName?: string;
  avatar?: string;
  avatarCharacter?: string; // Emoji character for avatar when no photo is set
  avatarBackgroundColor?: string; // Background color for avatar character
  bio?: string;
  lastUsernameChange?: Date; // Track when username was last changed
  isAnonymous: boolean;
  showEmail: boolean;
  facebookId?: string;
  isProtected?: boolean; // Protected accounts cannot be deleted (e.g., Apple review account)
  following: Types.ObjectId[];
  savedPosts: Types.ObjectId[];
  blockedUsers: Types.ObjectId[]; // Users that this user has blocked
  pushTokens: PushToken[];
  healthInfo?: {
    mentalHealth?: Array<{
      condition: string;
      type?: string;
      severity?: 'mild' | 'moderate' | 'severe';
      notes?: string;
    }>;
    physicalHealth?: Array<{
      condition: string;
      type?: string;
      severity?: 'mild' | 'moderate' | 'severe';
      notes?: string;
    }>;
    medications?: string[];
    therapies?: string[];
    lifeContext?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: false, // Made optional - will be validated in pre-save hook
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: [50, 'Display name cannot exceed 50 characters'],
    },
    avatar: {
      type: String,
      default: null,
    },
    avatarCharacter: {
      type: String,
      default: null,
    },
    avatarBackgroundColor: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    lastUsernameChange: {
      type: Date,
      default: null,
    },
    isAnonymous: {
      type: Boolean,
      default: true,
    },
    showEmail: {
      type: Boolean,
      default: false,
    },
    isProtected: {
      type: Boolean,
      default: false,
    },
    facebookId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    following: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    savedPosts: [{
      type: Schema.Types.ObjectId,
      ref: 'Post',
    }],
    blockedUsers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    pushTokens: [{
      token: {
        type: String,
        required: true,
      },
      deviceId: {
        type: String,
        required: true,
      },
      platform: {
        type: String,
        enum: ['ios', 'android', 'web'],
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
    healthInfo: {
      mentalHealth: [{
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
        notes: {
          type: String,
          trim: true,
          maxlength: [1000, 'Notes cannot exceed 1000 characters'],
        },
      }],
      physicalHealth: [{
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
        notes: {
          type: String,
          trim: true,
          maxlength: [1000, 'Notes cannot exceed 1000 characters'],
        },
      }],
      medications: [{
        type: String,
        trim: true,
      }],
      therapies: [{
        type: String,
        trim: true,
      }],
      lifeContext: {
        type: String,
        trim: true,
        maxlength: [5000, 'Life context cannot exceed 5000 characters'],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Validate password before saving (required unless Facebook user)
// Only validate on new documents or when password is being modified
UserSchema.pre('validate', async function (next) {
  // #region agent log
  const fs = require('fs');
  const logPath = 'c:\\Users\\ayman\\Desktop\\Fortunas\\TherapyAI\\.cursor\\debug.log';
  try {
    const logEntry = JSON.stringify({location:'User.ts:179',message:'pre-validate hook entry',data:{isNew:this.isNew,isModifiedPassword:this.isModified('password'),hasPassword:!!this.password,hasFacebookId:!!this.facebookId,userId:this._id?.toString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H3,H5'})+'\n';
    fs.appendFileSync(logPath, logEntry);
  } catch(e){}
  // #endregion
  // Skip validation if this is an update and password is not being modified
  if (!this.isNew) {
    // For updates, only validate if password is explicitly being modified
    if (!this.isModified('password')) {
      // #region agent log
      try {
        const logEntry = JSON.stringify({location:'User.ts:184',message:'pre-validate: password not modified, skipping',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H5'})+'\n';
        fs.appendFileSync(logPath, logEntry);
      } catch(e){}
      // #endregion
      return next();
    }
    // Password is being modified - validate it
    if (this.password && this.password.length < 6) {
      this.invalidate('password', 'Password must be at least 6 characters');
      return next();
    }
    // If password is being removed (set to null/undefined) during update,
    // check if user has facebookId or existing password in DB
    if (!this.password) {
      try {
        // Check if user has facebookId or if password exists in DB
        const UserModel = mongoose.model<IUser>('User');
        const existingUser = await UserModel.findById(this._id).select('password facebookId');
        // #region agent log
        try {
          const logEntry = JSON.stringify({location:'User.ts:197',message:'pre-validate: checking existing user',data:{existingUserFound:!!existingUser,existingFacebookId:!!existingUser?.facebookId,existingPassword:!!existingUser?.password},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H3'})+'\n';
          fs.appendFileSync(logPath, logEntry);
        } catch(e){}
        // #endregion
        if (existingUser && !existingUser.facebookId && !existingUser.password) {
          // User doesn't have facebookId and no password in DB - require password
          // #region agent log
          try {
            const logEntry = JSON.stringify({location:'User.ts:200',message:'pre-validate: invalidating password',data:{reason:'no facebookId and no existing password'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H3'})+'\n';
            fs.appendFileSync(logPath, logEntry);
          } catch(e){}
          // #endregion
          this.invalidate('password', 'Password is required for non-Facebook users');
          return next();
        }
      } catch (error: any) {
        // If we can't check, allow the update to proceed
        // The user might already have a password in the database
        // #region agent log
        try {
          const logEntry = JSON.stringify({location:'User.ts:206',message:'pre-validate: error checking existing user',data:{errorMessage:error?.message || String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H3'})+'\n';
          fs.appendFileSync(logPath, logEntry);
        } catch(e){}
        // #endregion
      }
    }
    return next();
  }
  
  // For new documents, require password unless Facebook user
  if (this.isNew && !this.facebookId && !this.password) {
    // #region agent log
    try {
      const logEntry = JSON.stringify({location:'User.ts:213',message:'pre-validate: invalidating new user password',data:{reason:'new user without facebookId and password'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})+'\n';
      fs.appendFileSync(logPath, logEntry);
    } catch(e){}
    // #endregion
    this.invalidate('password', 'Password is required for non-Facebook users');
  }
  
  next();
});

// Hash password before saving (skip if password is not modified or user is from Facebook)
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.facebookId || !this.password) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);

