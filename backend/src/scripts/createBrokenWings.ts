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

async function createBrokenWings() {
  try {
    console.log('🦋 Creating BrokenWings user and journal...');
    
    // Connect to database
    await connectDB();
    
    // Check if user already exists
    let user = await User.findOne({ username: 'BrokenWings' });
    
    if (user) {
      console.log('  ⚠️  User BrokenWings already exists');
      // Delete existing journal entries and journal
      await JournalEntry.deleteMany({ author: user._id });
      await Journal.deleteMany({ owner: user._id });
      console.log('  ✓ Deleted existing journal entries and journal');
    } else {
      // Create user
      const hashedPassword = await bcrypt.hash('password123', 10);
      user = await User.create({
        email: 'brokenwings@example.com',
        password: hashedPassword,
        username: 'BrokenWings',
        displayName: 'Broken Wings',
        bio: 'Learning to fly again after the storm...',
        isAnonymous: true,
        isProtected: false,
        healthInfo: {
          mentalHealth: [
            { condition: 'PTSD', type: 'Complex PTSD', severity: 'severe' },
            { condition: 'Depression', severity: 'moderate' },
            { condition: 'Anxiety Disorder', severity: 'severe' }
          ]
        }
      });
      console.log('  ✓ Created user: BrokenWings');
    }
    
    // Create public journal
    let journal = await Journal.findOne({ owner: user._id, name: 'The night that changed everything' });
    
    // Copy cover image from assets to public directory (which is committed to git)
    const publicDir = path.join(__dirname, '../../public');
    const coverImageName = 'night-journal-cover.jpg';
    const coverImagePath = path.join(publicDir, coverImageName);
    const sourceImagePath = path.join(__dirname, '../../../frontend/assets/night.jpg');
    
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
    const coverImageUrl = '/public/night-journal-cover.jpg';
    
    if (!journal) {
      journal = await Journal.create({
        owner: user._id,
        name: 'The night that changed everything',
        description: 'Processing trauma, one word at a time. This is my story of survival and healing.',
        isPublic: true,
        entriesCount: 0,
        topics: ['ptsd', 'trauma', 'recovery', 'mental-health'],
        coverImage: coverImageUrl,
      });
      console.log('  ✓ Created public journal: "The night that changed everything"');
      console.log('  ✓ Added cover image (night.jpg from assets)');
    } else {
      // Update existing journal with cover image
      journal.coverImage = coverImageUrl;
      await journal.save();
      console.log('  ✓ Updated journal with cover image (night.jpg from assets)');
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
    const totalEntries = 39;
    const endDate = new Date('2026-02-23');
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (totalEntries - 1));
    
    // Story context that builds over time
    const storyContext = {
      daysSinceFlashback: 0,
      inTherapy: false,
      daysSinceTherapy: 0,
      lastNightmare: 0,
      supportSystem: [] as string[],
    };
    
    // Function to generate entry content based on progress and story context
    const generateEntry = (dayIndex: number, progress: number): string => {
      const lengthType = Math.random();
      let content = '';
      
      // Determine entry length: 30% short, 50% medium, 20% long
      const isShort = lengthType < 0.3;
      const isLong = lengthType > 0.8;
      
      if (progress < 0.35) {
        // Dark phase - severe PTSD symptoms
        storyContext.daysSinceFlashback = 0;
        storyContext.lastNightmare = 0;
        
        if (isShort) {
          const shorts = [
            `Can't sleep. Every time I close my eyes, I see it.`,
            `Had a flashback today. Full body. Thought I was going to die.`,
            `Hypervigilant all the time. Every sound makes me jump.`,
            `Nightmares every night. The same one. Over and over.`,
          ];
          content = shorts[Math.floor(Math.random() * shorts.length)];
        } else if (isLong) {
          content = `I don't remember when it happened. That night. The night that changed everything. But my body remembers. My body always remembers. Every time I close my eyes, I'm back there. I can smell it. The smoke. The fear. I can hear it. The screams. The sirens. I can feel it. The pain. The terror. I'm stuck there. Trapped in that moment. Can't escape.

Had a flashback today. Full body. Full sensory. I was at work, in a meeting, and suddenly I wasn't there anymore. I was back there. In that moment. The night that changed everything. I could smell the smoke. Taste the blood. Feel the fear. My heart raced. I couldn't breathe. Thought I was going to die. Right there in the conference room. My coworker had to shake me. Bring me back. I was covered in sweat. Shaking. Couldn't speak. Just... gone.

I'm hypervigilant all the time. Every sound makes me jump. Every shadow makes me freeze. Can't relax. Can't feel safe. Never feel safe. My body is always on alert. Always waiting for the next threat. The next attack. The next moment that will destroy me. I'm exhausted. But I can't stop. Can't let my guard down. If I do, something bad will happen. I know it will.

Nightmares every night. The same one. Over and over. I wake up screaming. Covered in sweat. Afraid to go back to sleep. But I have to sleep. Have to work. Have to function. But I'm not functioning. I'm just... surviving. Barely.`;
        } else {
          content = `Can't sleep. Every time I close my eyes, I see it. The night that changed everything. Had a flashback today. Full body. Full sensory. I was back there. In that moment. Could smell it. Taste it. Feel it. Thought I was going to die. I'm hypervigilant all the time. Every sound makes me jump. Every shadow makes me freeze. Can't relax. Can't feel safe. Never feel safe. Nightmares every night. The same one. Over and over. Wake up screaming. Covered in sweat. Afraid to go back to sleep. I'm just surviving. Barely.`;
        }
      } else if (progress < 0.55) {
        // Awareness phase - starting to understand
        storyContext.daysSinceFlashback++;
        storyContext.lastNightmare++;
        if (!storyContext.inTherapy && Math.random() > 0.5) {
          storyContext.inTherapy = true;
          storyContext.supportSystem.push('therapist');
        }
        
        if (isShort) {
          const shorts = [
            `Starting to understand. It has a name. PTSD.`,
            `Told my therapist today. Said the words out loud.`,
            `Had a trigger. Used my grounding techniques. Got through it.`,
            `In therapy now. EMDR. It's hard. But I'm doing it.`,
          ];
          content = shorts[Math.floor(Math.random() * shorts.length)];
        } else if (isLong) {
          content = `I'm starting to understand what happened to me. It has a name. PTSD. Post-traumatic stress disorder. It's not my fault. It's an injury. A wound. Like a broken bone. But in my mind. In my soul. Learning about trauma. About how it affects the brain. About how it's not weakness. It's a response. A survival response. My body is trying to protect me. But it's stuck. Stuck in that moment. That night. The night that changed everything.

I told my therapist today. Said the words out loud. Described what happened. The night that changed everything. The car crash. The fire. The screams. The loss. It was terrifying. Saying it out loud made it real. Made it tangible. But also... freeing? Like I'm not carrying it alone anymore. Like someone else knows. Someone else understands.

I had a trigger today. A sound. A car backfiring. Something. Panicked. My heart raced. Couldn't breathe. But I used my grounding techniques. The ones my therapist taught me. Five things I can see. Four things I can touch. Three things I can hear. Two things I can smell. One thing I can taste. Got through it. Without a full flashback. That's progress. Real progress.

I'm in therapy now. EMDR. Trauma therapy. It's hard. So hard. Reliving the trauma. Processing it. But I'm doing it. Really doing it. Because I want to heal. I want to live again. Not just survive. Live.`;
        } else {
          content = `Starting to understand what happened to me. It has a name. PTSD. It's not my fault. It's an injury. I told my therapist today. Said the words out loud. Described what happened. The night that changed everything. It was terrifying. But also freeing. Like I'm not carrying it alone anymore. Had a trigger today. A sound. Panicked. But I used my grounding techniques. Got through it. Without a full flashback. That's progress. I'm in therapy now. EMDR. It's hard. But I'm doing it. Because I want to heal. I want to live again.`;
        }
      } else if (progress < 0.80) {
        // Recovery phase - processing, healing
        if (!storyContext.inTherapy) {
          storyContext.inTherapy = true;
        }
        storyContext.daysSinceTherapy++;
        storyContext.daysSinceFlashback = Math.min(storyContext.daysSinceFlashback + 1, 14);
        storyContext.lastNightmare = Math.min(storyContext.lastNightmare + 1, 7);
        
        if (isShort) {
          const shorts = [
            `Went a whole week without a flashback.`,
            `Sleeping better. The nightmares are less frequent.`,
            `Went to that place today. I was okay.`,
            `Learning to manage my triggers. I have tools now.`,
          ];
          content = shorts[Math.floor(Math.random() * shorts.length)];
        } else if (isLong) {
          content = `Three months in therapy now. Dr. Martinez says I'm making incredible progress. I don't always see it, but I'm trying to trust her. The nightmares are less frequent. Maybe twice a week instead of every night. When they come, I use my grounding techniques. I remind myself I'm safe now. The night that changed everything is in the past. I'm in the present. I'm safe.

I went a whole week without a flashback. A whole week. Didn't think it was possible. But I did it. The triggers are still there. But I'm learning to manage them. Learning to cope. I have tools now. Breathing exercises. Grounding techniques. A support system. People I can call. Places I can go. Things I can do. It's not perfect. But it's something. It's progress.

I went to that place today. The place where it happened. The night that changed everything. I didn't have a flashback. I was okay. More than okay. I was strong. I stood there. Felt the fear. But didn't let it consume me. Used my tools. Breathed through it. And I was okay. That's huge. That's healing.`;
        } else {
          content = `Three months in therapy now. Dr. Martinez says I'm making progress. The nightmares are less frequent. Maybe twice a week instead of every night. I went a whole week without a flashback. Didn't think it was possible. But I did it. I went to that place today. The place where it happened. I didn't have a flashback. I was okay. More than okay. I was strong. That's huge. That's healing.`;
        }
      } else {
        // Hopeful phase - healing, growth
        storyContext.daysSinceFlashback = Math.min(storyContext.daysSinceFlashback + 1, 90);
        storyContext.lastNightmare = Math.min(storyContext.lastNightmare + 1, 30);
        storyContext.daysSinceTherapy = Math.min(storyContext.daysSinceTherapy + 1, 365);
        
        if (isShort) {
          const shorts = [
            `${Math.floor(storyContext.daysSinceFlashback / 30)} months since my last flashback.`,
            `Sleep through the night now. The nightmares are rare.`,
            `Feel safe. Really safe. Never thought that was possible.`,
            `The night that changed everything... it made me stronger.`,
          ];
          content = shorts[Math.floor(Math.random() * shorts.length)];
        } else if (isLong) {
          content = `It's been ${Math.floor(storyContext.daysSinceFlashback / 30)} months since my last flashback. ${Math.floor(storyContext.daysSinceFlashback / 30)} months. I never thought I'd see this day. Never thought I'd make it this far. But here I am. Still going. Still healing. Still growing.

Therapy is less frequent now - once a month instead of twice a week. Dr. Martinez says I've done incredible work. I've processed the trauma. Learned to manage triggers. Built a support system. The flashbacks are gone. The nightmares are rare. When they come, I can handle them. I'm not stuck in that moment anymore. That night. The night that changed everything. I'm here. In the present. Living.

I feel safe. Really safe. In my body. In my mind. In my life. Never thought that was possible. But it is. I'm safe. The night that changed everything... it did change everything. But not all for the worse. I'm stronger now. Wiser. More resilient. I've been through hell. Came out the other side. I'm a survivor. Not a victim. A survivor.`;
        } else {
          content = `It's been ${Math.floor(storyContext.daysSinceFlashback / 30)} months since my last flashback. I never thought I'd make it this far. But here I am. Still going. Still healing. Therapy is less frequent now - once a month. The flashbacks are gone. The nightmares are rare. I feel safe. Really safe. Never thought that was possible. The night that changed everything... it made me stronger. Wiser. More resilient. I'm a survivor.`;
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
      
      if (progress < 0.35) {
        mood = 1 + Math.floor(Math.random() * 2); // 1-2
        symptoms = [
          { condition: 'PTSD', type: 'Complex PTSD', severity: 'severe' },
          { condition: 'Depression', severity: 'severe' },
          { condition: 'Anxiety Disorder', severity: 'severe' }
        ];
        tags = ['ptsd', 'trauma', 'dark', 'hopeless'];
      } else if (progress < 0.55) {
        mood = 2 + Math.floor(Math.random() * 2); // 2-3
        symptoms = [
          { condition: 'PTSD', type: 'Complex PTSD', severity: 'moderate' },
          { condition: 'Depression', severity: 'moderate' },
          { condition: 'Anxiety Disorder', severity: 'moderate' }
        ];
        tags = ['ptsd', 'trauma', 'struggling', 'awareness'];
      } else if (progress < 0.80) {
        mood = 3 + Math.floor(Math.random() * 3); // 3-5
        const recoverySymptoms = [
          { condition: 'PTSD', type: 'Complex PTSD', severity: 'mild' },
          { condition: 'Depression', severity: 'mild' },
          { condition: 'Anxiety Disorder', severity: 'mild' }
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
          { condition: 'PTSD', type: 'Complex PTSD', severity: 'mild' }
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
    console.log('\n✅ Successfully created BrokenWings user and journal!');
    console.log(`   Username: BrokenWings`);
    console.log(`   Password: password123`);
    console.log(`   Journal: "The night that changed everything" (Public)`);
    console.log(`   Entries: ${entries.length} entries showing recovery journey`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating BrokenWings:', error);
    process.exit(1);
  }
}

// Run script
createBrokenWings();
