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
  comments: BasicComment[];
  therapist: TherapistInfo;
}

const QUESTION_POSTS: QuestionPost[] = [
  {
    author: 'Lucas P.',
    hoursAgo: 0.5,
    likes: 31,
    question: 'How do I stop replaying conversations in my head and analyzing everything I said?',
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
        content: q.question,
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

