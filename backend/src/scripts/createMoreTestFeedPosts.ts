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
  replies?: FeedComment[];
}

interface FeedPost {
  author: string;
  hoursAgo: number;
  likes: number;
  title: string;
  content: string;
  comments: FeedComment[];
}

const FEED_POSTS: FeedPost[] = [
  {
    author: 'Maya R.',
    hoursAgo: 0.5, // 32 minutes ago
    likes: 14,
    title: 'Showing up for five minutes',
    content:
      'I almost skipped my workout again but told myself I only had to show up for five minutes. I stayed for thirty.',
    comments: [
      {
        author: 'Daniel K.',
        content: 'That five minute trick works.',
        replies: [
          { author: 'Maya R.', content: 'It removes the pressure somehow.' },
          { author: 'Daniel K.', content: 'Exactly. Starting is the hardest part.' },
        ],
      },
      { author: 'Sofia M.', content: 'Showing up is everything.' },
    ],
  },
  {
    author: 'Karim H.',
    hoursAgo: 1,
    likes: 41,
    title: 'Nights feel heavier',
    content:
      'It’s weird how nights feel heavier than mornings. During the day I can distract myself. At night it’s just me and my thoughts.',
    comments: [
      {
        author: 'Anna L.',
        content: 'Nights amplify everything.',
        replies: [{ author: 'Karim H.', content: 'They really do. It’s exhausting.' }],
      },
      {
        author: 'Lucas P.',
        content: 'I sleep with podcasts on because of this.',
        replies: [
          { author: 'Hannah E.', content: 'Same. Silence feels loud.' },
          { author: 'Lucas P.', content: 'That’s exactly it.' },
        ],
      },
      { author: 'Ethan L.', content: 'You’re not alone in that feeling.' },
      { author: 'Nina K.', content: 'Try a small routine before bed, it helped me.' },
    ],
  },
  {
    author: 'Emily S.',
    hoursAgo: 3,
    likes: 9,
    title: '"Just tired"',
    content: 'I keep telling people I’m “just tired.” It’s easier than explaining everything else.',
    comments: [
      {
        author: 'Sarah A.',
        content: 'I use that line too.',
        replies: [{ author: 'Emily S.', content: 'It avoids the questions.' }],
      },
    ],
  },
  {
    author: 'Daniel K.',
    hoursAgo: 5,
    likes: 67,
    title: 'Instagram detox',
    content: 'Deleted Instagram for a week. My brain feels quieter already.',
    comments: [
      {
        author: 'Sofia M.',
        content: 'I should try that.',
        replies: [{ author: 'Daniel K.', content: 'First two days were the hardest.' }],
      },
      {
        author: 'Chris D.',
        content: 'Did it help immediately?',
        replies: [{ author: 'Daniel K.', content: 'Not instantly. But noticeable after a few days.' }],
      },
      { author: 'Ahmed T.', content: 'Social media detox hits different.' },
      {
        author: 'Anna L.',
        content: 'I lasted three days.',
        replies: [{ author: 'Lucas P.', content: 'Three days is still something.' }],
      },
      { author: 'Maya R.', content: 'Protect your peace.' },
    ],
  },
  {
    author: 'Nina K.',
    hoursAgo: 7,
    likes: 3,
    title: 'No tears today',
    content: 'Today I didn’t cry. That’s it. That’s the post.',
    comments: [],
  },
  {
    author: 'Ethan L.',
    hoursAgo: 9,
    likes: 28,
    title: 'Overthinking mistakes',
    content:
      'I overthink every small mistake like it defines me as a person. I’m exhausted from fighting my own brain.',
    comments: [
      {
        author: 'Hannah E.',
        content: 'Your brain is lying to you.',
        replies: [{ author: 'Ethan L.', content: 'It feels very convincing though.' }],
      },
      { author: 'Karim H.', content: 'Perfectionism is brutal.' },
      { author: 'Emily S.', content: 'I relate so much.' },
      {
        author: 'Sofia M.',
        content: 'Same here.',
      },
      { author: 'Lucas P.', content: 'You are not your mistakes.' },
    ],
  },
  {
    author: 'Tara J.',
    hoursAgo: 12,
    likes: 19,
    title: 'Making a proper meal',
    content: 'Made a proper meal instead of skipping dinner. Trying to take care of myself in small ways.',
    comments: [
      { author: 'Daniel K.', content: 'That matters more than you think.' },
      {
        author: 'Anna L.',
        content: 'Proud of you.',
        replies: [{ author: 'Tara J.', content: 'Thank you, that means a lot.' }],
      },
      { author: 'Lucas P.', content: 'Small steps add up.' },
      { author: 'Sarah A.', content: 'What did you make?' },
    ],
  },
  {
    author: 'Lucas P.',
    hoursAgo: 15,
    likes: 52,
    title: 'Missing the old me',
    content: 'Sometimes I miss the old version of me before anxiety became part of my personality.',
    comments: [
      { author: 'Sarah A.', content: 'I think about that too.' },
      {
        author: 'Ahmed T.',
        content: 'You’re still you. Just evolving.',
        replies: [{ author: 'Lucas P.', content: 'I hope so.' }],
      },
      {
        author: 'Emily S.',
        content: 'Anxiety doesn’t define you.',
        replies: [{ author: 'Nina K.', content: 'It feels like it does though.' }],
      },
      { author: 'Sofia M.', content: 'Healing changes us, but not always for the worse.' },
      { author: 'Daniel K.', content: 'You’re more than what you struggle with.' },
    ],
  },
  {
    author: 'Ahmed T.',
    hoursAgo: 18,
    likes: 11,
    title: 'Looking back at old journals',
    content:
      'I opened my journal from last year. I forgot how dark it was. I’ve come further than I give myself credit for.',
    comments: [
      { author: 'Maya R.', content: 'That perspective hits.' },
      {
        author: 'Daniel K.',
        content: 'Growth is quiet sometimes.',
        replies: [{ author: 'Ahmed T.', content: 'Exactly. It sneaks up on you.' }],
      },
    ],
  },
  {
    author: 'Hannah E.',
    hoursAgo: 24,
    likes: 74,
    title: 'Feeling numb',
    content:
      'I don’t feel sad. I don’t feel happy. Just kind of numb. And that scares me more than being upset.',
    comments: [
      { author: 'Emily S.', content: 'Numbness is heavy in its own way.' },
      {
        author: 'Karim H.',
        content: 'I’ve been there. It passes slowly.',
        replies: [{ author: 'Hannah E.', content: 'I hope so.' }],
      },
      { author: 'Anna L.', content: 'Try grounding exercises maybe.' },
      { author: 'Sofia M.', content: 'Thank you for saying this.' },
      {
        author: 'Lucas P.',
        content: 'It’s a protective response sometimes.',
        replies: [{ author: 'Daniel K.', content: 'That’s true. The brain tries to shield us.' }],
      },
      { author: 'Nina K.', content: 'Sending you strength.' },
    ],
  },
];

