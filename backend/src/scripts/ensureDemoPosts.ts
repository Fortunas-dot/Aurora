import User from '../models/User';
import Post from '../models/Post';
import Comment from '../models/Comment';

type PostType = 'post' | 'question' | 'story';

type DemoPostSeed = {
  title: string;
  content: string;
  postType: PostType;
  tags: string[];
  comments: string[];
  /**
   * Target number of demo comments we want for this post.
   * We only ADD missing demo comments (we never delete).
   */
  targetCommentCount: number;
};

// Keep this list small and deterministic so it is safe to run on every backend start.
// This does NOT delete anything; it only inserts missing demo posts/comments.
const DEMO_POSTS: DemoPostSeed[] = [
  {
    title: 'My anxiety gets loud at night when it is quiet. What helps?',
    content:
      'During the day I can usually cope, but at night when things get quiet my brain starts racing. I end up stuck in that "what if" loop, and my body feels tense even when I am safe. Breathing helps for a minute, then the thoughts come right back.\n\nI am looking for routines or grounding strategies that help you switch from "on" to "sleep." What do you do to wind down (music, journaling, a routine, grounding, anything)? And what do you do when your mind refuses to slow down?',
    postType: 'question',
    tags: ['anxiety', 'sleep', 'night-routine', 'coping', 'question'],
    comments: [
      'Oof, the quiet at night spiral is so real.',
      'I relate. What is helped me is the same wind down every night, no negotiating.',
      'If breathing only works for a minute, try grounding before bed. It gives my brain a task.',
      'You are not alone. The fact you are looking for a strategy instead of blaming yourself matters.',
      'If you can, try one small wind down promise (like no scrolling). It gives your brain a rule.',
      'I do a quick body scan and it helps me stop arguing with my thoughts.',
    ],
    targetCommentCount: 6,
  },
  {
    title: 'Therapy homework week. I did the boring stuff and honestly… I am proud',
    content:
      'This week was not dramatic. It was just real. I did the little homework my therapist asked for, even when I did not feel like it.\n\nOne check in, one journaling prompt, and one moment where I caught my brain doing the worst case story and I interrupted it. Nothing magically fixed my life overnight, but I feel steadier.\n\nIf you are waiting for motivation to show up first, this is your reminder that showing up small still counts.',
    postType: 'post',
    tags: ['therapy', 'self-care', 'progress', 'habits'],
    comments: [
      'This is the kind of progress I wish more people talked about.',
      'Small homework wins are huge, especially when you are tired.',
      'I love that you caught the worst case story and interrupted it. That is real work.',
      'Proud of you. Keep doing the boring things.',
      'Tiny efforts add up. It sounds boring, but it is actually powerful.',
      'I needed to read this today. Thank you for sharing it.',
    ],
    targetCommentCount: 6,
  },
  {
    title: 'The guilt that hits when I finally rest. How do you handle it?',
    content:
      'Does anyone else get guilt when they finally stop and rest? For me it is like, "If I am not being productive, I am falling behind." Even when I am exhausted, I feel restless like I should be doing chores, replying, catching up.\n\nI know rest is important, but the guilt feels louder than the logic. What helped you reframe it? Any practical scripts or boundaries you use so you can actually relax without spiraling?',
    postType: 'question',
    tags: ['burnout', 'guilt', 'boundaries', 'self-care', 'question'],
    comments: [
      'Yes. My brain treats rest like it is optional, and that is exhausting.',
      'A script helps me too. I literally say to myself, "I am allowed to stop now."',
      'Try a tiny next step instead of trying to relax instantly. It eases the guilt.',
      'Rest is not something you earn. Your nervous system needs it.',
      'That guilt voice gets quieter when you repeat the same permission phrase.',
      'If rest feels guilty, try resting with a purpose. Like "I am recovering."',
    ],
    targetCommentCount: 5,
  },
  {
    title: 'I set a boundary with my family and nothing exploded (small win)',
    content:
      'I used to dread certain family conversations because they always turned into pressure. I would go in stressed, and I would leave even more stressed.\n\nThis time I tried something small. I gave myself a time limit and used a simple script. When it started drifting into that zone, I said calmly I was not available right now, and I ended the call.\n\nI expected to feel awful, but honestly I felt lighter. Not perfect, not forever fixed, but my nervous system finally got a break.',
    postType: 'story',
    tags: ['boundaries', 'family', 'stress', 'healing', 'support'],
    comments: [
      'That is a big win. Boundaries are hard when people keep pushing.',
      'I am proud of you for using a script instead of arguing.',
      'Ending the call is underrated. Your peace matters more than being understood in that moment.',
      'Small wins like this change the pattern over time.',
      'You did the healthy thing, even when it might have felt uncomfortable in the moment.',
      'I love this. Boundaries aren\'t mean; they are protection.',
    ],
    targetCommentCount: 6,
  },
  {
    title: 'ADHD mornings. How do you start without burning out?',
    content:
      'Mornings are hard. I wake up and everything feels urgent, but I cannot decide what matters first. Then I either do nothing, or I do one thing and crash.\n\nJust be motivated advice does not work when my brain is overloaded.\n\nWhat helps you actually start? Do you use timers, body doubling, a tiny checklist, or prep the night before? What does your first 20 to 30 minutes look like on a tough day?',
    postType: 'question',
    tags: ['adhd', 'routine', 'morning', 'productivity', 'question'],
    comments: [
      'I need a super short plan or I freeze.',
      'Timers plus body doubling help me start without burning out.',
      'Prep the night before is my cheat code. Even one tiny step helps.',
      'Thank you for asking. I am saving this for the next rough morning.',
      'I set up the first task the night before. So in the morning I only have to start.',
      'On bad days, I aim for start only and let the rest wait.',
    ],
    targetCommentCount: 6,
  },
];

