import User from '../models/User';
import Post from '../models/Post';
import Comment from '../models/Comment';

type PostType = 'post' | 'question' | 'story';

type DemoCommentSeed = {
  text: string;
  authorUsername?: string;
};

type DemoPostSeed = {
  title: string;
  content: string;
  postType: PostType;
  tags: string[];
  authorUsername: string;
  dayOffset: number; // 0=today, 1=yesterday, 2=day before yesterday
  hour: number;
  minute: number;
  comments: DemoCommentSeed[];
  /**
   * Target number of demo comments we want for this post.
   * We only ADD missing demo comments (we never delete).
   */
  targetCommentCount: number;
};

// Keep this list deterministic so it is safe to run on every backend start.
// This does NOT delete anything; it only inserts missing demo posts/comments.
const DEMO_POSTS: DemoPostSeed[] = [
  {
    title: 'I finally told someone how I really feel',
    content:
      'I have been carrying this weight for months, pretending everything is fine when it is not. Today I finally answered honestly when someone asked how I was doing. They did not try to fix me, they just listened.\n\nI cried after, but it was relief more than sadness. I did not realize how exhausting it is to fake being okay every day.',
    postType: 'post',
    tags: ['vulnerability', 'support', 'depression', 'honesty'],
    authorUsername: 'mike_mindful',
    dayOffset: 0,
    hour: 14,
    minute: 22,
    comments: [
      { text: 'This hit me hard. I do the same thing and keep saying "I am fine" when I am not.', authorUsername: 'sarah_wellness' },
      { text: 'The fact they listened without trying to fix everything is huge.', authorUsername: 'sophia_zen' },
      { text: 'Proud of you for being vulnerable. That takes real courage.', authorUsername: 'emma_hopeful' },
      { text: 'Being heard without judgment can be deeply regulating for your nervous system. Keep letting people in, even in small ways.', authorUsername: 'lisa_healing' },
    ],
    targetCommentCount: 4,
  },
  {
    title: 'Does anyone else feel worse after scrolling social media?',
    content:
      'Every time I open social media I end up feeling behind in life. I know it is highlights only, but my brain still compares.\n\nI have deleted apps before and always reinstalled them. Has anyone found a healthy middle ground?',
    postType: 'question',
    tags: ['social-media', 'comparison', 'anxiety', 'question'],
    authorUsername: 'sarah_wellness',
    dayOffset: 0,
    hour: 10,
    minute: 5,
    comments: [
      { text: 'I set a 20-minute limit and it helped more than I expected.', authorUsername: 'james_calm' },
      { text: 'I unfollowed accounts that triggered comparison and my feed feels safer now.', authorUsername: 'alex_recovery' },
      { text: 'Same here. I have to remind myself people do not post panic attacks and breakdowns.', authorUsername: 'emma_hopeful' },
      { text: 'I did a 2-month break and came back with strict boundaries. That worked best for me.', authorUsername: 'david_strong' },
    ],
    targetCommentCount: 4,
  },
  {
    title: 'Small win: I cooked a real meal today',
    content:
      'When my depression is heavy, cooking feels impossible. Today I made pasta with vegetables and sat at the table to eat.\n\nIt sounds small, but this is huge progress for me.',
    postType: 'post',
    tags: ['depression', 'small-wins', 'progress'],
    authorUsername: 'emma_hopeful',
    dayOffset: 0,
    hour: 18,
    minute: 30,
    comments: [
      { text: 'This is a real win. Proud of you.', authorUsername: 'mike_mindful' },
      { text: 'And doing dishes after? That is two wins.', authorUsername: 'sarah_wellness' },
      { text: 'Depression meals are real. You did great today.', authorUsername: 'david_strong' },
    ],
    targetCommentCount: 3,
  },
  {
    title: 'Medication update: 3 months on sertraline',
    content:
      'Week 1-2 was rough with side effects. Week 3-4 got easier. By month 2 I noticed my baseline anxiety was lower.\n\nNow at month 3 I still have hard days, but I am functioning again. Medication did not fix everything, but it gave me enough stability to use therapy skills.',
    postType: 'story',
    tags: ['medication', 'sertraline', 'anxiety', 'depression'],
    authorUsername: 'mike_mindful',
    dayOffset: 1,
    hour: 16,
    minute: 45,
    comments: [
      { text: 'Thank you for sharing this timeline. I am in week 2 and needed this.', authorUsername: 'sarah_wellness' },
      { text: 'The first weeks are rough. It got better for me too.', authorUsername: 'james_calm' },
      { text: 'What you described is very common: medication lowers symptom intensity so therapy skills can stick. Great update.', authorUsername: 'lisa_healing' },
      { text: 'Reading this makes me feel less scared to discuss meds with my doctor.', authorUsername: 'sophia_zen' },
    ],
    targetCommentCount: 4,
  },
  {
    title: 'How do you explain depression to someone who has never had it?',
    content:
      'My partner is supportive but keeps saying "just think positive." I know they mean well, but it makes me feel misunderstood.\n\nHow do you explain depression in a way loved ones can understand?',
    postType: 'question',
    tags: ['depression', 'relationships', 'communication', 'question'],
    authorUsername: 'sarah_wellness',
    dayOffset: 1,
    hour: 11,
    minute: 20,
    comments: [
      { text: 'I describe it as having 2% battery all day no matter how much I rest.', authorUsername: 'david_strong' },
      { text: 'The WHO "black dog" video helped my partner understand.', authorUsername: 'emma_hopeful' },
      { text: 'They may never fully feel it, but they can still learn to believe you. That is enough.', authorUsername: 'lisa_healing' },
      { text: 'Your running-through-water analogy is really good.', authorUsername: 'sophia_zen' },
    ],
    targetCommentCount: 4,
  },
  {
    title: 'Today I journaled for the first time in years',
    content:
      'I always thought journaling was pointless, but last night I wrote for 20 minutes and felt calmer after.\n\nNot a miracle, just less noise in my head.',
    postType: 'story',
    tags: ['journaling', 'therapy', 'coping'],
    authorUsername: 'david_strong',
    dayOffset: 2,
    hour: 21,
    minute: 40,
    comments: [
      { text: 'Free-writing works better for me than structured prompts too.', authorUsername: 'mike_mindful' },
      { text: 'Exactly. Getting thoughts onto paper breaks the loop.', authorUsername: 'sophia_zen' },
      { text: 'This is called externalization and it can be very effective for rumination. Keep going.', authorUsername: 'lisa_healing' },
    ],
    targetCommentCount: 3,
  },
  {
    title: 'The loneliness of depression nobody talks about',
    content:
      'I can be around people and still feel completely alone. Like I am present physically but emotionally behind glass.\n\nDoes anyone else feel this? How do you reconnect?',
    postType: 'question',
    tags: ['depression', 'loneliness', 'question'],
    authorUsername: 'alex_recovery',
    dayOffset: 2,
    hour: 13,
    minute: 15,
    comments: [
      { text: 'The "behind glass" feeling is exactly how I describe it too.', authorUsername: 'mike_mindful' },
      { text: 'Same. One honest sentence with a trusted friend helps me bridge it.', authorUsername: 'sarah_wellness' },
      { text: 'This can be emotional numbness when the system is overloaded. You are not broken.', authorUsername: 'lisa_healing' },
      { text: 'Thank you for putting this into words.', authorUsername: 'emma_hopeful' },
    ],
    targetCommentCount: 4,
  },
  {
    title: 'ADHD tax: what is the most expensive thing your ADHD has cost you?',
    content:
      'I forgot to cancel a trial and paid for months. Also paid rent late once even though I had the money.\n\nWhat systems help you avoid ADHD tax?',
    postType: 'question',
    tags: ['adhd', 'money', 'executive-function', 'question'],
    authorUsername: 'james_calm',
    dayOffset: 2,
    hour: 10,
    minute: 30,
    comments: [
      { text: 'Auto-pay everything was my biggest fix.', authorUsername: 'sarah_wellness' },
      { text: 'Parking tickets used to be my ADHD tax. Timers saved me.', authorUsername: 'david_strong' },
      { text: 'I keep a shared purchases note so I stop buying duplicates.', authorUsername: 'emma_hopeful' },
      { text: 'Same. Expired groceries was mine until I started date labels.', authorUsername: 'alex_recovery' },
    ],
    targetCommentCount: 4,
  },
];

