import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database';
import Post from '../models/Post';
import Group from '../models/Group';

dotenv.config();

interface FeedGroupMapping {
  title: string;
  groupName: string;
}

const FEED_GROUPS: FeedGroupMapping[] = [
  {
    title: 'Small reset',
    groupName: 'Self-Care & Mindfulness',
  },
  {
    title: 'Nights feel heavier',
    groupName: 'Depression Support',
  },
  {
    title: '"Just tired"',
    groupName: 'Depression Support',
  },
  {
    title: 'Instagram detox',
    groupName: 'Self-Care & Mindfulness',
  },
  {
    title: 'No tears today',
    groupName: 'Depression Support',
  },
  {
    title: 'Overthinking mistakes',
    groupName: 'Anxiety & Panic',
  },
  {
    title: 'Making a proper meal',
    groupName: 'Self-Care & Mindfulness',
  },
  {
    title: 'Missing the old me',
    groupName: 'Depression Support',
  },
  {
    title: 'Looking back at old journals',
    groupName: 'Trauma Healing',
  },
  {
    title: 'Feeling numb',
    groupName: 'Depression Support',
  },
];

async function assignFeedPostGroups() {
  try {
    console.log('🏷  Assigning groups to feed posts (post category)...');
    await connectDB();

    for (const mapping of FEED_GROUPS) {
      const group = await Group.findOne({ name: mapping.groupName });
      if (!group) {
        console.warn(`  ⚠️  Group "${mapping.groupName}" not found, skipping title: "${mapping.title}"`);
        continue;
      }

      const post = await Post.findOneAndUpdate(
        {
          title: mapping.title,
          postType: 'post',
        },
        {
          $set: { groupId: group._id },
        },
        { new: true }
      ).populate('groupId', 'name');

      if (!post) {
        console.warn(`  ⚠️  Post not found for title: "${mapping.title}"`);
        continue;
      }

      console.log(
        `  ✓ Linked post "${mapping.title}" -> group "${(post as any).groupId?.name || mapping.groupName}"`
      );
    }

    console.log('\n✅ Finished assigning groups to feed posts.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error assigning groups to feed posts:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

assignFeedPostGroups();

