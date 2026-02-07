import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database';
import User from '../models/User';
import Post from '../models/Post';
import Comment from '../models/Comment';
import Group from '../models/Group';
import Message from '../models/Message';
import Notification from '../models/Notification';
import Journal from '../models/Journal';
import JournalEntry from '../models/JournalEntry';
import bcrypt from 'bcryptjs';
import { getRandomCharacter } from '../utils/characters';

dotenv.config();

const SHOWCASE_EMAIL = 'showcase@aurora.app';
const SHOWCASE_USERNAME = 'showcase_user';
const SHOWCASE_PASSWORD = 'Showcase2024!';
const SHOWCASE_DISPLAY_NAME = 'Aurora User';

// Realistic conversation messages
const conversationMessages = [
  {
    sender: [
      'Hey! How are you doing today?',
      'I saw your post about anxiety - I can really relate to that.',
      'Have you tried any breathing exercises? They help me a lot.',
      'Thanks for sharing your story. It means a lot to know we\'re not alone in this.',
      'I hope you\'re having a better day today! 🌟',
    ],
    receiver: [
      'Hi! I\'m doing okay, thanks for asking. How about you?',
      'Yes, it\'s been tough lately. Some days are better than others.',
      'I\'ve tried a few, but I find it hard to focus sometimes.',
      'You\'re absolutely right. This community has been so supportive.',
      'Thank you! That means a lot. I\'m trying to take it one day at a time.',
    ],
  },
  {
    sender: [
      'I wanted to reach out and say your recovery story really inspired me.',
      'I\'m going through something similar and it gives me hope.',
      'Would you mind sharing what helped you the most?',
    ],
    receiver: [
      'Thank you so much! That really means a lot to me.',
      'I\'m so glad it could help. Recovery is definitely possible.',
      'Therapy was a game-changer for me, along with finding the right support system.',
    ],
  },
  {
    sender: [
      'Hey! I saw you joined the Depression Support group.',
      'Welcome! It\'s a really supportive community.',
      'Feel free to share whenever you\'re ready. No pressure at all.',
    ],
    receiver: [
      'Thank you! I\'m still getting comfortable with sharing, but everyone seems so kind.',
      'That\'s exactly what I was hoping for. It\'s nice to have a safe space.',
      'I really appreciate that. I\'ll definitely share when I feel ready.',
    ],
  },
];

// Realistic journal entries
const journalEntries = [
  {
    content: `Today was a good day. I woke up feeling more hopeful than I have in a while. I went for a walk in the morning, which always helps clear my mind. The weather was beautiful - sunny but not too hot.

I had therapy this afternoon, and we talked about setting boundaries. It's something I've always struggled with, but I'm starting to see how important it is for my mental health. I'm learning that saying "no" doesn't make me a bad person - it makes me a person who respects their own limits.

I'm grateful for the progress I've made, even if it feels slow sometimes. Small steps are still steps forward.`,
    mood: 7,
    symptoms: [{ condition: 'anxiety', severity: 'mild' }],
    tags: ['gratitude', 'progress', 'therapy'],
  },
  {
    content: `Had a difficult day today. My anxiety was really high, and I found it hard to focus on anything. I kept replaying conversations in my head, worrying about what I said or didn't say.

I tried to use some of the coping strategies I've learned - deep breathing, going for a walk, listening to calming music. They helped a bit, but I still felt overwhelmed.

I'm trying to be kind to myself about it. Not every day is going to be easy, and that's okay. Tomorrow is a new day.`,
    mood: 4,
    symptoms: [{ condition: 'anxiety', severity: 'moderate' }],
    tags: ['anxiety', 'self-care', 'difficult-day'],
  },
  {
    content: `I'm feeling really proud of myself today. I had a social event that I was dreading, but I went anyway. I was anxious beforehand, but once I got there, it wasn't as bad as I thought it would be.

I even had a few good conversations with people. I'm learning that my anxiety often makes things seem worse than they actually are. The anticipation is usually worse than the actual event.

This is progress. A few months ago, I would have canceled. Today, I went, and I'm glad I did.`,
    mood: 8,
    symptoms: [{ condition: 'anxiety', severity: 'mild' }],
    tags: ['progress', 'social-anxiety', 'proud'],
  },
];