const getPostTimestamp = (seed: DemoPostSeed): Date => {
  const now = new Date();
  const ts = new Date(now.getFullYear(), now.getMonth(), now.getDate(), seed.hour, seed.minute, 0, 0);
  ts.setDate(ts.getDate() - seed.dayOffset);
  return ts;
};

/** Comments appear after the post, staggered by a few minutes each. */
const getCommentTimestamp = (seed: DemoPostSeed, commentIndex: number): Date => {
  const base = getPostTimestamp(seed).getTime();
  const offsetMinutes = 5 + commentIndex * 9 + (seed.dayOffset * 3 + seed.minute) % 7;
  return new Date(base + offsetMinutes * 60 * 1000);
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

  // Ensure therapist badge user stays flagged as therapist for seeded therapist replies.
  await User.updateOne({ username: 'lisa_healing' }, { $set: { isTherapist: true } });

  const pickUserId = (i: number) => {
    const username = demoAuthorUsernames[i % demoAuthorUsernames.length];
    const id = usersByUsername.get(username);
    if (id) return id;

    // Fallback: pick any user if some demo usernames are missing in DB.
    const anyUser = users[0];
    if (anyUser?._id) return anyUser._id;
    throw new Error('[ensureDemoPosts] No demo users found to assign authors.');
  };

  const pickUserIdByUsername = (username: string, fallbackIndex = 0) => {
    const id = usersByUsername.get(username);
    if (id) return id;
    return pickUserId(fallbackIndex);
  };

  for (let seedIndex = 0; seedIndex < DEMO_POSTS.length; seedIndex++) {
    const seed = DEMO_POSTS[seedIndex];
    let post = await Post.findOne({ title: seed.title }).select('_id title commentsCount');

    if (!post) {
      const postTimestamp = getPostTimestamp(seed);
      post = await Post.create({
        author: pickUserIdByUsername(seed.authorUsername, seedIndex),
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
      const postTimestamp = getPostTimestamp(seed);
      await Post.updateOne(
        { _id: post._id },
        {
          $set: {
            author: pickUserIdByUsername(seed.authorUsername, seedIndex),
            createdAt: postTimestamp,
            updatedAt: postTimestamp,
          },
        }
      );
    }

    const commentSeeds = seed.comments;
    const commentTexts = commentSeeds.map((c) => c.text);
    const existingComments = await Comment.find({ post: post._id }).select('content likes');
    const existingContents = new Set(existingComments.map((c) => c.content));
    const existingCount = existingComments.length;

    // Create missing demo comments up to the target count (never delete).
    if (existingCount < seed.targetCommentCount) {
      const remainingSlots = seed.targetCommentCount - existingCount;
      const toCreate = commentSeeds.filter((c) => !existingContents.has(c.text)).slice(0, remainingSlots);

      for (let i = 0; i < toCreate.length; i++) {
        const commentSeed = toCreate[i];
        const text = commentSeed.text;
        const authorId = commentSeed.authorUsername
          ? pickUserIdByUsername(commentSeed.authorUsername, seedIndex + 1 + i)
          : pickUserId(seedIndex + 1 + i);
        const commentIndex = commentTexts.indexOf(text);
        const commentTimestamp = getCommentTimestamp(seed, commentIndex >= 0 ? commentIndex : i);

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
      const commentTimestamp = getCommentTimestamp(seed, commentIndex);
      await Comment.updateMany(
        { post: post._id, content: commentTexts[commentIndex] },
        { $set: { createdAt: commentTimestamp, updatedAt: commentTimestamp } }
      );
    }

    // Give seeded comments random likes if they currently have none.
    const seededComments = await Comment.find({
      post: post._id,
      content: { $in: commentTexts },
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