// Force a stable demo date so the UI shows the expected timeline.
// The UI typically uses Post.createdAt / Comment.createdAt.
// We also vary the time within 09:00–13:00 on 20 March so everything doesn't look identical.
const DEMO_DATE_UTC = { year: 2026, monthIndex: 2, day: 20 }; // monthIndex=2 => March
const DEMO_HOUR_START_UTC = 9;
const DEMO_HOUR_END_UTC = 13;

const makeUtc = (hour: number, minute: number): Date => {
  return new Date(Date.UTC(DEMO_DATE_UTC.year, DEMO_DATE_UTC.monthIndex, DEMO_DATE_UTC.day, hour, minute, 0, 0));
};

const getPostTimestamp = (seedIndex: number): Date => {
  const hour = Math.min(DEMO_HOUR_END_UTC, DEMO_HOUR_START_UTC + seedIndex);
  const minute = (seedIndex * 13) % 60;
  return makeUtc(hour, minute);
};

const getCommentTimestamp = (seedIndex: number, commentIndex: number): Date => {
  const hour = Math.min(DEMO_HOUR_END_UTC, DEMO_HOUR_START_UTC + seedIndex);
  const minute = (commentIndex * 15 + seedIndex * 7) % 60;
  return makeUtc(hour, minute);
};

