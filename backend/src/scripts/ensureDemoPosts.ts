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
    ],
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
    ],
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
    ],
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
    ],
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
    ],
  },
];

// Force a stable demo date so the UI shows the expected timeline.
// The UI typically uses Post.createdAt / Comment.createdAt.
const FIXED_DEMO_DATE_UTC = new Date('2026-03-20T12:00:00.000Z');

export const ensureDemoPostsAndComments = async (): Promise<void> => {
  const users = await User.find({}).select('_id username').limit(50);
  if (users.length === 0) {
    console.warn('[ensureDemoPosts] No users found; skipping demo post creation.');
    return;
  }

  // Use a stable list of authors so comments/posts look consistent but still "human".
  const pickUserId = (i: number) => users[i % users.length]._id;

  for (const seed of DEMO_POSTS) {
    let post = await Post.findOne({ title: seed.title }).select('_id title commentsCount');

    if (!post) {
      post = await Post.create({
        author: pickUserId(0),
        title: seed.title,
        content: seed.content,
        postType: seed.postType,
        tags: seed.tags,
        groupId: null,
        likes: [],
        commentsCount: 0,
        images: [],
        video: undefined,
        createdAt: FIXED_DEMO_DATE_UTC,
        updatedAt: FIXED_DEMO_DATE_UTC,
      });
    } else {
      // If the post already exists (from a previous seed run), fix its timestamp anyway.
      await Post.updateOne(
        { _id: post._id },
        { $set: { createdAt: FIXED_DEMO_DATE_UTC, updatedAt: FIXED_DEMO_DATE_UTC } }
      );
    }

    const existingComments = await Comment.find({ post: post._id }).select('content');
    const existingContents = new Set(existingComments.map((c) => c.content));

    let created = 0;
    for (let i = 0; i < seed.comments.length; i++) {
      const text = seed.comments[i];
      if (existingContents.has(text)) continue;

      await Comment.create({
        post: post._id,
        author: pickUserId(i + 1 + created),
        content: text,
        likes: [],
        createdAt: FIXED_DEMO_DATE_UTC,
        updatedAt: FIXED_DEMO_DATE_UTC,
      });

      created += 1;
    }

    // Ensure all seeded comments (even if they existed already) have the fixed demo date.
    await Comment.updateMany(
      { post: post._id, content: { $in: seed.comments } },
      { $set: { createdAt: FIXED_DEMO_DATE_UTC, updatedAt: FIXED_DEMO_DATE_UTC } }
    );

    const actualCount = await Comment.countDocuments({ post: post._id });
    if (post.commentsCount !== actualCount) {
      post.commentsCount = actualCount;
      await post.save();
    }
  }
};

