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
  {
    title: 'Panic at work and I still feel shaky hours later',
    content:
      'Something small went wrong in a meeting and my body went straight into panic mode. I stepped out, did box breathing, and came back.\n\nI am safe now but my legs still feel weird. Does anyone else get this delayed physical hangover?',
    postType: 'post',
    tags: ['anxiety', 'panic', 'work', 'grounding'],
    authorUsername: 'sophia_zen',
    dayOffset: 0,
    hour: 9,
    minute: 47,
    comments: [
      { text: 'Yes. Sometimes the adrenaline outlasts the situation by hours.', authorUsername: 'sarah_wellness' },
      { text: 'Cold water on wrists helps me signal safety to my body.', authorUsername: 'mike_mindful' },
      { text: 'That delayed somatic response is common after a big stress spike. Gentle movement and hydration can help it metabolize.', authorUsername: 'lisa_healing' },
    ],
    targetCommentCount: 3,
  },
  {
    title: 'Therapist cancelled last minute and I spiralled',
    content:
      'I know cancellations happen, but I had been holding things in all week for that session. I ended up doom-scrolling and feeling pathetic for being so affected.\n\nHow do you cope when the one appointment you counted on disappears?',
    postType: 'question',
    tags: ['therapy', 'cancellation', 'question', 'support'],
    authorUsername: 'david_strong',
    dayOffset: 1,
    hour: 19,
    minute: 12,
    comments: [
      { text: 'I keep a backup list: a walk, a voice note to myself, or a hot shower.', authorUsername: 'emma_hopeful' },
      { text: 'You are not pathetic. Disruption hits harder when your nervous system was already full.', authorUsername: 'lisa_healing' },
      { text: 'I journal the stuff I was going to say. It is not the same but it helps.', authorUsername: 'sarah_wellness' },
      { text: 'Sometimes I message my therapist a short summary anyway. Not everyone allows that, but worth asking.', authorUsername: 'alex_recovery' },
    ],
    targetCommentCount: 4,
  },
  {
    title: 'Another 3am night and I am trying not to catastrophize',
    content:
      'I know sleep deprivation makes everything feel worse. I am lying here listing every mistake I have ever made like it is a podcast I cannot unsubscribe from.\n\nIf you are awake too, you are not alone.',
    postType: 'post',
    tags: ['insomnia', 'anxiety', 'night', 'rumination'],
    authorUsername: 'emma_hopeful',
    dayOffset: 0,
    hour: 3,
    minute: 18,
    comments: [
      { text: 'I am awake too. Reading this instead of spiralling alone helps.', authorUsername: 'james_calm' },
      { text: 'The 3am brain is not a reliable narrator. Morning-you will see things differently.', authorUsername: 'mike_mindful' },
      { text: 'Try a boring audio book at low volume. It interrupts the spiral for me.', authorUsername: 'sophia_zen' },
    ],
    targetCommentCount: 3,
  },
  {
    title: 'Six months without self-harm. Quietly proud.',
    content:
      'I did not post milestones before because I was scared of jinxing it. Today I bought myself flowers and wrote down what helped: therapy, boundaries, and boring routines I used to hate.\n\nIf you are on day one, I see you. It can get lighter.',
    postType: 'story',
    tags: ['recovery', 'self-harm', 'hope', 'progress'],
    authorUsername: 'alex_recovery',
    dayOffset: 3,
    hour: 15,
    minute: 6,
    comments: [
      { text: 'This made me tear up. Congratulations.', authorUsername: 'sarah_wellness' },
      { text: 'So proud of you. Milestones matter even when they feel quiet.', authorUsername: 'emma_hopeful' },
      { text: 'Thank you for sharing. I needed this today.', authorUsername: 'david_strong' },
      { text: 'Beautiful work. Recovery is nonlinear and you are building real skills.', authorUsername: 'lisa_healing' },
    ],
    targetCommentCount: 4,
  },
  {
    title: 'My partner tries but my sensory overload confuses them',
    content:
      'Noise and bright lights can shut me down fast. They think I am angry when I am just overloaded.\n\nHow do you explain sensory needs without sounding like you are blaming them?',
    postType: 'question',
    tags: ['adhd', 'relationships', 'sensory', 'question'],
    authorUsername: 'james_calm',
    dayOffset: 2,
    hour: 12,
    minute: 53,
    comments: [
      { text: 'I use a traffic light code: green, yellow, red. Less explaining in the moment.', authorUsername: 'sophia_zen' },
      { text: 'I literally say "my brain is full" and ask for 10 minutes in a dark room.', authorUsername: 'emma_hopeful' },
      { text: 'Framing it as capacity, not mood, helped my partner understand.', authorUsername: 'mike_mindful' },
    ],
    targetCommentCount: 3,
  },
  {
    title: 'Gratitude lists felt fake until I made them tiny',
    content:
      'I used to write big things and feel nothing. Now I write embarrassingly small wins: warm socks, water, a text back.\n\nIt still feels silly sometimes, but it shifts something.',
    postType: 'post',
    tags: ['gratitude', 'depression', 'coping', 'small-wins'],
    authorUsername: 'sarah_wellness',
    dayOffset: 4,
    hour: 8,
    minute: 24,
    comments: [
      { text: 'Tiny is valid. Your brain learns safety in small doses.', authorUsername: 'lisa_healing' },
      { text: 'Same shift for me when I stopped trying to force big emotions.', authorUsername: 'david_strong' },
      { text: 'I write one line on a sticky note. That is enough.', authorUsername: 'alex_recovery' },
    ],
    targetCommentCount: 3,
  },
  {
    title: 'Weighted blanket: worth it or hype?',
    content:
      'I am debating spending money on one. Sleep is rough and I like pressure when I am anxious.\n\nIf you use one, what weight did you pick and did it actually help?',
    postType: 'question',
    tags: ['sleep', 'anxiety', 'question', 'tools'],
    authorUsername: 'mike_mindful',
    dayOffset: 1,
    hour: 22,
    minute: 41,
    comments: [
      { text: 'Mine is 10% of body weight roughly. Game changer for me.', authorUsername: 'sophia_zen' },
      { text: 'Try borrowing first if you can. I loved it, my partner hated it.', authorUsername: 'james_calm' },
      { text: 'Helped my restless legs more than anything else.', authorUsername: 'emma_hopeful' },
      { text: 'If cost is a barrier, a heavy folded duvet can be a cheap experiment.', authorUsername: 'lisa_healing' },
    ],
    targetCommentCount: 4,
  },
  {
    title: 'First group therapy tomorrow and I am terrified',
    content:
      'I keep imagining I will say the wrong thing or cry in front of strangers. I want to go but my stomach has been in knots for two days.\n\nAny first-timer tips?',
    postType: 'question',
    tags: ['therapy', 'group-therapy', 'anxiety', 'question'],
    authorUsername: 'emma_hopeful',
    dayOffset: 0,
    hour: 20,
    minute: 3,
    comments: [
      { text: 'You can pass and just listen the first time. That is allowed.', authorUsername: 'david_strong' },
      { text: 'I brought a fidget ring so my hands had a job.', authorUsername: 'james_calm' },
      { text: 'Most people are nervous too. Facilitators expect that.', authorUsername: 'lisa_healing' },
      { text: 'Arrive 10 minutes early so you are not rushing. Small thing, big difference.', authorUsername: 'sarah_wellness' },
    ],
    targetCommentCount: 4,
  },
  {
    title: 'Burnout recovery: I went for a walk instead of clearing my inbox',
    content:
      'My brain screams that email is urgent. Today I walked 20 minutes first and somehow the world did not end.\n\nStill behind, still anxious, but I am trying to treat myself like a person, not a machine.',
    postType: 'post',
    tags: ['burnout', 'boundaries', 'self-care', 'work'],
    authorUsername: 'david_strong',
    dayOffset: 2,
    hour: 7,
    minute: 38,
    comments: [
      { text: 'The inbox will always refill. Your body will not.', authorUsername: 'sophia_zen' },
      { text: 'Proud of you. That choice is harder than it sounds.', authorUsername: 'mike_mindful' },
      { text: 'Micro breaks add up. You are rewiring a habit.', authorUsername: 'lisa_healing' },
    ],
    targetCommentCount: 3,
  },
  {
    title: 'Climate anxiety has been crushing me lately',
    content:
      'I doom-read news and then feel guilty for feeling bad when other people have it worse. It is a loop.\n\nHow do you stay informed without melting down every day?',
    postType: 'question',
    tags: ['anxiety', 'climate', 'news', 'question'],
    authorUsername: 'sarah_wellness',
    dayOffset: 4,
    hour: 17,
    minute: 29,
    comments: [
      { text: 'Time-box news to 15 minutes. Timer on phone.', authorUsername: 'james_calm' },
      { text: 'Action helps me: volunteering locally channels the fear.', authorUsername: 'alex_recovery' },
      { text: 'Your distress is valid even if others have different struggles.', authorUsername: 'emma_hopeful' },
      { text: 'Pair information intake with grounding after. Walk, shower, music.', authorUsername: 'lisa_healing' },
    ],
    targetCommentCount: 4,
  },
  {
    title: 'I said no to a friend and the guilt is eating me',
    content:
      'They asked for another big favor and I finally said I could not. They said it was fine but I keep replaying their tone.\n\nWhy does protecting my energy feel like I am a bad person?',
    postType: 'post',
    tags: ['boundaries', 'friendship', 'guilt', 'people-pleasing'],
    authorUsername: 'alex_recovery',
    dayOffset: 3,
    hour: 11,
    minute: 7,
    comments: [
      { text: 'Their tone might be awkwardness, not punishment.', authorUsername: 'david_strong' },
      { text: 'No is a full sentence. You did nothing wrong.', authorUsername: 'sarah_wellness' },
      { text: 'Guilt after boundaries is common while you are retraining old patterns.', authorUsername: 'lisa_healing' },
    ],
    targetCommentCount: 3,
  },
  {
    title: 'Microdosing mindfulness: 60 seconds actually counted today',
    content:
      'I cannot do long meditations yet. I set a timer for one minute of breathing while my kettle boiled and I noticed my shoulders drop.\n\nSmall, but I will take it.',
    postType: 'story',
    tags: ['mindfulness', 'meditation', 'small-wins', 'anxiety'],
    authorUsername: 'sophia_zen',
    dayOffset: 1,
    hour: 6,
    minute: 55,
    comments: [
      { text: 'One minute done beats twenty minutes avoided.', authorUsername: 'james_calm' },
      { text: 'I stack habits like this too. It builds trust with yourself.', authorUsername: 'mike_mindful' },
      { text: 'Short practices done consistently change baseline arousal over time.', authorUsername: 'lisa_healing' },
    ],
    targetCommentCount: 3,
  },
];

