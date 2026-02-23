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
    const totalEntries = 41;
    const endDate = new Date('2026-02-23');
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (totalEntries - 1));
    
    // Story context that builds over time
    const storyContext = {
      daysSinceLastThought: 0,
      inTherapy: false,
      daysSinceTherapy: 0,
      supportSystem: [] as string[],
      lastAttempt: 0,
    };
    
    // Function to generate entry content based on progress and story context
    const generateEntry = (dayIndex: number, progress: number): string => {
      const lengthType = Math.random();
      let content = '';
      
      // Determine entry length: 30% short, 50% medium, 20% long
      const isShort = lengthType < 0.3;
      const isLong = lengthType > 0.8;
      
      if (progress < 0.35) {
        // Dark phase - active suicidal thoughts
        storyContext.daysSinceLastThought = 0;
        
        if (isShort) {
          const shorts = [
            `I don't want to exist anymore.`,
            `Everyone would be better off without me.`,
            `Made a plan today.`,
            `The pain is too much. I can't do this anymore.`,
          ];
          content = shorts[Math.floor(Math.random() * shorts.length)];
        } else if (isLong) {
          content = `I don't want to exist anymore. The thought is constant. Always there. In the background. In the foreground. Everywhere. I'm tired. So tired. Of the pain. Of the emptiness. Of the nothingness. Of existing. I don't want to exist anymore.

Made a plan today. A real plan. Not just thoughts. A plan. I know how. I know when. I know where. It's all figured out. The only thing left is... doing it. But I'm scared. Scared of the pain. Scared of failing. Scared of what comes after. But also... relieved? Like there's an end. A way out. A final escape from this pain. This emptiness. This nothingness.

Everyone would be better off without me. My family. My friends. Everyone. I'm a burden. A weight. Dragging them down. Making their lives harder. They'd be sad at first. But then they'd be relieved. Free. Free from me. Free from my problems. Free from my pain. They'd move on. They'd be better. Happier. Without me.

The pain is too much. I can't do this anymore. Every day is a struggle. Every moment is pain. I'm drowning. In the darkness. In the emptiness. In the nothingness. I can't breathe. Can't think. Can't feel anything except pain. I'm done. I'm just... done.`;
        } else {
          content = `I don't want to exist anymore. The thought is constant. Always there. Made a plan today. A real plan. I know how. I know when. I know where. Everyone would be better off without me. I'm a burden. A weight. Dragging everyone down. The pain is too much. I can't do this anymore. Every day is a struggle. Every moment is pain. I'm drowning. I'm done.`;
        }
      } else if (progress < 0.55) {
        // Awareness phase - starting to question, maybe reaching out
        storyContext.daysSinceLastThought++;
        if (!storyContext.inTherapy && Math.random() > 0.5) {
          storyContext.inTherapy = true;
          storyContext.supportSystem.push('therapist');
        }
        
        if (isShort) {
          const shorts = [
            `Called a crisis line today. They listened.`,
            `Told someone. My friend. They didn't judge.`,
            `Maybe... maybe I don't have to do this?`,
            `Starting therapy next week. I'm scared.`,
          ];
          content = shorts[Math.floor(Math.random() * shorts.length)];
        } else if (isLong) {
          content = `I called a crisis line today. The suicide hotline. I don't know why. The thoughts were so strong. So overwhelming. I had the plan. I was ready. But something made me pick up the phone. Dial the number. And they answered. A voice. A real person. They listened. Really listened. Didn't judge. Didn't minimize. Just... listened. And for a moment, just a moment, I felt less alone. Less hopeless. Less... done.

I told someone. My best friend, Alex. About the thoughts. About the plan. About how I don't want to exist anymore. They didn't judge. Didn't get angry. Didn't tell me I was being dramatic. They just... listened. Cried. Hugged me. Said they're here. That they care. That I matter. That I'm not a burden. That they'd be devastated if I was gone. Not relieved. Devastated. I'm trying to believe that. Trying to hold onto that.

Maybe... maybe I don't have to do this? Maybe there's another way? Maybe the pain can get better? Maybe I can get better? I don't know. But I'm starting to question. Starting to wonder. Starting to hope? Just a little. A tiny spark. But it's there.`;
        } else {
          content = `I called a crisis line today. The thoughts were so strong. But something made me pick up the phone. They listened. Really listened. For a moment, I felt less alone. I told my friend Alex. About the thoughts. About the plan. They didn't judge. Just listened. Cried. Hugged me. Said they care. That I matter. Maybe... maybe I don't have to do this? Maybe there's another way? I'm starting to question. Starting to hope? Just a little.`;
        }
      } else if (progress < 0.80) {
        // Recovery phase - in therapy, learning to cope
        if (!storyContext.inTherapy) {
          storyContext.inTherapy = true;
        }
        storyContext.daysSinceTherapy++;
        storyContext.daysSinceLastThought = Math.min(storyContext.daysSinceLastThought + 1, 14);
        
        if (isShort) {
          const shorts = [
            `Three days without suicidal thoughts.`,
            `Therapy was hard today. But I'm making progress.`,
            `Had a bad day. Didn't act on the thoughts.`,
            `Learning that the thoughts are just thoughts. Not commands.`,
          ];
          content = shorts[Math.floor(Math.random() * shorts.length)];
        } else if (isLong) {
          content = `Three weeks in therapy now. Dr. Kim says I'm making progress. I don't always see it, but I'm trying to trust her. The suicidal thoughts are less frequent. Less intense. When they come, I'm learning to recognize them. To name them. To understand them. They're just thoughts. Not commands. Not facts. Just thoughts. And thoughts can change. Thoughts can get better.

I went three days without suicidal thoughts. Three whole days. Didn't think it was possible. But I did it. The thoughts came back today. But they were weaker. Quieter. I didn't act on them. Didn't make a plan. Didn't think about how. Just... had the thought. Acknowledged it. Let it pass. That's progress. Real progress.

Therapy was hard today. Really hard. We talked about why. Why I don't want to exist. Why the pain feels so overwhelming. Why I feel like a burden. We're getting to the root of it. Processing it. Understanding it. It's painful. But it's necessary. I'm learning that the pain doesn't have to be forever. That I can heal. That I can get better. That I can want to exist again.`;
        } else {
          content = `Three weeks in therapy now. Dr. Kim says I'm making progress. I went three days without suicidal thoughts. Three whole days. The thoughts came back today. But they were weaker. I didn't act on them. Just had the thought. Acknowledged it. Let it pass. That's progress. Therapy was hard today. We talked about why. Why I don't want to exist. Why the pain feels so overwhelming. It's painful. But it's necessary. I'm learning that the pain doesn't have to be forever. That I can heal.`;
        }
      } else {
        // Hopeful phase - healing, finding reasons to stay
        storyContext.daysSinceLastThought = Math.min(storyContext.daysSinceLastThought + 1, 180);
        storyContext.daysSinceTherapy = Math.min(storyContext.daysSinceTherapy + 1, 365);
        
        if (isShort) {
          const shorts = [
            `${Math.floor(storyContext.daysSinceLastThought / 30)} months since I last thought about it.`,
            `I want to exist. I actually want to exist.`,
            `Found reasons to stay. Real reasons.`,
            `The pain is still there sometimes. But it's manageable now.`,
          ];
          content = shorts[Math.floor(Math.random() * shorts.length)];
        } else if (isLong) {
          content = `It's been ${Math.floor(storyContext.daysSinceLastThought / 30)} months since I last had a serious suicidal thought. ${Math.floor(storyContext.daysSinceLastThought / 30)} months. I never thought I'd see this day. Never thought I'd make it this far. But here I am. Still here. Still alive. Still fighting.

I want to exist. I actually want to exist. Not just survive. Not just endure. But exist. Live. Thrive. I found reasons to stay. Real reasons. My friends. My family. My dog. The sunrise. Coffee in the morning. Music. Art. Books. Small moments of joy. They add up. They matter. I matter.

Therapy is less frequent now - once a month instead of twice a week. Dr. Kim says I've done incredible work. I've processed the trauma. Learned coping skills. Built a support system. Found reasons to stay. The pain is still there sometimes. But it's manageable now. I have tools. I have support. I have hope. I have reasons to stay.`;
        } else {
          content = `It's been ${Math.floor(storyContext.daysSinceLastThought / 30)} months since I last had a serious suicidal thought. I never thought I'd make it this far. But here I am. Still here. Still alive. I want to exist. I actually want to exist. I found reasons to stay. Real reasons. The pain is still there sometimes. But it's manageable now. I have tools. I have support. I have hope. I have reasons to stay.`;
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
          { condition: 'Depression', severity: 'severe' },
          { condition: 'PTSD', severity: 'moderate' },
          { condition: 'Anxiety Disorder', severity: 'severe' }
        ];
        tags = ['suicide', 'depression', 'dark', 'hopeless'];
      } else if (progress < 0.55) {
        mood = 2 + Math.floor(Math.random() * 2); // 2-3
        symptoms = [
          { condition: 'Depression', severity: 'moderate' },
          { condition: 'PTSD', severity: 'moderate' },
          { condition: 'Anxiety Disorder', severity: 'moderate' }
        ];
        tags = ['suicide', 'depression', 'struggling', 'awareness'];
      } else if (progress < 0.80) {
        mood = 3 + Math.floor(Math.random() * 3); // 3-5
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
      } else {
        mood = 5 + Math.floor(Math.random() * 4); // 5-8
        const hopefulSymptoms = [
          { condition: 'Depression', severity: 'mild' }
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
