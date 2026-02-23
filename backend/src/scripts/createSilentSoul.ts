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
    
    // Copy cover image from assets to public directory (which is committed to git)
    const publicDir = path.join(__dirname, '../../public');
    const coverImageName = 'suicide-journal-cover.jpg';
    const coverImagePath = path.join(publicDir, coverImageName);
    const sourceImagePath = path.join(__dirname, '../../../frontend/assets/suicide.jpg');
    
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
    const coverImageUrl = '/public/suicide-journal-cover.jpg';
    
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
      console.log('  ✓ Added cover image (suicide.jpg from assets)');
    } else {
      // Update existing journal with cover image
      journal.coverImage = coverImageUrl;
      await journal.save();
      console.log('  ✓ Updated journal with cover image (suicide.jpg from assets)');
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
      `Don't want to exist anymore. The thought is constant. Background noise that never stops. What's the point?`,
      `Made a plan today. A real plan. I know how. I know when. The details are clear. It's almost comforting. Having an exit strategy.`,
      `Wrote a note. Deleted it. Wrote it again. Don't know if I'll use it. But it's there. Just in case.`,
      `Everyone would be better off without me. I'm a burden. A problem. A mistake. The world doesn't need me. I don't need me.`,
      `So tired. Not the kind sleep fixes. The kind that goes to your bones. Your soul. Tired of existing. Tired of trying.`,
      `Researched methods today. I know which ones work. Which ones are painless. The information is there. Easy to find. Too easy.`,
      `Look at the pills. Count them. Think about how many it would take. The math is simple. Too simple.`,
      `Don't see a future. Can't imagine tomorrow. Next week. Next year. Just... nothing. An empty void.`,
      `I'm a ghost already. Here, but not. Go through the motions. Not really living. Just... waiting.`,
      `The pain is too much. Every day is agony. Every breath is effort. Don't know how much longer. Don't know if I want to.`,
      `Lost everything that mattered. My job. My relationships. My hope. Nothing left. Nothing to fight for. Nothing to stay for.`,
      `Broken beyond repair. Too many pieces. Too scattered. Can't put myself back together. Don't even know where to start.`,
      `I'm a failure. At everything. Failed at life. At love. At being human. Just... done.`,
      `The voices won't stop. Tell me I'm worthless. Tell me to end it. Sometimes I think they're right.`,
      `Planning my funeral in my head. Who would come? Would anyone care? Would anyone notice? Probably not.`,
      `Don't want to die. But don't want to live like this either. Stuck. Trapped. No way out.`,
      `Called in sick again. Can't get out of bed. What's the point?`,
      `My friend texted. Asked if I'm okay. I said yes. Lied. Again.`,
      `Looked at old photos. I was happy once. I think. Hard to remember.`,
      `The pills are right there. In the cabinet. I know how many.`,
    ];
    
    const awarenessEntries = [
      `Called a crisis line today. Hung up before they answered. But I called. That's something, right?`,
      `Told someone. My best friend. Said the words out loud. "I want to die." Terrifying. But also... lighter.`,
      `Starting to see that maybe this isn't normal. Maybe wanting to die every day isn't how everyone feels. Maybe I need help.`,
      `Had a moment today. A small moment where I didn't want to die. Brief, but it was there. That's something.`,
      `I'm scared. Scared of what I might do. Scared of the thoughts. Scared that I'm losing control.`,
      `Looked at old photos today. I was happy once. Remember that person. Want to be that person again. I think I want to try.`,
      `Made an appointment with a therapist. Don't know if it will help. But I'm trying. That has to count.`,
      `Realizing I'm not alone. Other people feel this way. Other people have survived this. Maybe I can too.`,
      `Really bad day. The thoughts were overwhelming. But I didn't do anything. Just... waited. And the moment passed.`,
      `Starting to question the thoughts. Are they true? Am I really worthless? Am I really a burden? Maybe not.`,
      `Learning about depression. About suicidal ideation. Knowledge is power, they say. I hope so.`,
      `Told my therapist about the plan. About the note. About the thoughts. Hardest thing I've ever done.`,
      `On medication now. Early days. But maybe... maybe it will help. I'm willing to try.`,
      `Building a safety plan. Things to do when the thoughts get bad. People to call. Places to go. It's something.`,
      `Starting to see that the thoughts are symptoms. Not truth. Not me. They're the illness.`,
      `I'm fighting. Every day is a battle. Some days I lose. But I'm still here. Still fighting.`,
      `My mom called. Asked if I'm okay. I almost told her. Almost. But I couldn't. Not yet.`,
      `Watched a movie today. Forgot about the thoughts for two hours. That was nice.`,
      `My therapist asked me to promise. Promise I won't hurt myself. I promised. It felt... important.`,
      `Found an old journal. From when I was happy. I want that back. I think I want that back.`,
    ];
    
    const recoveryEntries = [
      `Went a whole day without thinking about suicide. A whole day. Didn't think it was possible. But I did it.`,
      `In treatment now. Therapy. Medication. Support groups. It's hard. But I'm doing it. Really doing it.`,
      `Had a crisis. The thoughts came back. Strong. Insistent. But I used my safety plan. Called someone. Got through it.`,
      `Learning coping skills. When the thoughts come, I have tools. Have strategies. Not helpless anymore.`,
      `Look at my safety plan. I'm proud. I built this. Created this. Taking care of myself.`,
      `Finding reasons to stay. Small reasons. A good cup of coffee. A beautiful sunset. A friend's laugh. They add up.`,
      `Learning that I'm not broken. Not a failure. I'm a person with an illness. And illnesses can be treated.`,
      `Building a life worth living. Not a perfect life. But a life. With good days and bad days. And that's okay.`,
      `Had a setback. The thoughts came back. But I didn't act on them. Reached out. Got help. That's progress.`,
      `Starting to see a future. Not a perfect future. But a future. With possibilities. With hope.`,
      `Grateful. Grateful for the people who helped me. Grateful for treatment. Grateful that I'm still here.`,
      `Helping others now. Sharing my story. Offering support. Feels good to use my pain for something positive.`,
      `Learning that recovery isn't linear. Some days are good. Some days are hard. But I'm moving forward.`,
      `Proud of myself. Every day I stay is a victory. Every day I choose life is a win.`,
      `Finding joy again. Small moments of happiness. They're rare. But they're there. And they're growing.`,
      `Building connections. Real connections. With people who understand. With people who care. I'm not alone anymore.`,
      `Went to a support group today. Met someone who's been where I am. They made it. Maybe I can too.`,
      `Had a panic attack. Old me would have... well. New me called my therapist. Did breathing exercises. Got through it.`,
      `Made plans for next week. Real plans. With friends. I'm looking forward to them. That's new.`,
      `The medication is helping. I think. The thoughts are quieter. Less insistent. That's something.`,
    ];
    
    const hopefulEntries = [
      `Months since I last thought about suicide. Months. Can't believe it. The thoughts are gone. Really gone.`,
      `Look at my life now. See possibility. See hope. See a future. See reasons to stay.`,
      `I'm happy. Really happy. Not all the time. But often. And that's enough. That's more than enough.`,
      `I don't want to exist anymore... that was my past. Not my present. Not my future. I want to live. I really do.`,
      `Helping others who are where I was. Sharing my story. Offering hope. Feels good to give back.`,
      `Grateful for every day. Every breath. Every moment. Grateful I'm still here. Grateful I chose to stay.`,
      `Building a life I love. With purpose. With meaning. With joy. It's not perfect. But it's mine. And it's good.`,
      `I'm proof that it gets better. That the darkness doesn't last forever. That there's light on the other side.`,
      `I'm strong. Stronger than I ever knew. Fought the hardest battle of my life. And I won. Really winning.`,
      `I'm living. Really living. Not just existing. But living. With passion. With purpose. With hope.`,
      `Grateful for the crisis. For the pain. For the struggle. It made me who I am. And I like who I am.`,
      `I'm a survivor. Not a victim. A survivor. Been through hell. Came out the other side.`,
      `Finding meaning in my pain. Using it to help others. Making something good out of something terrible.`,
      `I'm free. Free from the thoughts. Free from the darkness. Free to live. Free to be happy.`,
      `I don't want to exist anymore... but that was then. This is now. And now, I want to live. I really, really do.`,
      `I'm here. I'm alive. I'm fighting. I'm winning. Every day is a victory. Every day is a gift.`,
      `Started a new job today. I'm excited. Nervous. But excited. I have a future. I really have a future.`,
      `Went on a date. First one in years. It was nice. I'm learning to live again.`,
      `My friend said I seem happier. I am. I really am.`,
      `One year since my last crisis. One year. I never thought I'd make it. But here I am.`,
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
