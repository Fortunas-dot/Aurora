import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database';
import Post from '../models/Post';

dotenv.config();

async function deleteAllPosts() {
  try {
    console.log('🗑️  Connecting to database to delete all posts...');
    await connectDB();

    const count = await Post.countDocuments();
    console.log(`🔍 Found ${count} post(s) to delete.`);

    if (count === 0) {
      console.log('✅ No posts to delete. Exiting.');
      await mongoose.connection.close();
      process.exit(0);
    }

    const result = await Post.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} post(s) from the feed.`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error while deleting posts:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

deleteAllPosts();

