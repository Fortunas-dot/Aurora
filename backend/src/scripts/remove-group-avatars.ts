import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database';
import Group from '../models/Group';

dotenv.config();

async function removeGroupAvatars() {
  try {
    console.log('🗑️  Removing all group avatars...');
    
    // Connect to database
    await connectDB();
    
    // Update all groups to remove avatars
    const result = await Group.updateMany({}, { avatar: null });
    
    console.log(`✅ Updated ${result.modifiedCount} groups to remove avatars`);
    console.log(`📊 Total groups matched: ${result.matchedCount}`);
    
    // Verify
    const groupsWithAvatars = await Group.countDocuments({ avatar: { $ne: null } });
    if (groupsWithAvatars === 0) {
      console.log('✅ All groups now have null avatars');
    } else {
      console.log(`⚠️  Warning: ${groupsWithAvatars} groups still have avatars`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error removing group avatars:', error);
    process.exit(1);
  }
}

removeGroupAvatars();
