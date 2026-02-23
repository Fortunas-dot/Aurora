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
        description: 'Raw thoughts from someone learning to cope without the blade. This is my truth, my struggle, my path forward.',
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
    
    // Define all entries for each phase with realistic variety in length and style
    const darkEntries = [
      `Did it again. Can't stop.`,
      `The blade. It's the only thing that makes me feel real. Everything else is just... numb. I don't know when this started. Maybe last year? Time doesn't make sense anymore.`,
      `Cut deeper today. The pain cuts through the fog. I'm running out of places to hide the scars. Long sleeves in summer. People ask why. I lie.`,
      `I'm worthless. The voices won't stop. Maybe they're right. The blade understands. It's my only friend.`,
      `Looked at my arms. A map of pain. Each line is a moment I couldn't handle. Today was worse. How much longer?`,
      `Everything is gray. Except the blood. That's the only color I see. I need to feel something. Anything. Even if it's just pain.`,
      `I'm drowning. Every day I cut. Hoping this time it'll be enough. It never is. The emptiness grows.`,
      `My secret. My shame. My only release. I hate myself for needing it. But what else can I do? Where does the pain go?`,
      `I'm a monster. The mirror shows someone I don't know. The cuts are punishment. Making the outside match the inside.`,
      `Wake up. Feel nothing. Cut. Feel something. Then nothing again. The cycle. I can't break it.`,
      `Long sleeves. Even when it's hot. The shame is constant. I know it's wrong. But I can't stop. Don't want to stop.`,
      `The pain makes sense. Everything else is chaos. When I cut, for a moment, it's clear. Then the fog.`,
      `Lost count. The scars overlap. A web of pain. Each one is a moment I couldn't handle.`,
      `Tonight was bad. Really bad. Cut deeper. I'm scared. But also relieved. The emotional pain is gone. Replaced by something I can control.`,
      `Don't remember when this started. Feels like always. The blade is part of me now.`,
      `Tried to stop today. Really tried. Lasted three hours. Three hours of fighting myself. Still lost.`,
      `The blood drips. I watch it. Almost beautiful. The way it flows. It's the only thing that feels real.`,
      `Can't sleep. The urge is too strong. I need it. I need the release. Just one more time.`,
      `My mom asked about my arms. I lied. Said I fell. She believed me. Or pretended to. The guilt is crushing.`,
      `Found an old photo. Before all this. I was happy. I think. Hard to remember. That person is gone.`,
    ];
    
    const awarenessEntries = [
      `Cut again today. But something felt different. Looked at the scars. Is this really helping? The relief is so temporary. Then the shame.`,
      `Tried not to cut. Lasted until 3pm. That's progress, right? Still gave in. The urge was too strong. I'm weak.`,
      `Therapist asked me to try one day without cutting. Couldn't do it. Feel like a failure. But at least I'm thinking about it now. Questioning it.`,
      `Cut less today. Only twice. Usually it's five or six times. It's something. Trying to understand why. What am I really trying to escape?`,
      `The urges are still there. Constant. Overwhelming. But I'm starting to see patterns. I cut when I feel overwhelmed. When I can't process emotions. Maybe there's another way?`,
      `I'm scared. Scared of stopping. Scared of continuing. This has become my identity. Who am I without it? But I'm also tired. So tired.`,
      `Wrote in my journal instead of cutting. Didn't work as well. But it was something. I'm trying. That has to count.`,
      `The shame. It's eating me alive. I hide my arms. My legs. My pain. But maybe... maybe I don't have to do this alone?`,
      `Panic attack today. The urge to cut was overwhelming. But I called a crisis line instead. I didn't cut. First time in months.`,
      `Noticing the triggers now. Stress. Rejection. Feeling worthless. Every time I feel these things, the blade calls. But I'm learning to recognize it. Before I act.`,
      `Therapist says I'm making progress. I don't see it. But they seem to. Maybe I need to trust them. Trust myself.`,
      `Cut today. But I stopped after one cut. Usually I can't stop. This feels different. Maybe I have some control?`,
      `Reading about self-harm now. Understanding why people do it. What it does to the brain. Knowledge is power, they say. I hope so.`,
      `Told my best friend. About the cutting. They didn't judge. Just listened. For the first time in forever, I didn't feel alone.`,
      `Keeping track now. Marking the days I don't cut. It's not many. But it's more than zero. That has to mean something.`,
      `The urges come in waves. Sometimes I can ride them out. Other times I can't. But I'm learning. I'm trying. That's all I can do.`,
      `Had a really bad day at work. Boss yelled at me. The urge was so strong. But I didn't cut. I went for a walk instead. It helped. A little.`,
      `Saw a scar today. An old one. It's fading. I touched it. Remembered that day. The pain. But also... I survived it.`,
      `My roommate noticed. Asked if I'm okay. I said yes. But maybe... maybe I should tell them?`,
      `Watched a video about recovery. Someone talking about their journey. They made it. Maybe I can too?`,
    ];
    
    const recoveryEntries = [
      `Three days. THREE DAYS without cutting. Didn't think I could do it. The urges are still there. But I'm learning to sit with them. Breathe through them.`,
      `Told someone. My therapist. Hardest thing I've ever done. But I did it. They didn't judge. They helped me understand.`,
      `Learning new coping skills. When the urge comes, I try to distract myself. Feel the emotion without acting. It's hard. But it's working sometimes.`,
      `Cut today. But it was different. Stopped after one cut. Didn't go deeper. Called my therapist. Reached out. That's progress.`,
      `The scars are healing. Some are fading. Starting to see them differently. Not just marks of shame. Reminders of how far I've come.`,
      `Finding other ways to feel. Music. Art. Writing. Even just crying. The pain doesn't have to come from a blade. Emotions won't kill me.`,
      `Really bad day. Everything went wrong. The urge was overwhelming. But I didn't cut. Called a friend instead. I'm proud.`,
      `Therapist says I'm making progress. I don't always see it. But I'm trying to trust the process. Recovery isn't linear. That's okay.`,
      `One week. A full week without cutting. Can't believe it. The urges are still there. But quieter now. Learning to ignore them.`,
      `Relapsed today. Cut after five days clean. Disappointed. But not giving up. Recovery isn't about perfection. It's about getting back up.`,
      `Using my coping skills more now. When the urge comes, I do breathing exercises. Call someone. Write. It's not perfect. But it's working.`,
      `Look at my scars differently now. Not just marks of pain. Also marks of survival. I'm still here. Still fighting.`,
      `Joined a support group. Hearing other people's stories. Knowing I'm not alone. It helps. We're all fighting the same battle.`,
      `Had a setback. But didn't let it destroy me. I cut. But I also reached out for help. That's different. That's progress.`,
      `Learning to be kind to myself. When I cut, I don't hate myself as much. I understand I'm in pain. I'm trying to cope. That's okay.`,
      `The urges are getting weaker. They still come. But I'm stronger now. I have tools. I have support. I have hope.`,
      `Wore short sleeves today. For the first time in months. People might see. But I'm trying not to care. The scars are part of me.`,
      `Had a fight with my mom. Old me would have cut immediately. New me... I went for a run instead. It helped. A little.`,
      `Bought a sketchbook. Drawing when the urge comes. It's not the same. But it's something. Something different.`,
      `Two weeks clean. Two weeks. I never thought I'd make it this far. The urges are still there. But I'm stronger than them now.`,
    ];
    
    const hopefulEntries = [
      `Two weeks since I last cut. Two weeks! Never thought I could do this. The urges still come. But weaker now. I'm stronger.`,
      `Look at my arms. See healing. The scars are fading. So is the shame. Learning to love myself. Be gentle with myself. It's a process.`,
      `Finding joy in small things again. A good cup of coffee. A beautiful sunset. A friend's laugh. Remembering what it feels like to be alive. Without pain.`,
      `I cut myself everyday... that used to be my reality. Not anymore. I'm choosing different. Choosing life. Choosing me.`,
      `Learning that I'm not broken. Not a monster. I'm a person who was in pain. Found a way to cope. Now I'm finding better ways.`,
      `The urges are rare now. When they come, I know what to do. I have tools. I have support. I have hope. I'm not alone anymore.`,
      `I'm proud of myself. Every day I don't cut is a victory. Every day I choose myself is a win. Building a life worth living.`,
      `I cut myself everyday... but that was then. This is now. I'm healing. Growing. Becoming someone I can be proud of. The journey isn't over. But I'm on the right path.`,
      `Three weeks clean. Can't believe it. The person I was a month ago wouldn't recognize me now. I'm different. Better. Healing.`,
      `Really tough day today. The old urges came back. Strong. Insistent. But I didn't cut. Used my skills. Reached out. Got through it. So proud.`,
      `Starting to see my scars as part of my story. Not my identity. They show where I've been. But they don't define where I'm going.`,
      `Helping others now. Sharing my story. Offering support. Feels good to use my pain for something positive. Help others who are where I was.`,
      `Learning to feel emotions again. Real emotions. Not just numbness or pain. It's scary. But also beautiful. I'm alive. Really alive.`,
      `One month. A full month without cutting. Never thought this was possible. But here I am. I did it. I'm doing it.`,
      `Not perfect. Still have bad days. But I'm not cutting. Using healthy coping skills. Reaching out. Growing. That's enough.`,
      `Look in the mirror. See someone I recognize. Someone I'm starting to like. The journey isn't over. But I'm on the right path. I'm healing.`,
      `Went to the beach today. Wore a tank top. People might have seen my scars. But I didn't care. They're part of me. Part of my story.`,
      `Helped someone online today. They were struggling. I shared my story. They said it helped. That felt good. Really good.`,
      `Had a panic attack. Old me would have cut. New me... I called my therapist. Did breathing exercises. Got through it. Without cutting. I'm so proud.`,
      `One month and five days. Every day is a record. Every day is a victory. I'm doing this. I'm really doing this.`,
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
