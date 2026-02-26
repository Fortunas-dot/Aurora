import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database';
import User from '../models/User';
import Comment from '../models/Comment';

dotenv.config();

async function labelExistingTherapistComments() {
  try {
    console.log('🏷  Labelling existing therapist comments...');
    await connectDB();

    // Find all therapist users
    const therapists = await User.find({ isTherapist: true }).select('_id displayName');
    const therapistIds = therapists.map((t) => t._id);

    console.log(`🔍 Found ${therapists.length} therapist account(s).`);

    if (therapistIds.length === 0) {
      console.log('✅ No therapist users found, nothing to update.');
      await mongoose.connection.close();
      process.exit(0);
    }

    const comments = await Comment.find({
      author: { $in: therapistIds },
    });

    console.log(`🔍 Found ${comments.length} therapist comment(s) to inspect.`);

    let updated = 0;
    const prefix = '⭐ Certified therapist – ';

    for (const comment of comments) {
      if (comment.content.startsWith(prefix)) {
        continue;
      }

      const therapist = therapists.find((t) => t._id.equals(comment.author));
      const name = therapist?.displayName || 'Therapist';

      comment.content = `${prefix}${name}: ${comment.content}`;
      await comment.save();
      updated++;
    }

    console.log(`✅ Updated ${updated} therapist comment(s) with label prefix.`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error labelling therapist comments:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

labelExistingTherapistComments();

