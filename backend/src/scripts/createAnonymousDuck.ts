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
    
    // Create 5 raw, messy, authentic entries
    const entries: any[] = [];
    
    // Helper to create entry with random time (mostly late night/early morning for authenticity)
    const createEntry = (date: Date, content: string, mood: number, tags: string[]) => {
      // 70% late night (22-2), 20% early morning (2-6), 10% normal hours
      const rand = Math.random();
      let hours: number;
      if (rand < 0.7) {
        hours = 22 + Math.floor(Math.random() * 4); // 22-1
        if (hours >= 24) hours = hours % 24;
      } else if (rand < 0.9) {
        hours = 2 + Math.floor(Math.random() * 4); // 2-5
      } else {
        hours = 6 + Math.floor(Math.random() * 17); // 6-22
      }
      const minutes = Math.floor(Math.random() * 60);
      const seconds = Math.floor(Math.random() * 60);
      
      const entryDate = new Date(date);
      entryDate.setHours(hours, minutes, seconds, 0);
      
      entries.push({
        author: user._id,
        journal: journal._id,
        content,
        mood,
        symptoms: [
          { condition: 'Depression', severity: mood <= 2 ? 'severe' : mood <= 4 ? 'moderate' : 'mild' },
          { condition: 'Anxiety Disorder', severity: mood <= 2 ? 'severe' : mood <= 4 ? 'moderate' : 'mild' },
          { condition: 'Sleep Problems', severity: 'moderate' },
        ],
        tags,
        isPrivate: false,
        fontFamily: 'palatino',
        createdAt: entryDate,
        updatedAt: entryDate,
      });
    };
    
    // January 3, 2026 - First entry, very dark
    createEntry(
      new Date('2026-01-03'),
      `I cut myself everyday.

There. I wrote it. I don't know why that feels worse than actually doing it.

It's not dramatic like people think. There's no loud music or crying on the floor. It's quiet. I get home. I lock my door. I sit on my bed and stare at nothing until my head gets too loud. It feels like pressure in my chest. Like someone is pressing their thumb right between my ribs and won't let go.

I tell myself it's about control. That sounds better. Cleaner. The truth is I just don't know what else to do with the feeling.

Today was normal. That's what messes with me. I made coffee. I joked with someone at work. I scrolled on my phone during lunch. I looked completely fine. I even caught myself smiling at something stupid.

Then I came home and it all dropped. Like the floor disappeared.

I don't want to die. I wish people understood that. I just want the noise to stop for five minutes. I want to feel something that makes sense.

I keep thinking about what would happen if I didn't do it tonight.

That thought makes my stomach twist.`,
      2,
      ['self-harm', 'dark', 'overwhelmed', 'isolation']
    );
    
    // January 4, 2026 - Still dark but with a tiny moment
    createEntry(
      new Date('2026-01-04'),
      `I told myself I wouldn't write today. But here I am.

Nothing big happened. That's the problem. When nothing happens, my brain fills in the blanks with everything I've ever done wrong.

I felt weird all day. Like I was slightly outside my body. I kept checking my reflection in windows, making sure I looked normal. I did. No one would guess anything.

When I got home I sat on the floor instead of the bed. I don't know why. I just didn't want to follow the same exact routine. I lasted maybe fifteen minutes before the itch started. That's the only word I have for it. An itch under the skin that won't go away no matter how much you try to ignore it.

I hate how predictable I am.

Afterwards, everything went quiet. Not happy. Just quiet. Like the world was wrapped in cotton.

A girl on the bus smiled at me today. It caught me off guard. For a second I felt… visible. I don't know if I liked it. But I haven't stopped thinking about it.

It's strange how a tiny moment like that can stick.`,
      2,
      ['self-harm', 'depersonalization', 'small-moments', 'reflection']
    );
    
    // January 5, 2026 - Dream, anger, starting to write first
    createEntry(
      new Date('2026-01-05'),
      `I had a dream that my arms were covered in tattoos. Not the trendy kind. Messy ones. Words and lines and shapes that looked like they meant something. In the dream I wasn't ashamed of them. I was showing them to someone like they were art.

I woke up and just stared at my ceiling for a while.

Today I felt angry. At myself mostly. I snapped at someone for no reason and immediately felt guilty. I am either numb or too much. There is no middle.

I kept thinking about the dream. About choosing the marks instead of hiding them. That sounds stupid written down, but it felt important when I woke up.

When I got home, I opened this journal before anything else. That's new. I didn't go straight into autopilot. I just sat here and wrote about my day like a normal person.

The urge is still here. I won't pretend it disappeared because I'm writing poetic sentences. It didn't.

But writing makes it feel less overwhelming. Like I'm putting the feeling somewhere instead of letting it rattle around inside my chest.

That's something, I guess.`,
      3,
      ['dreams', 'anger', 'writing', 'small-steps', 'self-harm']
    );
    
    // January 6, 2026 - Short sleeves, beautiful sky, breathing exercises
    createEntry(
      new Date('2026-01-06'),
      `I wore short sleeves today and almost changed three times before leaving the house.

No one stared. No one said anything. All that fear and it was just… fine. I don't know why I expected people to point or whisper. Everyone was too busy with their own lives.

The sky this morning was actually beautiful. I sound like an old person saying that. But it was soft pink and blue and for a second I felt small in a good way. Not small like worthless. Small like my problems weren't the entire universe.

The urges came in waves today. They weren't constant. They would build and then fade a little. I tried breathing through one of them. I felt ridiculous, but it helped just enough.

I'm starting to realize the feeling doesn't last forever. It just feels like it does when I'm in it.

Tonight I still feel fragile. But not completely swallowed.

That's new.`,
      4,
      ['exposure', 'beauty', 'coping-skills', 'progress', 'fragile']
    );
    
    // January 7, 2026 - One week, friend, not hating reflection
    createEntry(
      new Date('2026-01-07'),
      `One week of writing this down.

That might be the most consistent thing I've done in months.

A friend asked me how I was and I almost lied. I always lie. It's easier. But I said, "I've been better." That was it. Not a big confession. Just a crack in the wall. They didn't freak out. They just said they get it.

It felt strangely relieving.

I'm not cured. I'm not suddenly okay. The thoughts are still there, whispering. But they don't feel as loud tonight.

When I looked at myself in the mirror earlier, I didn't immediately feel disgust. I just looked tired. And for the first time, I didn't hate that person looking back at me.

I don't know if this is how things start to shift. It's not dramatic. It's not some huge breakthrough.

It's just me sitting here, choosing to write instead of following the same pattern.

Maybe that counts.`,
      4,
      ['consistency', 'vulnerability', 'self-acceptance', 'small-shifts', 'hope']
    );
    
    // January 8, 2026 - Mom called, work awkward, went for a walk
    createEntry(
      new Date('2026-01-08'),
      `My mom called this morning and I almost didn't pick up.

I don't know why her voice always makes me feel twelve again. She asked if I was eating enough. I lied and said yes. She told me about the neighbor's new dog and how loud it is. Normal stuff. I kept staring at my wall while she talked, tracing a crack in the paint with my eyes.

At one point she said, "You sound tired." I laughed it off.

After the call I just sat there. It's strange how someone can love you and still not see you at all.

Work was awkward today. I spilled coffee on my shirt before a meeting and had to sit there with a brown stain near my collar like some kind of walking evidence that I can't even hold a cup properly. No one cared. I cared way too much.

The urge started building around late afternoon. I could feel it in my hands. That restless feeling. Like I needed to do something with all this tension.

I went for a walk after dinner instead of going straight to my room. I passed the bakery on the corner and the smell of fresh bread hit me. For a second I felt grounded. Like I was just a person walking home.

I'm in my room now.

It's loud in my head.

But I'm still just sitting here.`,
      3,
      ['family', 'work', 'coping', 'walking', 'resisting']
    );
    
    // January 9, 2026 - Saw ex at grocery store
    createEntry(
      new Date('2026-01-09'),
      `I saw my ex today.

I wasn't prepared for that.

I was standing in line at the grocery store holding a basket with frozen pizza and toothpaste, and suddenly they were two people ahead of me. Laughing. Looking fine. Like they hadn't shattered anything.

My chest actually hurt. I had to look down at my phone so I wouldn't stare. They didn't see me. Or maybe they did and chose not to react. I don't know which is worse.

All I could think was, how do you look so normal?

I came home feeling humiliated for no reason. It's been months. I should be over it. That word should feels heavy tonight.

The urge was immediate. Sharp. Like a reflex. I hated how predictable I am.

Afterwards I just lay on my bed and replayed the grocery store scene over and over. I imagined different versions where I looked confident. Unbothered. Strong.

Instead I looked small.

But here's something strange. I didn't cry. Not even once. I just felt the sadness move through me like a wave instead of swallowing me whole.

That has to mean something.`,
      2,
      ['trigger', 'ex', 'relapse', 'grief', 'reflection']
    );
    
    // January 11, 2026 - Sister's dinner, didn't do it
    createEntry(
      new Date('2026-01-11'),
      `I didn't write yesterday because I was at my sister's place for dinner.

She made pasta and talked about her new job the entire time. I nodded and smiled and helped clear the table. At one point she looked at my arms and paused. Not long. Just a flicker. Then she kept talking.

I don't know if she noticed or if I imagined it.

On the way home I felt exposed. Like I had walked around with a secret half hanging out of my pocket.

Tonight I sat on the edge of my bed and actually said out loud, "What do you want?" I don't know who I was talking to. Myself, I guess.

The answer wasn't pain. It was to not feel like a disappointment. It was to stop comparing myself to everyone else in that room last night.

I didn't do it tonight.

I came close. I picked up the blade. I turned it in my fingers.

Then I put it back in the drawer.

My hands were shaking for ten minutes after.

I don't feel triumphant. I feel fragile.

But I also feel… capable. A little.`,
      4,
      ['family', 'exposure', 'resisting', 'self-awareness', 'small-victory']
    );
    
    // January 13, 2026 - Work meeting, manager comment, writing instead
    createEntry(
      new Date('2026-01-13'),
      `Work was rough.

My manager pulled me aside and asked if everything was okay because I seemed "distracted lately." I wanted to laugh. If only she knew that distracted is the best version of me sometimes.

I told her I've just been sleeping badly. Another half truth.

The comment stuck with me all day. Am I that obvious? Can people tell something is off?

When I got home, I sat in the dark for a while without turning the lights on. The room felt safer that way. Smaller.

The urge showed up but it wasn't screaming. It was more like a whisper. A suggestion.

I opened this journal instead.

I wrote a whole page about the meeting at work. About how small I felt sitting in that chair. About how I'm terrified of being seen as weak.

Somewhere in the middle of writing, I realized something. I am exhausted from pretending.

Not from being sad. From hiding it.

That realization didn't fix anything. But it made the urge lose a bit of its power tonight.`,
      3,
      ['work', 'vulnerability', 'writing', 'self-awareness', 'coping']
    );
    
    // January 15, 2026 - Coffee with friend, admitted struggling
    createEntry(
      new Date('2026-01-15'),
      `I had coffee with that friend today.

I almost canceled. I typed out the message twice. But I went.

We sat by the window and talked about random things at first. Music. A show we both hate but still watch. Then there was this pause. The kind that feels like a door opening.

I said, "I've been struggling a bit lately."

My voice sounded smaller than I expected.

They didn't ask for details. They just said, "I'm really glad you told me." And then they told me about their own bad weeks. Not in a dramatic way. Just honest.

Walking home, I felt lighter. Not healed. Not magically different. Just less alone inside my own head.

The urges are still part of me. I won't lie about that. But tonight they feel further away. Like they're not the only option anymore.

I keep thinking about that moment in the café. About how the world didn't end when I admitted I'm not okay.

Maybe that's where this changes. Not in grand gestures.

Just in small, brave sentences.`,
      4,
      ['friendship', 'vulnerability', 'connection', 'hope', 'progress']
    );
    
    // Insert all entries
    await JournalEntry.insertMany(entries);
    journal.entriesCount = entries.length;
    await journal.save();
    
    console.log(`  ✓ Created ${entries.length} raw, authentic journal entries`);
    console.log(`  ✓ Entries span from January 3 to January 15, 2026`);
    console.log('\n✅ Successfully created anonymous_duck user and journal!');
    console.log(`   Username: anonymous_duck`);
    console.log(`   Password: password123`);
    console.log(`   Journal: "I cut myself everyday..." (Public)`);
    console.log(`   Entries: ${entries.length} entries (raw, messy, authentic)`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating anonymous_duck:', error);
    process.exit(1);
  }
}

// Run script
createAnonymousDuck();
