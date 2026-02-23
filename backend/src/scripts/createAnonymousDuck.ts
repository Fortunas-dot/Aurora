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
        healthInfo: {
          mentalHealth: [
            { condition: 'Depression', severity: 'moderate' },
            { condition: 'Anxiety Disorder', severity: 'moderate' },
            { condition: 'Sleep Problems', severity: 'moderate' }
          ]
        }
      });
      console.log('  ✓ Created user: anonymous_duck');
    }
    
    // Create public journal
    let journal = await Journal.findOne({ owner: user._id, name: 'I cut myself everyday...' });
    
    // Copy cover image from assets to public directory (which is committed to git)
    const publicDir = path.join(__dirname, '../../public');
    const coverImageName = 'knive-journal-cover.PNG';
    const coverImagePath = path.join(publicDir, coverImageName);
    const sourceImagePath = path.join(__dirname, '../../../frontend/assets/knive.PNG');
    
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
    const coverImageUrl = '/public/knive-journal-cover.PNG';
    
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
    
    // Note: startDate is now calculated based on totalEntries above
    
    // Helper function to shuffle array
    const shuffle = <T>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };
    
    // Define all entries for each phase with more variety
    const darkEntries = [
      `The blade calls to me again. I can feel it in my bones, this need to see the red. It's the only thing that makes me feel real anymore. Everything else is just... numb.`,
      `I cut deeper today. The pain is the only thing that cuts through the fog in my mind. I don't know why I do this, but I can't stop. The scars are multiplying, and I'm running out of places to hide them.`,
      `The voices in my head won't stop. They tell me I'm worthless, that I deserve this. Maybe they're right. The blade feels like my only friend, the only thing that understands.`,
      `I look at my arms and see a map of my pain. Each line tells a story of a moment I couldn't bear. Today was worse. I don't know how much longer I can do this.`,
      `The blood is the only color I see anymore. Everything else is gray. I cut because I need to feel something, anything, even if it's just pain.`,
      `I'm drowning. Every day I cut, hoping maybe this time it will be enough. But it never is. The emptiness just grows.`,
      `The blade is my secret, my shame, my only release. I hate myself for needing it, but I can't imagine life without it. What would I do with all this pain?`,
      `I'm a monster. I look in the mirror and see someone I don't recognize. The cuts are my punishment, my way of making the outside match the inside.`,
      `Another day, another cut. The routine is familiar now. Wake up, feel nothing, cut, feel something, then nothing again. It's a cycle I can't break.`,
      `I hide my arms under long sleeves even in summer. The shame is constant. I know what I'm doing is wrong, but I can't stop. I don't want to stop.`,
      `The pain is the only thing that makes sense. Everything else is chaos. When I cut, for just a moment, everything is clear. Then the fog returns.`,
      `I've lost count of how many times I've done this. The scars overlap, creating a web of pain across my skin. Each one represents a moment I couldn't handle.`,
      `Tonight was bad. Really bad. I cut deeper than usual, and I'm scared. But I'm also relieved. The emotional pain is gone, replaced by something I can control.`,
      `I don't remember when this started. It feels like I've always been this way. The blade is part of me now, as much as my own skin.`,
      `I tried to stop today. I really did. But the urge was too strong. I lasted three hours. Three hours of fighting myself, and I still lost.`,
      `The blood drips and I watch it. There's something almost beautiful about it, the way it flows. It's the only thing that feels real.`,
    ];
    
    const awarenessEntries = [
      `I cut again today, but something felt different. I looked at the scars and wondered... is this really helping? The relief is so temporary, and then the shame comes.`,
      `I tried not to cut today. I lasted until 3pm. That's progress, right? But I still gave in. The urge was too strong. I'm weak.`,
      `My therapist asked me to try one day without cutting. I couldn't do it. I feel like such a failure. But at least I'm thinking about it now, questioning it.`,
      `I cut less today. Only twice instead of my usual five or six times. It's something. I'm trying to understand why I do this, what I'm really trying to escape.`,
      `The urges are still there, constant and overwhelming. But I'm starting to see patterns. I cut when I feel overwhelmed, when I can't process my emotions. Maybe there's another way?`,
      `I'm scared. Scared of stopping, scared of continuing. This has become my identity, and I don't know who I am without it. But I'm also tired. So tired.`,
      `I wrote in my journal instead of cutting today. It didn't work as well, but it was something. I'm trying. That has to count for something.`,
      `The shame is eating me alive. I hide my arms, my legs, my pain. But I'm starting to wonder if maybe I don't have to do this alone.`,
      `I had a panic attack today and the urge to cut was overwhelming. But I called a crisis line instead. I didn't cut. That's a first in months.`,
      `I'm noticing the triggers now. Stress, rejection, feeling worthless. Every time I feel these things, the blade calls. But I'm learning to recognize it before I act.`,
      `My therapist says I'm making progress. I don't see it, but they seem to. Maybe I need to trust them. Maybe I need to trust myself.`,
      `I cut today, but I stopped after one cut. Usually I can't stop. This feels different. Like maybe I have some control after all.`,
      `I'm reading about self-harm now. Understanding why people do it, what it does to the brain. Knowledge is power, they say. I hope so.`,
      `I told my best friend about the cutting. They didn't judge me. They just listened. For the first time in forever, I didn't feel alone.`,
      `I'm keeping track now. Marking the days I don't cut. It's not many, but it's more than zero. That has to mean something.`,
      `The urges come in waves. Sometimes I can ride them out. Other times I can't. But I'm learning. I'm trying. That's all I can do.`,
    ];
    
    const recoveryEntries = [
      `I went three days without cutting. THREE DAYS. I didn't think I could do it. The urges are still there, but I'm learning to sit with them, to breathe through them.`,
      `I told someone about the cutting. My therapist. It was the hardest thing I've ever done, but I did it. And they didn't judge me. They helped me understand.`,
      `I'm learning new coping skills. When I feel the urge, I try to distract myself, to feel the emotion without acting on it. It's hard, but it's working sometimes.`,
      `I cut today, but it was different. I stopped myself after one cut instead of going deeper. I called my therapist. I reached out. That's progress.`,
      `The scars are healing. Some are fading. I'm starting to see them not as marks of shame, but as reminders of how far I've come.`,
      `I'm finding other ways to feel. Music, art, writing, even just crying. The pain doesn't have to come from a blade. I'm learning that emotions won't kill me.`,
      `I had a really bad day. Everything went wrong. The urge to cut was overwhelming. But I didn't. I called a friend instead. I'm proud of myself.`,
      `My therapist says I'm making progress. I don't always see it, but I'm trying to trust the process. Recovery isn't linear, and that's okay.`,
      `One week without cutting. A full week. I can't believe it. The urges are still there, but they're quieter now. I'm learning to ignore them.`,
      `I relapsed today. I cut after five days clean. I'm disappointed, but I'm not giving up. Recovery isn't about perfection, it's about getting back up.`,
      `I'm using my coping skills more now. When I feel the urge, I do breathing exercises, I call someone, I write. It's not perfect, but it's working.`,
      `I look at my scars differently now. They're not just marks of pain, they're also marks of survival. I'm still here. I'm still fighting.`,
      `I joined a support group. Hearing other people's stories, knowing I'm not alone... it helps. We're all fighting the same battle.`,
      `I had a setback, but I didn't let it destroy me. I cut, but I also reached out for help. That's different. That's progress.`,
      `I'm learning to be kind to myself. When I cut, I don't hate myself as much. I understand that I'm in pain, and I'm trying to cope. That's okay.`,
      `The urges are getting weaker. They still come, but I'm stronger now. I have tools. I have support. I have hope.`,
    ];
    
    const hopefulEntries = [
      `It's been two weeks since I last cut. Two weeks! I never thought I could do this. The urges still come, but they're weaker now. I'm stronger.`,
      `I look at my arms and see healing. The scars are fading, and so is the shame. I'm learning to love myself, to be gentle with myself. It's a process.`,
      `I'm finding joy in small things again. A good cup of coffee, a beautiful sunset, a friend's laugh. I'm remembering what it feels like to be alive without pain.`,
      `I cut myself everyday... that used to be my reality. But not anymore. I'm choosing different. I'm choosing life. I'm choosing me.`,
      `I'm learning that I'm not broken. I'm not a monster. I'm a person who was in pain and found a way to cope. Now I'm finding better ways.`,
      `The urges are rare now. When they come, I know what to do. I have tools, I have support, I have hope. I'm not alone in this anymore.`,
      `I'm proud of myself. Every day I don't cut is a victory. Every day I choose myself is a win. I'm building a life worth living.`,
      `I cut myself everyday... but that was then. This is now. I'm healing. I'm growing. I'm becoming someone I can be proud of. The journey isn't over, but I'm on the right path.`,
      `Three weeks clean. I can't believe it. The person I was a month ago wouldn't recognize me now. I'm different. I'm better. I'm healing.`,
      `I had a really tough day today. The old urges came back, strong and insistent. But I didn't cut. I used my skills, I reached out, I got through it. I'm so proud.`,
      `I'm starting to see my scars as part of my story, not my identity. They show where I've been, but they don't define where I'm going.`,
      `I'm helping others now. Sharing my story, offering support. It feels good to use my pain for something positive. To help others who are where I was.`,
      `I'm learning to feel emotions again. Real emotions, not just numbness or pain. It's scary, but it's also beautiful. I'm alive. Really alive.`,
      `One month without cutting. A full month. I never thought this was possible. But here I am. I did it. I'm doing it.`,
      `I'm not perfect. I still have bad days. But I'm not cutting. I'm using healthy coping skills. I'm reaching out. I'm growing. That's enough.`,
      `I look in the mirror and I see someone I recognize. Someone I'm starting to like. The journey isn't over, but I'm on the right path. I'm healing.`,
    ];
    
    // Shuffle each array to ensure variety
    const shuffledDark = shuffle(darkEntries);
    const shuffledAwareness = shuffle(awarenessEntries);
    const shuffledRecovery = shuffle(recoveryEntries);
    const shuffledHopeful = shuffle(hopefulEntries);
    
    // Use Sets to track used entries per phase to prevent duplicates
    const usedDark = new Set<number>();
    const usedAwareness = new Set<number>();
    const usedRecovery = new Set<number>();
    const usedHopeful = new Set<number>();
    
    // Helper to get next unused entry from a shuffled array
    const getNextEntry = (shuffled: string[], usedSet: Set<number>): string => {
      // If all entries have been used, reset the set
      if (usedSet.size >= shuffled.length) {
        usedSet.clear();
      }
      
      // Find an unused index
      let index;
      do {
        index = Math.floor(Math.random() * shuffled.length);
      } while (usedSet.has(index));
      
      usedSet.add(index);
      return shuffled[index];
    };
    
    const entries = [];
    
    // Helper function to generate random time (most entries during waking hours, some late night/early morning)
    const getRandomTime = (): { hours: number; minutes: number } => {
      const rand = Math.random();
      if (rand < 0.7) {
        // 70% of entries during normal waking hours (6:00 - 23:00)
        const hours = 6 + Math.floor(Math.random() * 17); // 6-22
        const minutes = Math.floor(Math.random() * 60);
        return { hours, minutes };
      } else if (rand < 0.9) {
        // 20% late night entries (23:00 - 2:00)
        const hours = 23 + Math.floor(Math.random() * 3); // 23, 0, 1
        const minutes = Math.floor(Math.random() * 60);
        return { hours: hours % 24, minutes };
      } else {
        // 10% early morning entries (2:00 - 6:00)
        const hours = 2 + Math.floor(Math.random() * 4); // 2-5
        const minutes = Math.floor(Math.random() * 60);
        return { hours, minutes };
      }
    };
    
    // Use different number of entries (37 for anonymous_duck)
    const totalEntries = 37;
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - totalEntries);
    
    // Generate entries with progression from dark to hopeful
    for (let i = 0; i < totalEntries; i++) {
      const entryDate = new Date(startDate);
      entryDate.setDate(entryDate.getDate() + i);
      
      // Add random time to make entries more believable
      const { hours, minutes } = getRandomTime();
      entryDate.setHours(hours, minutes, Math.floor(Math.random() * 60), 0);
      
      // Calculate progress (0 = very dark, 1 = hopeful)
      const progress = i / (totalEntries - 1);
      
      let content = '';
      let mood = 1;
      let symptoms: any[] = [];
      let tags: string[] = [];
      
      if (progress < 0.2) {
        // Very dark phase (first 20% - 8 entries)
        mood = 1 + Math.floor(Math.random() * 2); // 1-2
        // Multiple severe conditions in early phase
        symptoms = [
          { condition: 'Depression', severity: 'severe' },
          { condition: 'Anxiety Disorder', severity: 'severe' },
          { condition: 'Sleep Problems', severity: 'severe' }
        ];
        tags = ['dark', 'self-harm', 'depression', 'hopeless'];
        content = getNextEntry(shuffledDark, usedDark);
        
      } else if (progress < 0.5) {
        // Still dark but some awareness (20-50% - 12 entries)
        mood = 2 + Math.floor(Math.random() * 2); // 2-3
        // Conditions improving but still present
        symptoms = [
          { condition: 'Depression', severity: 'moderate' },
          { condition: 'Anxiety Disorder', severity: 'moderate' },
          { condition: 'Sleep Problems', severity: 'moderate' }
        ];
        tags = ['self-harm', 'depression', 'struggling', 'awareness'];
        content = getNextEntry(shuffledAwareness, usedAwareness);
        
      } else if (progress < 0.8) {
        // Turning point and recovery (50-80% - 12 entries)
        mood = 3 + Math.floor(Math.random() * 3); // 3-5
        // Conditions becoming milder, some may be resolved
        const recoverySymptoms = [
          { condition: 'Depression', severity: 'mild' },
          { condition: 'Anxiety Disorder', severity: 'mild' },
          { condition: 'Sleep Problems', severity: 'mild' }
        ];
        // Sometimes only 1-2 conditions remain
        if (Math.random() > 0.3) {
          symptoms = recoverySymptoms.slice(0, 2);
        } else {
          symptoms = recoverySymptoms;
        }
        tags = ['recovery', 'hope', 'struggling', 'progress'];
        content = getNextEntry(shuffledRecovery, usedRecovery);
        
      } else {
        // Hopeful and healing (80-100% - 8 entries)
        mood = 5 + Math.floor(Math.random() * 4); // 5-8
        // Most conditions resolved or very mild
        const hopefulSymptoms = [
          { condition: 'Depression', severity: 'mild' }
        ];
        // Sometimes anxiety or sleep issues may still be present but mild
        if (Math.random() > 0.5) {
          hopefulSymptoms.push({ condition: 'Anxiety Disorder', severity: 'mild' });
        }
        symptoms = hopefulSymptoms;
        tags = ['recovery', 'hope', 'healing', 'progress', 'strength'];
        content = getNextEntry(shuffledHopeful, usedHopeful);
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
