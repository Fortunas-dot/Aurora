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
        description: 'Learning to nourish my body and my soul. One meal, one day, one step at a time.',
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
    
    // Define all entries for each phase with realistic variety in length and style
    const darkEntries = [
      `Stepped on the scale. The number went down. Should be happy. I'm not. Never happy. Nothing is ever enough. Need to lose more. Be smaller. Disappear.`,
      `Counted every calorie today. 200. That's all. I'm so hungry. But the hunger feels like control. Hunger means I'm winning. Hunger means I'm strong.`,
      `Looked in the mirror. All I see is fat. I know logically I'm not. But the voice screams. You're disgusting. You're huge. You need to lose more.`,
      `Exercised for three hours. Can't stop. If I stop, I'll gain weight. If I gain weight, I'll be worthless. The pain in my body is nothing. Nothing compared to the pain of being fat.`,
      `Threw away the food my mom made. Can't eat it. Can't. The thought of putting it in my mouth makes me panic. Food is the enemy. Food is weakness.`,
      `My period stopped. Months ago. I know that's bad. Don't care. It means I'm winning. It means I'm thin enough. Nothing else matters.`,
      `So cold. All the time. My hands are always freezing. My hair is falling out. But I can't stop. Won't stop. This is who I am now.`,
      `Lied to my therapist again. Told them I'm eating. Told them I'm fine. They can't help me. No one can. This is my battle. I'm fighting it alone.`,
      `Looked at old photos. I was so much bigger then. So disgusting. Never want to go back. I'd rather die than be that person again.`,
      `Measured my waist today. Smaller than yesterday. That's all that matters. The number on the scale. The size of my body. Nothing else exists.`,
      `Dizzy. All the time. Can't concentrate. Tired. So tired. But I can't eat. Won't eat. Food is the enemy.`,
      `My friends are worried. Keep asking if I'm okay. I tell them I'm fine. Better than fine. I'm in control. That's all that matters.`,
      `Can't remember the last time I ate a full meal. Can't remember what it feels like to not be hungry. But hunger is my friend. Hunger means I'm winning.`,
      `I'm breaking. I know I am. But I can't stop. Don't know how to stop. This is all I am now. All I'll ever be.`,
      `Looked at myself in the mirror. Cried. I hate what I see. Hate who I am. But I can't change. Won't change. This is my life now.`,
      `I'm disappearing. Literally. My body is shrinking. So am I. Soon there will be nothing left. Maybe that's okay. Maybe that's what I want.`,
      `Ate an apple today. Felt guilty. So guilty. Had to exercise for two hours to make up for it. It wasn't enough.`,
      `My mom cried. Asked me to eat. I can't. I just can't. The fear is too strong.`,
      `Saw my reflection in a window. Didn't recognize myself. Who is that?`,
      `My jeans are falling off. I should be happy. I'm not. Still too big. Need to lose more.`,
    ];
    
    const awarenessEntries = [
      `Fainted today. In the middle of the day. Just collapsed. My mom found me. She was crying. Never seen her so scared. Maybe... maybe this isn't okay.`,
      `Tried to eat something today. Just a small apple. Couldn't do it. The panic was too much. But I wanted to. Really wanted to. That's something, right?`,
      `Therapist said I'm killing myself. I know they're right. Know this is dangerous. But I can't stop. Don't know how to stop.`,
      `Looked at my reflection. For a moment, just a moment, I saw how thin I really am. How sick I look. It scared me. But then the voice came back. You're still fat.`,
      `Starting to see the damage. My hair is thin. Skin is dry. Always cold. My body is breaking down. But I can't stop. Won't stop.`,
      `Had a moment of clarity today. Realized I haven't felt happy in months. Not really happy. The scale going down doesn't make me happy anymore. Nothing does.`,
      `I'm scared. Scared of what I'm doing to myself. Scared of what will happen if I don't stop. But also scared of what will happen if I do stop. Who will I be?`,
      `Tried to eat a meal today. Made it halfway through. Panicked and stopped. But I tried. That's progress, right? It has to be.`,
      `Doctor said my heart rate is dangerously low. Talking about hospitalization. Don't want that. But maybe... maybe I need it.`,
      `Starting to question everything. Why am I doing this? What am I trying to prove? Who am I trying to be? I don't have answers.`,
      `Looked at old photos. Realized I was happy then. I was healthy. Had energy. Had a life. I want that back. I think I want that back.`,
      `Tired of fighting. Tired of the constant battle. With food. With my body. With myself. So tired. Maybe it's time to try something different.`,
      `Told someone the truth today. Told them I'm not eating. Told them I'm scared. Hardest thing I've ever done. But it felt... lighter.`,
      `Starting to see that this isn't control. This is the opposite of control. The eating disorder is controlling me. I'm not in charge anymore.`,
      `Had a moment today. Wanted to eat. Really wanted to. Not because I had to. But because I wanted to. That hasn't happened in so long.`,
      `Realizing I can't do this alone. Been trying to fight this by myself. But I can't. I need help. I think I'm ready to ask for help.`,
      `My friend brought me lunch. I threw it away when they left. Felt guilty. But I couldn't eat it. The fear was too strong.`,
      `Saw a photo of myself from last year. I looked... healthy. Happy. I miss that person.`,
      `My mom made my favorite meal. I couldn't eat it. She cried. I cried. But I still couldn't eat it.`,
      `Therapist wants me to go to treatment. I'm scared. But maybe... maybe it's time.`,
    ];
    
    const recoveryEntries = [
      `Ate a full meal today. A real meal. I was terrified. But I did it. And I didn't die. Didn't gain ten pounds. I just... ate.`,
      `In treatment now. It's hard. So hard. Every meal is a battle. Every bite is a victory. But I'm fighting. Really fighting.`,
      `Gained weight. The number on the scale went up. Panicked. Cried. But I didn't restrict. Didn't exercise it away. Just... felt it. And it was okay.`,
      `Learning that my body needs food. That food isn't the enemy. That I'm not weak for eating. I'm strong for fighting.`,
      `Had a setback today. Restricted. Exercised too much. But I didn't let it destroy me. Talked to my therapist. Got back on track. That's progress.`,
      `Starting to see my body differently. Not as something to control. But as something to care for. Something to nourish. It's a slow process. But it's happening.`,
      `Ate something I used to love today. A cookie. I was scared. But I did it. And it tasted good. Really good. I'd forgotten what that felt like.`,
      `My period came back. I know that's a good sign. Means my body is healing. Means I'm getting better. But it's also scary. Change is scary.`,
      `Learning to challenge the voice. When it tells me I'm fat, I tell it I'm healing. When it tells me to restrict, I tell it I'm recovering. Getting stronger.`,
      `Really hard day. Everything felt wrong. Wanted to restrict. Wanted to exercise. But I didn't. Used my coping skills instead. I'm proud.`,
      `Starting to feel again. Real emotions. Not just numbness. It's overwhelming sometimes. But it's also... alive. Feeling alive again.`,
      `Looked in the mirror today. Didn't hate what I saw. Not love, not yet. But not hate. That's something. That's progress.`,
      `Gaining weight and it's okay. It's hard. But it's okay. My body needs this. I need this. Learning to accept that.`,
      `Finding joy in things again. Small things. A good book. A beautiful sunset. A friend's laugh. Remembering what it feels like to be happy.`,
      `Learning that recovery isn't linear. Some days are good. Some days are hard. But I'm moving forward. That's what matters.`,
      `Starting to see myself as more than my body. More than a number on a scale. I'm a person. A whole person. And that's enough.`,
      `Went out to dinner with friends. Ate actual food. In public. I was anxious. But I did it. And it was okay.`,
      `The scale number went up again. Panicked. But I didn't restrict. Called my therapist instead. She helped me through it.`,
      `My mom hugged me today. Said I look healthier. I cried. But not from sadness. From... something else. Relief maybe?`,
      `Ate breakfast. Lunch. Dinner. All three meals. In one day. I can't remember the last time I did that.`,
    ];
    
    const hopefulEntries = [
      `Months since I last restricted. Months. Can't believe it. I'm eating regularly. Nourishing my body. Healing.`,
      `Look in the mirror. See strength. See someone who fought. Someone who's still fighting. See a survivor.`,
      `Finding balance. I can eat without panic. Exercise for fun, not punishment. Live without the constant battle.`,
      `My journey being anorexia... that was my past. Not my future. I'm choosing recovery. Choosing life. Choosing me.`,
      `Learning to love my body. Not because it's perfect. But because it's mine. Because it's strong. Because it's healing.`,
      `Helping others now. Sharing my story. Offering support. Feels good to use my pain for something positive. Help others who are where I was.`,
      `I'm free. Really free. Free from the constant thoughts about food. Free from the scale. Free from the voice. I'm just... me.`,
      `Proud of myself. Every meal I eat is a victory. Every day I choose recovery is a win. Building a life worth living.`,
      `Finding joy in food again. Not fear. Not control. But joy. A good meal with friends. A favorite dessert. Food is becoming a friend again.`,
      `Learning that I'm enough. Just as I am. Not thinner. Not smaller. Just me. And that's okay. That's more than okay.`,
      `Building a life outside of my eating disorder. Hobbies. Friends. Goals. Things that matter. Things that make me happy.`,
      `Grateful. Grateful for my body. For my health. For my life. Grateful for the people who helped me. Grateful for recovery.`,
      `I'm strong. Stronger than I ever knew. Fought the hardest battle of my life. And I'm winning. Really winning.`,
      `Learning that recovery isn't about being perfect. It's about being human. It's about progress, not perfection. And that's enough.`,
      `Healing. My body is healing. My mind is healing. My soul is healing. It's a process. But I'm in it. I'm doing it.`,
      `My journey being anorexia... it was hard. So hard. But I made it. I'm making it. Every day is a step forward. Every day is a victory.`,
      `Went to a restaurant today. Ordered what I wanted. Not what was "safe." Ate it. Enjoyed it. That's huge.`,
      `My period is regular now. My hair is growing back. My skin looks better. My body is healing. I'm healing.`,
      `Had a bad day. The voice came back. Told me I'm fat. But I didn't listen. I ate anyway. I'm stronger than the voice now.`,
      `Six months in recovery. Six months. I never thought I'd make it this far. But here I am. I'm doing it.`,
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
    
    // Use different number of entries (43 for WhoIsLisa)
    const totalEntries = 43;
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
          { condition: 'Eating Disorder', type: 'Anorexia nervosa', severity: 'severe' },
          { condition: 'Anxiety Disorder', severity: 'severe' },
          { condition: 'Depression', severity: 'severe' }
        ];
        tags = ['anorexia', 'eating-disorder', 'dark', 'hopeless'];
        content = getNextEntry(shuffledDark, usedDark);
        
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
        content = getNextEntry(shuffledAwareness, usedAwareness);
        
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
        content = getNextEntry(shuffledRecovery, usedRecovery);
        
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