async function createShowcaseAccount() {
  try {
    console.log('📸 Creating Showcase Account with Realistic Test Data...');
    
    // Connect to database
    await connectDB();
    
    // Get or create showcase user
    let showcaseUser = await User.findOne({
      $or: [
        { email: SHOWCASE_EMAIL },
        { username: SHOWCASE_USERNAME },
      ],
    });
    
    if (showcaseUser) {
      console.log('  ✓ Showcase account already exists, updating...');
      showcaseUser.displayName = SHOWCASE_DISPLAY_NAME;
      showcaseUser.bio = 'Welcome to Aurora - Your mental health companion';
      showcaseUser.isAnonymous = false;
      showcaseUser.isProtected = true;
      
      // Update password
      const salt = await bcrypt.genSalt(10);
      showcaseUser.password = await bcrypt.hash(SHOWCASE_PASSWORD, salt);
      
      // Set avatar character if not set
      if (!showcaseUser.avatarCharacter) {
        showcaseUser.avatarCharacter = getRandomCharacter();
      }
      
      await showcaseUser.save();
    } else {
      // Create new showcase user
      const hashedPassword = await bcrypt.hash(SHOWCASE_PASSWORD, 10);
      const avatarCharacter = getRandomCharacter();
      
      showcaseUser = await User.create({
        email: SHOWCASE_EMAIL,
        password: hashedPassword,
        username: SHOWCASE_USERNAME,
        displayName: SHOWCASE_DISPLAY_NAME,
        bio: 'Welcome to Aurora - Your mental health companion',
        isAnonymous: false,
        isProtected: true,
        avatarCharacter,
        healthInfo: {
          mentalHealth: [
            { condition: 'anxiety', severity: 'moderate' },
            { condition: 'depression', severity: 'mild' },
          ],
          therapies: ['cbt', 'mindfulness'],
        },
      });
      console.log('  ✓ Showcase account created');
    }
    
    // Get other users for interactions (create some if they don't exist)
    console.log('  👥 Setting up other users for interactions...');
    const otherUsers = await User.find({ 
      _id: { $ne: showcaseUser._id },
      isProtected: { $ne: true },
    }).limit(10);
    
    // Create a few additional users if needed
    if (otherUsers.length < 5) {
      const additionalUsers = [];
      for (let i = 0; i < 5; i++) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await User.create({
          email: `testuser${i}@test.com`,
          password: hashedPassword,
          username: `testuser${i}`,
          displayName: `Test User ${i}`,
          bio: `Test user ${i} for showcase`,
          isAnonymous: false,
          avatarCharacter: getRandomCharacter(),
        });
        additionalUsers.push(user);
      }
      otherUsers.push(...additionalUsers);
      console.log(`  ✓ Created ${additionalUsers.length} additional users`);
    }
    
    // Create groups and add showcase user as member
    console.log('  👥 Creating groups...');
    const groups = await Group.find({ members: showcaseUser._id }).limit(3);
    
    if (groups.length < 3) {
      const groupNames = [
        { name: 'Depression Support', description: 'A safe space for those dealing with depression', tags: ['depression', 'support'], isPrivate: false },
        { name: 'Anxiety Warriors', description: 'Supporting each other through anxiety', tags: ['anxiety', 'coping'], isPrivate: false },
        { name: 'Mental Health Journey', description: 'Sharing our mental health journeys together', tags: ['mental-health', 'community'], isPrivate: false },
      ];
      
      for (const groupData of groupNames) {
        const existingGroup = await Group.findOne({ name: groupData.name });
        if (!existingGroup) {
          const group = await Group.create({
            ...groupData,
            admins: [showcaseUser._id],
            members: [showcaseUser._id, ...otherUsers.slice(0, 3).map(u => u._id)],
            avatar: null,
            country: 'global',
          });
          groups.push(group);
          console.log(`  ✓ Created group: ${group.name}`);
        } else {
          // Add showcase user to existing group if not already a member
          if (!existingGroup.members.some(m => m.toString() === showcaseUser._id.toString())) {
            existingGroup.members.push(showcaseUser._id);
            await existingGroup.save();
          }
          groups.push(existingGroup);
        }
      }
    }
    
    // Create posts with likes and comments
    console.log('  📝 Creating posts...');
    const existingPosts = await Post.find({ author: showcaseUser._id }).limit(5);
    
    if (existingPosts.length < 5) {
      const postContents = [
        {
          title: 'Small Steps Forward',
          content: 'Today was a difficult day, but I\'m proud of myself for getting through it. Small steps are still steps forward! 💪',
          postType: 'post' as const,
          tags: ['depression', 'self-care', 'motivation'],
        },
        {
          title: 'Grateful for This Community',
          content: 'I just wanted to say how grateful I am for this community. Reading everyone\'s stories and experiences has helped me feel less alone. Thank you all for being so supportive. ❤️',
          postType: 'post' as const,
          tags: ['gratitude', 'community', 'support'],
        },
        {
          title: 'What helps you with morning anxiety?',
          content: 'I\'ve been struggling with really bad anxiety in the mornings. It feels like my mind starts racing as soon as I wake up, and it\'s hard to get out of bed. Does anyone have strategies that have worked for them? I\'d love to hear what helps you.',
          postType: 'question' as const,
          tags: ['anxiety', 'morning', 'question', 'coping'],
        },
      ];
      
      for (let i = 0; i < postContents.length; i++) {
        const postData = postContents[i];
        const daysAgo = i * 2; // Space posts out over time
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);
        
        const post = await Post.create({
          ...postData,
          author: showcaseUser._id,
          groupId: groups[Math.floor(Math.random() * groups.length)]?._id || null,
          likes: otherUsers.slice(0, Math.floor(Math.random() * 5) + 2).map(u => u._id),
          commentsCount: 0,
          createdAt,
        });
        
        // Add comments to posts with realistic timestamps
        const numComments = Math.floor(Math.random() * 4) + 2;
        for (let j = 0; j < numComments; j++) {
          const commentAuthor = otherUsers[Math.floor(Math.random() * otherUsers.length)];
          const commentHoursAgo = daysAgo * 24 + (numComments - j) * 2; // Comments spread over time
          const commentCreatedAt = new Date();
          commentCreatedAt.setHours(commentCreatedAt.getHours() - commentHoursAgo);
          
          const comment = await Comment.create({
            post: post._id,
            author: commentAuthor._id,
            content: [
              'You\'re doing great! Keep going 💪',
              'I relate to this so much. Thanks for sharing.',
              'You\'re not alone in this. We\'re here for you.',
              'This is such an important reminder. Thank you!',
              'Sending you positive vibes! 🌟',
              'Thank you for being vulnerable and sharing this.',
              'This community is so supportive. I\'m grateful to be here.',
            ][Math.floor(Math.random() * 7)],
            likes: [],
            createdAt: commentCreatedAt,
          });
          post.commentsCount += 1;
        }
        await post.save();
        console.log(`  ✓ Created post: ${post.title}`);
      }
    }
    
    // Create conversations with multiple users
    console.log('  💬 Creating conversations...');
    const existingMessages = await Message.find({
      $or: [
        { sender: showcaseUser._id },
        { receiver: showcaseUser._id },
      ],
    });
    
    if (existingMessages.length < 20) {
      // Create conversations with 3-4 different users
      const conversationPartners = otherUsers.slice(0, 4);
      
      for (let i = 0; i < conversationPartners.length; i++) {
        const partner = conversationPartners[i];
        const conversation = conversationMessages[i % conversationMessages.length];
        
        // Create back-and-forth conversation
        let hoursAgo = 48; // Start 48 hours ago for more realistic timeline
        const messageCount = Math.min(conversation.sender.length, conversation.receiver.length);
        
        for (let j = 0; j < messageCount; j++) {
          // Alternate between showcase user and partner
          const isShowcaseTurn = j % 2 === 0;
          const sender = isShowcaseTurn ? showcaseUser : partner;
          const receiver = isShowcaseTurn ? partner : showcaseUser;
          const messageContent = isShowcaseTurn ? conversation.sender[j] : conversation.receiver[j];
          
          const createdAt = new Date();
          createdAt.setHours(createdAt.getHours() - hoursAgo);
          
          await Message.create({
            sender: sender._id,
            receiver: receiver._id,
            content: messageContent,
            readAt: hoursAgo > 3 ? new Date(createdAt.getTime() + 30 * 60000) : undefined, // Read after 30 minutes if old
            createdAt,
          });
          
          // Decrease time between messages (more recent = more frequent)
          hoursAgo -= Math.max(1, Math.floor(hoursAgo / 10));
        }
        
        console.log(`  ✓ Created conversation with ${partner.username}`);
      }
    }
    
    // Create various notifications
    console.log('  🔔 Creating notifications...');
    const existingNotifications = await Notification.find({ user: showcaseUser._id });
    
    if (existingNotifications.length < 15) {
      // Get showcase user's posts for comment/like notifications
      const showcasePosts = await Post.find({ author: showcaseUser._id }).limit(5);
      
      // Create like notifications
      for (let i = 0; i < 3; i++) {
        const notifier = otherUsers[Math.floor(Math.random() * otherUsers.length)];
        const post = showcasePosts[Math.floor(Math.random() * showcasePosts.length)];
        if (post) {
          const notification = await Notification.create({
            user: showcaseUser._id,
            type: 'like',
            relatedUser: notifier._id,
            relatedPost: post._id,
            message: 'liked your post',
            read: Math.random() > 0.5,
          });
          await notification.populate('relatedUser', 'username displayName avatar');
          await notification.populate('relatedPost', 'content');
        }
      }
      
      // Create comment notifications
      for (let i = 0; i < 4; i++) {
        const notifier = otherUsers[Math.floor(Math.random() * otherUsers.length)];
        const post = showcasePosts[Math.floor(Math.random() * showcasePosts.length)];
        if (post) {
          const notification = await Notification.create({
            user: showcaseUser._id,
            type: 'comment',
            relatedUser: notifier._id,
            relatedPost: post._id,
            message: 'commented on your post',
            read: Math.random() > 0.6,
          });
          await notification.populate('relatedUser', 'username displayName avatar');
          await notification.populate('relatedPost', 'content');
        }
      }
      
      // Create follow notifications
      for (let i = 0; i < 3; i++) {
        const notifier = otherUsers[Math.floor(Math.random() * otherUsers.length)];
        const notification = await Notification.create({
          user: showcaseUser._id,
          type: 'follow',
          relatedUser: notifier._id,
          message: 'started following you',
          read: Math.random() > 0.5,
        });
        await notification.populate('relatedUser', 'username displayName avatar');
      }
      
      // Create message notifications
      for (let i = 0; i < 2; i++) {
        const notifier = otherUsers[Math.floor(Math.random() * otherUsers.length)];
        const notification = await Notification.create({
          user: showcaseUser._id,
          type: 'message',
          relatedUser: notifier._id,
          message: 'sent you a message',
          read: false, // Keep some unread for realism
        });
        await notification.populate('relatedUser', 'username displayName avatar');
      }
      
      // Create group join notification
      if (groups.length > 0) {
        const notifier = otherUsers[Math.floor(Math.random() * otherUsers.length)];
        const notification = await Notification.create({
          user: showcaseUser._id,
          type: 'group_join',
          relatedUser: notifier._id,
          relatedGroup: groups[0]._id,
          message: 'joined your group',
          read: false,
        });
        await notification.populate('relatedUser', 'username displayName avatar');
        await notification.populate('relatedGroup', 'name');
      }
      
      console.log('  ✓ Created various notifications');
    }
    
    // Create journal and entries
    console.log('  📔 Creating journal entries...');
    let journal = await Journal.findOne({ owner: showcaseUser._id });
    
    if (!journal) {
      journal = await Journal.create({
        owner: showcaseUser._id,
        name: 'My Journal',
        description: 'Daily reflections and thoughts',
        isPublic: false,
        entriesCount: 0,
      });
      console.log('  ✓ Created journal');
    }
    
    const existingEntries = await JournalEntry.find({ author: showcaseUser._id });
    if (existingEntries.length < 3) {
      for (let i = 0; i < journalEntries.length; i++) {
        const entryData = journalEntries[i];
        const daysAgo = i;
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);
        
        const entry = await JournalEntry.create({
          author: showcaseUser._id,
          journal: journal._id,
          content: entryData.content,
          mood: entryData.mood,
          symptoms: entryData.symptoms,
          tags: entryData.tags,
          isPrivate: true,
          fontFamily: 'palatino',
          createdAt,
        });
        
        journal.entriesCount = (journal.entriesCount || 0) + 1;
        console.log(`  ✓ Created journal entry ${i + 1}`);
      }
      await journal.save();
    }
    
    // Set up following relationships
    console.log('  🔗 Setting up following relationships...');
    showcaseUser.following = otherUsers.slice(0, 5).map(u => u._id);
    await showcaseUser.save();
    
    // Make some users follow showcase user
    for (let i = 0; i < 5; i++) {
      const follower = otherUsers[i];
      if (follower && !follower.following.some(f => f.toString() === showcaseUser._id.toString())) {
        follower.following.push(showcaseUser._id);
        await follower.save();
      }
    }
    
    // Save some posts
    const postsToSave = await Post.find({ author: { $ne: showcaseUser._id } }).limit(3);
    showcaseUser.savedPosts = postsToSave.map(p => p._id);
    await showcaseUser.save();
    
    console.log('\n✅ Showcase account setup completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Account: ${SHOWCASE_EMAIL}`);
    console.log(`   - Username: ${SHOWCASE_USERNAME}`);
    console.log(`   - Password: ${SHOWCASE_PASSWORD}`);
    console.log(`   - Groups: ${groups.length}`);
    console.log(`   - Posts: ${await Post.countDocuments({ author: showcaseUser._id })}`);
    console.log(`   - Conversations: ${await Message.countDocuments({ $or: [{ sender: showcaseUser._id }, { receiver: showcaseUser._id }] }) / 2}`);
    console.log(`   - Notifications: ${await Notification.countDocuments({ user: showcaseUser._id })}`);
    console.log(`   - Journal Entries: ${await JournalEntry.countDocuments({ author: showcaseUser._id })}`);
    console.log(`   - Following: ${showcaseUser.following.length} users`);
    console.log(`   - Followers: ${await User.countDocuments({ following: showcaseUser._id })}`);
    console.log(`\n🎬 Ready for screenshots!`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating showcase account:', error);
    process.exit(1);
  }
}

// Run the script
createShowcaseAccount();
