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

async function createAnonymousDuck() {
  try {
    console.log('🦆 Creating anonymous_duck user and journal...');
    
    // Connect to database
    await connectDB();
    
    // Check if user already exists
    let user = await User.findOne({ username: 'anonymous_duck' });
    
    if (user) {
      console.log('  ⚠️  User anonymous_duck already exists');
      // Delete existing journal entries and journal
      await JournalEntry.deleteMany({ author: user._id });
      await Journal.deleteMany({ owner: user._id });
      console.log('  ✓ Deleted existing journal entries and journal');
    } else {
      // Create user
      const hashedPassword = await bcrypt.hash('password123', 10);
      user = await User.create({
        email: 'anonymous_duck@example.com',
        password: hashedPassword,
        username: 'anonymous_duck',
        displayName: 'Anonymous Duck',
        bio: 'Just trying to survive...',
        isAnonymous: true,
        isProtected: false,
      });
      console.log('  ✓ Created user: anonymous_duck');
    }
    
    // Create public journal
    let journal = await Journal.findOne({ owner: user._id, name: 'I cut myself everyday...' });
    
    // Copy cover image from assets to uploads if it doesn't exist
    const uploadsDir = path.join(__dirname, '../../uploads');
    const coverImageName = 'knive-journal-cover.PNG';
    const coverImagePath = path.join(uploadsDir, coverImageName);
    const sourceImagePath = path.join(__dirname, '../../../frontend/assets/knive.PNG');
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Copy image if source exists and destination doesn't
    if (fs.existsSync(sourceImagePath) && !fs.existsSync(coverImagePath)) {
      try {
        fs.copyFileSync(sourceImagePath, coverImagePath);
        console.log('  ✓ Copied cover image from assets to uploads');
      } catch (error) {
        console.log('  ⚠️  Could not copy cover image:', error);
      }
    }
    
    // Use the uploaded image URL
    const coverImageUrl = '/uploads/knive-journal-cover.PNG';
    
    if (!journal) {
      journal = await Journal.create({
        owner: user._id,
        name: 'I cut myself everyday...',
        description: 'A journey through darkness to light',
        isPublic: true,
        entriesCount: 0,
        topics: ['self-harm', 'recovery', 'mental-health'],
        coverImage: coverImageUrl,
      });
      console.log('  ✓ Created public journal: "I cut myself everyday..."');
      console.log('  ✓ Added cover image (knive.PNG from assets)');
    } else {
      // Update existing journal with cover image
      journal.coverImage = coverImageUrl;
      await journal.save();
      console.log('  ✓ Updated journal with cover image (knive.PNG from assets)');
    }
    
    // Delete existing entries
    await JournalEntry.deleteMany({ journal: journal._id });
    journal.entriesCount = 0;
    
    // Create journal entries - starting from about 40 days ago, ending on 23-2-2026
    const endDate = new Date('2026-02-23');
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 40); // Start 40 days before
    
    const entries = [];
    
    // Generate entries with progression from dark to hopeful
    for (let i = 0; i < 40; i++) {
      const entryDate = new Date(startDate);
      entryDate.setDate(entryDate.getDate() + i);
      
      // Calculate progress (0 = very dark, 1 = hopeful)
      const progress = i / 39;
      
      let content = '';
      let mood = 1;
      let symptoms: any[] = [];
      let tags: string[] = [];
      
      if (progress < 0.2) {
        // Very dark phase (first 20%)
        mood = 1 + Math.floor(Math.random() * 2); // 1-2
        symptoms = [{ condition: 'depression', severity: 'severe' }, { condition: 'self-harm', severity: 'severe' }];
        tags = ['dark', 'self-harm', 'depression', 'hopeless'];
        
        const darkEntries = [
          `The blade calls to me again. I can feel it in my bones, this need to see the red. It's the only thing that makes me feel real anymore. Everything else is just... numb.`,
          `I cut deeper today. The pain is the only thing that cuts through the fog in my mind. I don't know why I do this, but I can't stop. The scars are multiplying, and I'm running out of places to hide them.`,
          `The voices in my head won't stop. They tell me I'm worthless, that I deserve this. Maybe they're right. The blade feels like my only friend, the only thing that understands.`,
          `I look at my arms and see a map of my pain. Each line tells a story of a moment I couldn't bear. Today was worse. I don't know how much longer I can do this.`,
          `The blood is the only color I see anymore. Everything else is gray. I cut because I need to feel something, anything, even if it's just pain.`,
          `I'm drowning. Every day I cut, hoping maybe this time it will be enough. But it never is. The emptiness just grows.`,
          `The blade is my secret, my shame, my only release. I hate myself for needing it, but I can't imagine life without it. What would I do with all this pain?`,
          `I'm a monster. I look in the mirror and see someone I don't recognize. The cuts are my punishment, my way of making the outside match the inside.`,
        ];
        content = darkEntries[Math.floor(Math.random() * darkEntries.length)];
        
      } else if (progress < 0.5) {
        // Still dark but some awareness (20-50%)
        mood = 2 + Math.floor(Math.random() * 2); // 2-3
        symptoms = [{ condition: 'depression', severity: 'moderate' }, { condition: 'self-harm', severity: 'moderate' }];
        tags = ['self-harm', 'depression', 'struggling', 'awareness'];
        
        const awarenessEntries = [
          `I cut again today, but something felt different. I looked at the scars and wondered... is this really helping? The relief is so temporary, and then the shame comes.`,
          `I tried not to cut today. I lasted until 3pm. That's progress, right? But I still gave in. The urge was too strong. I'm weak.`,
          `My therapist asked me to try one day without cutting. I couldn't do it. I feel like such a failure. But at least I'm thinking about it now, questioning it.`,
          `I cut less today. Only twice instead of my usual five or six times. It's something. I'm trying to understand why I do this, what I'm really trying to escape.`,
          `The urges are still there, constant and overwhelming. But I'm starting to see patterns. I cut when I feel overwhelmed, when I can't process my emotions. Maybe there's another way?`,
          `I'm scared. Scared of stopping, scared of continuing. This has become my identity, and I don't know who I am without it. But I'm also tired. So tired.`,
          `I wrote in my journal instead of cutting today. It didn't work as well, but it was something. I'm trying. That has to count for something.`,
          `The shame is eating me alive. I hide my arms, my legs, my pain. But I'm starting to wonder if maybe I don't have to do this alone.`,
        ];
        content = awarenessEntries[Math.floor(Math.random() * awarenessEntries.length)];
        
      } else if (progress < 0.8) {
        // Turning point and recovery (50-80%)
        mood = 3 + Math.floor(Math.random() * 3); // 3-5
        symptoms = [{ condition: 'depression', severity: 'mild' }, { condition: 'self-harm', severity: 'mild' }];
        tags = ['recovery', 'hope', 'struggling', 'progress'];
        
        const recoveryEntries = [
          `I went three days without cutting. THREE DAYS. I didn't think I could do it. The urges are still there, but I'm learning to sit with them, to breathe through them.`,
          `I told someone about the cutting. My therapist. It was the hardest thing I've ever done, but I did it. And they didn't judge me. They helped me understand.`,
          `I'm learning new coping skills. When I feel the urge, I try to distract myself, to feel the emotion without acting on it. It's hard, but it's working sometimes.`,
          `I cut today, but it was different. I stopped myself after one cut instead of going deeper. I called my therapist. I reached out. That's progress.`,
          `The scars are healing. Some are fading. I'm starting to see them not as marks of shame, but as reminders of how far I've come.`,
          `I'm finding other ways to feel. Music, art, writing, even just crying. The pain doesn't have to come from a blade. I'm learning that emotions won't kill me.`,
          `I had a really bad day. Everything went wrong. The urge to cut was overwhelming. But I didn't. I called a friend instead. I'm proud of myself.`,
          `My therapist says I'm making progress. I don't always see it, but I'm trying to trust the process. Recovery isn't linear, and that's okay.`,
        ];
        content = recoveryEntries[Math.floor(Math.random() * recoveryEntries.length)];
        
      } else {
        // Hopeful and healing (80-100%)
        mood = 5 + Math.floor(Math.random() * 4); // 5-8
        symptoms = [{ condition: 'depression', severity: 'mild' }];
        tags = ['recovery', 'hope', 'healing', 'progress', 'strength'];
        
        const hopefulEntries = [
          `It's been two weeks since I last cut. Two weeks! I never thought I could do this. The urges still come, but they're weaker now. I'm stronger.`,
          `I look at my arms and see healing. The scars are fading, and so is the shame. I'm learning to love myself, to be gentle with myself. It's a process.`,
          `I'm finding joy in small things again. A good cup of coffee, a beautiful sunset, a friend's laugh. I'm remembering what it feels like to be alive without pain.`,
          `I cut myself everyday... that used to be my reality. But not anymore. I'm choosing different. I'm choosing life. I'm choosing me.`,
          `I'm learning that I'm not broken. I'm not a monster. I'm a person who was in pain and found a way to cope. Now I'm finding better ways.`,
          `The urges are rare now. When they come, I know what to do. I have tools, I have support, I have hope. I'm not alone in this anymore.`,
          `I'm proud of myself. Every day I don't cut is a victory. Every day I choose myself is a win. I'm building a life worth living.`,
          `I cut myself everyday... but that was then. This is now. I'm healing. I'm growing. I'm becoming someone I can be proud of. The journey isn't over, but I'm on the right path.`,
        ];
        content = hopefulEntries[Math.floor(Math.random() * hopefulEntries.length)];
      }
      
      entries.push({
        author: user._id,
        journal: journal._id,
        content,
        mood,
        symptoms,
        tags,
        isPrivate: false, // Public journal entries
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
    console.log('\n✅ Successfully created anonymous_duck user and journal!');
    console.log(`   Username: anonymous_duck`);
    console.log(`   Password: password123`);
    console.log(`   Journal: "I cut myself everyday..." (Public)`);
    console.log(`   Entries: ${entries.length} entries showing recovery journey`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating anonymous_duck:', error);
    process.exit(1);
  }
}

// Run script
createAnonymousDuck();
