import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from '../config/database';
import User from '../models/User';
import Post from '../models/Post';
import Group from '../models/Group';
import Comment from '../models/Comment';
import JournalEntry from '../models/JournalEntry';
import Message from '../models/Message';
import Notification from '../models/Notification';

dotenv.config();

const sampleUsers = [
  {
    email: 'sarah@test.com',
    password: 'password123',
    username: 'sarah_wellness',
    displayName: 'Sarah',
    bio: 'Mental health advocate | Yoga enthusiast | Always here to listen 💙',
    isAnonymous: false,
    healthInfo: {
      mentalHealth: [
        { condition: 'anxiety', severity: 'moderate' },
        { condition: 'depression', severity: 'mild' },
      ],
      therapies: ['cbt', 'meditation'],
    },
  },
  {
    email: 'mike@test.com',
    password: 'password123',
    username: 'mike_mindful',
    displayName: 'Mike',
    bio: 'Sharing my journey with depression. You are not alone! 🌟',
    isAnonymous: false,
    healthInfo: {
      mentalHealth: [
        { condition: 'depression', severity: 'moderate' },
      ],
      medications: ['sertraline'],
    },
  },
  {
    email: 'lisa@test.com',
    password: 'password123',
    username: 'lisa_healing',
    displayName: 'Lisa',
    bio: 'Therapist in training | Mental health warrior | Spreading positivity ✨',
    isAnonymous: false,
    healthInfo: {
      mentalHealth: [
        { condition: 'anxiety', severity: 'mild' },
        { condition: 'ptsd', severity: 'moderate' },
      ],
      therapies: ['therapy', 'mindfulness'],
    },
  },
  {
    email: 'david@test.com',
    password: 'password123',
    username: 'david_strong',
    displayName: 'David',
    bio: 'Recovering from burnout | Learning to prioritize self-care 🧘',
    isAnonymous: false,
    healthInfo: {
      mentalHealth: [
        { condition: 'burnout', severity: 'severe' },
        { condition: 'anxiety', severity: 'moderate' },
      ],
      physicalHealth: [
        { condition: 'chronic fatigue', severity: 'moderate' },
      ],
    },
  },
  {
    email: 'emma@test.com',
    password: 'password123',
    username: 'emma_hopeful',
    displayName: 'Emma',
    bio: 'Bipolar disorder warrior | Art therapy lover | Living my best life 🎨',
    isAnonymous: false,
    healthInfo: {
      mentalHealth: [
        { condition: 'bipolar', severity: 'moderate' },
      ],
      medications: ['lithium'],
      therapies: ['art therapy'],
    },
  },
  {
    email: 'james@test.com',
    password: 'password123',
    username: 'james_calm',
    displayName: 'James',
    bio: 'ADHD & anxiety | Productivity tips | Coffee enthusiast ☕',
    isAnonymous: false,
    healthInfo: {
      mentalHealth: [
        { condition: 'adhd', severity: 'moderate' },
        { condition: 'anxiety', severity: 'mild' },
      ],
      medications: ['adderall'],
    },
  },
  {
    email: 'sophia@test.com',
    password: 'password123',
    username: 'sophia_zen',
    displayName: 'Sophia',
    bio: 'Mindfulness teacher | Meditation guide | Peace seeker 🧘‍♀️',
    isAnonymous: false,
    healthInfo: {
      mentalHealth: [
        { condition: 'anxiety', severity: 'mild' },
      ],
      therapies: ['meditation', 'yoga'],
    },
  },
  {
    email: 'alex@test.com',
    password: 'password123',
    username: 'alex_recovery',
    displayName: 'Alex',
    bio: 'Eating disorder recovery | Body positivity | Self-love journey 💪',
    isAnonymous: false,
    healthInfo: {
      mentalHealth: [
        { condition: 'eating disorder', severity: 'moderate' },
      ],
      therapies: ['cbt', 'nutrition counseling'],
    },
  },
];

