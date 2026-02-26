import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../config/database';
import User from '../models/User';
import Post from '../models/Post';
import Comment from '../models/Comment';

dotenv.config();

interface FeedComment {
  author: string;
  content: string;
}

interface FeedPost {
  author: string;
  hoursAgo: number; // how many hours ago the post was created
  title: string;
  content: string;
  comments: FeedComment[];
}

const FEED_POSTS: FeedPost[] = [
  {
    author: 'Maya R.',
    hoursAgo: 1,
    title: 'Small reset',
    content:
      "I cleaned my room today after weeks of letting it pile up. It doesn’t seem like much, but it felt impossible before. Small reset.",
    comments: [
      { author: 'Daniel K.', content: 'A clean space really helps the mind too. Proud of you.' },
      { author: 'Sofia M.', content: 'That’s not small. That’s momentum.' },
      { author: 'Liam J.', content: 'I need this energy.' },
    ],
  },
  {
    author: 'Ethan L.',
    hoursAgo: 3,
    title: 'Saying no',
    content:
      "I said no to something that drained me. Didn’t over explain. Just said no. Still feel guilty, but also relieved.",
    comments: [
      { author: 'Hannah E.', content: 'Boundaries feel wrong before they feel right.' },
      { author: 'Ahmed T.', content: 'That guilt fades. The relief stays.' },
      { author: 'Nina K.', content: 'I’m trying to learn this too.' },
    ],
  },
  {
    author: 'Sofia M.',
    hoursAgo: 5,
    title: 'Stress day for no reason',
    content:
      'Woke up anxious for no reason. Nothing bad happened. My body just decided today is a stress day.',
    comments: [
      { author: 'Lucas P.', content: 'Hate when that happens. It’s exhausting.' },
      { author: 'Emily S.', content: 'Those days need extra kindness.' },
      { author: 'Chris D.', content: 'You’re not alone in that.' },
    ],
  },
  {
    author: 'Karim H.',
    hoursAgo: 7,
    title: 'Deleting their number',
    content:
      'I finally deleted their number. I kept checking if they’d text. They never did. I think this was the closure I had to give myself.',
    comments: [
      { author: 'Tara J.', content: 'That takes strength.' },
      { author: 'Daniel K.', content: 'Self respect hurts sometimes.' },
      { author: 'Maya R.', content: 'Proud of you for choosing yourself.' },
    ],
  },
  {
    author: 'Anna L.',
    hoursAgo: 9,
    title: 'Masking at work',
    content:
      'I’ve been pretending I’m okay at work. Smiling. Performing. The second I get in my car I just sit there in silence.',
    comments: [
      { author: 'Ethan L.', content: 'The car breakdowns are real.' },
      { author: 'Hannah E.', content: 'Masking is so draining.' },
      { author: 'Sofia M.', content: 'I feel this deeply.' },
    ],
  },
  {
    author: 'Lucas P.',
    hoursAgo: 12,
    title: '10 minute walk',
    content:
      'Went for a 10 minute walk instead of staying in bed all day. It wasn’t life changing. But it was different.',
    comments: [
      { author: 'Ahmed T.', content: 'Different is good.' },
      { author: 'Nina K.', content: 'Movement really shifts something.' },
      { author: 'Emily S.', content: '10 minutes is a win.' },
    ],
  },
  {
    author: 'Sarah A.',
    hoursAgo: 14,
    title: 'Comparison online',
    content:
      'I keep comparing myself to everyone online. It’s messing with my head more than I want to admit.',
    comments: [
      { author: 'Daniel K.', content: 'Social media is a highlight reel. Always.' },
      { author: 'Tara J.', content: 'I had to unfollow a lot of people for my peace.' },
      { author: 'Chris D.', content: 'Same. It sneaks up on you.' },
    ],
  },
  {
    author: 'Noah B.',
    hoursAgo: 18,
    title: 'Therapy tears',
    content:
      'I had therapy today and cried over something I thought I was “over.” Guess healing isn’t linear.',
    comments: [
      { author: 'Maya R.', content: 'It never is. You’re still moving forward.' },
      { author: 'Sofia M.', content: 'Revisiting doesn’t mean regressing.' },
      { author: 'Ethan L.', content: 'That’s growth actually.' },
    ],
  },
  {
    author: 'Emily S.',
    hoursAgo: 22,
    title: 'Existing is enough',
    content:
      'Today I didn’t feel productive. Didn’t improve myself. Didn’t optimize anything. I just existed. Trying to tell myself that’s enough.',
    comments: [
      { author: 'Karim H.', content: 'Existing is underrated.' },
      { author: 'Hannah E.', content: 'Rest is productive too.' },
      { author: 'Lucas P.', content: 'I needed to read this.' },
    ],
  },
  {
    author: 'Daniel K.',
    hoursAgo: 24,
    title: 'Opening up to a friend',
    content:
      'I opened up to a friend last night instead of isolating. It felt awkward. But lighter after.',
    comments: [
      { author: 'Anna L.', content: 'That vulnerability is powerful.' },
      { author: 'Sarah A.', content: 'I’m scared to do that. Respect.' },
      { author: 'Ahmed T.', content: 'The right people make it worth it.' },
    ],
  },
];

// Simple helper to create a safe username + email from a display name
function normalizeAuthorName(name: string) {
  // "Maya R." -> { displayName: "Maya R.", username: "maya_r", email: "maya_r@testfeed.local" }
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const username = base || 'aurora_user';
  const email = `${username}@testfeed.local`;

  return { displayName: name, username, email };
}

async function ensureUserExists(displayName: string): Promise<mongoose.Types.ObjectId> {
  const { username, email } = normalizeAuthorName(displayName);

  // Prefer existing user by username or email if present
  let user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (user) {
    return user._id;
  }

  const hashedPassword = await bcrypt.hash('password123', 10);

  user = await User.create({
    email,
    password: hashedPassword,
    username,
    displayName,
    isAnonymous: false,
    bio: '',
  });

  console.log(`  ✓ Created testfeed user: ${displayName} (${username})`);
  return user._id;
}

async function createTestFeedPosts() {
  try {
    console.log('🌌 Creating Aurora test feed posts...');
    await connectDB();

    const createdPosts: mongoose.Types.ObjectId[] = [];

    for (const feedPost of FEED_POSTS) {
      const authorId = await ensureUserExists(feedPost.author);

      const createdAt = new Date();
      createdAt.setHours(createdAt.getHours() - feedPost.hoursAgo);

      const post = await Post.create({
        author: authorId,
        title: feedPost.title,
        content: feedPost.content,
        postType: 'post',
        tags: ['testfeed', 'community'],
        images: [],
        groupId: null,
        likes: [],
        commentsCount: 0,
        createdAt,
        updatedAt: createdAt,
      });

      createdPosts.push(post._id);
      console.log(`  ✓ Created testfeed post by ${feedPost.author}`);

      // Create comments
      for (const commentData of feedPost.comments) {
        const commentAuthorId = await ensureUserExists(commentData.author);
        const comment = await Comment.create({
          post: post._id,
          author: commentAuthorId,
          content: commentData.content,
          likes: [],
        });

        // Increment commentsCount on post
        await Post.findByIdAndUpdate(post._id, {
          $inc: { commentsCount: 1 },
        });

        console.log(`    • Comment by ${commentData.author}`);
      }
    }

    console.log('\n✅ Finished creating Aurora test feed posts.');
    console.log(`   - Posts created: ${createdPosts.length}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test feed posts:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

createTestFeedPosts();

