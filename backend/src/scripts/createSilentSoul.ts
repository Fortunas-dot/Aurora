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

async function createSilentSoul() {
  try {
    console.log('💭 Creating SilentSoul user and journal...');
    
    // Connect to database
    await connectDB();
    
    // Check if user already exists
    let user = await User.findOne({ username: 'SilentSoul' });
    
    if (user) {
      console.log('  ⚠️  User SilentSoul already exists');
      // Delete existing journal entries and journal
      await JournalEntry.deleteMany({ author: user._id });
      await Journal.deleteMany({ owner: user._id });
      console.log('  ✓ Deleted existing journal entries and journal');
    } else {
      // Create user
      const hashedPassword = await bcrypt.hash('password123', 10);
      user = await User.create({
        email: 'silentsoul@example.com',
        password: hashedPassword,
        username: 'SilentSoul',
        displayName: 'Silent Soul',
        bio: 'Finding reasons to stay...',
        isAnonymous: true,
        isProtected: false,
        healthInfo: {
          mentalHealth: [
            { condition: 'Depression', severity: 'severe' },
            { condition: 'PTSD', severity: 'moderate' },
            { condition: 'Anxiety Disorder', severity: 'severe' }
          ]
        }
      });
      console.log('  ✓ Created user: SilentSoul');
    }
    
    // Create public journal
    let journal = await Journal.findOne({ owner: user._id, name: 'I don\'t want to exist anymore' });
    
    // Use the public image URL (cover image can be added later)
    const coverImageUrl = undefined; // No cover image yet
    
    if (!journal) {
      journal = await Journal.create({
        owner: user._id,
        name: 'I don\'t want to exist anymore',
        description: 'Thoughts from someone who almost gave up. These are the days I chose to stay.',
        isPublic: true,
        entriesCount: 0,
        topics: ['suicide', 'depression', 'recovery', 'mental-health'],
        coverImage: coverImageUrl,
      });
      console.log('  ✓ Created public journal: "I don\'t want to exist anymore"');
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
      `I don't want to exist anymore. The thought is constant, like a background noise that never stops. What's the point? What's the point of any of this?`,
      `I made a plan today. A real plan. I know how I would do it. I know when. The details are clear in my mind. It's almost comforting, having an exit strategy.`,
      `I wrote a note. Then I deleted it. Then I wrote it again. I don't know if I'll use it, but it's there. Just in case.`,
      `Everyone would be better off without me. I'm a burden. I'm a problem. I'm a mistake. The world doesn't need me. I don't need me.`,
      `I'm so tired. Not the kind of tired that sleep fixes. The kind that goes to your bones, your soul. I'm tired of existing. I'm tired of trying.`,
      `I researched methods today. I know which ones work. I know which ones are painless. The information is there, easy to find. Too easy.`,
      `I look at the pills in my medicine cabinet. I count them. I think about how many it would take. The math is simple. Too simple.`,
      `I don't see a future. I can't imagine tomorrow, next week, next year. There's just... nothing. An empty void where my future should be.`,
      `I'm a ghost already. I'm here, but I'm not. I go through the motions, but I'm not really living. I'm just... waiting.`,
      `The pain is too much. Every day is agony. Every breath is effort. I don't know how much longer I can do this. I don't know if I want to.`,
      `I've lost everything that mattered. My job, my relationships, my hope. There's nothing left. Nothing to fight for. Nothing to stay for.`,
      `I'm broken beyond repair. Too many pieces, too scattered. I can't put myself back together. I don't even know where to start.`,
      `I'm a failure. At everything. I've failed at life, at love, at being human. I'm just... done.`,
      `The voices in my head won't stop. They tell me I'm worthless. They tell me to end it. Sometimes I think they're right.`,
      `I'm planning my funeral in my head. Who would come? Would anyone care? Would anyone notice I'm gone? Probably not.`,
      `I don't want to die. But I don't want to live like this either. I'm stuck. Trapped. There's no way out.`,
    ];
    
    const awarenessEntries = [
      `I called a crisis line today. I hung up before they answered. But I called. That's something, right?`,
      `I told someone. My best friend. I said the words out loud. "I want to die." It was terrifying. But also... lighter.`,
      `I'm starting to see that maybe this isn't normal. Maybe wanting to die every day isn't how everyone feels. Maybe I need help.`,
      `I had a moment today. A small moment where I didn't want to die. It was brief, but it was there. That's something.`,
      `I'm scared. Scared of what I might do. Scared of the thoughts in my head. Scared that I'm losing control.`,
      `I looked at old photos today. I was happy once. I remember that person. I want to be that person again. I think I want to try.`,
      `I made an appointment with a therapist. I don't know if it will help, but I'm trying. That has to count for something.`,
      `I'm realizing I'm not alone. Other people feel this way. Other people have survived this. Maybe I can too.`,
      `I had a really bad day. The thoughts were overwhelming. But I didn't do anything. I just... waited. And the moment passed.`,
      `I'm starting to question the thoughts. Are they true? Am I really worthless? Am I really a burden? Maybe not.`,
      `I'm learning about depression. About suicidal ideation. Knowledge is power, they say. I hope so.`,
      `I told my therapist about the plan. About the note. About the thoughts. It was the hardest thing I've ever done.`,
      `I'm on medication now. It's early days, but maybe... maybe it will help. I'm willing to try.`,
      `I'm building a safety plan. Things to do when the thoughts get bad. People to call. Places to go. It's something.`,
      `I'm starting to see that the thoughts are symptoms. They're not truth. They're not me. They're the illness.`,
      `I'm fighting. Every day is a battle. Some days I lose. But I'm still here. I'm still fighting.`,
    ];
    
    const recoveryEntries = [
      `I went a whole day without thinking about suicide. A whole day. I didn't think it was possible. But I did it.`,
      `I'm in treatment now. Therapy, medication, support groups. It's hard, but I'm doing it. I'm really doing it.`,
      `I had a crisis. The thoughts came back, strong and insistent. But I used my safety plan. I called someone. I got through it.`,
      `I'm learning coping skills. When the thoughts come, I have tools. I have strategies. I'm not helpless anymore.`,
      `I look at my safety plan and I'm proud. I built this. I created this. I'm taking care of myself.`,
      `I'm finding reasons to stay. Small reasons. A good cup of coffee. A beautiful sunset. A friend's laugh. They add up.`,
      `I'm learning that I'm not broken. I'm not a failure. I'm a person with an illness. And illnesses can be treated.`,
      `I'm building a life worth living. Not a perfect life, but a life. With good days and bad days. And that's okay.`,
      `I had a setback. The thoughts came back. But I didn't act on them. I reached out. I got help. That's progress.`,
      `I'm starting to see a future. Not a perfect future, but a future. With possibilities. With hope.`,
      `I'm grateful. Grateful for the people who helped me. Grateful for treatment. Grateful that I'm still here.`,
      `I'm helping others now. Sharing my story. Offering support. It feels good to use my pain for something positive.`,
      `I'm learning that recovery isn't linear. Some days are good. Some days are hard. But I'm moving forward.`,
      `I'm proud of myself. Every day I stay is a victory. Every day I choose life is a win.`,
      `I'm finding joy again. Small moments of happiness. They're rare, but they're there. And they're growing.`,
      `I'm building connections. Real connections. With people who understand. With people who care. I'm not alone anymore.`,
    ];
    
    const hopefulEntries = [
      `It's been months since I last thought about suicide. Months. I can't believe it. The thoughts are gone. Really gone.`,
      `I look at my life now and I see possibility. I see hope. I see a future. I see reasons to stay.`,
      `I'm happy. Really happy. Not all the time, but often. And that's enough. That's more than enough.`,
      `I don't want to exist anymore... that was my past. But not my present. Not my future. I want to live. I really do.`,
      `I'm helping others who are where I was. Sharing my story. Offering hope. It feels good to give back.`,
      `I'm grateful for every day. Every breath. Every moment. I'm grateful I'm still here. I'm grateful I chose to stay.`,
      `I'm building a life I love. With purpose, with meaning, with joy. It's not perfect, but it's mine. And it's good.`,
      `I'm proof that it gets better. That the darkness doesn't last forever. That there's light on the other side.`,
      `I'm strong. Stronger than I ever knew. I fought the hardest battle of my life, and I won. I'm really winning.`,
      `I'm living. Really living. Not just existing, but living. With passion, with purpose, with hope.`,
      `I'm grateful for the crisis. For the pain. For the struggle. It made me who I am. And I like who I am.`,
      `I'm a survivor. Not a victim. A survivor. I've been through hell and I came out the other side.`,
      `I'm finding meaning in my pain. Using it to help others. Making something good out of something terrible.`,
      `I'm free. Free from the thoughts. Free from the darkness. Free to live. Free to be happy.`,
      `I don't want to exist anymore... but that was then. This is now. And now, I want to live. I really, really do.`,
      `I'm here. I'm alive. I'm fighting. I'm winning. Every day is a victory. Every day is a gift.`,
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
    
    // Use different number of entries (41 for SilentSoul)
    const totalEntries = 41;
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
          { condition: 'Depression', severity: 'severe' },
          { condition: 'PTSD', severity: 'severe' },
          { condition: 'Anxiety Disorder', severity: 'severe' }
        ];
        tags = ['suicide', 'depression', 'dark', 'hopeless'];
        content = getNextEntry(shuffledDark, usedDark);
        
      } else if (progress < 0.5) {
        // Awareness phase
        mood = 2 + Math.floor(Math.random() * 2);
        symptoms = [
          { condition: 'Depression', severity: 'moderate' },
          { condition: 'PTSD', severity: 'moderate' },
          { condition: 'Anxiety Disorder', severity: 'moderate' }
        ];
        tags = ['suicide', 'depression', 'struggling', 'awareness'];
        content = getNextEntry(shuffledAwareness, usedAwareness);
        
      } else if (progress < 0.8) {
        // Recovery phase
        mood = 3 + Math.floor(Math.random() * 3);
        const recoverySymptoms = [
          { condition: 'Depression', severity: 'mild' },
          { condition: 'PTSD', severity: 'mild' },
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
          { condition: 'Depression', severity: 'mild' }
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
    console.log('\n✅ Successfully created SilentSoul user and journal!');
    console.log(`   Username: SilentSoul`);
    console.log(`   Password: password123`);
    console.log(`   Journal: "I don't want to exist anymore" (Public)`);
    console.log(`   Entries: ${entries.length} entries showing recovery journey`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating SilentSoul:', error);
    process.exit(1);
  }
}

// Run script
createSilentSoul();
