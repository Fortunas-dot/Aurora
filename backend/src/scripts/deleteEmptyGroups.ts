import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database';
import Group from '../models/Group';
import Post from '../models/Post';

dotenv.config();

async function deleteEmptyGroups() {
  try {
    console.log('🧹 Deleting groups without any posts...');
    await connectDB();

    const groups = await Group.find().select('_id name').lean();
    console.log(`Found ${groups.length} groups in database.`);

    const groupsWithoutPosts: { _id: mongoose.Types.ObjectId; name: string }[] = [];

    for (const group of groups) {
      const postCount = await Post.countDocuments({ groupId: group._id });
      if (postCount === 0) {
        groupsWithoutPosts.push(group as any);
      }
    }

    if (groupsWithoutPosts.length === 0) {
      console.log('✅ No empty groups found. Nothing to delete.');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`Found ${groupsWithoutPosts.length} groups without posts:`);
    groupsWithoutPosts.forEach((g) => {
      console.log(`  - ${g.name} (${g._id.toString()})`);
    });

    const idsToDelete = groupsWithoutPosts.map((g) => g._id);
    const result = await Group.deleteMany({ _id: { $in: idsToDelete } });

    console.log(`\n🗑  Deleted ${result.deletedCount ?? 0} empty groups.`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting empty groups:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

deleteEmptyGroups();

