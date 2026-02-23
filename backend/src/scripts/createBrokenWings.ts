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
    
    // Helper function to shuffle array
    const shuffle = <T>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };
    
    // Define all entries for each phase with realistic variety
    const darkEntries = [
      `Can't sleep. Every time I close my eyes, I see it. Hear it. Feel it. The night that changed everything. Always there. Waiting.`,
      `Had a flashback today. Full body. Full sensory. I was back there. In that moment. Could smell it. Taste it. Feel it. Thought I was going to die.`,
      `Hypervigilant all the time. Every sound makes me jump. Every shadow makes me freeze. Can't relax. Can't feel safe. Never feel safe.`,
      `Avoid everything. Places. People. Situations. Anything that might trigger me. My world is getting smaller. Soon there will be nothing left.`,
      `Can't remember what happened. Not all of it. My mind has blocked it out. But my body remembers. My body always remembers.`,
      `Nightmares every night. The same one. Over and over. Wake up screaming. Covered in sweat. Afraid to go back to sleep.`,
      `Feel disconnected. From my body. From my emotions. From reality. Like I'm watching my life from outside. Like I'm not really here.`,
      `Angry all the time. Rage that comes from nowhere. Snap at people. Break things. Don't recognize myself.`,
      `Blame myself. Should have done something. Should have fought back. Should have been stronger. It's my fault. All my fault.`,
      `Can't trust anyone. Not really. Everyone is a threat. Everyone could hurt me. I'm alone. Always alone.`,
      `I'm numb. Can't feel anything. Not happiness. Not sadness. Not anything. Just... empty. A void.`,
      `Panic attacks. Out of nowhere. My heart races. Can't breathe. Think I'm dying. The fear is overwhelming.`,
      `Stuck. Stuck in that moment. That night. Can't move forward. Can't move back. Just... stuck.`,
      `Feel broken. Beyond repair. Too many pieces. Too scattered. Don't know how to put myself back together.`,
      `Scared. All the time. Scared of everything. Scared of nothing. Just scared. Constant. Overwhelming fear.`,
      `Don't know who I am anymore. The person I was before is gone. The person I am now is a stranger. I'm lost.`,
      `Saw something on TV. A scene. Similar to... that night. Had to turn it off. Couldn't breathe.`,
      `My friend hugged me. I flinched. They looked hurt. I'm sorry. But I can't help it.`,
      `Drove past that place today. The place where... I had to pull over. Vomited.`,
      `Can't wear that perfume anymore. The one I wore that night. The smell triggers me. Everything triggers me.`,
    ];
    
    const awarenessEntries = [
      `Starting to understand what happened to me. It has a name. PTSD. Post-traumatic stress disorder. It's not my fault. It's an injury.`,
      `Told someone. My therapist. Said the words out loud. Described what happened. Terrifying. But also... freeing.`,
      `Learning about trauma. About how it affects the brain. About how it's not weakness. It's a response. Knowledge is power.`,
      `Had a trigger today. A sound. A smell. Something. Panicked. But I used my grounding techniques. Got through it. That's progress.`,
      `Starting to see patterns. What triggers me. When I'm most vulnerable. Understanding is the first step to healing.`,
      `In therapy now. EMDR. Trauma therapy. It's hard. So hard. But I'm doing it. Really doing it.`,
      `Learning that it's not my fault. I didn't ask for this. Didn't deserve this. It's not my fault.`,
      `Building a safety plan. Things to do when I'm triggered. People to call. Places to go. It's something.`,
      `Starting to feel again. Not all the time. But sometimes. Real emotions. Not just numbness. That's something.`,
      `Learning to ground myself. To stay in the present. To remind myself I'm safe now. Not always easy. But I'm trying.`,
      `Had a good day. A really good day. No flashbacks. No panic attacks. No nightmares. Just... a normal day. I'd forgotten what that felt like.`,
      `Starting to trust again. Slowly. Carefully. One person at a time. It's scary. But I'm trying.`,
      `Processing the trauma. Talking about it. Writing about it. Feeling it. It's painful. But it's necessary.`,
      `Learning that I'm not broken. I'm injured. And injuries can heal. It takes time. But they can heal.`,
      `Building connections. With people who understand. With people who care. I'm not alone anymore.`,
      `I'm fighting. Every day is a battle. Some days I lose. But I'm still here. Still fighting.`,
      `Went to a support group. Met others who've been through similar things. I'm not alone. That helps.`,
      `My therapist asked me to write about it. I did. It was hard. But it helped. A little.`,
      `Had a flashback. But this time I used my grounding techniques. Got through it. Without panicking. That's new.`,
      `Slept through the night. No nightmares. First time in months. I'm hopeful.`,
    ];
    
    const recoveryEntries = [
      `Went a whole week without a flashback. A whole week. Didn't think it was possible. But I did it.`,
      `Sleeping better. Not every night. But most nights. The nightmares are less frequent. Less intense. That's progress.`,
      `Learning to manage my triggers. Can't avoid everything. But I can cope. I have tools. Have strategies.`,
      `Processing the trauma. Really processing it. It's painful. But I'm doing it. I'm facing it.`,
      `Building a life again. Not the life I had before. But a new life. A better life. With purpose. With meaning.`,
      `Finding joy again. Small moments of happiness. They're rare. But they're there. And they're growing.`,
      `Helping others. Sharing my story. Offering support. Feels good to use my pain for something positive.`,
      `Learning to trust my body again. To feel safe in my own skin. It's a process. But I'm getting there.`,
      `Building healthy relationships. With boundaries. With respect. With care. Learning what that looks like.`,
      `Finding meaning in my pain. Using it to help others. Making something good out of something terrible.`,
      `Grateful. Grateful for therapy. Grateful for support. Grateful that I'm healing.`,
      `Proud of myself. Every day I get through is a victory. Every trigger I manage is a win.`,
      `Learning that recovery isn't linear. Some days are good. Some days are hard. But I'm moving forward.`,
      `Starting to see a future. Not defined by the trauma. But informed by it. A future with hope.`,
      `Building resilience. Getting stronger. The trauma doesn't define me anymore. I define me.`,
      `Healing. Slowly, but surely. The wounds are closing. The scars are fading. I'm healing.`,
      `Went to that place today. The place where... I didn't have a flashback. I was okay. That's huge.`,
      `Let someone hug me today. Without flinching. That's progress. Real progress.`,
      `Had a nightmare. But I used my grounding techniques. Got through it. Didn't panic. I'm getting stronger.`,
      `Started dating again. It's scary. But I'm trying. I deserve to be happy.`,
    ];
    
    const hopefulEntries = [
      `Months since my last flashback. Months. Can't believe it. The trauma is losing its power over me.`,
      `Sleep through the night now. Most nights. The nightmares are rare. When they come, I can handle them.`,
      `Feel safe. Really safe. In my body. In my mind. In my life. Never thought that was possible.`,
      `Living again. Really living. Not just surviving. But living. With joy. With purpose. With hope.`,
      `Helping others who are where I was. Sharing my story. Offering hope. Feels good to give back.`,
      `Grateful for the journey. For the pain. For the struggle. For the healing. It made me who I am.`,
      `I'm strong. Stronger than I ever knew. Been through hell. Came out the other side.`,
      `I'm free. Free from the flashbacks. Free from the fear. Free to live. Free to be happy.`,
      `Building a life I love. With purpose. With meaning. With joy. It's not perfect. But it's mine.`,
      `Proof that healing is possible. That trauma doesn't have to define you. That there's life after pain.`,
      `I'm a survivor. Not a victim. A survivor. Been through hell. Came out stronger.`,
      `Finding peace. Real peace. Not the absence of pain. But peace with the pain. It's part of my story. But not all of it.`,
      `Living in the present. Not stuck in the past. Not afraid of the future. Just... present.`,
      `Whole again. Not the same as before. But whole. The pieces have come back together. Different, but whole.`,
      `The night that changed everything... it did change everything. But not all for the worse. I'm stronger now. Wiser. More.`,
      `I'm here. I'm alive. I'm healing. I'm thriving. The trauma is part of my story. But it's not the whole story.`,
      `Got a new job. One I actually like. I'm moving forward. Building a future.`,
      `In a relationship now. A healthy one. With someone who understands. Who cares. I'm happy. Really happy.`,
      `Went back to that place. The place where... I was okay. More than okay. I was strong.`,
      `One year since I started therapy. One year. I'm a different person. A better person. I'm healing.`,
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
    
    // Use different number of entries (39 for BrokenWings)
    const totalEntries = 39;
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - totalEntries);
    
    // Generate entries with progression from dark to hopeful
    for (let i = 0; i < totalEntries; i++) {
      const entryDate = new Date(startDate);
      entryDate.setDate(entryDate.getDate() + i);
      
      // Add random time
      const { hours, minutes } = getRandomTime();
      entryDate.setHours(hours, minutes, Math.floor(Math.random() * 60), 0);
      
      // Calculate progress (0 = very dark, 1 = hopeful)
      const progress = i / (totalEntries - 1);
      
      let content = '';
      let mood = 1;
      let symptoms: any[] = [];
      let tags: string[] = [];
      
      if (progress < 0.2) {
        // Very dark phase
        mood = 1 + Math.floor(Math.random() * 2);
        symptoms = [
          { condition: 'PTSD', type: 'Complex PTSD', severity: 'severe' },
          { condition: 'Depression', severity: 'severe' },
          { condition: 'Anxiety Disorder', severity: 'severe' }
        ];
        tags = ['ptsd', 'trauma', 'dark', 'hopeless'];
        content = getNextEntry(shuffledDark, usedDark);
        
      } else if (progress < 0.5) {
        // Awareness phase
        mood = 2 + Math.floor(Math.random() * 2);
        symptoms = [
          { condition: 'PTSD', type: 'Complex PTSD', severity: 'moderate' },
          { condition: 'Depression', severity: 'moderate' },
          { condition: 'Anxiety Disorder', severity: 'moderate' }
        ];
        tags = ['ptsd', 'trauma', 'struggling', 'awareness'];
        content = getNextEntry(shuffledAwareness, usedAwareness);
        
      } else if (progress < 0.8) {
        // Recovery phase
        mood = 3 + Math.floor(Math.random() * 3);
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
        content = getNextEntry(shuffledRecovery, usedRecovery);
        
      } else {
        // Hopeful phase
        mood = 5 + Math.floor(Math.random() * 4);
        const hopefulSymptoms = [
          { condition: 'PTSD', type: 'Complex PTSD', severity: 'mild' }
        ];
        if (Math.random() > 0.5) {
          hopefulSymptoms.push({ condition: 'Anxiety Disorder', severity: 'mild' } as any);
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
