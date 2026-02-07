import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database';
import User from '../models/User';
import Post from '../models/Post';
import Comment from '../models/Comment';

dotenv.config();

const SHOWCASE_EMAIL = 'showcase@aurora.app';
const SHOWCASE_USERNAME = 'showcase_user';
const SHOWCASE_DISPLAY_NAME = 'Aurora User';

async function removeShowcasePosts() {
  try {
    console.log('🗑️  Removing all posts from Aurora User (showcase account)...');
    
    // Connect to database
    await connectDB();
    
    // Find showcase user
    const showcaseUser = await User.findOne({
      $or: [
        { email: SHOWCASE_EMAIL },
        { username: SHOWCASE_USERNAME },
        { displayName: SHOWCASE_DISPLAY_NAME },
      ],
    });
    
    if (!showcaseUser) {
      console.log('⚠️  Showcase user not found. No posts to remove.');
      process.exit(0);
    }
    
    console.log(`📋 Found showcase user: ${showcaseUser.displayName || showcaseUser.username} (${showcaseUser.email})`);
    
    // Find all posts by showcase user
    const posts = await Post.find({ author: showcaseUser._id });
    console.log(`📝 Found ${posts.length} posts to remove`);
    
    if (posts.length === 0) {
      console.log('✅ No posts found. Nothing to remove.');
      process.exit(0);
    }
    
    // Get all post IDs
    const postIds = posts.map(p => p._id);
    
    // Delete all comments on these posts
    const commentsResult = await Comment.deleteMany({ post: { $in: postIds } });
    console.log(`  ✓ Deleted ${commentsResult.deletedCount} comments`);
    
    // Delete all posts
    const postsResult = await Post.deleteMany({ author: showcaseUser._id });
    console.log(`  ✓ Deleted ${postsResult.deletedCount} posts`);
    
    console.log('\n✅ All posts from Aurora User have been removed!');
    
    // Verify
    const remainingPosts = await Post.countDocuments({ author: showcaseUser._id });
    if (remainingPosts === 0) {
      console.log('✅ Verification: No posts remaining from Aurora User');
    } else {
      console.log(`⚠️  Warning: ${remainingPosts} posts still remain`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error removing showcase posts:', error);
    process.exit(1);
  }
}

removeShowcasePosts();
