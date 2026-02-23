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
        description: 'A journey from darkness to light, from control to freedom',
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
      `I stepped on the scale today. The number went down. I should be happy, but I'm not. I'm never happy. Nothing is ever enough. I need to lose more. I need to be smaller. I need to disappear.`,
      `I counted every calorie today. 200. That's all I allowed myself. I'm so hungry, but the hunger feels like control. The hunger means I'm winning. The hunger means I'm strong.`,
      `I looked in the mirror and all I see is fat. I know logically I'm not, but the voice in my head screams at me. You're disgusting. You're huge. You need to lose more.`,
      `I exercised for three hours today. I can't stop. If I stop, I'll gain weight. If I gain weight, I'll be worthless. The pain in my body is nothing compared to the pain of being fat.`,
      `I threw away the food my mom made me. I can't eat it. I can't. The thought of putting it in my mouth makes me panic. Food is the enemy. Food is weakness.`,
      `My period stopped months ago. I know that's bad, but I don't care. It means I'm winning. It means I'm thin enough. Nothing else matters.`,
      `I'm so cold all the time. My hands are always freezing. My hair is falling out. But I can't stop. I won't stop. This is who I am now.`,
      `I lied to my therapist again. Told them I'm eating. Told them I'm fine. They can't help me. No one can. This is my battle, and I'm fighting it alone.`,
      `I looked at old photos of myself. I was so much bigger then. So disgusting. I never want to go back to that. I'd rather die than be that person again.`,
      `I measured my waist today. It's smaller than yesterday. That's all that matters. The number on the scale, the size of my body. Nothing else exists.`,
      `I'm dizzy all the time. I can't concentrate. I'm tired, so tired. But I can't eat. I won't eat. Food is the enemy.`,
      `My friends are worried. They keep asking if I'm okay. I tell them I'm fine. I'm better than fine. I'm in control. That's all that matters.`,
      `I can't remember the last time I ate a full meal. I can't remember what it feels like to not be hungry. But hunger is my friend. Hunger means I'm winning.`,
      `I'm breaking. I know I am. But I can't stop. I don't know how to stop. This is all I am now. This is all I'll ever be.`,
      `I looked at myself in the mirror and cried. I hate what I see. I hate who I am. But I can't change. I won't change. This is my life now.`,
      `I'm disappearing. Literally. My body is shrinking, and so am I. Soon there will be nothing left. And maybe that's okay. Maybe that's what I want.`,
    ];
    
    const awarenessEntries = [
      `I fainted today. In the middle of the day, just collapsed. My mom found me. She was crying. I've never seen her so scared. Maybe... maybe this isn't okay.`,
      `I tried to eat something today. Just a small apple. I couldn't do it. The panic was too much. But I wanted to. I really wanted to. That's something, right?`,
      `My therapist said I'm killing myself. I know they're right. I know this is dangerous. But I can't stop. I don't know how to stop.`,
      `I looked at my reflection and for a moment, just a moment, I saw how thin I really am. How sick I look. It scared me. But then the voice came back. You're still fat.`,
      `I'm starting to see the damage. My hair is thin. My skin is dry. I'm always cold. My body is breaking down. But I can't stop. I won't stop.`,
      `I had a moment of clarity today. I realized I haven't felt happy in months. Not really happy. The scale going down doesn't make me happy anymore. Nothing does.`,
      `I'm scared. Scared of what I'm doing to myself. Scared of what will happen if I don't stop. But also scared of what will happen if I do stop. Who will I be?`,
      `I tried to eat a meal today. I made it halfway through before I panicked and stopped. But I tried. That's progress, right? It has to be.`,
      `My doctor said my heart rate is dangerously low. They're talking about hospitalization. I don't want that. But maybe... maybe I need it.`,
      `I'm starting to question everything. Why am I doing this? What am I trying to prove? Who am I trying to be? I don't have answers.`,
      `I looked at old photos and realized I was happy then. I was healthy. I had energy. I had a life. I want that back. I think I want that back.`,
      `I'm tired of fighting. Tired of the constant battle with food, with my body, with myself. I'm so tired. Maybe it's time to try something different.`,
      `I told someone the truth today. Told them I'm not eating. Told them I'm scared. It was the hardest thing I've ever done. But it felt... lighter.`,
      `I'm starting to see that this isn't control. This is the opposite of control. The eating disorder is controlling me. I'm not in charge anymore.`,
      `I had a moment today where I wanted to eat. Really wanted to. Not because I had to, but because I wanted to. That hasn't happened in so long.`,
      `I'm realizing I can't do this alone. I've been trying to fight this by myself, but I can't. I need help. I think I'm ready to ask for help.`,
    ];
    
    const recoveryEntries = [
      `I ate a full meal today. A real meal. I was terrified, but I did it. And I didn't die. I didn't gain ten pounds. I just... ate.`,
      `I'm in treatment now. It's hard. So hard. Every meal is a battle. Every bite is a victory. But I'm fighting. I'm really fighting.`,
      `I gained weight. The number on the scale went up. I panicked. I cried. But I didn't restrict. I didn't exercise it away. I just... felt it. And it was okay.`,
      `I'm learning that my body needs food. That food isn't the enemy. That I'm not weak for eating. I'm strong for fighting.`,
      `I had a setback today. I restricted. I exercised too much. But I didn't let it destroy me. I talked to my therapist. I got back on track. That's progress.`,
      `I'm starting to see my body differently. Not as something to control, but as something to care for. Something to nourish. It's a slow process, but it's happening.`,
      `I ate something I used to love today. A cookie. I was scared, but I did it. And it tasted good. Really good. I'd forgotten what that felt like.`,
      `My period came back. I know that's a good sign. It means my body is healing. It means I'm getting better. But it's also scary. Change is scary.`,
      `I'm learning to challenge the voice. When it tells me I'm fat, I tell it I'm healing. When it tells me to restrict, I tell it I'm recovering. I'm getting stronger.`,
      `I had a really hard day. Everything felt wrong. I wanted to restrict. I wanted to exercise. But I didn't. I used my coping skills instead. I'm proud of myself.`,
      `I'm starting to feel again. Real emotions, not just numbness. It's overwhelming sometimes, but it's also... alive. I'm feeling alive again.`,
      `I looked in the mirror today and didn't hate what I saw. Not love, not yet. But not hate. That's something. That's progress.`,
      `I'm gaining weight and it's okay. It's hard, but it's okay. My body needs this. I need this. I'm learning to accept that.`,
      `I'm finding joy in things again. Small things. A good book. A beautiful sunset. A friend's laugh. I'm remembering what it feels like to be happy.`,
      `I'm learning that recovery isn't linear. Some days are good. Some days are hard. But I'm moving forward. That's what matters.`,
      `I'm starting to see myself as more than my body. More than a number on a scale. I'm a person. A whole person. And that's enough.`,
    ];
    
    const hopefulEntries = [
      `It's been months since I last restricted. Months. I can't believe it. I'm eating regularly. I'm nourishing my body. I'm healing.`,
      `I look in the mirror and I see strength. I see someone who fought. Someone who's still fighting. I see a survivor.`,
      `I'm finding balance. I can eat without panic. I can exercise for fun, not punishment. I can live without the constant battle.`,
      `My journey being anorexia... that was my past. But not my future. I'm choosing recovery. I'm choosing life. I'm choosing me.`,
      `I'm learning to love my body. Not because it's perfect, but because it's mine. Because it's strong. Because it's healing.`,
      `I'm helping others now. Sharing my story. Offering support. It feels good to use my pain for something positive. To help others who are where I was.`,
      `I'm free. Really free. Free from the constant thoughts about food. Free from the scale. Free from the voice. I'm just... me.`,
      `I'm proud of myself. Every meal I eat is a victory. Every day I choose recovery is a win. I'm building a life worth living.`,
      `I'm finding joy in food again. Not fear, not control, but joy. A good meal with friends. A favorite dessert. Food is becoming a friend again.`,
      `I'm learning that I'm enough. Just as I am. Not thinner, not smaller, just me. And that's okay. That's more than okay.`,
      `I'm building a life outside of my eating disorder. Hobbies, friends, goals. Things that matter. Things that make me happy.`,
      `I'm grateful. Grateful for my body, for my health, for my life. Grateful for the people who helped me. Grateful for recovery.`,
      `I'm strong. Stronger than I ever knew. I fought the hardest battle of my life, and I'm winning. I'm really winning.`,
      `I'm learning that recovery isn't about being perfect. It's about being human. It's about progress, not perfection. And that's enough.`,
      `I'm healing. My body is healing. My mind is healing. My soul is healing. It's a process, but I'm in it. I'm doing it.`,
      `My journey being anorexia... it was hard. So hard. But I made it. I'm making it. Every day is a step forward. Every day is a victory.`,
    ];
    
    // Shuffle each array to ensure variety
    const shuffledDark = shuffle(darkEntries);
    const shuffledAwareness = shuffle(awarenessEntries);
    const shuffledRecovery = shuffle(recoveryEntries);
    const shuffledHopeful = shuffle(hopefulEntries);
    
    // Track indices for each phase to ensure we use all entries before repeating
    let darkIndex = 0;
    let awarenessIndex = 0;
    let recoveryIndex = 0;
    let hopefulIndex = 0;
    
    // Create journal entries - starting from about 40 days ago, ending on today
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 40); // Start 40 days before
    
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
    
    // Generate entries with progression from dark to hopeful
    for (let i = 0; i < 40; i++) {
      const entryDate = new Date(startDate);
      entryDate.setDate(entryDate.getDate() + i);
      
      // Add random time to make entries more believable
      const { hours, minutes } = getRandomTime();
      entryDate.setHours(hours, minutes, Math.floor(Math.random() * 60), 0);
      
      // Calculate progress (0 = very dark, 1 = hopeful)
      const progress = i / 39;
      
      let content = '';
      let mood = 1;
      let symptoms: any[] = [];
      let tags: string[] = [];
      
      if (progress < 0.2) {
        // Very dark phase (first 20% - 8 entries)
        mood = 1 + Math.floor(Math.random() * 2); // 1-2
        // Multiple severe conditions in early phase
        symptoms = [
          { condition: 'Eating Disorder', type: 'Anorexia nervosa', severity: 'severe' },
          { condition: 'Anxiety Disorder', severity: 'severe' },
          { condition: 'Depression', severity: 'severe' }
        ];
        tags = ['anorexia', 'eating-disorder', 'dark', 'hopeless'];
        content = shuffledDark[darkIndex % shuffledDark.length];
        darkIndex++;
        
      } else if (progress < 0.5) {
        // Still dark but some awareness (20-50% - 12 entries)
        mood = 2 + Math.floor(Math.random() * 2); // 2-3
        // Conditions improving but still present
        symptoms = [
          { condition: 'Eating Disorder', type: 'Anorexia nervosa', severity: 'moderate' },
          { condition: 'Anxiety Disorder', severity: 'moderate' },
          { condition: 'Depression', severity: 'moderate' }
        ];
        tags = ['anorexia', 'eating-disorder', 'struggling', 'awareness'];
        content = shuffledAwareness[awarenessIndex % shuffledAwareness.length];
        awarenessIndex++;
        
      } else if (progress < 0.8) {
        // Turning point and recovery (50-80% - 12 entries)
        mood = 3 + Math.floor(Math.random() * 3); // 3-5
        // Conditions becoming milder, some may be resolved
        const recoverySymptoms = [
          { condition: 'Eating Disorder', type: 'Anorexia nervosa', severity: 'mild' },
          { condition: 'Anxiety Disorder', severity: 'mild' },
          { condition: 'Depression', severity: 'mild' }
        ];
        // Sometimes only 1-2 conditions remain
        if (Math.random() > 0.3) {
          symptoms = recoverySymptoms.slice(0, 2);
        } else {
          symptoms = recoverySymptoms;
        }
        tags = ['recovery', 'hope', 'struggling', 'progress'];
        content = shuffledRecovery[recoveryIndex % shuffledRecovery.length];
        recoveryIndex++;
        
      } else {
        // Hopeful and healing (80-100% - 8 entries)
        mood = 5 + Math.floor(Math.random() * 4); // 5-8
        // Most conditions resolved or very mild
        const hopefulSymptoms = [
          { condition: 'Eating Disorder', type: 'Anorexia nervosa', severity: 'mild' }
        ];
        // Sometimes anxiety or depression may still be present but mild
        if (Math.random() > 0.5) {
          hopefulSymptoms.push({ condition: 'Anxiety Disorder', severity: 'mild' } as any);
        }
        symptoms = hopefulSymptoms;
        tags = ['recovery', 'hope', 'healing', 'progress', 'strength'];
        content = shuffledHopeful[hopefulIndex % shuffledHopeful.length];
        hopefulIndex++;
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
