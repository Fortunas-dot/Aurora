import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../config/database';
import User from '../models/User';
import Post from '../models/Post';
import Comment from '../models/Comment';

dotenv.config();

interface BasicComment {
  author: string;
  content: string;
}

interface TherapistInfo {
  name: string;
  content: string;
}

interface QuestionPost {
  author: string;
  hoursAgo: number;
  likes: number;
  question: string;
  body: string;
  comments: BasicComment[];
  therapist: TherapistInfo;
}

const QUESTION_POSTS: QuestionPost[] = [
  {
    author: 'Lucas P.',
    hoursAgo: 0.5,
    likes: 31,
    question: 'How do I stop replaying conversations in my head and analyzing everything I said?',
    body: `After I talk to someone, my brain replays every sentence I said and imagines how it might have sounded wrong or awkward. I know the other person has probably forgotten the conversation already, but I still analyse every detail as if I did something terrible. It’s exhausting and makes me dread social situations. How do you break out of this loop and actually move on from a conversation mentally?`,
    comments: [
      { author: 'Nina K', content: 'I do this every night.' },
      { author: 'Daniel K.', content: 'Most people don’t think about us as much as we think.' },
      { author: 'Emily S.', content: 'It’s exhausting.' },
      { author: 'Sofia M.', content: 'Social anxiety makes it worse.' },
    ],
    therapist: {
      name: 'Dr. Amelia Brooks',
      content:
        'This is called rumination and is common in social anxiety. Research shows we overestimate how much others notice our mistakes. Try cognitive reframing by asking, “What actual evidence supports this fear?” Setting a short reflection limit can also reduce repetitive thinking.',
    },
  },
  {
    author: 'Sarah A.',
    hoursAgo: 1,
    likes: 44,
    question: 'Why do I feel anxious when things are going well? Like I’m waiting for something bad.',
    body: `Life is finally a bit calmer for once — work is okay, relationships are stable, nothing huge is wrong — and yet I feel more on edge, not less. Instead of enjoying it, I keep waiting for something horrible to happen, like I don’t deserve things going smoothly. It’s like my nervous system doesn’t trust peace and is constantly scanning for the next disaster. Has anyone else felt this, and how did you learn to actually relax into the good moments?`,
    comments: [
      { author: 'Karim H.', content: 'I sabotage good things because of this.' },
      { author: 'Hannah E.', content: 'Peace feels unfamiliar.' },
      { author: 'Ahmed T.', content: 'Same here.' },
      { author: 'Anna L.', content: 'Calm makes me uneasy.' },
      { author: 'Lucas P.', content: 'I thought I was alone.' },
    ],
    therapist: {
      name: 'Dr. Marcus Levin',
      content:
        'If you’ve experienced past instability, your nervous system may stay alert for danger even during calm periods. This is a protective adaptation. Gradual exposure to safe experiences and nervous system regulation techniques can help retrain this response.',
    },
  },
  {
    author: 'Emily S.',
    hoursAgo: 2,
    likes: 18,
    question: 'Is it normal to feel numb instead of sad?',
    body: `Lately, when things hurt or go wrong, I don’t really cry or feel the sadness fully — I just feel kind of flat and disconnected. Part of me worries that I’m broken for not reacting “properly,” but another part is almost relieved not to feel everything so intensely. I’m not sure if this is a sign of burnout, depression, or just my brain protecting itself. Is emotional numbness something others experience, and did it change over time?`,
    comments: [
      { author: 'Nina K', content: 'I prefer numb over overwhelmed.' },
      { author: 'Daniel K.', content: 'It scares me more than sadness.' },
      { author: 'Sofia M.', content: 'Same.' },
    ],
    therapist: {
      name: 'Dr. Rachel Kim',
      content:
        'Emotional numbness can be a stress response. When feelings become overwhelming, the brain may reduce emotional intensity for protection. Gentle sensory reconnection, like movement or music, can help restore emotional awareness safely.',
    },
  },
  {
    author: 'Karim H.',
    hoursAgo: 3,
    likes: 52,
    question: 'How do I set boundaries without feeling guilty?',
    body: `Whenever I say no to someone or set a limit, I immediately feel like a bad friend, partner, or family member. I was raised to be “easy” and accommodating, so putting my needs first feels selfish even when I’m clearly drained. Logically I know boundaries are healthy, but emotionally I still feel like I’m doing something wrong. How do you handle the guilt that comes up when you start protecting your own energy?`,
    comments: [
      { author: 'Sarah A.', content: 'The guilt hits immediately.' },
      { author: 'Lucas P.', content: 'I feel selfish.' },
      { author: 'Hannah E.', content: 'I was raised to always say yes.' },
      { author: 'Emily S.', content: 'Same here.' },
      { author: 'Daniel K.', content: 'It gets easier.' },
      { author: 'Tara J.', content: 'Still learning.' },
    ],
    therapist: {
      name: 'Dr. Olivia Grant',
      content:
        'Guilt often appears when we challenge long established patterns. If approval once equaled safety, boundaries may feel threatening. Healthy boundaries are not rejection. Over time, your brain learns that limits do not mean losing connection.',
    },
  },
  {
    author: 'Hannah E.',
    hoursAgo: 5,
    likes: 22,
    question: 'Why am I tired all the time even when I sleep enough?',
    body: `I can sleep a full night and still wake up feeling like I’ve barely rested. Even on days when I don’t do much physically, I feel completely drained and heavy, like my battery never actually charges. I’m wondering how much of this is emotional or mental exhaustion rather than just sleep. Has anyone figured out the difference between being physically tired and being worn out emotionally, and what actually helped?`,
    comments: [
      { author: 'Ahmed T.', content: 'Mental exhaustion maybe.' },
      { author: 'Anna L.', content: 'Depression can do that.' },
      { author: 'Lucas P.', content: 'Stress drains energy.' },
      { author: 'Nina K', content: 'Same here.' },
    ],
    therapist: {
      name: 'Dr. Daniel Reyes',
      content:
        'Chronic stress and anxiety reduce sleep quality even if sleep duration is sufficient. Emotional strain consumes significant cognitive energy. Monitoring stress levels alongside sleep patterns may help identify contributing factors.',
    },
  },
  {
    author: 'Ahmed T.',
    hoursAgo: 7,
    likes: 35,
    question: 'How do you forgive yourself for past mistakes?',
    body: `There are a few things I’ve done in the past that still replay in my mind years later, even though I’ve apologised and tried to grow from them. I find it much easier to forgive other people than to forgive myself, and I keep punishing myself in my head. I know staying stuck in shame isn’t helping anyone, but I don’t know how to move into real self compassion. What has helped you actually let go and stop reliving old mistakes?`,
    comments: [
      { author: 'Emily S.', content: 'That’s hard for me.' },
      { author: 'Daniel K.', content: 'I replay mine constantly.' },
      { author: 'Sofia M.', content: 'Same.' },
      { author: 'Lucas P.', content: 'I struggle too.' },
      { author: 'Sarah A.', content: 'Following.' },
    ],
    therapist: {
      name: 'Dr. Rachel Kim',
      content:
        'Self forgiveness involves accountability combined with self compassion. Research shows self compassion increases growth and motivation. Ask yourself whether you would judge someone else this harshly for the same mistake.',
    },
  },
  {
    author: 'Nina K',
    hoursAgo: 9,
    likes: 19,
    question: 'Why do I push people away when I start caring about them?',
    body: `As soon as I start to really care about someone, I notice myself pulling back, replying slower, or finding reasons to create distance. It’s like getting close flips a switch that says “this is dangerous” even if the person has done nothing wrong. I’m scared of being abandoned or hurt, so I end up sabotaging the connection first. If you’ve been through this, how did you learn to stay present in relationships instead of pushing people away?`,
    comments: [
      { author: 'Hannah E.', content: 'Fear of being hurt.' },
      { author: 'Karim H.', content: 'I do this too.' },
      { author: 'Anna L.', content: 'It feels protective.' },
    ],
    therapist: {
      name: 'Dr. Marcus Levin',
      content:
        'This may relate to attachment patterns. If closeness once felt unpredictable, distancing can feel safer. Awareness of the urge to withdraw is the first step toward gradually building secure connection.',
    },
  },
  {
    author: 'Daniel K.',
    hoursAgo: 11,
    likes: 39,
    question: 'How do I know if I’m burnt out or just lazy?',
    body: `I used to be able to push through tasks, but now even simple things feel overwhelming and I label myself as lazy. Part of me still cares and wants to do better, but my body and brain feel like they’re moving through mud. I can’t tell if I’m genuinely depleted or just making excuses. How do you personally tell the difference between burnout and “I just don’t feel like it,” and what did recovery look like for you?`,
    comments: [
      { author: 'Lucas P.', content: 'I ask this weekly.' },
      { author: 'Emily S.', content: 'Burnout feels heavier.' },
      { author: 'Sarah A.', content: 'I feel stuck.' },
      { author: 'Ahmed T.', content: 'If you care but can’t act, it’s not laziness.' },
      { author: 'Nina K', content: 'That’s true.' },
      { author: 'Sofia M.', content: 'Same struggle.' },
    ],
    therapist: {
      name: 'Dr. Amelia Brooks',
      content:
        'Burnout is linked to prolonged stress and emotional exhaustion. Laziness implies lack of desire. If motivation exists but energy does not, depletion is more likely. Recovery requires rest and boundary adjustments.',
    },
  },
  {
    author: 'Tara J.',
    hoursAgo: 13,
    likes: 14,
    question: 'Why do I cry over small things lately?',
    body: `Recently, the tiniest things set me off — a small comment, a minor inconvenience, or even a song — and I end up in tears. I know the trigger itself isn’t that big, which makes me feel “too sensitive,” but the reaction feels huge in my body. I’m starting to wonder if it’s all the stress and emotions I’ve been holding in finally spilling over. Has anyone else had a phase like this, and did it mean something deeper was going on?`,
    comments: [
      { author: 'Anna L.', content: 'It builds up.' },
      { author: 'Daniel K.', content: 'Small trigger, big reaction.' },
    ],
    therapist: {
      name: 'Dr. Daniel Reyes',
      content:
        'When stress accumulates, emotional thresholds lower. The small trigger is often the final drop. Crying is a natural nervous system release and can reduce stress hormones.',
    },
  },
  {
    author: 'Anna L.',
    hoursAgo: 15,
    likes: 33,
    question: 'How do I stop comparing myself to everyone else?',
    body: `I can scroll for a few minutes and suddenly feel like I’m behind in every area of life — career, relationships, looks, everything. Even when I know people only post their highlights, I still end up ranking myself below them. It’s exhausting to constantly measure my worth against strangers and friends online. What has actually helped you shift your focus back to your own path instead of constantly comparing?`,
    comments: [
      { author: 'Emily S.', content: 'Social media makes it worse.' },
      { author: 'Lucas P.', content: 'I feel behind.' },
      { author: 'Karim H.', content: 'Same.' },
      { author: 'Nina K', content: 'Comparison steals joy.' },
    ],
    therapist: {
      name: 'Dr. Olivia Grant',
      content:
        'Comparison is natural, but social media amplifies unrealistic standards. Shifting focus toward personal values and growth rather than ranking reduces distress over time.',
    },
  },
  {
    author: 'Sofia M.',
    hoursAgo: 18,
    likes: 24,
    question: 'Why do I feel guilty for resting?',
    body: `Any time I try to rest, watch something, or just do nothing for a while, a voice in my head tells me I’m being unproductive or wasting time. Even when I’m clearly exhausted, I feel like I should be “using” that time to improve or achieve something. It’s hard to enjoy downtime when it always comes with guilt and self criticism. How did you learn that rest is allowed and not something you have to earn?`,
    comments: [
      { author: 'Daniel K.', content: 'Productivity culture.' },
      { author: 'Sarah A.', content: 'I tie worth to output.' },
      { author: 'Ahmed T.', content: 'Same here.' },
    ],
    therapist: {
      name: 'Dr. Amelia Brooks',
      content:
        'Many people internalize the belief that productivity equals worth. Neuroscience shows rest improves emotional regulation and cognitive functioning. Guilt around rest is learned, not biological.',
    },
  },
  {
    author: 'Ethan L.',
    hoursAgo: 24,
    likes: 61,
    question: 'How do I calm down during a panic attack?',
    body: `When I have a panic attack, my heart races, my chest feels tight, and I’m convinced something terrible is about to happen, even if I logically know I’m “safe.” In the moment it’s hard to remember any coping tools, and I usually just wait it out and feel shaken afterwards. I’d like to have a simple plan I can reach for when it starts, instead of feeling completely powerless. What has genuinely helped you ride out or reduce a panic attack in real time?`,
    comments: [
      { author: 'Nina K', content: 'Breathing helps.' },
      { author: 'Karim H.', content: 'Cold water works for me.' },
      { author: 'Emily S.', content: 'It feels like I’m dying.' },
      { author: 'Lucas P.', content: 'Same.' },
      { author: 'Sarah A.', content: 'It’s terrifying.' },
      { author: 'Anna L.', content: 'Grounding helps.' },
      { author: 'Daniel K.', content: 'Counting backwards works.' },
    ],
    therapist: {
      name: 'Dr. Marcus Levin',
      content:
        'A panic attack is a temporary activation of the fight or flight response. Slow breathing with longer exhales activates the parasympathetic nervous system. Grounding techniques and cold stimulation can interrupt the stress cycle. Remind yourself that panic is uncomfortable but not dangerous, and it will pass.',
    },
  },
];

