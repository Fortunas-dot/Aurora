import mongoose from 'mongoose';
import Post from '../models/Post';
import User from '../models/User';
import Message from '../models/Message';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const BASE_URL = process.env.BASE_URL || 'https://aurora-production.up.railway.app';

// Helper function to normalize URLs to absolute URLs
const normalizeUrl = (url: string | undefined | null): string | undefined => {
  if (!url || typeof url !== 'string' || url.trim() === '') return undefined;
  
  // Remove any whitespace
  const trimmedUrl = url.trim();
  
  // If already absolute, return as-is
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }
  
  // If relative, make it absolute
  // Ensure the relative URL starts with /
  let relativeUrl = trimmedUrl;
  if (!relativeUrl.startsWith('/')) {
    relativeUrl = `/${relativeUrl}`;
  }
  
  // Remove any double slashes (except after http:// or https://)
  const normalized = `${BASE_URL}${relativeUrl}`.replace(/([^:]\/)\/+/g, '$1');
  
  return normalized;
};

async function normalizePostUrls() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all posts
    const posts = await Post.find({}).lean();
    console.log(`📝 Found ${posts.length} posts to check`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const post of posts) {
      let needsUpdate = false;
      const updateData: any = {};

      // Normalize images
      if (post.images && Array.isArray(post.images) && post.images.length > 0) {
        const normalizedImages = post.images.map((img: string) => normalizeUrl(img)).filter((img): img is string => !!img);
        if (JSON.stringify(normalizedImages) !== JSON.stringify(post.images)) {
          updateData.images = normalizedImages;
          needsUpdate = true;
        }
      }

      // Normalize video
      if (post.video) {
        const normalizedVideo = normalizeUrl(post.video);
        if (normalizedVideo !== post.video) {
          updateData.video = normalizedVideo;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await Post.updateOne({ _id: post._id }, { $set: updateData });
        updatedCount++;
        console.log(`✅ Updated post ${post._id}`);
      } else {
        skippedCount++;
      }
    }

    // Also normalize user avatars
    const users = await User.find({}).lean();
    console.log(`👤 Found ${users.length} users to check`);

    let updatedUsersCount = 0;
    let skippedUsersCount = 0;

    for (const user of users) {
      if (user.avatar) {
        const normalizedAvatar = normalizeUrl(user.avatar);
        if (normalizedAvatar !== user.avatar) {
          await User.updateOne({ _id: user._id }, { $set: { avatar: normalizedAvatar } });
          updatedUsersCount++;
          console.log(`✅ Updated user ${user._id} avatar`);
        } else {
          skippedUsersCount++;
        }
      } else {
        skippedUsersCount++;
      }
    }

    // Also normalize message attachments
    const messages = await Message.find({}).lean();
    console.log(`💬 Found ${messages.length} messages to check`);

    let updatedMessagesCount = 0;
    let skippedMessagesCount = 0;

    for (const message of messages) {
      if (message.attachments && Array.isArray(message.attachments) && message.attachments.length > 0) {
        let needsUpdate = false;
        const normalizedAttachments = message.attachments.map((attachment: any) => {
          const normalizedUrl = normalizeUrl(attachment.url);
          if (normalizedUrl !== attachment.url) {
            needsUpdate = true;
          }
          return {
            ...attachment,
            url: normalizedUrl || attachment.url,
          };
        });

        if (needsUpdate) {
          await Message.updateOne({ _id: message._id }, { $set: { attachments: normalizedAttachments } });
          updatedMessagesCount++;
          console.log(`✅ Updated message ${message._id}`);
        } else {
          skippedMessagesCount++;
        }
      } else {
        skippedMessagesCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`Posts: ${updatedCount} updated, ${skippedCount} skipped`);
    console.log(`Users: ${updatedUsersCount} updated, ${skippedUsersCount} skipped`);
    console.log(`Messages: ${updatedMessagesCount} updated, ${skippedMessagesCount} skipped`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
normalizePostUrls();
