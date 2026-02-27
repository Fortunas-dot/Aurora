import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database';
import Group from '../models/Group';

dotenv.config();

// Carefully chosen banners that fit each group theme
const GROUP_BANNERS: Record<string, string> = {
  'Self-Care & Mindfulness':
    'https://images.pexels.com/photos/1051838/pexels-photo-1051838.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'Depression Support':
    'https://images.pexels.com/photos/954116/pexels-photo-954116.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'Anxiety & Panic':
    'https://images.pexels.com/photos/1452701/pexels-photo-1452701.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'Trauma Healing':
    'https://images.pexels.com/photos/220210/pexels-photo-220210.jpeg?auto=compress&cs=tinysrgb&w=1200',
};

async function setGroupBanners() {
  try {
    console.log('🖼  Setting cover banners for groups...');
    await connectDB();

    const names = Object.keys(GROUP_BANNERS);
    console.log(`Configuring banners for ${names.length} groups...`);

    for (const name of names) {
      const bannerUrl = GROUP_BANNERS[name];
      const group = await Group.findOneAndUpdate(
        { name },
        { $set: { coverImage: bannerUrl } },
        { new: true }
      );

      if (!group) {
        console.warn(`  ⚠️  Group not found for name: "${name}"`);
      } else {
        console.log(`  ✓ Set banner for "${name}" -> ${bannerUrl}`);
      }
    }

    console.log('\n✅ Finished setting group banners.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting group banners:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

setGroupBanners();

