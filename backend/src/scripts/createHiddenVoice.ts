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
    const totalEntries = 42;
    const endDate = new Date('2026-02-23');
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (totalEntries - 1));
    
    // Story context that builds over time
    const storyContext = {
      daysSinceLastIncident: 0,
      toldSomeone: false,
      inTherapy: false,
      daysSinceTherapy: 0,
      daysClean: 0,
      lastFlashback: 0,
      supportSystem: [] as string[],
    };
    
    // Function to generate entry content based on progress and story context
    const generateEntry = (dayIndex: number, progress: number): string => {
      const lengthType = Math.random();
      let content = '';
      
      // Determine entry length: 30% short (2-4 sentences), 50% medium (paragraph), 20% long (multiple paragraphs)
      const isShort = lengthType < 0.3;
      const isLong = lengthType > 0.8;
      
      if (progress < 0.35) {
        // Dark phase - early abuse, silence, fear
        storyContext.daysSinceLastIncident++;
        
        if (isShort) {
          const shorts = [
            `He came into my room again. I pretended to sleep.`,
            `Can't tell anyone. Nobody would believe me.`,
            `It hurts. Every time.`,
            `Feel so dirty. Can't wash it away.`,
            `He said it's our secret. I believed him.`,
          ];
          content = shorts[Math.floor(Math.random() * shorts.length)];
        } else if (isLong) {
          content = `Last night was bad. Really bad. He came into my room around 2am, like he always does when mom and dad are asleep. I heard the door creak and I immediately closed my eyes, tried to make my breathing even, pretended I was deep in sleep. But he knows. He always knows when I'm faking it. 

I felt the bed dip as he sat down. My whole body went rigid. I wanted to scream, to run, to do something. But I just... froze. Like I always do. It's like my body isn't mine anymore. It's like I'm watching this happen to someone else, from far away. 

After he left, I lay there for hours. Couldn't move. Couldn't cry. Just... empty. I took three showers this morning. Scrubbed until my skin was raw. But I still feel dirty. Like his touch is burned into me. Like I'll never be clean again.

I can't tell anyone. Who would believe a 12-year-old over their favorite uncle? Everyone loves him. He's the fun one, the one who brings presents, the one who makes everyone laugh. I'm just... me. Quiet. Invisible. Nobody would believe me.`;
        } else {
          content = `He came into my room again last night. I pretended to be asleep, but I wasn't. I was wide awake, terrified, listening to every sound. When I felt his weight on the bed, my whole body went cold. I just lay there, frozen, waiting for it to be over. It always hurts. Every time. But I don't say anything. I can't. He told me it's our special secret, that I'm special, that I shouldn't tell anyone. I believed him. I was so young when it started. Now I'm 12 and I still can't find the words. Who would believe me anyway? He's everyone's favorite uncle. I'm just the quiet kid who doesn't talk much.`;
        }
      } else if (progress < 0.55) {
        // Awareness phase - starting to question, maybe telling someone
        if (!storyContext.toldSomeone && Math.random() > 0.7) {
          storyContext.toldSomeone = true;
          storyContext.supportSystem.push('teacher');
        }
        
        if (isShort) {
          const shorts = [
            `Told my teacher today. She believed me.`,
            `It's not my fault. I keep telling myself that.`,
            `Starting therapy next week. I'm scared.`,
            `Had a good day today. No flashbacks.`,
          ];
          content = shorts[Math.floor(Math.random() * shorts.length)];
        } else if (isLong) {
          content = `I did it. I actually told someone. Mrs. Johnson, my English teacher. She noticed I've been spacing out in class, that my grades dropped, that I'm always wearing long sleeves even when it's hot. She asked me to stay after class today, and I don't know what came over me, but I just... told her. Everything. The words tumbled out like they'd been waiting, like they couldn't wait any longer.

She didn't look shocked. She didn't look disgusted. She just... listened. Really listened. And then she hugged me. Gently. Asked if I wanted to tell my parents, or if I wanted her to help me tell them. I said I didn't know. I'm so scared of what will happen. What if they don't believe me? What if they blame me? What if everything falls apart?

But Mrs. Johnson said she believes me. She said it's not my fault. She said I'm brave for telling her. I don't feel brave. I feel like I'm breaking apart. But for the first time in years, I also feel... a tiny bit of hope. Like maybe, just maybe, this can stop. Like maybe I'm not alone anymore.

She's going to help me find a therapist. Someone who specializes in... this. I'm terrified. But I'm also relieved. The secret isn't just mine anymore.`;
        } else {
          content = `I told someone. My teacher, Mrs. Johnson. I don't know how it happened - the words just came out. She believed me. She actually believed me. She said it's not my fault, that I'm brave for telling her. I don't feel brave. I feel scared and relieved and confused all at once. She's helping me find a therapist. I start next week. I'm terrified. But I'm also... hopeful? For the first time in so long, I feel like maybe this can stop. Maybe I'm not alone anymore.`;
        }
      } else if (progress < 0.80) {
        // Recovery phase - in therapy, processing, ups and downs
        if (!storyContext.inTherapy) {
          storyContext.inTherapy = true;
        }
        storyContext.daysSinceTherapy++;
        storyContext.daysSinceLastIncident = Math.floor(Math.random() * 30) + 10;
        
        if (isShort) {
          const shorts = [
            `Therapy was hard today. But I'm making progress.`,
            `Went a whole week without a flashback.`,
            `Had a nightmare last night. Used my grounding techniques.`,
            `Starting to feel safe sometimes.`,
          ];
          content = shorts[Math.floor(Math.random() * shorts.length)];
        } else if (isLong) {
          content = `Therapy session today was intense. We talked about the first time it happened. I was 8. It was during a family barbecue. Everyone was outside, laughing, having fun. I went inside to get a drink, and he followed me. Said he wanted to show me something in the basement. I trusted him. Why wouldn't I? He was my uncle. He was supposed to keep me safe.

Talking about it out loud, saying the words, describing what happened... it was like reliving it. I had a panic attack right there in Dr. Martinez's office. But she helped me through it. Taught me breathing exercises, grounding techniques. "You're safe now," she kept saying. "You're 13 now. You're safe. He can't hurt you anymore."

And I am safe. He's not allowed near me anymore. My parents believed me. They were devastated, angry, guilty. But they believed me. They got a restraining order. He's not part of our lives anymore. 

I'm still processing. Still healing. Some days are better than others. Yesterday I had a flashback in the grocery store - someone touched my shoulder from behind and I completely froze, couldn't breathe. But today? Today I went to school, I laughed with my friends, I felt almost normal. Almost. 

The nightmares are less frequent now. Maybe once a week instead of every night. When they come, I use the techniques Dr. Martinez taught me. I remind myself I'm safe. I'm getting stronger.`;
        } else {
          content = `Three months in therapy now. Dr. Martinez says I'm making incredible progress. I don't always see it, but I'm trying to trust her. The nightmares are less frequent - maybe once a week instead of every night. When they come, I use the grounding techniques she taught me. I remind myself I'm safe now. He can't hurt me anymore. My parents believed me. They got a restraining order. He's not part of our lives. Some days are still hard. Flashbacks come out of nowhere. But other days... other days I feel almost normal. Almost happy. I'm learning that recovery isn't a straight line. It's messy. But I'm moving forward.`;
        }
      } else {
        // Hopeful phase - healing, growth, looking forward
        storyContext.daysSinceLastIncident = Math.floor(Math.random() * 90) + 60;
        storyContext.daysSinceTherapy = Math.floor(Math.random() * 180) + 90;
        storyContext.lastFlashback = Math.floor(Math.random() * 60) + 30;
        
        if (isShort) {
          const shorts = [
            `Six months since my last flashback. I'm healing.`,
            `Started volunteering at a crisis center. Helping others.`,
            `Went on a date. It was scary but good.`,
            `I'm a survivor. Not a victim.`,
          ];
          content = shorts[Math.floor(Math.random() * shorts.length)];
        } else if (isLong) {
          content = `It's been almost a year since I told Mrs. Johnson. A year since my world changed. A year since I found my voice.

I'm 14 now. In high school. Making friends. Real friends who know about my past, who support me, who don't treat me like I'm broken. I'm not broken. I'm healing. 

I started volunteering at a local crisis center for kids. I help with the support groups, share my story when I'm ready. Seeing other kids who've been through similar things... it helps. It helps them, and it helps me. I'm not alone. None of us are alone.

Therapy is less frequent now - once a month instead of twice a week. Dr. Martinez says I've done incredible work. I've processed the trauma, learned to manage triggers, built a support system. I still have bad days. Days where the memories feel too close, where I feel that old fear creeping in. But those days are rare now. Most days, I feel... good. Happy even.

I went on my first date last week. With a boy from my history class. He's kind, gentle, respects my boundaries. When he asked if he could hold my hand, I said yes. And it was okay. It was actually nice. I didn't freeze. I didn't panic. I just... held his hand. And it was normal. Beautifully, wonderfully normal.

I'm not defined by what happened to me. It's part of my story, but it's not the whole story. I'm a survivor. I'm strong. I'm healing. And I'm going to be okay.`;
        } else {
          content = `It's been almost a year since I told someone. A year of therapy, of healing, of learning to trust again. I'm 14 now, in high school, making real friends. I started volunteering at a crisis center - helping other kids who've been through similar things. It helps them, and it helps me. I'm not alone anymore. 

The nightmares are rare now. Maybe once a month. When they come, I know how to handle them. I use my grounding techniques, remind myself I'm safe. Most days, I feel good. Happy even. I went on my first date last week. It was scary, but it was also... normal. Beautifully normal. I'm healing. I'm a survivor. And I'm going to be okay.`;
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
      let healthConditions: any[] = [];
      
      if (progress < 0.35) {
        mood = 1 + Math.floor(Math.random() * 2); // 1-2
        healthConditions = [
          { condition: 'PTSD', type: 'Complex PTSD', severity: 'severe' },
          { condition: 'Depression', severity: 'severe' },
          { condition: 'Anxiety Disorder', severity: 'severe' }
        ];
      } else if (progress < 0.55) {
        mood = 2 + Math.floor(Math.random() * 2); // 2-3
        healthConditions = [
          { condition: 'PTSD', type: 'Complex PTSD', severity: 'moderate' },
          { condition: 'Depression', severity: 'moderate' },
          { condition: 'Anxiety Disorder', severity: 'moderate' }
        ];
      } else if (progress < 0.80) {
        mood = 3 + Math.floor(Math.random() * 3); // 3-5
        healthConditions = [
          { condition: 'PTSD', type: 'Complex PTSD', severity: 'mild' },
          { condition: 'Depression', severity: 'mild' },
          { condition: 'Anxiety Disorder', severity: 'mild' }
        ];
      } else {
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
        isPrivate: false,
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
    console.log('  ✓ Entries form a continuous story with varying lengths');
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
