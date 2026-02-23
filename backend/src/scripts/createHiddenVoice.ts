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

async function createHiddenVoice() {
  try {
    console.log('🔇 Creating HiddenVoice user and journal...');
    
    // Connect to database
    await connectDB();
    
    // Check if user already exists
    let user = await User.findOne({ username: 'HiddenVoice' });
    
    if (user) {
      console.log('  ⚠️  User HiddenVoice already exists');
      // Delete existing journal entries and journal
      await JournalEntry.deleteMany({ author: user._id });
      await Journal.deleteMany({ owner: user._id });
      console.log('  ✓ Deleted existing journal entries and journal');
    } else {
      // Create user
      const hashedPassword = await bcrypt.hash('password123', 10);
      user = await User.create({
        email: 'hiddenvoice@example.com',
        password: hashedPassword,
        username: 'HiddenVoice',
        displayName: 'Hidden Voice',
        bio: 'Finding my voice, one word at a time...',
        isAnonymous: true,
        isProtected: false,
        healthInfo: {
          mentalHealth: [
            { condition: 'PTSD', type: 'Complex PTSD', severity: 'severe' },
            { condition: 'Depression', severity: 'severe' },
            { condition: 'Anxiety Disorder', severity: 'severe' }
          ]
        }
      });
      console.log('  ✓ Created user: HiddenVoice');
    }
    
    // Create public journal
    let journal = await Journal.findOne({ owner: user._id, name: 'My uncle touches me' });
    
    // Copy cover image from assets to public directory (which is committed to git)
    const publicDir = path.join(__dirname, '../../public');
    const coverImageName = 'touch-journal-cover.jpg';
    const coverImagePath = path.join(publicDir, coverImageName);
    const sourceImagePath = path.join(__dirname, '../../../frontend/assets/touch.jpg');
    
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
    const coverImageUrl = '/public/touch-journal-cover.jpg';
    
    if (!journal) {
      journal = await Journal.create({
        owner: user._id,
        name: 'My uncle touches me',
        description: 'A child\'s voice breaking the silence. This is my truth, my pain, my path to healing.',
        isPublic: true,
        entriesCount: 0,
        topics: ['sexual-abuse', 'trauma', 'recovery', 'mental-health', 'survivor'],
        coverImage: coverImageUrl,
      });
      console.log('  ✓ Created public journal: "My uncle touches me"');
      console.log('  ✓ Added cover image (touch.jpg from assets)');
    } else {
      // Update existing journal with cover image
      journal.coverImage = coverImageUrl;
      await journal.save();
      console.log('  ✓ Updated journal with cover image (touch.jpg from assets)');
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
      `He came into my room again last night. I pretended to be asleep. But I wasn't. I was awake. I was scared. I am always scared.`,
      `Can't tell anyone. Who would believe me? He's my uncle. Everyone loves him. I'm just a kid. Nobody would believe me.`,
      `It hurts. It always hurts. But I don't say anything. I just lie there. Frozen. Waiting for it to be over.`,
      `Feel dirty. All the time. Like I'm covered in something I can't wash off. No matter how much I shower. Still feel dirty.`,
      `He told me it's our secret. That I'm special. That I shouldn't tell anyone. I believed him. I was so young.`,
      `Can't sleep. Too afraid. What if he comes again? What if he comes tonight? I stay awake. Listening. Waiting.`,
      `Hate my body. Hate that it's mine. Wish I could disappear. Wish I could just... not exist.`,
      `Feel like it's my fault. I must have done something. Said something. Wore something. It's my fault. Always my fault.`,
      `Nobody knows. Nobody sees. Nobody helps. I'm alone. Completely alone.`,
      `Can't concentrate in school. Can't think. Can't focus. My mind is somewhere else. Always somewhere else.`,
      `Feel numb. Can't feel anything. Not happy. Not sad. Just... nothing. Empty.`,
      `He said I liked it. That I wanted it. I didn't. I don't. I never did. But he said I did.`,
      `Scared of being alone with him. Scared of family gatherings. Scared of holidays. Scared of everything.`,
      `Feel broken. Like something inside me is broken. Something that can't be fixed.`,
      `Can't trust anyone. Not adults. Not family. Not anyone. Everyone could hurt me.`,
      `Wish I could tell someone. But I can't. The words won't come. They're stuck. Trapped inside.`,
      `Feel like I'm suffocating. Like I can't breathe. Like I'm drowning. In silence. In shame.`,
      `He's always there. At family events. At holidays. At my birthday. I can't escape.`,
      `Feel like I'm two people. The one everyone sees. And the one who's broken. The one who's dirty.`,
      `Don't know who I am anymore. The person I was before is gone. The person I am now is... nothing.`,
    ];
    
    const awarenessEntries = [
      `Starting to understand. It's not my fault. It was never my fault. I was a child. He was an adult. It's not my fault.`,
      `Told someone. My teacher. She believed me. She helped me. I'm not alone anymore.`,
      `Learning about what happened to me. It has a name. Sexual abuse. It's not my fault. It's not my fault.`,
      `In therapy now. Talking about it. For the first time. It's hard. So hard. But I'm doing it.`,
      `Learning that I'm not dirty. That I'm not broken. That I'm a survivor. Not a victim. A survivor.`,
      `Starting to feel again. Real emotions. Not just numbness. It's scary. But it's also... something.`,
      `Learning to trust again. Slowly. Carefully. One person at a time. It's hard. But I'm trying.`,
      `Understanding that I didn't do anything wrong. That I didn't ask for this. That I didn't deserve this.`,
      `Building a safety plan. People I can call. Places I can go. Things I can do. It's something.`,
      `Learning that my body is mine. That I have control. That I can say no. That I can say stop.`,
      `Starting to see patterns. What triggers me. When I'm most vulnerable. Understanding helps.`,
      `Had a good day. A really good day. No flashbacks. No panic attacks. Just... a normal day.`,
      `Learning about boundaries. About what's okay and what's not. About saying no. About protecting myself.`,
      `Starting to process. To feel the pain. To cry. To be angry. It's hard. But it's necessary.`,
      `Learning that I'm not alone. That others have been through this. That I'm not the only one.`,
      `Building connections. With people who understand. With people who care. I'm not alone anymore.`,
      `Learning to ground myself. To stay in the present. To remind myself I'm safe now.`,
      `Starting to feel safe. Sometimes. In some places. With some people. It's a start.`,
      `My therapist said I'm brave. That telling someone was brave. That I'm strong. I'm trying to believe it.`,
      `Processing the trauma. Talking about it. Writing about it. Feeling it. It's painful. But I'm doing it.`,
    ];
    
    const recoveryEntries = [
      `Went a whole week without a flashback. A whole week. Didn't think it was possible. But I did it.`,
      `Sleeping better. Not every night. But most nights. The nightmares are less frequent. That's progress.`,
      `Learning to manage my triggers. Can't avoid everything. But I can cope. I have tools.`,
      `Processing the trauma. Really processing it. It's painful. But I'm doing it. I'm facing it.`,
      `Building a life again. Not the life I had before. But a new life. A better life.`,
      `Finding joy again. Small moments of happiness. They're rare. But they're there.`,
      `Helping others. Sharing my story. Offering support. Feels good to use my pain for something positive.`,
      `Learning to trust my body again. To feel safe in my own skin. It's a process. But I'm getting there.`,
      `Building healthy relationships. With boundaries. With respect. With care.`,
      `Finding meaning in my pain. Using it to help others. Making something good out of something terrible.`,
      `Grateful. Grateful for therapy. Grateful for support. Grateful that I'm healing.`,
      `Proud of myself. Every day I get through is a victory. Every trigger I manage is a win.`,
      `Learning that recovery isn't linear. Some days are good. Some days are hard. But I'm moving forward.`,
      `Starting to see a future. Not defined by the abuse. But informed by it. A future with hope.`,
      `Building resilience. Getting stronger. The abuse doesn't define me anymore. I define me.`,
      `Healing. Slowly, but surely. The wounds are closing. The scars are fading. I'm healing.`,
      `Went to a family event. He was there. But I was okay. I had support. I was safe.`,
      `Let someone hug me today. Without flinching. Without freezing. That's progress. Real progress.`,
      `Had a nightmare. But I used my grounding techniques. Got through it. Didn't panic. I'm getting stronger.`,
      `Started dating. It's scary. But I'm trying. I deserve to be happy. I deserve love.`,
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
      `Proof that healing is possible. That abuse doesn't have to define you. That there's life after pain.`,
      `I'm a survivor. Not a victim. A survivor. Been through hell. Came out stronger.`,
      `Finding peace. Real peace. Not the absence of pain. But peace with the pain. It's part of my story. But not all of it.`,
      `Living in the present. Not stuck in the past. Not afraid of the future. Just... present.`,
      `Whole again. Not the same as before. But whole. The pieces have come back together. Different, but whole.`,
      `The abuse changed everything... it did change everything. But not all for the worse. I'm stronger now. Wiser. More.`,
      `I'm here. I'm alive. I'm healing. I'm thriving. The abuse is part of my story. But it's not the whole story.`,
      `Got a new job. One I actually like. I'm moving forward. Building a future.`,
      `In a relationship now. A healthy one. With someone who understands. Who cares. I'm happy. Really happy.`,
      `Went to a family event. He was there. But I was okay. More than okay. I was strong. I was safe.`,
      `One year since I told someone. One year. I'm a different person. A better person. I'm healing.`,
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
    
    // Generate 42 entries over 42 days, ending on 23-2-2026
    const totalEntries = 42;
    const endDate = new Date('2026-02-23');
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (totalEntries - 1));
    
    // Determine phase distribution
    const darkPhaseEnd = Math.floor(totalEntries * 0.35); // 35% dark
    const awarenessPhaseEnd = Math.floor(totalEntries * 0.55); // 20% awareness
    const recoveryPhaseEnd = Math.floor(totalEntries * 0.80); // 25% recovery
    // 20% hopeful
    
    for (let i = 0; i < totalEntries; i++) {
      const entryDate = new Date(startDate);
      entryDate.setDate(entryDate.getDate() + i);
      
      const { hours, minutes } = getRandomTime();
      entryDate.setHours(hours, minutes, Math.floor(Math.random() * 60), 0);
      
      let content: string;
      let healthConditions: any[] = [];
      let mood: number;
      
      if (i < darkPhaseEnd) {
        // Dark phase
        content = getNextEntry(shuffledDark, usedDark);
        mood = 1 + Math.floor(Math.random() * 2); // 1-2
        healthConditions = [
          { condition: 'PTSD', type: 'Complex PTSD', severity: 'severe' },
          { condition: 'Depression', severity: 'severe' },
          { condition: 'Anxiety Disorder', severity: 'severe' }
        ];
      } else if (i < awarenessPhaseEnd) {
        // Awareness phase
        content = getNextEntry(shuffledAwareness, usedAwareness);
        mood = 2 + Math.floor(Math.random() * 2); // 2-3
        healthConditions = [
          { condition: 'PTSD', type: 'Complex PTSD', severity: 'moderate' },
          { condition: 'Depression', severity: 'moderate' },
          { condition: 'Anxiety Disorder', severity: 'moderate' }
        ];
      } else if (i < recoveryPhaseEnd) {
        // Recovery phase
        content = getNextEntry(shuffledRecovery, usedRecovery);
        mood = 3 + Math.floor(Math.random() * 3); // 3-5
        healthConditions = [
          { condition: 'PTSD', type: 'Complex PTSD', severity: 'mild' },
          { condition: 'Depression', severity: 'mild' },
          { condition: 'Anxiety Disorder', severity: 'mild' }
        ];
      } else {
        // Hopeful phase
        content = getNextEntry(shuffledHopeful, usedHopeful);
        mood = 5 + Math.floor(Math.random() * 4); // 5-8
        healthConditions = [
          { condition: 'PTSD', type: 'Complex PTSD', severity: 'mild' },
          { condition: 'Depression', severity: 'mild' },
          { condition: 'Anxiety Disorder', severity: 'mild' }
        ];
      }
      
      entries.push({
        journal: journal._id,
        author: user._id,
        content,
        mood,
        healthConditions,
        symptoms: healthConditions.map((hc: any) => ({
          condition: hc.condition,
          severity: hc.severity,
        })),
        isPrivate: false, // Public journal entries
        createdAt: entryDate,
        updatedAt: entryDate,
      });
    }
    
    // Insert all entries
    await JournalEntry.insertMany(entries);
    journal.entriesCount = entries.length;
    await journal.save();
    
    console.log(`  ✓ Created ${entries.length} journal entries`);
    console.log('  ✓ Journal entries span from', startDate.toLocaleDateString(), 'to', endDate.toLocaleDateString());
    console.log('  ✓ Entries progress from dark to hopeful');
    console.log('  ✓ Added health conditions: PTSD (Complex), Depression, Anxiety Disorder');
    console.log('  ✓ All entries have realistic, varied timestamps');
    
    console.log('\n✅ Successfully created HiddenVoice user and journal!');
    
  } catch (error) {
    console.error('❌ Error creating HiddenVoice user and journal:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('  ✓ Database connection closed');
  }
}

// Run the script
createHiddenVoice();
