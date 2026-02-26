import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database';
import Post from '../models/Post';
import Group from '../models/Group';

dotenv.config();

interface QuestionGroupMapping {
  question: string;
  groupName: string;
}

// Map ~65% of the therapist question posts to a fitting group
const QUESTION_GROUPS: QuestionGroupMapping[] = [
  {
    question: 'How do I stop replaying conversations in my head and analyzing everything I said?',
    groupName: 'Anxiety & Panic',
  },
  {
    question: 'Why do I feel anxious when things are going well? Like I’m waiting for something bad.',
    groupName: 'Anxiety & Panic',
  },
  {
    question: 'Is it normal to feel numb instead of sad?',
    groupName: 'Depression Support',
  },
  {
    question: 'How do I set boundaries without feeling guilty?',
    groupName: 'Self-Care & Mindfulness',
  },
  {
    question: 'How do you forgive yourself for past mistakes?',
    groupName: 'Trauma Healing',
  },
  {
    question: 'Why do I push people away when I start caring about them?',
    groupName: 'Trauma Healing',
  },
  {
    question: 'How do I know if I’m burnt out or just lazy?',
    groupName: 'Self-Care & Mindfulness',
  },
  {
    question: 'How do I calm down during a panic attack?',
    groupName: 'Anxiety & Panic',
  },
];

async function assignGroups() {
  try {
    console.log('🏷  Assigning groups to therapist question posts...');
    await connectDB();

    for (const mapping of QUESTION_GROUPS) {
      const group = await Group.findOne({ name: mapping.groupName });
      if (!group) {
        console.warn(`  ⚠️  Group "${mapping.groupName}" not found, skipping question: "${mapping.question}"`);
        continue;
      }

      const post = await Post.findOneAndUpdate(
        {
          title: mapping.question,
          postType: 'question',
        },
        {
          $set: { groupId: group._id },
        },
        { new: true }
      ).populate('groupId', 'name');

      if (!post) {
        console.warn(`  ⚠️  Post not found for question: "${mapping.question}"`);
        continue;
      }

      console.log(
        `  ✓ Linked question "${mapping.question}" -> group "${(post as any).groupId?.name || mapping.groupName}"`
      );
    }

    console.log('\n✅ Finished assigning groups to therapist question posts.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error assigning groups to therapist question posts:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

assignGroups();