const sampleGroups = [
  {
    name: 'Depression Support',
    description: 'A safe space for people dealing with depression. Share your experiences, tips and support each other.',
    tags: ['depression', 'support', 'mental-health'],
    isPrivate: false,
  },
  {
    name: 'Anxiety & Panic',
    description: 'For everyone struggling with anxiety and panic attacks. Together we are stronger.',
    tags: ['anxiety', 'panic', 'support'],
    isPrivate: false,
  },
  {
    name: 'Self-Care & Mindfulness',
    description: 'Tips, tricks and inspiration for self-care and mindfulness. Take time for yourself.',
    tags: ['self-care', 'mindfulness', 'wellness'],
    isPrivate: false,
  },
  {
    name: 'Bipolar Support',
    description: 'A community for people with bipolar disorder. Share experiences and support each other.',
    tags: ['bipolar', 'support', 'mental-health'],
    isPrivate: true,
  },
  {
    name: 'ADHD Community',
    description: 'For people with ADHD. Tips, strategies and understanding from like-minded people.',
    tags: ['adhd', 'neurodiversity', 'support'],
    isPrivate: false,
  },
  {
    name: 'Trauma Healing',
    description: 'A safe space for trauma healing and recovery. Professional guidance and peer support.',
    tags: ['trauma', 'healing', 'ptsd'],
    isPrivate: true,
  },
];

const samplePosts = [
  {
    title: 'Small Steps Forward',
    content: 'Today was a difficult day, but I\'m proud of myself for getting through it. Small steps are still steps forward! 💪',
    postType: 'post' as const,
    tags: ['depression', 'self-care', 'motivation'],
  },
  {
    title: 'Tips for Panic Attacks?',
    content: 'Does anyone have tips for dealing with panic attacks? I\'ve been struggling with them a lot lately.',
    postType: 'question' as const,
    tags: ['anxiety', 'panic', 'question'],
  },
  {
    title: 'My Depression Journey',
    content: 'My story with depression began 3 years ago. It was a long journey, but I came out stronger. If you\'re reading this: you are not alone. There is hope. 🌟',
    postType: 'story' as const,
    tags: ['depression', 'story', 'hope'],
  },
  {
    title: 'Favorite Mindfulness Exercises?',
    content: 'What are your favorite mindfulness exercises? I\'m looking for new ways to relax.',
    postType: 'question' as const,
    tags: ['mindfulness', 'self-care', 'question'],
  },
  {
    title: 'A Good Day',
    content: 'Today I had a good day for the first time in weeks. I feel hopeful. 🌈',
    postType: 'post' as const,
    tags: ['hope', 'positive', 'progress'],
  },
  {
    title: 'Dealing with Social Anxiety',
    content: 'How do you deal with social anxiety? I find it difficult to go to social events.',
    postType: 'question' as const,
    tags: ['anxiety', 'social', 'question'],
  },
  {
    title: 'ADHD and Neurodiversity',
    content: 'My journey with ADHD has taught me that being different is okay. Neurodiversity is a strength, not a weakness. 🧠✨',
    postType: 'story' as const,
    tags: ['adhd', 'neurodiversity', 'acceptance'],
  },
  {
    title: 'Self-Care Tip of the Day',
    content: 'Self-care tip of the day: take a warm bath, put on your favorite music and read a good book. You deserve it! 🛁📚',
    postType: 'post' as const,
    tags: ['self-care', 'tip', 'wellness'],
  },
  {
    title: 'Anxiety Medication Experience?',
    content: 'Does anyone have experience with medication for anxiety? I\'m considering it, but I\'m uncertain.',
    postType: 'question' as const,
    tags: ['anxiety', 'medication', 'question'],
  },
  {
    title: 'Setting Boundaries',
    content: 'Today I was proud of myself for saying "no" to something that was giving me too much stress. Setting boundaries is important! 💪',
    postType: 'post' as const,
    tags: ['boundaries', 'self-care', 'assertiveness'],
  },
  {
    title: 'Eating Disorder Recovery Story',
    content: 'My story with eating disorders and recovery. It was a long journey, but I\'m here. If you\'re struggling with this: help is available. ❤️',
    postType: 'story' as const,
    tags: ['eating-disorder', 'recovery', 'hope'],
  },
  {
    title: 'Coping with Stress',
    content: 'What do you do to cope with stress? I\'m looking for new strategies.',
    postType: 'question' as const,
    tags: ['stress', 'coping', 'question'],
  },
];

