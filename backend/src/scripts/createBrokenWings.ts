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
    
    // Use the public image URL (cover image can be added later)
    const coverImageUrl = undefined; // No cover image yet
    
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
    } else {
      await journal.save();
      console.log('  ✓ Updated journal');
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
    
    // Define all entries for each phase
    const darkEntries = [
      `I can't sleep. Every time I close my eyes, I see it. I hear it. I feel it. The night that changed everything. It's always there, waiting.`,
      `I had a flashback today. Full body, full sensory. I was back there. In that moment. I could smell it, taste it, feel it. I thought I was going to die.`,
      `I'm hypervigilant all the time. Every sound makes me jump. Every shadow makes me freeze. I can't relax. I can't feel safe. I never feel safe.`,
      `I avoid everything. Places, people, situations. Anything that might trigger me. My world is getting smaller and smaller. Soon there will be nothing left.`,
      `I can't remember what happened. Not all of it. My mind has blocked it out. But my body remembers. My body always remembers.`,
      `I have nightmares every night. The same one, over and over. I wake up screaming, covered in sweat. I'm afraid to go back to sleep.`,
      `I feel disconnected. From my body, from my emotions, from reality. Like I'm watching my life from outside. Like I'm not really here.`,
      `I'm angry all the time. Rage that comes from nowhere. I snap at people. I break things. I don't recognize myself.`,
      `I blame myself. I should have done something. I should have fought back. I should have been stronger. It's my fault. All my fault.`,
      `I can't trust anyone. Not really. Everyone is a threat. Everyone could hurt me. I'm alone. I'm always alone.`,
      `I'm numb. I can't feel anything. Not happiness, not sadness, not anything. Just... empty. A void where my emotions should be.`,
      `I have panic attacks. Out of nowhere. My heart races, I can't breathe, I think I'm dying. The fear is overwhelming.`,
      `I'm stuck. Stuck in that moment. That night. I can't move forward. I can't move back. I'm just... stuck.`,
      `I feel broken. Beyond repair. Too many pieces, too scattered. I don't know how to put myself back together.`,
      `I'm scared. All the time. Scared of everything. Scared of nothing. Just scared. Constant, overwhelming fear.`,
      `I don't know who I am anymore. The person I was before is gone. The person I am now is a stranger. I'm lost.`,
    ];
    
    const awarenessEntries = [
      `I'm starting to understand what happened to me. It has a name. PTSD. Post-traumatic stress disorder. It's not my fault. It's an injury.`,
      `I told someone. My therapist. I said the words out loud. I described what happened. It was terrifying. But also... freeing.`,
      `I'm learning about trauma. About how it affects the brain. About how it's not weakness, it's a response. Knowledge is power.`,
      `I had a trigger today. A sound, a smell, something. I panicked. But I used my grounding techniques. I got through it. That's progress.`,
      `I'm starting to see patterns. What triggers me. When I'm most vulnerable. Understanding is the first step to healing.`,
      `I'm in therapy now. EMDR, trauma therapy. It's hard. So hard. But I'm doing it. I'm really doing it.`,
      `I'm learning that it's not my fault. I didn't ask for this. I didn't deserve this. It's not my fault.`,
      `I'm building a safety plan. Things to do when I'm triggered. People to call. Places to go. It's something.`,
      `I'm starting to feel again. Not all the time, but sometimes. Real emotions. Not just numbness. That's something.`,
      `I'm learning to ground myself. To stay in the present. To remind myself I'm safe now. It's not always easy, but I'm trying.`,
      `I had a good day. A really good day. No flashbacks, no panic attacks, no nightmares. Just... a normal day. I'd forgotten what that felt like.`,
      `I'm starting to trust again. Slowly. Carefully. One person at a time. It's scary, but I'm trying.`,
      `I'm processing the trauma. Talking about it. Writing about it. Feeling it. It's painful, but it's necessary.`,
      `I'm learning that I'm not broken. I'm injured. And injuries can heal. It takes time, but they can heal.`,
      `I'm building connections. With people who understand. With people who care. I'm not alone anymore.`,
      `I'm fighting. Every day is a battle. Some days I lose. But I'm still here. I'm still fighting.`,
    ];
    
    const recoveryEntries = [
      `I went a whole week without a flashback. A whole week. I didn't think it was possible. But I did it.`,
      `I'm sleeping better. Not every night, but most nights. The nightmares are less frequent. Less intense. That's progress.`,
      `I'm learning to manage my triggers. I can't avoid everything, but I can cope. I have tools. I have strategies.`,
      `I'm processing the trauma. Really processing it. It's painful, but I'm doing it. I'm facing it.`,
      `I'm building a life again. Not the life I had before, but a new life. A better life. With purpose, with meaning.`,
      `I'm finding joy again. Small moments of happiness. They're rare, but they're there. And they're growing.`,
      `I'm helping others. Sharing my story. Offering support. It feels good to use my pain for something positive.`,
      `I'm learning to trust my body again. To feel safe in my own skin. It's a process, but I'm getting there.`,
      `I'm building healthy relationships. With boundaries, with respect, with care. I'm learning what that looks like.`,
      `I'm finding meaning in my pain. Using it to help others. Making something good out of something terrible.`,
      `I'm grateful. Grateful for therapy. Grateful for support. Grateful that I'm healing.`,
      `I'm proud of myself. Every day I get through is a victory. Every trigger I manage is a win.`,
      `I'm learning that recovery isn't linear. Some days are good. Some days are hard. But I'm moving forward.`,
      `I'm starting to see a future. Not defined by the trauma, but informed by it. A future with hope.`,
      `I'm building resilience. I'm getting stronger. The trauma doesn't define me anymore. I define me.`,
      `I'm healing. Slowly, but surely. The wounds are closing. The scars are fading. I'm healing.`,
    ];
    
    const hopefulEntries = [
      `It's been months since my last flashback. Months. I can't believe it. The trauma is losing its power over me.`,
      `I sleep through the night now. Most nights. The nightmares are rare. When they come, I can handle them.`,
      `I feel safe. Really safe. In my body, in my mind, in my life. I never thought that was possible.`,
      `I'm living again. Really living. Not just surviving, but living. With joy, with purpose, with hope.`,
      `I'm helping others who are where I was. Sharing my story. Offering hope. It feels good to give back.`,
      `I'm grateful for the journey. For the pain, for the struggle, for the healing. It made me who I am.`,
      `I'm strong. Stronger than I ever knew. I've been through hell and I came out the other side.`,
      `I'm free. Free from the flashbacks. Free from the fear. Free to live. Free to be happy.`,
      `I'm building a life I love. With purpose, with meaning, with joy. It's not perfect, but it's mine.`,
      `I'm proof that healing is possible. That trauma doesn't have to define you. That there's life after pain.`,
      `I'm a survivor. Not a victim. A survivor. I've been through hell and I came out stronger.`,
      `I'm finding peace. Real peace. Not the absence of pain, but peace with the pain. It's part of my story, but not all of it.`,
      `I'm living in the present. Not stuck in the past. Not afraid of the future. Just... present.`,
      `I'm whole again. Not the same as before, but whole. The pieces have come back together. Different, but whole.`,
      `The night that changed everything... it did change everything. But not all for the worse. I'm stronger now. I'm wiser. I'm more.`,
      `I'm here. I'm alive. I'm healing. I'm thriving. The trauma is part of my story, but it's not the whole story.`,
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