function normalizeName(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const username = base || 'aurora_user';
  const email = `${username}@testfeed.local`;

  return { displayName: name, username, email };
}

async function ensureUser(displayName: string, isTherapist: boolean = false): Promise<mongoose.Types.ObjectId> {
  const { username, email } = normalizeName(displayName);

  let user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (user) {
    if (isTherapist && !user.isTherapist) {
      user.isTherapist = true;
      await user.save();
    }
    return user._id;
  }

  const hashedPassword = await bcrypt.hash('password123', 10);

  user = await User.create({
    email,
    password: hashedPassword,
    username,
    displayName,
    isAnonymous: false,
    showEmail: false,
    isTherapist,
  });

  console.log(`  ✓ Created ${isTherapist ? 'therapist' : 'user'}: ${displayName} (${username})`);
  return user._id;
}

async function createTherapistQuestionPosts() {
  try {
    console.log('❓ Creating therapist question posts...');
    await connectDB();

    // Prepare a pool of likers from all authors and therapists
    const likerNames = Array.from(
      new Set(
        QUESTION_POSTS.flatMap((p) => [
          p.author,
          ...p.comments.map((c) => c.author),
          p.therapist.name,
        ])
      )
    );

    const likerIdMap = new Map<string, mongoose.Types.ObjectId>();
    for (const name of likerNames) {
      const isTherapist = name.startsWith('Dr.');
      const id = await ensureUser(name, isTherapist);
      likerIdMap.set(name, id);
    }

    for (const q of QUESTION_POSTS) {
      const authorId = await ensureUser(q.author, false);

      const createdAt = new Date();
      createdAt.setTime(createdAt.getTime() - q.hoursAgo * 60 * 60 * 1000);

      const pool = Array.from(likerIdMap.values());
      const likeCount = Math.min(q.likes, pool.length);
      const likes: mongoose.Types.ObjectId[] = [];
      for (let i = 0; i < likeCount; i++) {
        likes.push(pool[i]);
      }

      const post = await Post.create({
        author: authorId,
        title: q.question,
        content: q.body,
        postType: 'question',
        tags: ['question', 'mental-health'],
        images: [],
        groupId: null,
        likes,
        commentsCount: 0,
        createdAt,
        updatedAt: createdAt,
      });

      console.log(`  ✓ Created question post by ${q.author}`);

      // Normal comments
      for (const c of q.comments) {
        const commenterId = await ensureUser(c.author, false);
        await Comment.create({
          post: post._id,
          author: commenterId,
          content: c.content,
          likes: [],
        });
        await Post.findByIdAndUpdate(post._id, { $inc: { commentsCount: 1 } });
      }

      // Therapist comment
      const therapistId = await ensureUser(q.therapist.name, true);
      await Comment.create({
        post: post._id,
        author: therapistId,
        content: q.therapist.content,
        likes: [],
      });
      await Post.findByIdAndUpdate(post._id, { $inc: { commentsCount: 1 } });
    }

    console.log('\n✅ Finished creating therapist question posts.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating therapist question posts:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

createTherapistQuestionPosts();

