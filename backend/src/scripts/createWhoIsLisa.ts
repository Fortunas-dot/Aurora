import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database';
import User from '../models/User';
import Journal from '../models/Journal';
import JournalEntry from '../models/JournalEntry';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function createWhoIsLisa() {
  try {
    console.log('👤 Creating WhoIsLisa user and journal...');
    
    // Connect to database
    await connectDB();
    
    // Check if user already exists
    let user = await User.findOne({ username: 'WhoIsLisa' });
    
    if (user) {
      console.log('  ⚠️  User WhoIsLisa already exists');
      // Delete existing journal entries and journal
      await JournalEntry.deleteMany({ author: user._id });
      await Journal.deleteMany({ owner: user._id });
      console.log('  ✓ Deleted existing journal entries and journal');
    } else {
      // Create user
      const hashedPassword = await bcrypt.hash('password123', 10);
      user = await User.create({
        email: 'whoislisa@example.com',
        password: hashedPassword,
        username: 'WhoIsLisa',
        displayName: 'Lisa',
        bio: 'Recovering, one day at a time...',
        isAnonymous: true,
        isProtected: false,
        healthInfo: {
          mentalHealth: [
            { condition: 'Eating Disorder', type: 'Anorexia nervosa', severity: 'moderate' },
            { condition: 'Anxiety Disorder', severity: 'moderate' },
            { condition: 'Depression', severity: 'moderate' }
          ]
        }
      });
      console.log('  ✓ Created user: WhoIsLisa');
    }
    
    // Create public journal
    let journal = await Journal.findOne({ owner: user._id, name: 'My journey being anorexia' });
    
    // Copy cover image from assets to public directory (which is committed to git)
    const publicDir = path.join(__dirname, '../../public');
    const coverImageName = 'anorexia-journal-cover.jpg';
    const coverImagePath = path.join(publicDir, coverImageName);
    const sourceImagePath = path.join(__dirname, '../../../frontend/assets/anorexia.jpg');
    
    // Ensure public directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Copy image if source exists (always overwrite to ensure it's up to date)
    if (fs.existsSync(sourceImagePath)) {
      try {
        fs.copyFileSync(sourceImagePath, coverImagePath);
        console.log('  ✓ Copied cover image from assets to public directory');
      } catch (error) {
        console.log('  ⚠️  Could not copy cover image:', error);
      }
    } else {
      console.log('  ⚠️  Source image not found at:', sourceImagePath);
    }
    
    // Use the public image URL (this will be served from /public)
    const coverImageUrl = '/public/anorexia-journal-cover.jpg';
    
    if (!journal) {
      journal = await Journal.create({
        owner: user._id,
        name: 'My journey being anorexia',
        description: 'Learning to nourish my body and my soul. One meal, one day, one step at a time.',
        isPublic: true,
        entriesCount: 0,
        topics: ['anorexia', 'eating-disorder', 'recovery', 'mental-health'],
        coverImage: coverImageUrl,
      });
      console.log('  ✓ Created public journal: "My journey being anorexia"');
      console.log('  ✓ Added cover image (anorexia.jpg from assets)');
    } else {
      // Update existing journal with cover image
      journal.coverImage = coverImageUrl;
      await journal.save();
      console.log('  ✓ Updated journal with cover image (anorexia.jpg from assets)');
    }
    
    // Delete existing entries
    await JournalEntry.deleteMany({ journal: journal._id });
    journal.entriesCount = 0;
    
    // Helper function to generate random time
    const getRandomTime = (): { hours: number; minutes: number } => {
      const rand = Math.random();
      if (rand < 0.7) {
        const hours = 6 + Math.floor(Math.random() * 17);
        const minutes = Math.floor(Math.random() * 60);
        return { hours, minutes };
      } else if (rand < 0.9) {
        const hours = 23 + Math.floor(Math.random() * 3);
        const minutes = Math.floor(Math.random() * 60);
        return { hours: hours % 24, minutes };
      } else {
        const hours = 2 + Math.floor(Math.random() * 4);
        const minutes = Math.floor(Math.random() * 60);
        return { hours, minutes };
      }
    };
    
    // Generate entries as a continuous story with varying lengths
    const totalEntries = 43;
    const endDate = new Date('2026-02-23');
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (totalEntries - 1));
    
    // Story context that builds over time
    const storyContext = {
      currentWeight: 95, // Starting weight (lbs)
      targetWeight: 85, // Dangerous low weight
      daysSinceLastMeal: 0,
      inTreatment: false,
      daysSinceTreatment: 0,
      mealsEaten: 0,
      lastRelapse: 0,
      supportSystem: [] as string[],
    };
    
    // Function to generate entry content based on progress and story context
    const generateEntry = (dayIndex: number, progress: number): string => {
      const lengthType = Math.random();
      let content = '';
      
      // Determine entry length: 30% short, 50% medium, 20% long
      const isShort = lengthType < 0.3;
      const isLong = lengthType > 0.8;
      
      if (progress < 0.2) {
        // Dark phase - severe restriction
        storyContext.daysSinceLastMeal++;
        storyContext.currentWeight = Math.max(85, storyContext.currentWeight - Math.random() * 0.5);
        
        if (isShort) {
          const shorts = [
            `Stepped on the scale. Number went down. Still not enough.`,
            `Ate 200 calories today. Too much.`,
            `Exercised for three hours. Can't stop.`,
            `So cold. All the time.`,
          ];
          content = shorts[Math.floor(Math.random() * shorts.length)];
        } else if (isLong) {
          content = `I don't remember when this started. Maybe six months ago? Maybe longer. I just wanted to lose a few pounds. Get in shape. Feel better about myself. But it became something else. Something dark. Something consuming.

Today I stepped on the scale. 87 pounds. Down from 88 yesterday. I should be happy. I'm not. Never happy. The number is never low enough. I look in the mirror and all I see is fat. I know logically I'm not. I know I'm dangerously thin. But the voice in my head screams. You're disgusting. You're huge. You need to lose more.

I counted every calorie today. 200. That's all. An apple in the morning. A few crackers. That's it. I'm so hungry. My stomach aches constantly. But the hunger feels like control. Hunger means I'm winning. Hunger means I'm strong. Food is the enemy. Food is weakness.

I exercised for three hours today. Running. Crunches. Anything to burn calories. Can't stop. If I stop, I'll gain weight. If I gain weight, I'll be worthless. The pain in my body is nothing. Nothing compared to the pain of being fat.

My period stopped months ago. I know that's bad. I know it means my body is shutting down. But I don't care. It means I'm winning. It means I'm thin enough. Nothing else matters.`;
        } else {
          content = `Stepped on the scale today. 87 pounds. Down from 88 yesterday. I should be happy. I'm not. Never happy. The number is never low enough. I counted every calorie today. 200. That's all. I'm so hungry. But the hunger feels like control. Hunger means I'm winning. I exercised for three hours. Can't stop. If I stop, I'll gain weight. If I gain weight, I'll be worthless. My period stopped months ago. I know that's bad. But I don't care. It means I'm winning. Nothing else matters.`;
        }
      } else if (progress < 0.5) {
        // Awareness phase - starting to see the damage
        storyContext.daysSinceLastMeal = Math.min(storyContext.daysSinceLastMeal + 1, 3);
        if (!storyContext.inTreatment && Math.random() > 0.5) {
          storyContext.inTreatment = true;
          storyContext.supportSystem.push('therapist');
        }
        
        if (isShort) {
          const shorts = [
            `Fainted today. My mom found me.`,
            `Tried to eat something. Couldn't do it.`,
            `Therapist said I'm killing myself.`,
            `Maybe this isn't okay.`,
          ];
          content = shorts[Math.floor(Math.random() * shorts.length)];
        } else if (isLong) {
          content = `I fainted today. In the middle of the day. Just collapsed. My mom found me on the kitchen floor. She was crying. I've never seen her so scared. She called an ambulance. At the hospital, the doctor said my heart rate is dangerously low. My blood pressure is too low. My body is shutting down. They're talking about hospitalization. Force feeding. I'm terrified. But also... maybe I need it? Maybe this isn't okay?

I tried to eat something today. Just a small apple. Couldn't do it. The panic was overwhelming. My hands shook. My heart raced. I felt like I was going to die. But I wanted to. Really wanted to. That's something, right? That has to mean something.

My therapist said I'm killing myself. I know they're right. I know this is dangerous. I know I'm dying. But I can't stop. Don't know how to stop. This has become who I am. My identity. Without it, who am I? But I'm also so tired. So cold. So empty. Maybe it's time to try something different.`;
        } else {
          content = `I fainted today. My mom found me. She was crying. Never seen her so scared. At the hospital, the doctor said my heart rate is dangerously low. They're talking about hospitalization. I'm terrified. But maybe I need it? I tried to eat something today. Just an apple. Couldn't do it. The panic was overwhelming. But I wanted to. That's something, right? My therapist said I'm killing myself. I know they're right. But I can't stop. Don't know how to stop. Maybe it's time to try something different.`;
        }
      } else if (progress < 0.8) {
        // Recovery phase - in treatment, learning to eat again
        if (!storyContext.inTreatment) {
          storyContext.inTreatment = true;
        }
        storyContext.daysSinceTreatment++;
        storyContext.currentWeight = Math.min(100, storyContext.currentWeight + Math.random() * 0.3);
        storyContext.mealsEaten = Math.min(storyContext.mealsEaten + (Math.random() > 0.3 ? 1 : 0), 30);
        
        if (isShort) {
          const shorts = [
            `Ate a full meal today. Felt guilty but proud.`,
            `Three days in treatment. It's hard.`,
            `Gained two pounds. Trying not to panic.`,
            `Therapy is helping. Slowly.`,
          ];
          content = shorts[Math.floor(Math.random() * shorts.length)];
        } else if (isLong) {
          content = `Three weeks in treatment now. It's the hardest thing I've ever done. Every meal is a battle. Every bite is a fight. The voice in my head screams. You're going to get fat. You're losing control. You're weak. But I'm learning to fight back. Learning that the voice is lying. That I'm not weak. That eating is strength. That recovery is strength.

Today I ate a full meal. Breakfast, lunch, and dinner. All of them. I felt guilty. So guilty. Wanted to exercise. Wanted to restrict. Wanted to make up for it. But I didn't. I called my therapist instead. Talked about the guilt. About the fear. She helped me understand. Helped me see that the guilt is the eating disorder talking. That I'm not weak for eating. I'm strong.

I've gained two pounds. Two pounds. The scale says 89 now. I'm trying not to panic. Trying to remember what my therapist says. That my body needs this. That I need this. That I'm not getting fat. I'm getting healthy. But it's so hard. The fear is overwhelming sometimes. But I'm doing it. I'm really doing it.`;
        } else {
          content = `Three weeks in treatment now. It's the hardest thing I've ever done. Every meal is a battle. Every bite is a fight. Today I ate a full meal. Breakfast, lunch, and dinner. I felt guilty. So guilty. But I didn't exercise. I didn't restrict. I called my therapist instead. I've gained two pounds. I'm trying not to panic. Trying to remember that I'm not getting fat. I'm getting healthy. But it's so hard. The fear is overwhelming. But I'm doing it. I'm really doing it.`;
        }
      } else {
        // Hopeful phase - healing, learning to love food again
        storyContext.currentWeight = Math.min(110, storyContext.currentWeight + Math.random() * 0.2);
        storyContext.mealsEaten = Math.min(storyContext.mealsEaten + 1, 60);
        storyContext.daysSinceTreatment = Math.min(storyContext.daysSinceTreatment + 1, 180);
        
        if (isShort) {
          const shorts = [
            `${Math.floor(storyContext.daysSinceTreatment / 30)} months in recovery. Still going.`,
            `Ate pizza today. Actually enjoyed it.`,
            `My period came back. My body is healing.`,
            `I'm learning to love food again.`,
          ];
          content = shorts[Math.floor(Math.random() * shorts.length)];
        } else if (isLong) {
          content = `It's been ${Math.floor(storyContext.daysSinceTreatment / 30)} months since I started treatment. ${Math.floor(storyContext.daysSinceTreatment / 30)} months. I never thought I'd make it this far. Never thought I'd be here. But here I am. Still going. Still healing. Still growing.

I ate pizza today. Real pizza. With friends. And I actually enjoyed it. Not just tolerated it. Enjoyed it. The taste. The texture. The experience. I didn't count calories. Didn't panic. Didn't feel guilty. Just... ate. And it was okay. More than okay. It was good. Really good.

My period came back last month. After almost a year without it. My body is healing. My hair is growing back. I have energy again. Real energy. Not the fake energy from starvation. Real, sustainable energy. I can think clearly. I can concentrate. I can live.

I'm learning to love food again. Not fear it. Love it. Food is nourishment. Food is life. Food is connection. I'm learning to cook. Trying new recipes. Sharing meals with people I care about. It's beautiful. Food is beautiful. Life is beautiful. I'm learning to see that.`;
        } else {
          content = `It's been ${Math.floor(storyContext.daysSinceTreatment / 30)} months since I started treatment. I never thought I'd make it this far. But here I am. Still going. Still healing. I ate pizza today. With friends. And I actually enjoyed it. Didn't count calories. Didn't panic. Just ate. And it was good. My period came back last month. My body is healing. I have energy again. Real energy. I'm learning to love food again. Not fear it. Love it. Food is nourishment. Food is life. It's beautiful.`;
        }
      }
      
      return content;
    };
    
    const entries = [];
    
    for (let i = 0; i < totalEntries; i++) {
      const entryDate = new Date(startDate);
      entryDate.setDate(entryDate.getDate() + i);
      
      const { hours, minutes } = getRandomTime();
      entryDate.setHours(hours, minutes, Math.floor(Math.random() * 60), 0);
      
      const progress = i / (totalEntries - 1);
      const content = generateEntry(i, progress);
      
      let mood: number;
      let symptoms: any[] = [];
      let tags: string[] = [];
      
      if (progress < 0.2) {
        mood = 1 + Math.floor(Math.random() * 2); // 1-2
        symptoms = [
          { condition: 'Eating Disorder', type: 'Anorexia nervosa', severity: 'severe' },
          { condition: 'Anxiety Disorder', severity: 'severe' },
          { condition: 'Depression', severity: 'severe' }
        ];
        tags = ['anorexia', 'eating-disorder', 'dark', 'hopeless'];
      } else if (progress < 0.5) {
        mood = 2 + Math.floor(Math.random() * 2); // 2-3
        symptoms = [
          { condition: 'Eating Disorder', type: 'Anorexia nervosa', severity: 'moderate' },
          { condition: 'Anxiety Disorder', severity: 'moderate' },
          { condition: 'Depression', severity: 'moderate' }
        ];
        tags = ['anorexia', 'eating-disorder', 'struggling', 'awareness'];
      } else if (progress < 0.8) {
        mood = 3 + Math.floor(Math.random() * 3); // 3-5
        const recoverySymptoms = [
          { condition: 'Eating Disorder', type: 'Anorexia nervosa', severity: 'mild' },
          { condition: 'Anxiety Disorder', severity: 'mild' },
          { condition: 'Depression', severity: 'mild' }
        ];
        if (Math.random() > 0.3) {
          symptoms = recoverySymptoms.slice(0, 2);
        } else {
          symptoms = recoverySymptoms;
        }
        tags = ['recovery', 'hope', 'struggling', 'progress'];
      } else {
        mood = 5 + Math.floor(Math.random() * 4); // 5-8
        const hopefulSymptoms = [
          { condition: 'Eating Disorder', type: 'Anorexia nervosa', severity: 'mild' }
        ];
        if (Math.random() > 0.5) {
          hopefulSymptoms.push({ condition: 'Anxiety Disorder', severity: 'mild' } as any);
        }
        symptoms = hopefulSymptoms;
        tags = ['recovery', 'hope', 'healing', 'progress', 'strength'];
      }
      
      entries.push({
        author: user._id,
        journal: journal._id,
        content,
        mood,
        symptoms,
        tags,
        isPrivate: false,
        fontFamily: 'palatino',
        createdAt: entryDate,
        updatedAt: entryDate,
      });
    }
    
    // Insert all entries
    await JournalEntry.insertMany(entries);
    journal.entriesCount = entries.length;
    await journal.save();
    
    console.log(`  ✓ Created ${entries.length} journal entries`);
    console.log(`  ✓ Journal spans from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
    console.log('  ✓ Entries form a continuous story with varying lengths');
    console.log('\n✅ Successfully created WhoIsLisa user and journal!');
    console.log(`   Username: WhoIsLisa`);
    console.log(`   Password: password123`);
    console.log(`   Journal: "My journey being anorexia" (Public)`);
    console.log(`   Entries: ${entries.length} entries showing recovery journey`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating WhoIsLisa:', error);
    process.exit(1);
  }
}

// Run script
createWhoIsLisa();
