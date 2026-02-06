import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database';
import User from '../models/User';
import bcrypt from 'bcryptjs';

dotenv.config();

const APPLE_REVIEW_EMAIL = 'apple.review@aurora.app';
const APPLE_REVIEW_USERNAME = 'apple_review';
const APPLE_REVIEW_PASSWORD = 'AppleReview2024!';

async function createAppleReviewAccount() {
  try {
    console.log('🍎 Creating Apple Review Account...');
    
    // Connect to database
    await connectDB();
    
    // Check if account already exists
    const existingUser = await User.findOne({
      $or: [
        { email: APPLE_REVIEW_EMAIL },
        { username: APPLE_REVIEW_USERNAME },
      ],
    });
    
    if (existingUser) {
      // Update existing account to be protected
      existingUser.isProtected = true;
      existingUser.displayName = existingUser.displayName || 'Apple Review';
      existingUser.bio = 'Apple App Store review account - Protected account';
      existingUser.isAnonymous = false;
      
      // Update password if needed
      if (existingUser.password) {
        const isMatch = await existingUser.comparePassword(APPLE_REVIEW_PASSWORD);
        if (!isMatch) {
          const salt = await bcrypt.genSalt(10);
          existingUser.password = await bcrypt.hash(APPLE_REVIEW_PASSWORD, salt);
          console.log('  ✓ Password updated');
        }
      } else {
        const salt = await bcrypt.genSalt(10);
        existingUser.password = await bcrypt.hash(APPLE_REVIEW_PASSWORD, salt);
        console.log('  ✓ Password set');
      }
      
      await existingUser.save();
      console.log('  ✓ Apple review account updated and protected');
      console.log(`  📧 Email: ${APPLE_REVIEW_EMAIL}`);
      console.log(`  👤 Username: ${APPLE_REVIEW_USERNAME}`);
      console.log(`  🔒 Password: ${APPLE_REVIEW_PASSWORD}`);
      console.log(`  🛡️  Protected: ${existingUser.isProtected}`);
      
      process.exit(0);
      return;
    }
    
    // Create new account
    const hashedPassword = await bcrypt.hash(APPLE_REVIEW_PASSWORD, 10);
    
    const appleReviewUser = await User.create({
      email: APPLE_REVIEW_EMAIL,
      password: hashedPassword,
      username: APPLE_REVIEW_USERNAME,
      displayName: 'Apple Review',
      bio: 'Apple App Store review account - Protected account',
      isAnonymous: false,
      isProtected: true, // Mark as protected - cannot be deleted
    });
    
    console.log('  ✅ Apple review account created successfully!');
    console.log(`  📧 Email: ${APPLE_REVIEW_EMAIL}`);
    console.log(`  👤 Username: ${APPLE_REVIEW_USERNAME}`);
    console.log(`  🔒 Password: ${APPLE_REVIEW_PASSWORD}`);
    console.log(`  🛡️  Protected: ${appleReviewUser.isProtected}`);
    console.log('\n  ⚠️  IMPORTANT: This account is protected and will NOT be deleted during seeding!');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating Apple review account:', error);
    process.exit(1);
  }
}

// Run the script
createAppleReviewAccount();
