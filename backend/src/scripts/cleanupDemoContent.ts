import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database';
import User from '../models/User';
import Post from '../models/Post';
import Comment from '../models/Comment';
import Group from '../models/Group';
import Notification from '../models/Notification';

dotenv.config();

/**
 * One-off cleanup script to remove demo/test content:
 * - All posts authored by @mike and @aurora
 * - The group named "Testgroup" (and its posts/notifications)
 *
 * IMPORTANT:
 * - This script uses the same Mongo connection settings as the main server.
 * - Run with NODE_ENV=production against the environment you want to clean.
 */
async function cleanupDemoContent() {
  try {
    console.log('🧹 Starting cleanup of demo content...');

    await connectDB();

    // 1. Find users by usernames for demo/test accounts shown as:
    //    Mike @Mike, Bob @Aurora, and the original seed user mike_mindful
    const targetUsernames = ['mike_mindful', 'aurora', 'Mike', 'Aurora'];
    const users = await User.find({ username: { $in: targetUsernames } }).select('_id username');

    if (!users.length) {
      console.log('ℹ️ No users found for usernames:', targetUsernames.join(', '));
    } else {
      console.log('👥 Found users to clean posts for:');
      users.forEach((u) => console.log(`  - ${u.username} (${u._id})`));

      const userIds = users.map((u) => u._id);

      // Find posts by these users
      const posts = await Post.find({ author: { $in: userIds } }).select('_id author title');
      const postIds = posts.map((p) => p._id);

      console.log(`📝 Found ${posts.length} posts by @mike / @aurora to delete.`);

      if (postIds.length) {
        // Delete comments attached to these posts
        const { deletedCount: deletedComments } = await Comment.deleteMany({ post: { $in: postIds } });
        console.log(`💬 Deleted ${deletedComments || 0} comments on those posts.`);

        // Delete notifications related to these posts
        const { deletedCount: deletedPostNotifications } = await Notification.deleteMany({
          relatedPost: { $in: postIds },
        });
        console.log(`🔔 Deleted ${deletedPostNotifications || 0} notifications related to those posts.`);

        // Finally delete the posts
        const { deletedCount: deletedPosts } = await Post.deleteMany({ _id: { $in: postIds } });
        console.log(`🗑️  Deleted ${deletedPosts || 0} posts by @mike / @aurora.`);
      }
    }

    // 2. Remove group named "Testgroup" and its posts/notifications
    const testGroup = await Group.findOne({ name: 'Testgroup' }).select('_id name');

    if (!testGroup) {
      console.log('ℹ️ No group named "Testgroup" found.');
    } else {
      console.log(`👥 Found group to delete: "${testGroup.name}" (${testGroup._id})`);

      // Find posts in this group
      const groupPosts = await Post.find({ groupId: testGroup._id }).select('_id');
      const groupPostIds = groupPosts.map((p) => p._id);

      console.log(`📝 Found ${groupPosts.length} posts in "Testgroup" to delete.`);

      if (groupPostIds.length) {
        const { deletedCount: deletedGroupComments } = await Comment.deleteMany({ post: { $in: groupPostIds } });
        console.log(`💬 Deleted ${deletedGroupComments || 0} comments on Testgroup posts.`);

        const { deletedCount: deletedGroupPostNotifications } = await Notification.deleteMany({
          relatedPost: { $in: groupPostIds },
        });
        console.log(`🔔 Deleted ${deletedGroupPostNotifications || 0} notifications related to Testgroup posts.`);

        const { deletedCount: deletedGroupPosts } = await Post.deleteMany({ _id: { $in: groupPostIds } });
        console.log(`🗑️  Deleted ${deletedGroupPosts || 0} posts in Testgroup.`);
      }

      // Delete notifications that point directly to the group
      const { deletedCount: deletedGroupNotifications } = await Notification.deleteMany({
        relatedGroup: testGroup._id,
      });
      console.log(`🔔 Deleted ${deletedGroupNotifications || 0} notifications related to Testgroup itself.`);

      // Finally delete the group
      const { deletedCount: deletedGroups } = await Group.deleteOne({ _id: testGroup._id });
      console.log(`🗑️  Deleted group "Testgroup" (count=${deletedGroups || 0}).`);
    }

    console.log('✅ Demo content cleanup completed.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

cleanupDemoContent();