function normalizeAuthorName(name: string) {
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

async function createMoreTestFeedPosts() {
  try {
    console.log('🌌 Creating additional Aurora test feed posts...');
    await connectDB();

    // Build a pool of potential likers from all authors referenced here
    const likerNames = Array.from(
      new Set(
        FEED_POSTS.flatMap((p) => [
          p.author,
          ...p.comments.map((c) => c.author),
          ...p.comments.flatMap((c) => c.replies?.map((r) => r.author) || []),
        ])
      )
    );

    const likerIdMap = new Map<string, mongoose.Types.ObjectId>();
    for (const name of likerNames) {
      const id = await ensureUserExists(name);
      likerIdMap.set(name, id);
    }

    for (const feedPost of FEED_POSTS) {
      const authorId = await ensureUserExists(feedPost.author);

      const createdAt = new Date();
      createdAt.setTime(createdAt.getTime() - feedPost.hoursAgo * 60 * 60 * 1000);

      // Generate likes from the pool (cap at pool size)
      const likeUserIds: mongoose.Types.ObjectId[] = [];
      const pool = Array.from(likerIdMap.values());
      const likeCount = Math.min(feedPost.likes, pool.length);

      for (let i = 0; i < likeCount; i++) {
        likeUserIds.push(pool[i]);
      }

      const post = await Post.create({
        author: authorId,
        title: feedPost.title,
        content: feedPost.content,
        postType: 'post',
        tags: ['testfeed', 'community'],
        images: [],
        groupId: null,
        likes: likeUserIds,
        commentsCount: 0,
        createdAt,
        updatedAt: createdAt,
      });

      console.log(`  ✓ Created testfeed post by ${feedPost.author}`);

      // Create comments and nested replies
      for (const commentData of feedPost.comments) {
        const commentAuthorId = await ensureUserExists(commentData.author);

        const baseComment = await Comment.create({
          post: post._id,
          author: commentAuthorId,
          content: commentData.content,
          likes: [],
        });

        await Post.findByIdAndUpdate(post._id, {
          $inc: { commentsCount: 1 },
        });

        console.log(`    • Comment by ${commentData.author}`);

        if (commentData.replies && commentData.replies.length > 0) {
          for (const replyData of commentData.replies) {
            const replyAuthorId = await ensureUserExists(replyData.author);
            await Comment.create({
              post: post._id,
              author: replyAuthorId,
              content: replyData.content,
              likes: [],
              parentComment: baseComment._id,
            });

            console.log(`      ↳ Reply by ${replyData.author}`);
          }
        }
      }
    }

    console.log('\n✅ Finished creating additional Aurora test feed posts.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating additional test feed posts:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

createMoreTestFeedPosts();

