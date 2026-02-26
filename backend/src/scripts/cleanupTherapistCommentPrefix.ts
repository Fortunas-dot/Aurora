import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database';
import User from '../models/User';
import Comment from '../models/Comment';

dotenv.config();

async function cleanupTherapistCommentPrefix() {
  try {
    console.log('🧹 Cleaning up old therapist comment prefixes...');
    await connectDB();

    const therapists = await User.find({ isTherapist: true }).select('_id displayName');
    const therapistIds = therapists.map((t) => t._id);

    console.log(`🔍 Found ${therapists.length} therapist account(s).`);

    if (therapistIds.length === 0) {
      console.log('✅ No therapist users found, nothing to clean.');
      await mongoose.connection.close();
      process.exit(0);
    }

    const comments = await Comment.find({
      author: { $in: therapistIds },
    });

    console.log(`🔍 Found ${comments.length} therapist comment(s) to inspect.`);

    let updated = 0;

    for (const comment of comments) {
      const original = comment.content;
      // Remove any previous "⭐ Certified therapist – Name: " prefix if present
      const prefixMatch = original.match(/^⭐ Certified therapist –[^:]+:\s*/);
      if (prefixMatch) {
        comment.content = original.replace(prefixMatch[0], '');
        await comment.save();
        updated++;
      }
    }

    console.log(`✅ Cleaned up ${updated} therapist comment(s).`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning up therapist comment prefixes:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

cleanupTherapistCommentPrefix();

