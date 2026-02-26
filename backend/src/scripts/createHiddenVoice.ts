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
      console.log('  ✓ User HiddenVoice already exists');
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
    
    // Check existing entries count
    const existingCount = await JournalEntry.countDocuments({ journal: journal._id });
    console.log(`  ✓ Found ${existingCount} existing entries`);
    
    // Create new entries to add
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
          { condition: 'PTSD', type: 'Complex PTSD', severity: mood <= 2 ? 'severe' : mood <= 4 ? 'moderate' : 'mild' },
          { condition: 'Depression', severity: mood <= 2 ? 'severe' : mood <= 4 ? 'moderate' : 'mild' },
          { condition: 'Anxiety Disorder', severity: mood <= 2 ? 'severe' : mood <= 4 ? 'moderate' : 'mild' },
        ],
        tags,
        isPrivate: false,
        fontFamily: 'palatino',
        createdAt: entryDate,
        updatedAt: entryDate,
      });
    };
    
    // February 11, 2025 - Half page, processing, feeling different
    createEntry(
      new Date('2025-02-11'),
      `It's been a few days since I told Sarah about the first time.

I keep thinking about it. About what I said. About how it felt to say it out loud.

I thought I would feel worse. More broken. More dirty. But I don't. I feel... different. Not good. Not bad. Just different.

Like maybe it's not a secret anymore. Like maybe it doesn't own me the way it used to.

I still have nightmares. I still have flashbacks. But they feel... less? Like they're not as strong. Like I'm not as trapped in them.

Maybe Sarah was right. Maybe talking about it does help.`,
      3,
      ['processing', 'different', 'less-power', 'hope']
    );
    
    // February 14, 2025 - Page-long, Valentine's Day, thinking about the future
    createEntry(
      new Date('2025-02-14'),
      `It's Valentine's Day.

I used to hate this day. All the couples. All the love. All the happiness. It made me feel more alone. More broken. More unlovable.

But today... I don't know. It's different.

I'm not in love. I'm not dating anyone. I probably won't for a long time. Maybe never. And that's okay.

But I'm starting to think... maybe I'm not unlovable. Maybe what happened to me doesn't make me broken. Maybe it just makes me... me.

I spent today with my family. My mom made my favorite dinner. My dad watched a movie with me. We didn't talk about anything heavy. We just... were together.

It was nice. Normal. Like maybe I can have normal things. Like maybe I'm allowed to be happy sometimes.

Sarah says I'm allowed to be happy. That I'm allowed to have good days. That I'm allowed to feel okay. That I'm allowed to heal.

I'm starting to believe her.

I'm not there yet. I know that. But I'm getting there. Slowly. One day at a time.

That's enough for now.`,
      4,
      ['valentines', 'future', 'hope', 'healing', 'allowed-to-be-happy']
    );
    
    // February 18, 2025 - Half page, group at therapy, hearing other stories
    createEntry(
      new Date('2025-02-18'),
      `Sarah asked if I wanted to try a group today.

At first I said no. The idea of sitting in a circle and talking about this stuff with strangers made my stomach hurt.

But I went anyway. I didn't talk. Not really. I just listened.

There were other kids there. Some older. Some younger. They talked about nightmares. About feeling dirty. About not trusting anyone. About blaming themselves.

They were saying the same things I think in my head.

It felt strange. And kind of comforting. Like maybe I'm not the only broken one.

I still don't know if I want to share. But I might go back.`,
      3,
      ['group-therapy', 'not-alone', 'listening', 'nervous']
    );
    
    // February 21, 2025 - Page-long, school project, deciding what to share
    createEntry(
      new Date('2025-02-21'),
      `We have to do a project at school about "something that changed your life."

I wanted to roll my eyes when the teacher said that. I could think of one thing that changed my life. But I'm not putting that on a poster board.

Maya asked what I'm going to do. I shrugged. Said maybe I'll talk about moving houses when I was little. Something safe. Something boring.

On the way home I kept thinking about it. About how this thing that happened to me does control so much of my life. And no one at school even knows.

I don't want to stand in front of the class and tell them everything. I don't owe them that.

But I decided to do my project on "how to help a friend who's not okay." Sarah helped me come up with ideas. Checking in. Listening. Not pushing. Not saying things like "just get over it."

I'm not saying it's about me. But it kind of is.

Maybe that's enough for now. Talking around it. Without giving it all away.`,
      4,
      ['school', 'project', 'indirect-sharing', 'friendship', 'coping']
    );
    
    // February 24, 2025 - Half page, a trigger that didn't win
    createEntry(
      new Date('2025-02-24'),
      `Today something happened that would've ruined my whole day before.

In class, the door slammed shut really hard. Out of nowhere. My heart jumped. My chest got tight. For a second I was back there. Small. Trapped.

But I did the breathing. In for four. Hold. Out for four.

It didn't make everything magically fine. I still felt shaky. But I stayed in my seat. I didn't run out of the room. I didn't freeze for ten minutes.

That feels big. Like the fear was there, but it didn't get to be the boss this time.`,
      4,
      ['trigger', 'coping', 'breathing', 'small-win']
    );
    
    // February 27, 2025 - Page-long, looking ahead without a neat ending
    createEntry(
      new Date('2025-02-27'),
      `Sarah asked me today if I ever think about the future.

I told her I don't. Not really. Most days I'm just trying to get through school, through the night, through the next flashback.

She asked me to try anyway. Just for a minute. To imagine myself older. Away from all of this.

At first my brain went blank. Then I saw something small. Me in a room that feels safe. With my own things. With a lock I control. With no one walking in without knocking.

I don't see big things yet. No job. No partner. No "dream life." Just that room. That door. That feeling of not having to be scared all the time.

It doesn't feel like a movie ending. There's no big music. No slow motion hug.

It's just a quiet picture in my head that doesn't hurt to look at.

I don't know if I'll ever get there. But for the first time, when I think about the future, I don't only see him.

I see me.`,
      3,
      ['future', 'imagining', 'safety', 'no-neat-ending', 'hope']
    );
    
    // March 3, 2025 - Half page, ordinary day that still feels strange
    createEntry(
      new Date('2025-03-03'),
      `Today was boring.

I mean that in a good way.

I went to school. Did my work. Forgot my pen. Borrowed one from Maya. We made fun of a dumb worksheet. I came home. Ate dinner. Watched a show. That's it.

No huge breakdown. No giant trigger. No big conversation.

Halfway through the day I realized I hadn't thought about him for a few hours. As soon as I noticed, the thoughts came back. But still. There was a gap.

It's weird how being okay can feel just as unfamiliar as being scared.`,
      4,
      ['ordinary-day', 'small-gap', 'strange-okay', 'school']
    );
    
    // March 8, 2025 - Page-long, a bad night, but different response
    createEntry(
      new Date('2025-03-08'),
      `Last night was rough.

Nightmare again. The same one. Door. Bed. Him. My body doing that frozen thing even though I'm asleep.

I woke up shaking and sweating. For a second I couldn't remember where I was. My chest hurt. My hands were numb.

Old me would've just laid there alone and tried to pretend it wasn't happening.

This time I went to my mom's room. I stood in the doorway for a minute, feeling stupid, then I just said, "I had a bad dream."

She moved over without saying anything and let me lie down next to her. She didn't ask for details. She just rubbed my back and breathed slowly so I could match her.

I still didn't sleep great after that. But I wasn't alone. And that made it less horrible.

I hate that the nightmares are still here. But I guess the difference is I don't have to get through them by myself anymore.`,
      2,
      ['nightmare', 'asking-for-help', 'mom', 'not-alone']
    );
    
    // March 12, 2025 - Half page, not a conclusion, just another step
    createEntry(
      new Date('2025-03-12'),
      `Sarah asked me today if I ever look back at where I started.

I don't like thinking about the beginning. But she meant something else. She meant the first time I walked into her office. The first time I wrote in this journal. The first time I said "it happened" out loud.

I guess things are different now.

I still have bad days. I still get scared for no reason. I still have moments where I feel dirty and wrong and broken.

But there are also days where I laugh without feeling guilty. Moments where I feel safe in my own room. Nights where I sleep all the way through.

It doesn't feel like a happy ending. More like I'm somewhere in the middle of a really long book.

I'm tired. But I'm still here. And for now, that's enough.`,
      3,
      ['middle', 'progress', 'still-here', 'no-ending']
    );
    
    // Check for existing entries with same content to avoid duplicates
    const existingEntries = await JournalEntry.find({ journal: journal._id }).select('content createdAt');
    const existingContentSet = new Set(existingEntries.map(e => e.content.trim()));
    
    // Filter out entries that already exist (exact content match)
    const newEntries = entries.filter(entry => !existingContentSet.has(entry.content.trim()));
    
    // Insert only new entries
    if (newEntries.length > 0) {
      await JournalEntry.insertMany(newEntries);
      journal.entriesCount = existingCount + newEntries.length;
      await journal.save();
      console.log(`  ✓ Added ${newEntries.length} new journal entries (skipped ${entries.length - newEntries.length} duplicates)`);
      console.log(`  ✓ Total entries: ${journal.entriesCount}`);
    } else {
      console.log('  ⚠️  No new entries to add (all entries already exist)');
    }
    console.log('\n✅ Successfully updated HiddenVoice journal!');
    console.log(`   Journal: "My uncle touches me" (Public)`);
    console.log(`   Total entries: ${journal.entriesCount}`);
    
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
