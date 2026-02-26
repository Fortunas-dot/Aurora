import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../config/database';
import User from '../models/User';
import Post from '../models/Post';
import Comment from '../models/Comment';
import Group from '../models/Group';

dotenv.config();

interface StoryComment {
  author: string;
  content: string;
}

interface TherapistReply {
  name: string;
  content: string;
}

interface StoryPost {
  author: string;
  hoursAgo: number;
  likes: number;
  title: string;
  body: string;
  groupName: string;
  comments: StoryComment[];
  therapistReply?: TherapistReply;
}

const STORY_POSTS: StoryPost[] = [
  {
    author: 'Emily S.',
    hoursAgo: 5,
    likes: 247,
    title: 'I didn’t realize how tired I was until I stopped pretending',
    body: `I think I’ve been performing for so long that I forgot what my natural state even feels like. It started small, just adjusting my tone in conversations so I wouldn’t seem too negative, making sure I smiled enough so people wouldn’t ask questions, saying “I’m good” automatically before I even checked in with myself. Over time it became automatic. I became the reliable one. The calm one. The emotionally regulated one.

But the truth is I haven’t felt regulated in a long time. I’ve felt tightly held together. There’s a difference. Regulation feels grounded. This feels like clenching every muscle so nothing spills out.

Last week I came home from work and didn’t turn on the lights. I just sat in the dark living room, still wearing my coat, staring at nothing. It wasn’t dramatic. I wasn’t crying. I just felt completely emptied out. Like every social interaction during the day had taken a piece of me and I had nothing left to refill myself with.

What scares me is that nobody would guess this. If you asked my coworkers how I’m doing, they’d probably say I’m thriving. If you asked my friends, they’d say I’m stable. I’ve built this version of myself that functions well enough that no one looks closer. And I don’t know how to dismantle that without disappointing people.

I keep wondering what would happen if I stopped filtering everything. If I admitted that I’m not actually okay. Part of me thinks people would lean in. Another part thinks they’d slowly step back. And that fear keeps the performance going.

I don’t want to be admired for being strong anymore. I want to be known for being honest. I just don’t know how to shift from one to the other without feeling like I’m losing something.`,
    groupName: 'Depression Support',
    comments: [
      { author: 'Sofia M.', content: '“Tightly held together” explains it perfectly.' },
      { author: 'Lucas P.', content: 'That difference between regulation and clenching is real.' },
      { author: 'Anna L.', content: 'I’ve sat in the dark like that too.' },
      { author: 'Daniel K.', content: 'Being seen feels risky.' },
      { author: 'Nina K', content: 'You deserve to be known, not just admired.' },
      { author: 'Karim H.', content: 'The performance is exhausting.' },
      { author: 'Sarah A.', content: 'This feels very real.' },
      { author: 'Ahmed T.', content: 'Thank you for writing this.' },
      { author: 'Hannah E.', content: 'You’re not alone in this.' },
    ],
  },
  {
    author: 'Karim H.',
    hoursAgo: 9,
    likes: 198,
    title: 'I thought I was over it',
    body: `I saw her name pop up on someone else’s phone today. It wasn’t even a message to me. Just a notification on a friend’s screen while we were sitting at lunch. But my body reacted before my brain could catch up. My stomach dropped. My chest tightened. For a split second I felt like I had been pulled backward in time.

It’s been almost a year since we ended things. I’ve told myself the story that I’ve healed. I’ve gone on dates. I’ve worked on myself. I’ve replayed every argument enough times that it doesn’t sting the same way. At least that’s what I thought.

But seeing her name reminded me that healing isn’t linear. It’s layered. You can process something logically and still have your nervous system react like it’s fresh. I hate that part. I hate that my body remembers things my mind has already filed away.

What makes it complicated is that I don’t miss the chaos. I don’t miss feeling like I had to shrink to keep the peace. I don’t miss questioning whether I was too sensitive every time I reacted to something that hurt me. But I do miss the version of us that existed before it went wrong. The early days when everything felt easy and warm and certain.

I think sometimes we grieve the potential more than the person. We grieve the imagined future. The version of the story that never got written.

I didn’t text her. I didn’t ask about her. I just sat with the discomfort. It lasted longer than I expected, but it passed. And that feels like progress, even if it doesn’t feel like closure.`,
    groupName: 'Trauma Healing',
    comments: [
      { author: 'Emily S.', content: 'Grieving the potential is so real.' },
      { author: 'Daniel K.', content: 'The body remembering part hits hard.' },
      { author: 'Anna L.', content: 'Healing in layers makes sense.' },
      { author: 'Sofia M.', content: 'You handled it with strength.' },
      { author: 'Lucas P.', content: 'Sitting with it is growth.' },
      { author: 'Nina K', content: 'Nostalgia is tricky.' },
      { author: 'Sarah A.', content: 'Proud of you for not reopening it.' },
    ],
    therapistReply: {
      name: 'Dr. Marcus Levin',
      content:
        'Emotional memory is stored not only cognitively but physiologically. The nervous system can respond to cues long after conscious processing has occurred. The key shift is not eliminating the reaction, but changing your response to it. Staying present instead of acting impulsively builds resilience and reduces future intensity.',
    },
  },
  {
    author: 'Anna L.',
    hoursAgo: 24,
    likes: 312,
    title: 'The quiet version of depression nobody warned me about',
    body: `When I first learned about depression, I thought it meant not getting out of bed, crying constantly, or being visibly broken. I didn’t realize there was another version. One that looks functional from the outside and feels quietly suffocating on the inside.

I still wake up to my alarm. I still shower. I still go to work and complete what needs to be done. I reply to messages. I show up to birthdays. I remember to say thank you. There’s no dramatic collapse, no visible crisis.

But everything feels dulled. Food tastes fine but doesn’t excite me. Music plays but doesn’t move me the way it used to. Conversations happen but don’t fully reach me. It’s like living behind a pane of glass, watching my own life instead of inhabiting it.

The most confusing part is the self doubt. Because I function, I question whether I’m allowed to feel this way. I tell myself I should be grateful. That other people have it worse. That maybe I’m just lazy or unmotivated. That maybe I’m exaggerating something that isn’t even real.

But the heaviness is real. It’s steady and persistent. It’s the constant background noise of fatigue, the lack of excitement about anything in the future, the way days blur together without leaving an impression.

I don’t want pity. I don’t want dramatic concern. I just want this to feel lighter. I want color back. I want to wake up and feel something other than neutral survival.

Writing this feels strange because nothing is technically wrong. And yet something clearly is.`,
    groupName: 'Depression Support',
    comments: [
      { author: 'Emily S.', content: 'The glass metaphor again. So accurate.' },
      { author: 'Karim H.', content: 'Functioning doesn’t mean thriving.' },
      { author: 'Lucas P.', content: 'The self doubt part hurts.' },
      { author: 'Nina K', content: 'I relate to questioning if it’s “bad enough.”' },
      { author: 'Daniel K.', content: 'It’s real even if it’s quiet.' },
      { author: 'Sofia M.', content: 'You explained this perfectly.' },
      { author: 'Ahmed T.', content: 'Thank you for articulating this.' },
      { author: 'Sarah A.', content: 'This feels seen.' },
      { author: 'Hannah E.', content: 'I’ve been there.' },
      { author: 'Tara J.', content: 'You deserve support even if it’s subtle.' },
      { author: 'Marcus W.', content: 'Neutral survival is the worst phrase because it’s true.' },
      { author: 'Olivia R.', content: 'Sending strength.' },
    ],
    therapistReply: {
      name: 'Dr. Daniel Reyes',
      content:
        'Depression can present as anhedonia and persistent low mood without visible dysfunction. High functioning depression often includes self invalidation because external responsibilities are maintained. The absence of crisis does not mean the absence of pain. If symptoms persist, support from a professional can help restore emotional vitality.',
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

async function createStoryPosts() {
  try {
    console.log('📖 Creating story posts...');
    await connectDB();

    // Build liker pool
    const likerNames = Array.from(
      new Set(
        STORY_POSTS.flatMap((p) => [
          p.author,
          ...p.comments.map((c) => c.author),
          ...(p.therapistReply ? [p.therapistReply.name] : []),
        ])
      )
    );

    const likerIdMap = new Map<string, mongoose.Types.ObjectId>();
    for (const name of likerNames) {
      const isTherapist = name.startsWith('Dr.');
      const id = await ensureUser(name, isTherapist);
      likerIdMap.set(name, id);
    }

    for (const story of STORY_POSTS) {
      const authorId = await ensureUser(story.author, false);

      const group = await Group.findOne({ name: story.groupName });
      if (!group) {
        console.warn(`  ⚠️ Group "${story.groupName}" not found. Story "${story.title}" will have no group.`);
      }

      const createdAt = new Date();
      createdAt.setTime(createdAt.getTime() - story.hoursAgo * 60 * 60 * 1000);

      const pool = Array.from(likerIdMap.values());
      const likeCount = Math.min(story.likes, pool.length);
      const likes: mongoose.Types.ObjectId[] = [];
      for (let i = 0; i < likeCount; i++) {
        likes.push(pool[i]);
      }

      const post = await Post.create({
        author: authorId,
        title: story.title,
        content: story.body,
        postType: 'story',
        tags: ['story', 'mental-health'],
        images: [],
        groupId: group ? group._id : null,
        likes,
        commentsCount: 0,
        createdAt,
        updatedAt: createdAt,
      });

      console.log(`  ✓ Created story post by ${story.author}: "${story.title}"`);

      // Regular comments
      for (const c of story.comments) {
        const commenterId = await ensureUser(c.author, false);
        await Comment.create({
          post: post._id,
          author: commenterId,
          content: c.content,
          likes: [],
        });
        await Post.findByIdAndUpdate(post._id, { $inc: { commentsCount: 1 } });
      }

      // Therapist reply, if present
      if (story.therapistReply) {
        const therapistId = await ensureUser(story.therapistReply.name, true);
        await Comment.create({
          post: post._id,
          author: therapistId,
          content: story.therapistReply.content,
          likes: [],
        });
        await Post.findByIdAndUpdate(post._id, { $inc: { commentsCount: 1 } });
      }
    }

    console.log('\n✅ Finished creating story posts.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating story posts:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

createStoryPosts();

