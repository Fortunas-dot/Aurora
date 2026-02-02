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
    name: 'Depressie Support',
    description: 'Een veilige ruimte voor mensen die te maken hebben met depressie. Deel je ervaringen, tips en steun elkaar.',
    tags: ['depressie', 'support', 'mental-health'],
    isPrivate: false,
  },
  {
    name: 'Angst & Paniek',
    description: 'Voor iedereen die worstelt met angst en paniekaanvallen. Samen staan we sterker.',
    tags: ['angst', 'paniek', 'anxiety'],
    isPrivate: false,
  },
  {
    name: 'Zelfzorg & Mindfulness',
    description: 'Tips, tricks en inspiratie voor zelfzorg en mindfulness. Neem de tijd voor jezelf.',
    tags: ['zelfzorg', 'mindfulness', 'wellness'],
    isPrivate: false,
  },
  {
    name: 'Bipolar Support',
    description: 'Een community voor mensen met bipolaire stoornis. Ervaringen delen en elkaar ondersteunen.',
    tags: ['bipolar', 'support', 'mental-health'],
    isPrivate: true,
  },
  {
    name: 'ADHD Community',
    description: 'Voor mensen met ADHD. Tips, strategieën en begrip van gelijkgestemden.',
    tags: ['adhd', 'neurodiversity', 'support'],
    isPrivate: false,
  },
  {
    name: 'Trauma Healing',
    description: 'Een veilige ruimte voor trauma healing en herstel. Professionele begeleiding en peer support.',
    tags: ['trauma', 'healing', 'ptsd'],
    isPrivate: true,
  },
];

const samplePosts = [
  {
    content: 'Vandaag was een moeilijke dag, maar ik ben trots op mezelf dat ik er doorheen ben gekomen. Kleine stappen zijn ook stappen vooruit! 💪',
    postType: 'post' as const,
    tags: ['depressie', 'zelfzorg', 'motivatie'],
  },
  {
    content: 'Heeft iemand tips voor het omgaan met paniekaanvallen? Ik heb er de laatste tijd veel last van.',
    postType: 'question' as const,
    tags: ['angst', 'paniek', 'vraag'],
  },
  {
    content: 'Mijn verhaal met depressie begon 3 jaar geleden. Het was een lange weg, maar ik ben er sterker uitgekomen. Als je dit leest: je bent niet alleen. Er is hoop. 🌟',
    postType: 'story' as const,
    tags: ['depressie', 'verhaal', 'hoop'],
  },
  {
    content: 'Wat zijn jullie favoriete mindfulness oefeningen? Ik ben op zoek naar nieuwe manieren om te ontspannen.',
    postType: 'question' as const,
    tags: ['mindfulness', 'zelfzorg', 'vraag'],
  },
  {
    content: 'Vandaag heb ik voor het eerst in weken weer een goede dag gehad. Ik voel me hoopvol. 🌈',
    postType: 'post' as const,
    tags: ['hoop', 'positief', 'vooruitgang'],
  },
  {
    content: 'Hoe ga je om met sociale angst? Ik vind het moeilijk om naar sociale evenementen te gaan.',
    postType: 'question' as const,
    tags: ['angst', 'sociaal', 'vraag'],
  },
  {
    content: 'Mijn reis met ADHD heeft me geleerd dat anders zijn oké is. Neurodiversity is een kracht, geen zwakte. 🧠✨',
    postType: 'story' as const,
    tags: ['adhd', 'neurodiversity', 'acceptatie'],
  },
  {
    content: 'Zelfzorg tip van de dag: neem een warm bad, zet je favoriete muziek op en lees een goed boek. Je verdient het! 🛁📚',
    postType: 'post' as const,
    tags: ['zelfzorg', 'tip', 'wellness'],
  },
  {
    content: 'Heeft iemand ervaring met medicatie voor angst? Ik overweeg het, maar ben onzeker.',
    postType: 'question' as const,
    tags: ['angst', 'medicatie', 'vraag'],
  },
  {
    content: 'Vandaag was ik trots op mezelf omdat ik "nee" durfde te zeggen tegen iets wat me te veel stress gaf. Grenzen stellen is belangrijk! 💪',
    postType: 'post' as const,
    tags: ['grenzen', 'zelfzorg', 'assertiviteit'],
  },
  {
    content: 'Mijn verhaal met eetstoornissen en herstel. Het was een lange weg, maar ik ben er. Als je hier mee worstelt: er is hulp beschikbaar. ❤️',
    postType: 'story' as const,
    tags: ['eetstoornis', 'herstel', 'hoop'],
  },
  {
    content: 'Wat doen jullie om met stress om te gaan? Ik zoek nieuwe strategieën.',
    postType: 'question' as const,
    tags: ['stress', 'coping', 'vraag'],
  },
];

const sampleComments = [
  'Je bent zo sterk! Blijf doorgaan 💪',
  'Ik herken me hier zo in. Bedankt voor het delen.',
  'Probeer ademhalingsoefeningen, die helpen mij altijd.',
  'Je bent niet alleen. We staan er samen voor.',
  'Wat een mooie vooruitgang! Trots op je 🌟',
  'Dankjewel voor deze tip, ik ga het proberen.',
  'Ik heb hetzelfde meegemaakt. Als je wilt praten, ik luister.',
  'Wat een inspirerend verhaal! Dit geeft me hoop.',
];

const sampleJournalPrompts = [
  'Hoe voel je je vandaag?',
  'Wat zijn drie dingen waar je dankbaar voor bent?',
  'Wat heeft je vandaag een glimlach gegeven?',
  'Hoe kun je vandaag voor jezelf zorgen?',
  'Wat zijn je doelen voor deze week?',
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
          content: `Vandaag voel ik me ${['goed', 'oké', 'moeilijk', 'hopeful', 'angstig'][Math.floor(Math.random() * 5)]}. ${sampleJournalPrompts[Math.floor(Math.random() * sampleJournalPrompts.length)]} Ik ben dankbaar voor de steun die ik krijg.`,
          mood: Math.floor(Math.random() * 5) + 5,
          symptoms: [
            {
              condition: ['anxiety', 'depression', 'stress'][Math.floor(Math.random() * 3)],
              severity: ['mild', 'moderate', 'severe'][Math.floor(Math.random() * 3)] as any,
            },
          ],
          tags: ['dagelijks', 'reflectie'],
          aiInsights: {
            sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as any,
            themes: ['zelfzorg', 'gratitude', 'uitdagingen'],
            therapeuticFeedback: 'Je doet het goed door je gevoelens te delen. Blijf doorgaan met reflecteren.',
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
        'Hey! Hoe gaat het met je?',
        'Goed! En met jou?',
        'Ook goed, dankjewel voor het vragen 😊',
        'Geen probleem! Als je ooit wilt praten, ik ben er.',
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