const sampleComments = [
  'You are so strong! Keep going 💪',
  'I relate to this so much. Thanks for sharing.',
  'Try breathing exercises, they always help me.',
  'You are not alone. We are in this together.',
  'What beautiful progress! Proud of you 🌟',
  'Thank you for this tip, I\'m going to try it.',
  'I\'ve been through the same. If you want to talk, I\'m here to listen.',
  'What an inspiring story! This gives me hope.',
];

const sampleJournalPrompts = [
  'How are you feeling today?',
  'What are three things you are grateful for?',
  'What made you smile today?',
  'How can you take care of yourself today?',
  'What are your goals for this week?',
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Post.deleteMany({});
    await Group.deleteMany({});
    await Comment.deleteMany({});
    await JournalEntry.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});
    
    // Create users
    console.log('👥 Creating users...');
    const usersToInsert = [];
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const { password, ...restData } = userData;
      usersToInsert.push({
        ...restData,
        password: hashedPassword,
      });
    }
    // Insert users directly to bypass pre-save hook
    const insertedUsers = await User.insertMany(usersToInsert);
    const createdUsers = insertedUsers;
    createdUsers.forEach(user => {
      console.log(`  ✓ Created user: ${user.username}`);
    });
    
    // Create groups
    console.log('👥 Creating groups...');
    const createdGroups = [];
    for (let i = 0; i < sampleGroups.length; i++) {
      const groupData = sampleGroups[i];
      const admin = createdUsers[i % createdUsers.length];
      const members = createdUsers.slice(0, Math.min(4, createdUsers.length));
      
      const group = await Group.create({
        ...groupData,
        admins: [admin._id],
        members: members.map(u => u._id),
      });
      createdGroups.push(group);
      console.log(`  ✓ Created group: ${group.name}`);
    }
    
    // Create posts
    console.log('📝 Creating posts...');
    const createdPosts = [];
    for (let i = 0; i < samplePosts.length; i++) {
      const postData = samplePosts[i];
      const author = createdUsers[i % createdUsers.length];
      const group = i < createdGroups.length ? createdGroups[i] : null;
      
      const post = await Post.create({
        ...postData,
        author: author._id,
        groupId: group?._id,
        likes: createdUsers.slice(0, Math.floor(Math.random() * 5)).map(u => u._id),
        commentsCount: 0,
      });
      createdPosts.push(post);
      console.log(`  ✓ Created post: ${post.postType}`);
    }
    
    // Create comments
    console.log('💬 Creating comments...');
    for (let i = 0; i < createdPosts.length; i++) {
      const post = createdPosts[i];
      const numComments = Math.floor(Math.random() * 4) + 1;
      
      for (let j = 0; j < numComments; j++) {
        const commentAuthor = createdUsers[Math.floor(Math.random() * createdUsers.length)];
        const comment = await Comment.create({
          post: post._id,
          author: commentAuthor._id,
          content: sampleComments[Math.floor(Math.random() * sampleComments.length)],
          likes: [],
        });
        
        // Update post comments count
        post.commentsCount += 1;
        await post.save();
        console.log(`  ✓ Created comment on post ${i + 1}`);
      }
    }
    
    // Create follow relationships
    console.log('🔗 Creating follow relationships...');
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      const numFollowing = Math.floor(Math.random() * 3) + 1;
      const following = createdUsers
        .filter(u => u._id.toString() !== user._id.toString())
        .sort(() => Math.random() - 0.5)
        .slice(0, numFollowing);
      
      user.following = following.map(u => u._id);
      await user.save();
      console.log(`  ✓ User ${user.username} is following ${numFollowing} users`);
    }
    
    // Create journal entries
    console.log('📔 Creating journal entries...');
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      const numEntries = Math.floor(Math.random() * 5) + 2;
      
      for (let j = 0; j < numEntries; j++) {
        const daysAgo = j;
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);
        
        const entry = await JournalEntry.create({
          author: user._id,
          content: `Today I feel ${['good', 'okay', 'difficult', 'hopeful', 'anxious'][Math.floor(Math.random() * 5)]}. ${sampleJournalPrompts[Math.floor(Math.random() * sampleJournalPrompts.length)]} I am grateful for the support I receive.`,
          mood: Math.floor(Math.random() * 5) + 5,
          symptoms: [
            {
              condition: ['anxiety', 'depression', 'stress'][Math.floor(Math.random() * 3)],
              severity: ['mild', 'moderate', 'severe'][Math.floor(Math.random() * 3)] as any,
            },
          ],
          tags: ['daily', 'reflection'],
          aiInsights: {
            sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as any,
            themes: ['self-care', 'gratitude', 'challenges'],
            therapeuticFeedback: 'You are doing well by sharing your feelings. Keep reflecting.',
          },
          isPrivate: true,
          createdAt,
        });
        console.log(`  ✓ Created journal entry for ${user.username}`);
      }
    }
    
    // Create messages
    console.log('💌 Creating messages...');
    for (let i = 0; i < createdUsers.length - 1; i++) {
      const sender = createdUsers[i];
      const receiver = createdUsers[i + 1];
      
      const messages = [
        'Hey! How are you doing?',
        'Good! And you?',
        'Also good, thanks for asking 😊',
        'No problem! If you ever want to talk, I\'m here.',
      ];
      
      for (let j = 0; j < messages.length; j++) {
        const createdAt = new Date();
        createdAt.setHours(createdAt.getHours() - (messages.length - j));
        
        await Message.create({
          sender: sender._id,
          receiver: receiver._id,
          content: messages[j],
          readAt: j < messages.length - 1 ? new Date() : undefined,
          createdAt,
        });
      }
      console.log(`  ✓ Created conversation between ${sender.username} and ${receiver.username}`);
    }
    
    // Create notifications
    console.log('🔔 Creating notifications...');
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      const numNotifications = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < numNotifications; j++) {
        const notifier = createdUsers[Math.floor(Math.random() * createdUsers.length)];
        if (notifier._id.toString() !== user._id.toString()) {
          await Notification.create({
            user: user._id,
            type: ['follow', 'like', 'comment'][Math.floor(Math.random() * 3)] as any,
            relatedUser: notifier._id,
            message: ['started following you', 'liked your post', 'commented on your post'][Math.floor(Math.random() * 3)],
            read: Math.random() > 0.5,
          });
        }
      }
      console.log(`  ✓ Created notifications for ${user.username}`);
    }
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Groups: ${createdGroups.length}`);
    console.log(`   - Posts: ${createdPosts.length}`);
    console.log(`   - Comments: ${await Comment.countDocuments()}`);
    console.log(`   - Journal Entries: ${await JournalEntry.countDocuments()}`);
    console.log(`   - Messages: ${await Message.countDocuments()}`);
    console.log(`   - Notifications: ${await Notification.countDocuments()}`);
    console.log(`\n🔑 Test accounts created:`);
    console.log(`   All passwords: password123`);
    sampleUsers.forEach(u => {
      console.log(`   - ${u.email} (${u.username})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seed
seedDatabase();