export const ensureDemoPostsAndComments = async (): Promise<void> => {
  // Use explicit usernames so demo "poster" authors are deterministic and
  // we never accidentally use the same person for every post.
  const demoAuthorUsernames = [
    'sarah_wellness',
    'mike_mindful',
    'lisa_healing',
    'david_strong',
    'emma_hopeful',
    'james_calm',
    'sophia_zen',
    'alex_recovery',
  ];

  const users = await User.find({ username: { $in: demoAuthorUsernames } }).select('_id username');
  const usersByUsername = new Map(users.map((u) => [u.username, u._id]));

  const pickUserId = (i: number) => {
    const username = demoAuthorUsernames[i % demoAuthorUsernames.length];
    const id = usersByUsername.get(username);
    if (id) return id;

    // Fallback: pick any user if some demo usernames are missing in DB.
    const anyUser = users[0];
    if (anyUser?._id) return anyUser._id;
    throw new Error('[ensureDemoPosts] No demo users found to assign authors.');
  };

  for (let seedIndex = 0; seedIndex < DEMO_POSTS.length; seedIndex++) {
    const seed = DEMO_POSTS[seedIndex];
    let post = await Post.findOne({ title: seed.title }).select('_id title commentsCount');

    if (!post) {
      const postTimestamp = getPostTimestamp(seedIndex);
      post = await Post.create({
        author: pickUserId(seedIndex),
        title: seed.title,
        content: seed.content,
        postType: seed.postType,
        tags: seed.tags,
        groupId: null,
        likes: [],
        commentsCount: 0,
        images: [],
        video: undefined,
        createdAt: postTimestamp,
        updatedAt: postTimestamp,
      });
    } else {
      // If the post already exists (from a previous seed run), fix its timestamp and author anyway.
      const postTimestamp = getPostTimestamp(seedIndex);
      await Post.updateOne(
        { _id: post._id },
        {
          $set: {
            author: pickUserId(seedIndex),
            createdAt: postTimestamp,
            updatedAt: postTimestamp,
          },
        }
      );
    }

    const existingComments = await Comment.find({ post: post._id }).select('content likes');
    const existingContents = new Set(existingComments.map((c) => c.content));
    const existingCount = existingComments.length;

    // Create missing demo comments up to the target count (never delete).
    if (existingCount < seed.targetCommentCount) {
      const remainingSlots = seed.targetCommentCount - existingCount;
      const toCreate = seed.comments.filter((text) => !existingContents.has(text)).slice(0, remainingSlots);

      for (let i = 0; i < toCreate.length; i++) {
        const text = toCreate[i];
        const authorId = pickUserId(seedIndex + 1 + i);
        const commentIndex = seed.comments.indexOf(text);
        const commentTimestamp = getCommentTimestamp(seedIndex, commentIndex >= 0 ? commentIndex : i);

        // Random likes: 0..3 demo users.
        const likesCount = Math.floor(Math.random() * 4);
        const likeUsers = users
          .filter((u) => u._id.toString() !== authorId.toString())
          .sort(() => Math.random() - 0.5)
          .slice(0, likesCount)
          .map((u) => u._id);

        await Comment.create({
          post: post._id,
          author: authorId,
          content: text,
          likes: likeUsers,
          createdAt: commentTimestamp,
          updatedAt: commentTimestamp,
        });
      }
    }

    // Ensure all seeded comments (even if they existed already) have stable timestamps.
    // Use different times within 09:00–13:00 so they don't all look identical.
    for (let commentIndex = 0; commentIndex < seed.comments.length; commentIndex++) {
      const commentTimestamp = getCommentTimestamp(seedIndex, commentIndex);
      await Comment.updateMany(
        { post: post._id, content: seed.comments[commentIndex] },
        { $set: { createdAt: commentTimestamp, updatedAt: commentTimestamp } }
      );
    }

    // Give seeded comments random likes if they currently have none.
    const seededComments = await Comment.find({
      post: post._id,
      content: { $in: seed.comments },
    }).select('content likes author');

    for (const c of seededComments) {
      if (Array.isArray(c.likes) && c.likes.length > 0) continue;

      const likesCount = Math.floor(Math.random() * 4);
      const likeUsers = users
        .filter((u) => u._id.toString() !== c.author.toString())
        .sort(() => Math.random() - 0.5)
        .slice(0, likesCount)
        .map((u) => u._id);

      await Comment.updateOne({ _id: c._id }, { $set: { likes: likeUsers } });
    }

    const actualCount = await Comment.countDocuments({ post: post._id });
    if (post.commentsCount !== actualCount) {
      post.commentsCount = actualCount;
      await post.save();
    }
  }
};