const getPostTimestamp = (seed: DemoPostSeed): Date => {
  const now = new Date();
  const ts = new Date(now.getFullYear(), now.getMonth(), now.getDate(), seed.hour, seed.minute, 0, 0);
  ts.setDate(ts.getDate() - seed.dayOffset);
  // Never stamp demo content in the future (e.g. "today" at 22:00 while the server starts at 09:00).
  if (ts.getTime() > now.getTime()) {
    const bump = (seed.hour * 37 + seed.minute + seed.dayOffset * 91) % 180;
    ts.setTime(now.getTime() - (5 + bump) * 60 * 1000);
  }
  return ts;
};

/** Comments appear after the post, staggered by a few minutes each. */
const getCommentTimestamp = (seed: DemoPostSeed, commentIndex: number): Date => {
  const now = new Date();
  const postTime = getPostTimestamp(seed).getTime();
  const offsetMinutes = 5 + commentIndex * 9 + (seed.dayOffset * 3 + seed.minute) % 7;
  let t = postTime + offsetMinutes * 60 * 1000;
  t = Math.min(t, now.getTime());
  const minAfterPost = postTime + 60 * 1000;
  if (t < minAfterPost) t = minAfterPost;
  if (t > now.getTime()) t = now.getTime() - 30 * 1000;
  if (t <= postTime) t = postTime + 60 * 1000;
  return new Date(t);
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

