import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database';
import Post from '../models/Post';
import Comment from '../models/Comment';

dotenv.config();

async function recalculateCommentsCount() {
  try {
    console.log('🧮 Recalculating commentsCount for all posts...');
    await connectDB();

    const posts = await Post.find({}, '_id commentsCount').lean();
    console.log(`🔍 Found ${posts.length} post(s) to update.`);

    let updated = 0;

    for (const post of posts) {
      const count = await Comment.countDocuments({ post: post._id });

      await Post.updateOne(
        { _id: post._id },
        { $set: { commentsCount: count } }
      );

      updated++;
      console.log(`  ✓ Post ${post._id.toString()} -> commentsCount = ${count}`);
    }

    console.log(`\n✅ Done. Updated ${updated} post(s).`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error recalculating commentsCount:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

recalculateCommentsCount();

