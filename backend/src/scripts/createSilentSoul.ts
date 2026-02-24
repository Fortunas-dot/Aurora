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
    
    // Create 5 raw, authentic entries
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
          { condition: 'PTSD', severity: mood <= 2 ? 'moderate' : mood <= 4 ? 'moderate' : 'mild' },
          { condition: 'Anxiety Disorder', severity: mood <= 2 ? 'severe' : mood <= 4 ? 'moderate' : 'mild' },
        ],
        tags,
        isPrivate: false,
        fontFamily: 'palatino',
        createdAt: entryDate,
        updatedAt: entryDate,
      });
    };
    
    // January 3, 2026 - First entry, very dark, page-long
    createEntry(
      new Date('2026-01-03'),
      `I don't want to exist anymore.

There. I wrote it down. It feels different seeing it on paper. More real. More permanent.

I've been thinking about it for months. Maybe longer. I don't know when it started. The thoughts just crept in slowly until they were all I could think about. Every morning I wake up and the first thing I feel is disappointment that I'm still here. That I have to do this again. Get up. Get dressed. Pretend.

Work was fine today. I smiled at the right people. I laughed at the right jokes. I looked completely normal. No one would guess that I spent my lunch break in the bathroom stall, staring at my phone, googling methods. Reading about how long it takes. How much it hurts. Whether it's guaranteed.

I keep telling myself everyone would be better off. My mom wouldn't have to worry about me anymore. My friends wouldn't have to deal with my constant sadness. My boss wouldn't have to accommodate my bad days. They'd be sad at first, sure. But then they'd move on. They'd realize how much easier life is without me dragging them down.

I made a plan today. A real one. Not just thoughts. I know where. I know how. I know when. I've been collecting the things I need. Hiding them in a box under my bed. It's almost complete. Just a few more things and then... then I can stop.

The weird part is I'm not scared. I thought I'd be terrified. But I feel calm. Relieved. Like there's finally an end to this. A way out of the pain. The emptiness. The nothingness that's been eating me alive.

I don't want to exist anymore. And I think that's okay.`,
      1,
      ['suicide', 'dark', 'planning', 'hopeless', 'isolation']
    );
    
    // January 5, 2026 - Still dark, shorter entry
    createEntry(
      new Date('2026-01-05'),
      `I didn't write yesterday. I couldn't. The thoughts were too loud. Too overwhelming.

Today I went to the store and bought the last thing I need. The cashier smiled at me. Asked if I was having a good day. I said yes. I'm always saying yes.

I'm ready. I think I'm ready.`,
      1,
      ['suicide', 'preparation', 'isolation', 'dark']
    );
    
    // January 7, 2026 - Page-long, questioning
    createEntry(
      new Date('2026-01-07'),
      `I almost did it last night.

I had everything set up. I was ready. I sat there for what felt like hours, just holding it. My hands were shaking. My heart was racing. I kept thinking about my mom. About how she'd find me. About the sound she'd make. The way her face would look.

I thought about my best friend, Sarah. We were supposed to get coffee next week. I'd already canceled twice. She probably thinks I'm avoiding her. I am. But not for the reason she thinks.

I thought about my cat. Who would take care of him? Would anyone even notice he was hungry? Would he sit by the door waiting for me to come home?

I thought about all the things I'd never do. The places I'd never see. The people I'd never meet. The person I might become if I just... stayed.

And then I put everything away. I put it all back in the box. Under the bed. Where it's been for weeks.

I don't know why I didn't do it. I don't know if I'm relieved or disappointed. I just know that right now, in this moment, I'm still here.

Maybe that means something. Maybe it doesn't.

I'm so tired.`,
      2,
      ['suicide', 'crisis', 'questioning', 'guilt', 'exhaustion']
    );
    
    // January 9, 2026 - Half page, reaching out
    createEntry(
      new Date('2026-01-09'),
      `I called the crisis line today.

I don't know why. I was sitting in my car after work, and the thoughts were so loud. So overwhelming. I couldn't breathe. I couldn't think. I just needed someone to hear me. To know I exist. Even if it's just for a few minutes.

The woman on the phone had a calm voice. She asked me my name. I said I didn't want to give it. She said that was okay. She asked if I was safe right now. I said I think so. She asked if I had a plan. I said yes. She didn't panic. She just listened.

I told her I don't want to exist anymore. That I'm tired. That I'm a burden. That everyone would be better off.

She said, "I'm really glad you called. That took courage."

I cried. I don't know why. I just cried.

She stayed on the phone with me for almost an hour. We didn't solve anything. But for a moment, just a moment, I felt less alone.

Maybe that's enough for tonight.`,
      2,
      ['crisis-line', 'reaching-out', 'vulnerability', 'connection']
    );
    
    // January 11, 2026 - Short entry, small shift
    createEntry(
      new Date('2026-01-11'),
      `I told Sarah.

Not everything. But enough. I said I've been struggling. That I've been having dark thoughts. That I don't want to exist sometimes.

She didn't freak out. She didn't tell me I was being dramatic. She just hugged me. Hard. And said, "I'm so glad you told me. I'm here. I'm not going anywhere."

I'm still here too. For now.`,
      3,
      ['vulnerability', 'friendship', 'support', 'small-hope']
    );
    
    // January 13, 2026 - Page-long, therapy appointment
    createEntry(
      new Date('2026-01-13'),
      `I had my first therapy appointment today.

Sarah helped me find someone. She called around. Made the appointment. Even offered to come with me. I said no. I needed to do this alone.

I sat in the waiting room for twenty minutes before my appointment time. I almost left three times. My hands were shaking. My heart was racing. I kept thinking, what if they lock me up? What if they think I'm too broken? What if I'm wasting their time?

Dr. Martinez came out and called my name. She was younger than I expected. Had kind eyes. She led me to her office and we just sat there for a moment. She asked me what brought me in today.

I couldn't say it at first. I just sat there, staring at my hands. She waited. Didn't rush me. Didn't fill the silence with questions. Just waited.

Finally I said, "I don't want to exist anymore."

She nodded. Like it wasn't shocking. Like she'd heard it before. She asked if I had a plan. I said yes. She asked if I had the means. I said yes. She asked if I had a timeline. I said soon.

She didn't panic. She didn't call security. She just asked me if I wanted to be here. If I wanted help. I said I don't know. She said that's okay. That not knowing is a start.

We talked for an hour. About the thoughts. About the pain. About the emptiness. About how long I've felt this way. About what I think would happen if I was gone. About who would miss me.

I cried. A lot. More than I've cried in months. Maybe years.

At the end, she asked if I could make a safety plan. If I could promise to call the crisis line or go to the hospital if the thoughts got too strong. I said I'd try.

She said that's enough. That trying is enough.

I'm seeing her again next week.`,
      2,
      ['therapy', 'first-appointment', 'vulnerability', 'safety-plan', 'crying']
    );
    
    // January 15, 2026 - Short entry, bad day
    createEntry(
      new Date('2026-01-15'),
      `Bad day today.

The thoughts are back. Loud. Screaming. I opened the box under my bed. Just to look. Just to remember it's still there.

I didn't do anything. But I wanted to. So badly.

I'm still here. Barely.`,
      1,
      ['bad-day', 'struggling', 'urges', 'resisting']
    );
    
    // January 17, 2026 - Half page, small moment
    createEntry(
      new Date('2026-01-17'),
      `Sarah came over today. Unannounced. She said she was in the neighborhood, but I know she was checking on me.

She brought food. Chinese takeout. My favorite. We sat on my floor and ate straight from the containers. Watched some stupid reality show. Laughed at how ridiculous it was.

For a few hours, I forgot. I forgot about the box under my bed. I forgot about the plan. I forgot about the thoughts. I was just a person, eating food with a friend, watching TV.

It didn't last. The thoughts came back as soon as she left. But for those few hours, I existed. Not just survived. Existed.

Maybe that counts for something.`,
      3,
      ['friendship', 'distraction', 'small-moments', 'existing']
    );
    
    // January 19, 2026 - Page-long, second therapy session
    createEntry(
      new Date('2026-01-19'),
      `Second therapy session today.

I almost canceled. I woke up feeling worse than usual. The thoughts were so loud. So persistent. I kept thinking, what's the point? What's the point of talking? What's the point of trying? I'm broken. I'm unfixable. I'm too far gone.

But I went. I don't know why. Maybe because Sarah would be disappointed if I didn't. Maybe because I made a promise. Maybe because some tiny part of me still wants to believe this could work.

Dr. Martinez asked how my week was. I told her about the bad day. About opening the box. About how close I came. She didn't judge. She just listened.

We talked about what happens right before the thoughts get really strong. What triggers them. What makes them worse. I said I don't know. She said that's okay. That we'll figure it out together.

She asked me to think about what I felt when Sarah came over. When I forgot about everything for a few hours. I said I felt... normal. Like a regular person. She asked if I wanted to feel that more often. I said yes. I think I meant it.

We talked about safety. About what to do when the thoughts get too strong. She gave me a list. Crisis line. Text Sarah. Go to the hospital. Call her. She said I'm not alone in this. That there are people who want to help.

I don't know if I believe that yet. But I'm trying.

I'm still here. Still fighting. Still trying.`,
      2,
      ['therapy', 'safety-plan', 'triggers', 'trying', 'hope']
    );
    
    // January 21, 2026 - Short entry, small shift
    createEntry(
      new Date('2026-01-21'),
      `I didn't write yesterday. Nothing happened. Just another day of existing.

Today I moved the box. From under my bed to the top shelf of my closet. Where I can't reach it easily. Where I'd have to think about it. Where I'd have to make a conscious choice.

It's still there. But it's harder to get to now.

That feels like something.`,
      3,
      ['small-steps', 'barriers', 'choice', 'progress']
    );
    
    // January 23, 2026 - Page-long, relapse thoughts
    createEntry(
      new Date('2026-01-23'),
      `The thoughts came back hard today.

I don't know what triggered it. Maybe nothing. Maybe everything. I woke up and immediately felt the weight. The heaviness. The emptiness. Like I was drowning in my own bed.

Work was impossible. I kept zoning out. Staring at my screen. My manager asked if I was okay. I said I was fine. Always fine. Always okay. Always lying.

I came home and the first thing I thought was, I could get the box down. It wouldn't be that hard. I could stand on a chair. It would only take a minute. Then I could stop. I could finally stop.

I sat on my bed for what felt like hours. Just thinking about it. Planning it. Imagining it. The relief. The peace. The end.

But I didn't do it.

I called Sarah instead. I didn't tell her what I was thinking. I just said I was having a bad day. She came over. Brought ice cream. We watched a movie. She didn't ask questions. She just stayed.

The thoughts are still here. Still loud. Still persistent. But I'm still here too.

I don't know if that's winning or losing. But it's something.`,
      2,
      ['relapse', 'triggers', 'resisting', 'support', 'struggling']
    );
    
    // January 25, 2026 - Short entry, therapy breakthrough
    createEntry(
      new Date('2026-01-25'),
      `Therapy today was different.

We talked about my mom. About how she's always worried. About how I feel like I'm disappointing her just by existing. By being broken.

Dr. Martinez asked me what I think my mom would say if I was gone. I said she'd be devastated. She'd blame herself. She'd never recover.

She asked if that sounds like someone who would be better off without me.

I cried. A lot.

Maybe I'm not a burden. Maybe I'm just... struggling.`,
      3,
      ['therapy', 'family', 'breakthrough', 'self-worth', 'crying']
    );
    
    // January 27, 2026 - Half page, small win
    createEntry(
      new Date('2026-01-27'),
      `I went to the grocery store today.

That sounds stupid. But I haven't been in weeks. I've been living on delivery and whatever Sarah brings me. I just couldn't make myself go. Too many people. Too much noise. Too much existing in public.

But today I did it. I got dressed. I drove there. I walked through the doors. I bought food. Real food. Vegetables. Things that require cooking.

I didn't have a panic attack. I didn't break down. I just... did it.

When I got home, I actually cooked. Made pasta. Burned it a little. But I made it. I ate it. I felt like a person.

Small things. But they feel big right now.`,
      4,
      ['small-wins', 'cooking', 'self-care', 'progress', 'normalcy']
    );
    
    // January 29, 2026 - Page-long, crisis and choice
    createEntry(
      new Date('2026-01-29'),
      `I almost did it last night.

The thoughts were so strong. So overwhelming. I couldn't breathe. I couldn't think. I just wanted it to stop. All of it. The pain. The emptiness. The nothingness. I just wanted it to stop.

I got the chair. I stood on it. I reached for the box. My hands were shaking. My whole body was shaking. I could feel my heart racing. My chest tight. I couldn't breathe.

I had the box in my hands. I was going to do it. I was really going to do it.

But then I thought about therapy. About Dr. Martinez asking me to make a safety plan. About promising to call if it got this bad.

I thought about Sarah. About how she came over when I called. About how she stayed. About how she didn't judge. About how she just... cared.

I thought about my mom. About how devastated she'd be. About how she'd blame herself. About how she'd never recover.

I thought about the crisis line. About the woman with the calm voice. About how she said I was brave for calling.

I put the box back. I got down from the chair. I put the chair away.

I called the crisis line. I talked to someone. They stayed on the phone with me until I felt safe. Until the thoughts quieted down. Until I could breathe again.

I'm still here.

I don't know if I'm glad or disappointed. But I'm here.`,
      2,
      ['crisis', 'almost-relapse', 'safety-plan', 'crisis-line', 'choice', 'surviving']
    );
    
    // January 31, 2026 - Short entry, reflection
    createEntry(
      new Date('2026-01-31'),
      `It's been almost a month since I started writing this.

I'm still here. Still fighting. Still trying.

The thoughts are still there. They still come. They still hurt. But I'm learning. Learning to call for help. Learning to reach out. Learning that maybe, just maybe, I'm not as alone as I thought.

I don't know if I want to exist yet. But I'm starting to think maybe I don't have to want to. Maybe I can just... exist. And that's enough for now.`,
      3,
      ['reflection', 'progress', 'month-marker', 'acceptance', 'hope']
    );
    
    // February 2, 2026 - Page-long, therapy session about the crisis
    createEntry(
      new Date('2026-02-02'),
      `I told Dr. Martinez about what happened on the 29th. About almost getting the box. About calling the crisis line.

She didn't judge. She didn't panic. She just asked me what I learned from it. What worked. What didn't.

I said calling for help worked. That reaching out worked. That having a safety plan worked. Even when I didn't think it would.

She asked me how I felt after I called. I said relieved. Exhausted. But also... proud? Like I'd done something hard. Something I didn't think I could do.

She said that's progress. Real progress. That every time I choose to stay, I'm building new pathways in my brain. New ways of coping. New ways of surviving.

We talked about the box. About whether I should get rid of it completely. I said I'm not ready. That having it there, even if it's hard to reach, feels like having an option. A way out if things get too bad.

She said that's okay. That I don't have to be ready. That recovery isn't linear. That it's okay to hold onto safety nets while I'm learning to trust other ones.

I left feeling lighter. Not fixed. Not cured. But lighter. Like maybe, just maybe, I'm not as broken as I thought.`,
      3,
      ['therapy', 'processing', 'crisis-reflection', 'progress', 'safety-nets']
    );
    
    // February 4, 2026 - Short entry, bad day but different
    createEntry(
      new Date('2026-02-04'),
      `Bad day today. The thoughts came back. Strong. Persistent.

But I didn't get the chair. I didn't reach for the box. I called Sarah instead. And then I called the crisis line. And then I went for a walk.

I'm still here. Still fighting. Still choosing to stay.

That feels different.`,
      2,
      ['bad-day', 'coping-skills', 'reaching-out', 'choice']
    );
    
    // February 6, 2026 - Half page, small moment of connection
    createEntry(
      new Date('2026-02-06'),
      `Sarah dragged me to a coffee shop today. I didn't want to go. I wanted to stay in bed. Stay hidden. Stay safe.

But I went. We sat by the window. I ordered something I'd never tried before. A lavender latte. It was weird. But good weird.

A woman at the next table smiled at me. Just a small smile. Nothing big. But it caught me off guard. I smiled back. For a second, I felt... seen. Not in a bad way. Just seen.

We stayed for two hours. Talked about nothing important. Just... existed together. In public. Like normal people.

When I got home, I realized I hadn't thought about the box once. Not the whole time.

Maybe that's what existing feels like. Not wanting to. Not hating it. Just... being.`,
      4,
      ['social', 'coffee', 'small-moments', 'connection', 'existing']
    );
    
    // February 8, 2026 - Page-long, therapy breakthrough about worth
    createEntry(
      new Date('2026-02-08'),
      `Therapy was hard today. Really hard.

Dr. Martinez asked me to write a letter. To myself. From the perspective of someone who loves me. Someone who would be devastated if I was gone.

I wrote it from my mom's perspective. About how she'd feel. About what she'd say. About how much she'd miss me. About how she'd never recover. About how I'm not a burden. How I'm loved. How I matter.

I cried the whole time I was writing it. Big, ugly, snotty tears. The kind that make your face hurt.

When I read it out loud, I couldn't finish. I just sat there, sobbing. Dr. Martinez waited. Didn't rush me. Just waited.

Finally I said, "I don't believe it. I don't believe any of it."

She said, "That's okay. You don't have to believe it yet. But you wrote it. You said it out loud. That's a start."

We talked about why it's so hard to believe. About how the depression lies. About how it tells me I'm worthless. About how it's wrong.

I don't believe it yet. But I'm starting to question it. Starting to wonder if maybe, just maybe, the depression is wrong. If maybe I'm not as worthless as I think.

That feels scary. And also... hopeful?`,
      3,
      ['therapy', 'breakthrough', 'self-worth', 'letter', 'depression-lies', 'hope']
    );
    
    // February 10, 2026 - Short entry, small shift
    createEntry(
      new Date('2026-02-10'),
      `I looked at the box today. Still on the top shelf. Still there. Still an option.

But I didn't get the chair. I didn't reach for it. I just looked at it. Acknowledged it. And then I closed the closet door.

I'm still here. Still choosing to stay. Still fighting.

The thoughts are quieter today. Not gone. But quieter.

Maybe that's enough.`,
      3,
      ['box', 'choice', 'resisting', 'progress', 'quiet-thoughts']
    );
    
    // Insert all entries
    await JournalEntry.insertMany(entries);
    journal.entriesCount = entries.length;
    await journal.save();
    
    console.log(`  ✓ Created ${entries.length} raw, authentic journal entries`);
    console.log(`  ✓ Entries span from January 3 to February 10, 2026`);
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
