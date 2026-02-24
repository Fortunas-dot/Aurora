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

async function createBrokenWings() {
  try {
    console.log('🦋 Creating BrokenWings user and journal...');
    
    // Connect to database
    await connectDB();
    
    // Check if user already exists
    let user = await User.findOne({ username: 'BrokenWings' });
    
    if (user) {
      console.log('  ⚠️  User BrokenWings already exists');
      // Delete existing journal entries and journal
      await JournalEntry.deleteMany({ author: user._id });
      await Journal.deleteMany({ owner: user._id });
      console.log('  ✓ Deleted existing journal entries and journal');
    } else {
      // Create user
      const hashedPassword = await bcrypt.hash('password123', 10);
      user = await User.create({
        email: 'brokenwings@example.com',
        password: hashedPassword,
        username: 'BrokenWings',
        displayName: 'Broken Wings',
        bio: 'Learning to fly again after the storm...',
        isAnonymous: true,
        isProtected: false,
        healthInfo: {
          mentalHealth: [
            { condition: 'PTSD', type: 'Complex PTSD', severity: 'severe' },
            { condition: 'Depression', severity: 'moderate' },
            { condition: 'Anxiety Disorder', severity: 'severe' }
          ]
        }
      });
      console.log('  ✓ Created user: BrokenWings');
    }
    
    // Create public journal
    let journal = await Journal.findOne({ owner: user._id, name: 'The night that changed everything' });
    
    // Copy cover image from assets to public directory (which is committed to git)
    const publicDir = path.join(__dirname, '../../public');
    const coverImageName = 'night-journal-cover.jpg';
    const coverImagePath = path.join(publicDir, coverImageName);
    const sourceImagePath = path.join(__dirname, '../../../frontend/assets/night.jpg');
    
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
    const coverImageUrl = '/public/night-journal-cover.jpg';
    
    if (!journal) {
      journal = await Journal.create({
        owner: user._id,
        name: 'The night that changed everything',
        description: 'Processing trauma, one word at a time. This is my story of survival and healing.',
        isPublic: true,
        entriesCount: 0,
        topics: ['ptsd', 'trauma', 'recovery', 'mental-health'],
        coverImage: coverImageUrl,
      });
      console.log('  ✓ Created public journal: "The night that changed everything"');
      console.log('  ✓ Added cover image (night.jpg from assets)');
    } else {
      // Update existing journal with cover image
      journal.coverImage = coverImageUrl;
      await journal.save();
      console.log('  ✓ Updated journal with cover image (night.jpg from assets)');
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
    
    // January 3, 2026 - First entry, very dark, page-long
    createEntry(
      new Date('2026-01-03'),
      `I can't sleep again.

Every time I close my eyes, I see it. That night. The night that changed everything. I don't want to think about it. But I can't stop. My body remembers even when my mind tries to forget.

I was driving home. It was late. Raining. I remember the rain. How it made everything blurry. How I could barely see. I was tired. Should have pulled over. Should have stopped. But I kept going. Just wanted to get home.

Then the other car. Coming at me. Too fast. Wrong side of the road. I tried to swerve. But it was too late. The crash. The sound. Like nothing I've ever heard. Metal on metal. Glass breaking. My head hitting the window.

Then the fire. I don't know how it started. But I could smell it. The smoke. Burning. I was stuck. Couldn't move. Couldn't get out. I thought I was going to die. Right there. In my car. Alone.

Someone pulled me out. I don't remember who. Just hands. Pulling. Dragging. Then the ambulance. The hospital. The pain. So much pain.

But that's not the worst part. The worst part is I keep going back there. Every night. In my dreams. I'm back in that car. Stuck. Burning. Dying. I wake up screaming. Covered in sweat. My heart racing. Can't breathe.

I can't do this anymore.`,
      1,
      ['trauma', 'nightmare', 'crash', 'flashback', 'dark']
    );
    
    // January 5, 2026 - Still dark, shorter entry
    createEntry(
      new Date('2026-01-05'),
      `Had a flashback at work today.

I was in a meeting. Someone slammed a door. Just a door. But the sound. It was like the crash. Like the impact. Suddenly I wasn't in the meeting anymore. I was back there. In the car. I could smell the smoke. Feel the heat. Taste the blood.

My coworker had to shake me. Bring me back. I was shaking. Couldn't talk. Everyone was staring.

I'm so tired of this.`,
      1,
      ['flashback', 'trigger', 'work', 'embarrassed']
    );
    
    // January 7, 2026 - Page-long, trying to understand
    createEntry(
      new Date('2026-01-07'),
      `I looked it up today. What's wrong with me. Why I can't sleep. Why I keep going back there. Why every sound makes me jump. Why I can't feel safe anymore.

It has a name. PTSD. Post-traumatic stress disorder. I read about it. About how your brain gets stuck. Stuck in that moment. That night. The night that changed everything. Your body thinks it's still happening. Still in danger. So it stays alert. Always ready. Always waiting for the next threat.

That's why I can't sleep. Why I jump at every sound. Why I can't relax. My body is trying to protect me. But it's stuck. Stuck in that moment.

I read about flashbacks. About how they happen. How your brain can't tell the difference between then and now. How you can be sitting in a meeting and suddenly you're back there. In the car. In the fire. In the pain.

I read about nightmares. About how your brain tries to process what happened. But it can't. So it just keeps replaying it. Over and over. The same nightmare. Every night.

I don't know if knowing this helps. But at least I know I'm not crazy. I'm not weak. This is real. This is what happens after something like that.

I'm thinking about getting help. Maybe therapy. I don't know.`,
      2,
      ['understanding', 'ptsd', 'research', 'help', 'therapy']
    );
    
    // January 9, 2026 - Half page, reaching out
    createEntry(
      new Date('2026-01-09'),
      `I called a therapist today.

I found one online. Specializes in trauma. PTSD. I was so nervous. My hands were shaking when I dialed. But I did it. I made an appointment.

It's next week. I'm scared. But I have to try something. I can't keep living like this. Can't keep going back there every night. Can't keep having flashbacks at work. Can't keep jumping at every sound.

I have to try.`,
      2,
      ['therapy', 'appointment', 'scared', 'trying']
    );
    
    // January 11, 2026 - Short entry, first therapy session
    createEntry(
      new Date('2026-01-11'),
      `I went to therapy today.

I almost didn't go. Sat in my car outside the building for twenty minutes. Almost drove away. But I went in.

We talked. About that night. About what happened. About how I feel now. About the nightmares. The flashbacks. The fear.

She said it's normal. That what I'm feeling is normal after something like that. That I'm not broken. That I can get better.

I don't know if I believe her yet. But I'm going back next week.`,
      2,
      ['therapy', 'first-session', 'talking', 'hope']
    );
    
    // January 13, 2026 - Page-long, bad night, nightmare
    createEntry(
      new Date('2026-01-13'),
      `Last night was bad.

The nightmare came back. The same one. Always the same one. I'm in the car. It's raining. I can't see. Then the other car. Coming at me. Too fast. The crash. The sound. The fire. The smoke. I'm stuck. Can't move. Can't breathe. Burning. Dying.

I woke up screaming. My roommate came running. Asked if I was okay. I couldn't talk. Just shaking. Crying. She sat with me. Didn't ask questions. Just sat there. Until I could breathe again.

I didn't go back to sleep. Just sat on my bed. Staring at the wall. Waiting for morning. Waiting for the sun. Anything to make the dark go away.

Work was hard today. I was so tired. Couldn't focus. Kept zoning out. My boss asked if I was okay. I said I was fine. Always fine. Always lying.

I'm so tired of this. So tired of going back there. Every night. Over and over. The same nightmare. The same fear. The same pain.

I have therapy tomorrow. Maybe I'll tell her about the nightmare. Maybe she can help.`,
      1,
      ['nightmare', 'bad-night', 'roommate', 'exhausted', 'therapy']
    );
    
    // January 15, 2026 - Half page, therapy session about nightmare
    createEntry(
      new Date('2026-01-15'),
      `I told her about the nightmare today. Dr. Chen. My therapist.

I cried. A lot. More than I wanted to. But she just listened. Didn't judge. Didn't tell me to get over it. Just listened.

She asked me to describe it. The nightmare. In detail. It was hard. So hard. But I did it. I told her everything. The rain. The crash. The fire. The fear.

She said nightmares are normal. That my brain is trying to process what happened. That it's stuck. That we can help it get unstuck.

She taught me something. A way to ground myself when I wake up from a nightmare. Five things I can see. Four things I can touch. Three things I can hear. Two things I can smell. One thing I can taste.

I'm going to try it next time.`,
      2,
      ['therapy', 'nightmare', 'crying', 'grounding', 'tools']
    );
    
    // January 17, 2026 - Short entry, trigger at store
    createEntry(
      new Date('2026-01-17'),
      `Had a trigger at the grocery store today.

A car alarm went off. The sound. It was like the crash. Like the impact. My heart started racing. Couldn't breathe. Thought I was going to pass out.

I used the grounding thing. The one Dr. Chen taught me. Five things I can see. Four things I can touch. Three things I can hear. Two things I can smell. One thing I can taste.

It helped. A little. I didn't have a full flashback. Just panic. But I got through it.

That's something, right?`,
      2,
      ['trigger', 'store', 'grounding', 'coping', 'progress']
    );
    
    // January 19, 2026 - Page-long, therapy breakthrough
    createEntry(
      new Date('2026-01-19'),
      `Therapy was different today.

Dr. Chen asked me to talk about what happened after. After the crash. After the hospital. How I felt. How I feel now.

I told her about the guilt. How I keep thinking I should have done something different. Should have seen the other car sooner. Should have swerved faster. Should have pulled over when I was tired. Should have, should have, should have.

She stopped me. Asked me if I think I caused the crash. I said no. The other car was on the wrong side of the road. Going too fast. It wasn't my fault.

She asked why I feel guilty then.

I didn't have an answer. I just sat there. Thinking. Why do I feel guilty? I didn't do anything wrong. I was just driving home. It wasn't my fault.

She said sometimes we feel guilty because we survived. Because we made it. And someone else didn't. Or because we think we should have been able to stop it. To prevent it. But we can't. We couldn't.

I cried. Again. But this time it felt different. Like I was letting something go. Something I'd been carrying for too long.

I don't know if the guilt is gone. But it feels lighter.`,
      3,
      ['therapy', 'guilt', 'breakthrough', 'survivor-guilt', 'crying']
    );
    
    // January 21, 2026 - Short entry, small progress
    createEntry(
      new Date('2026-01-21'),
      `I slept a little better last night.

The nightmare still came. But when I woke up, I used the grounding thing. Five things I can see. Four things I can touch. Three things I can hear. Two things I can smell. One thing I can taste.

I could feel my heart slow down. My breathing get easier. I didn't scream. Didn't wake my roommate.

I went back to sleep. Eventually.

It's not perfect. But it's something.`,
      3,
      ['sleep', 'nightmare', 'grounding', 'progress', 'small-wins']
    );
    
    // January 23, 2026 - Page-long, talking about the crash in detail
    createEntry(
      new Date('2026-01-23'),
      `Therapy was really hard today.

Dr. Chen asked me to describe the crash. In detail. Everything I remember. From the beginning. I didn't want to. I've been trying to forget. But she said we need to talk about it. To process it. To help my brain understand it's over. That I'm safe now.

So I did. I told her everything. How I was driving home from work. How tired I was. How I should have pulled over. But I didn't. I just wanted to get home. To my bed. To sleep.

I told her about the rain. How heavy it was. How it made everything blurry. How I could barely see the road. How I was going slow. Being careful. But it wasn't enough.

I told her about seeing the other car. Coming at me. Too fast. Wrong side of the road. How I tried to swerve. Tried to get out of the way. But it was too late. There was nowhere to go.

I told her about the impact. The sound. Like nothing I've ever heard. Metal crushing. Glass breaking. My head hitting the window. The pain. So much pain.

I told her about the fire. How it started. I don't know how. But suddenly there was smoke. Everywhere. I couldn't breathe. Couldn't see. I was stuck. Couldn't move my legs. Couldn't get out. I thought I was going to die. Right there. In my car. Alone.

I told her about the person who pulled me out. I don't know who it was. Just hands. Pulling. Dragging. Getting me away from the fire. Away from the car. Laying me on the ground. The rain on my face. The cold. The relief.

I told her about the ambulance. The hospital. The pain. The fear. Not knowing if I was going to be okay. Not knowing if I'd ever walk again. Not knowing anything.

I cried the whole time. Big, ugly tears. But I did it. I said it all out loud. Made it real. Made it something I could talk about. Not just something that lives in my nightmares.

Dr. Chen said I was brave. That it takes courage to face what happened. That talking about it is the first step to healing.

I don't feel brave. I feel broken. But maybe that's okay.`,
      2,
      ['therapy', 'talking', 'crash', 'processing', 'crying', 'brave']
    );
    
    // January 25, 2026 - Page-long, flashback at work, using tools
    createEntry(
      new Date('2026-01-25'),
      `I had another flashback at work today.

It was a normal day. Normal meeting. Normal people. Normal sounds. Then someone dropped something. A heavy folder. Hit the floor with a thud. The sound. It was like the crash. Like the impact. Like my world breaking.

Suddenly I wasn't in the meeting anymore. I was back there. In the car. In the rain. I could smell the smoke. Feel the heat. Taste the blood. My heart was racing. I couldn't breathe. I thought I was going to die. Right there. In the conference room.

But then I remembered. The grounding thing. Five things I can see. The table. The chairs. The window. The clock. The pen in my hand. Four things I can touch. My shirt. The table. My hair. My face. Three things I can hear. The air conditioning. Someone typing. My own breathing. Two things I can smell. Coffee. My perfume. One thing I can taste. The mint from my gum.

I kept saying it in my head. Over and over. Five things I can see. Four things I can touch. Three things I can hear. Two things I can smell. One thing I can taste.

Slowly, slowly, I came back. The smoke faded. The heat faded. The fear faded. I was back in the meeting. Back in the present. Safe.

My coworker was looking at me. Asked if I was okay. I said I was fine. Just zoned out for a second. They didn't push. Just nodded.

I didn't have a full flashback. Not like before. I came back. I used my tools. It worked. It actually worked.

I'm still shaking. Still scared. But I'm here. I'm safe. I got through it.`,
      2,
      ['flashback', 'work', 'grounding', 'tools', 'coping', 'progress']
    );
    
    // January 27, 2026 - Page-long, talking to roommate about what happened
    createEntry(
      new Date('2026-01-27'),
      `I told my roommate about the crash today.

We were sitting in the living room. Watching TV. Nothing important. Just background noise. She asked how therapy was going. I said it was okay. She asked if it was helping. I said I think so.

Then she asked what happened. The crash. She'd never asked before. I think she was scared to. Scared to make it worse. But she asked. And I told her.

I told her about that night. About driving home. About the rain. About the other car. About the crash. About the fire. About being stuck. About thinking I was going to die.

I told her about the nightmares. About the flashbacks. About how I can't sleep. About how every sound makes me jump. About how I can't feel safe anymore.

She listened. Really listened. Didn't interrupt. Didn't tell me it would be okay. Didn't try to fix it. Just listened.

When I was done, she hugged me. Hard. Said she was sorry. That she didn't know it was that bad. That I could talk to her anytime. That she was here.

I cried. A lot. But it felt good. To tell someone. Someone who knows me. Someone who cares. Not just a therapist. But a friend.

She asked if there was anything she could do. I said just being here is enough. Just listening is enough.

I don't know if this helps. But it feels different. Like I'm not carrying it alone anymore. Like someone else knows. Someone else understands. At least a little.

Maybe that's enough.`,
      3,
      ['roommate', 'talking', 'vulnerability', 'support', 'friendship', 'crying']
    );
    
    // January 29, 2026 - Page-long, therapy about triggers and safety
    createEntry(
      new Date('2026-01-29'),
      `Dr. Chen and I talked about triggers today.

She asked me what sets me off. What makes me go back there. I told her sounds. Loud sounds. Car alarms. Doors slamming. Things dropping. Anything that sounds like the crash. Like the impact.

I told her about smells. Smoke. Burning. Even if it's just someone's cigarette. Or a campfire. It takes me back. To the car. To the fire. To the fear.

I told her about driving. How I can't drive anymore. How I get someone else to drive. Or take the bus. Or walk. Anything but drive. Because every time I'm behind the wheel, I'm back there. In that moment. In that car. In that crash.

She asked if I want to drive again. I said I don't know. Maybe. Someday. But not now. Not yet.

She said that's okay. That I don't have to rush. That it's okay to avoid things that trigger me. For now. While I'm healing. That I can work up to it. Slowly. When I'm ready.

We talked about safety. About how I don't feel safe anymore. How I'm always on alert. Always waiting for the next threat. The next crash. The next thing that will destroy me.

She said that's normal. That my body is trying to protect me. That it's stuck in that moment. That night. The night that changed everything. That we need to help it understand I'm safe now. That the danger is over. That I survived.

She gave me homework. To make a list. Of things that make me feel safe. Of places where I feel safe. Of people who make me feel safe. To practice going to those places. Being with those people. To help my body remember what safe feels like.

I'm going to try. I don't know if it will work. But I'm going to try.`,
      2,
      ['therapy', 'triggers', 'driving', 'safety', 'homework', 'healing']
    );
    
    // January 31, 2026 - Page-long, small progress, better sleep
    createEntry(
      new Date('2026-01-31'),
      `I made the list. The one Dr. Chen asked me to make. Things that make me feel safe.

My bed. Under the covers. With the door locked. That's safe.

My roommate's room. When she's there. Just sitting. Not talking. Just being there. That's safe.

The therapy office. Dr. Chen's office. The couch. The plants. The quiet. That's safe.

The coffee shop down the street. The one with the big windows. Where I can see everything. Where I can leave if I need to. That's safe.

My friend Sarah's apartment. Her couch. Her cat. Her quiet. That's safe.

I wrote it all down. Made it real. Made it something I can look at. Something I can remember.

I went to the coffee shop today. The safe one. The one with the big windows. I sat by the window. Could see everything. The street. The people. The cars. I could leave if I needed to. But I didn't need to. I stayed. For an hour. Drank my coffee. Read a book. Felt almost normal.

The nightmare came again last night. But when I woke up, I used the grounding thing. Five things I can see. Four things I can touch. Three things I can hear. Two things I can smell. One thing I can taste.

I came back. Faster than before. My heart slowed down. My breathing got easier. I didn't scream. Didn't wake my roommate.

I went back to sleep. Eventually. And I slept. Really slept. For a few hours. Without the nightmare coming back.

It's not perfect. The nightmares still come. The flashbacks still happen. I still can't drive. I still jump at every sound. But it's better. A little better.

I'm still here. Still fighting. Still trying. Still healing.

Maybe that's enough.`,
      3,
      ['safety-list', 'coffee-shop', 'progress', 'sleep', 'healing', 'hope']
    );
    
    // February 2, 2026 - Page-long, therapy about the other driver
    createEntry(
      new Date('2026-02-02'),
      `Dr. Chen asked me about the other driver today.

I don't know much. Just what the police told me. That they were drunk. That they were going way too fast. That they crossed into my lane. That they didn't make it. That they died. Right there. At the scene.

I've been thinking about them. A lot. Wondering who they were. What their name was. If they had a family. If someone misses them. If someone's hurting because of what happened.

I feel guilty. Even though it wasn't my fault. Even though I didn't do anything wrong. I still feel guilty. Because I survived. And they didn't.

Dr. Chen said that's normal. That survivor's guilt is real. That it's okay to feel it. But that I didn't cause the crash. That I didn't make them drink. That I didn't make them drive. That I was just in the wrong place at the wrong time.

She asked if I want to know more. About the other driver. About what happened. I said I don't know. Part of me wants to know. To understand. To make sense of it. But part of me is scared. Scared to know. Scared to feel worse. Scared to feel more guilty.

She said I don't have to decide now. That I can think about it. That when I'm ready, if I want to know, we can talk about it. But I don't have to. Not yet. Not until I'm ready.

I'm still thinking about it. About them. About what happened. About why I survived and they didn't.

I don't have answers. Maybe I never will. But I'm trying to be okay with that.`,
      2,
      ['therapy', 'other-driver', 'guilt', 'survivor-guilt', 'processing']
    );
    
    // February 4, 2026 - Page-long, trying to drive again
    createEntry(
      new Date('2026-02-04'),
      `I tried to drive today.

Just around the block. Just a few minutes. My roommate came with me. Sat in the passenger seat. Said she'd be right there. That I could stop anytime. That I was safe.

I was so scared. My hands were shaking. My heart was racing. I could barely breathe. But I did it. I got in the car. Put on my seatbelt. Started the engine.

I drove. Slowly. Very slowly. Just around the block. One time. That's all. But I did it.

I didn't have a flashback. I didn't panic. I didn't crash. I just drove. Like a normal person. For a few minutes.

When I got back, I was shaking. Crying. But also... proud? Like I'd done something impossible. Something I didn't think I could do.

My roommate hugged me. Said I was brave. That she was proud of me. That I could do it again. When I was ready. Not today. But someday. When I'm ready.

I don't know if I'll drive again tomorrow. Or next week. Or next month. But I know I can. I know it's possible. I know I'm not stuck. Not forever.

That feels like something.`,
      3,
      ['driving', 'facing-fear', 'progress', 'roommate', 'brave', 'hope']
    );
    
    // February 6, 2026 - Page-long, one month mark, reflection
    createEntry(
      new Date('2026-02-06'),
      `It's been a month since I started therapy.

A whole month. I can't believe it. It feels like forever. And also like no time at all.

I'm still having nightmares. Still having flashbacks. Still jumping at every sound. Still can't drive alone. Still don't feel safe. Not really.

But it's different. Better. I have tools now. The grounding thing. The safety list. People I can talk to. A therapist who gets it. A roommate who cares. Friends who listen.

I'm sleeping better. Not every night. But some nights. More than before. The nightmares still come. But I can handle them now. I can come back. I can breathe.

I'm going to therapy. Every week. Talking about it. Processing it. Not hiding from it. Not pretending it didn't happen. But facing it. Slowly. One step at a time.

I'm trying. Really trying. To heal. To get better. To live again. Not just survive. But live.

It's hard. So hard. Harder than I thought it would be. But I'm doing it. I'm still here. Still fighting. Still trying.

Dr. Chen says I'm making progress. That I'm doing the work. That healing takes time. That I'm doing great.

I don't always see it. But I'm trying to trust her. Trying to trust the process. Trying to believe it will get better.

Maybe it will. Maybe it won't. But I'm going to keep trying. Keep fighting. Keep healing.

One day at a time.`,
      3,
      ['one-month', 'reflection', 'progress', 'therapy', 'healing', 'hope']
    );
    
    // February 8, 2026 - Page-long, bad day, flashback
    createEntry(
      new Date('2026-02-08'),
      `Bad day today.

I had a flashback at work. Full one. The worst one in weeks. Someone's phone went off. A loud ringtone. Like an alarm. Like a siren. Like the crash.

Suddenly I wasn't at work anymore. I was back there. In the car. In the rain. I could smell the smoke. Feel the heat. Taste the blood. My heart was racing. I couldn't breathe. I thought I was going to die.

I tried the grounding thing. Five things I can see. Four things I can touch. Three things I can hear. Two things I can smell. One thing I can taste.

But it didn't work. Not fast enough. I was stuck. Trapped. Back there. In that moment. In that night. The night that changed everything.

My coworker had to help me. Had to bring me back. Had to sit with me. Until I could breathe again. Until I could talk again. Until I was back.

I was so embarrassed. So ashamed. Everyone saw. Everyone knows. I'm broken. I'm damaged. I'm not normal.

I left early. Went home. Locked myself in my room. Cried. For hours. Just cried.

I thought I was getting better. I thought the tools were working. I thought I was healing.

But I'm not. I'm still broken. Still stuck. Still going back there. Every time something triggers me.

I don't know if this will ever get better. I don't know if I'll ever be normal again.

I'm so tired.`,
      1,
      ['bad-day', 'flashback', 'work', 'embarrassed', 'hopeless', 'tired']
    );
    
    // February 10, 2026 - Half page, therapy about the bad day
    createEntry(
      new Date('2026-02-10'),
      `I told Dr. Chen about what happened. About the flashback. About how embarrassed I was. About how I thought I was getting better but I'm not.

She said setbacks are normal. That healing isn't linear. That some days will be worse. That that's okay. That it doesn't mean I'm not getting better. That it doesn't mean I'm not healing.

She said the fact that I'm here. That I'm talking about it. That I'm trying. That means something. That I am getting better. Even if it doesn't feel like it.

I don't know if I believe her. But I'm trying to.`,
      2,
      ['therapy', 'setback', 'healing', 'non-linear', 'trying']
    );
    
    // February 12, 2026 - Page-long, going back to the place
    createEntry(
      new Date('2026-02-12'),
      `Dr. Chen asked me if I want to go back. To the place where it happened. Where the crash was. Where that night happened. The night that changed everything.

I said no. Absolutely not. Never. I can't. I won't.

She said I don't have to. Not now. Not ever. But that sometimes, when we're ready, going back can help. Can help our brain understand it's over. That we're safe now. That the danger is past.

I said I'm not ready. I'll never be ready.

She said that's okay. That I don't have to be ready. That I can decide. When I'm ready. If I'm ever ready.

I've been thinking about it. About going back. About seeing that place again. About facing it. About proving to myself that I'm not stuck there. That I can go there and come back. That I'm safe.

I don't know if I'll ever do it. But I'm thinking about it. That's something.`,
      2,
      ['therapy', 'place', 'facing-fear', 'thinking', 'not-ready']
    );
    
    // February 14, 2026 - Short entry, small win
    createEntry(
      new Date('2026-02-14'),
      `I drove again today.

Just around the block. Like before. My roommate came with me again. But this time I drove a little further. A little longer. A little faster.

I didn't panic. I didn't have a flashback. I just drove. Like a normal person.

When I got back, I wasn't shaking. Wasn't crying. I was just... okay.

That feels like progress.`,
      3,
      ['driving', 'progress', 'small-wins', 'roommate']
    );
    
    // February 16, 2026 - Page-long, therapy about anger
    createEntry(
      new Date('2026-02-16'),
      `Dr. Chen asked me if I'm angry today.

I said no. I'm not angry. I'm sad. I'm scared. I'm tired. But not angry.

She asked me to think about it. Really think. About what happened. About the crash. About the other driver. About how they were drunk. About how they were going too fast. About how they crossed into my lane. About how they almost killed me. About how they did kill themselves. About how they changed my life forever.

She asked if I'm angry at them.

I thought about it. Really thought. And I realized... I am. I'm angry. So angry. At them. For being drunk. For driving. For almost killing me. For changing everything. For making me like this. Broken. Scared. Stuck.

I'm angry at myself too. For not seeing them sooner. For not swerving faster. For not being able to stop it. For surviving when they didn't. For feeling guilty about surviving.

I'm angry at the world. For letting this happen. For not stopping them. For not protecting me. For making me go through this. For making me heal. For making it so hard.

I'm angry. And I've been holding it in. Pretending I'm not. Pretending I'm just sad. Just scared. Just tired.

But I'm angry. Really angry.

Dr. Chen said that's okay. That anger is normal. That it's okay to be angry. That I can feel it. That I can express it. That I don't have to hold it in.

I cried. Again. But this time it felt different. Like I was letting something out. Something I'd been holding in for too long.

I'm still angry. But it feels better. To admit it. To feel it. To let it out.

Maybe that's part of healing too.`,
      2,
      ['therapy', 'anger', 'other-driver', 'emotions', 'processing', 'crying']
    );
    
    // February 18, 2026 - Page-long, better sleep, less nightmares
    createEntry(
      new Date('2026-02-18'),
      `I slept through the night last night.

The whole night. No nightmare. No waking up screaming. No flashback. Just sleep. Real sleep. Deep sleep.

I can't remember the last time that happened. Before the crash, probably. Before that night. The night that changed everything.

I woke up this morning feeling different. Rested. Like I actually slept. Like my body got what it needed. Like my brain got a break.

I'm still scared. Still jump at sounds. Still don't feel completely safe. But I slept. Really slept.

I told Dr. Chen about it today. She smiled. Said that's progress. Real progress. That my brain is starting to heal. Starting to understand I'm safe. That the danger is over.

I don't know if it will last. If the nightmares will come back. If I'll sleep through the night again. But for one night, I did. For one night, I was okay.

That feels like something. Like maybe, just maybe, I'm getting better. Like maybe, just maybe, I can heal. Like maybe, just maybe, I can live again.

I'm trying not to get my hopes up. Trying not to expect too much. But I can't help it. I feel hopeful. For the first time in a long time.

Maybe that's progress too.`,
      3,
      ['sleep', 'no-nightmare', 'progress', 'hope', 'healing']
    );
    
    // February 20, 2026 - Half page, going to coffee shop alone
    createEntry(
      new Date('2026-02-20'),
      `I went to the coffee shop today. The safe one. The one with the big windows.

But this time I went alone. No roommate. No friend. Just me.

I was scared. My hands were shaking when I ordered. But I did it. I sat by the window. Drank my coffee. Read my book. Stayed for an hour.

I didn't panic. I didn't have a flashback. I just... existed. Like a normal person.

That feels like progress.`,
      3,
      ['coffee-shop', 'alone', 'facing-fear', 'progress', 'normalcy']
    );
    
    // February 22, 2026 - Page-long, therapy about the future
    createEntry(
      new Date('2026-02-22'),
      `Dr. Chen asked me about the future today.

What do I want? What do I hope for? Where do I see myself in a year? In five years?

I said I don't know. I haven't thought about it. I've been so focused on surviving. On getting through each day. On not having flashbacks. On sleeping. On healing. I haven't thought about the future. About what comes next.

She asked me to think about it. To imagine. To dream. Even if it feels impossible. Even if it feels too far away.

I thought about it. Really thought. What do I want?

I want to sleep. Every night. Without nightmares. Without fear. Just sleep.

I want to drive. By myself. Without someone in the passenger seat. Without panic. Just drive. Like I used to.

I want to feel safe. Really safe. In my body. In my mind. In my life. Not just sometimes. But always.

I want to go places. New places. Places I've never been. Without fear. Without flashbacks. Just go.

I want to live. Not just survive. But live. Really live. Laugh. Have fun. Be happy. Feel joy. Feel peace.

I want to be okay. Not perfect. Not fixed. Just okay. Just me. But okay.

I told her. All of it. Everything I want. Everything I hope for. Everything I dream about.

She said those are good goals. That they're possible. That I can have them. That I can get there. That I'm already on my way.

I don't know if I believe her. But I want to. I really want to.

Maybe that's enough for now.`,
      3,
      ['therapy', 'future', 'goals', 'dreams', 'hope', 'healing']
    );
    
    // February 24, 2026 - Page-long, nightmare came back
    createEntry(
      new Date('2026-02-24'),
      `The nightmare came back last night.

I thought I was past it. I thought I was getting better. I thought the nightmares were done. But they're not. They came back. Full force. Like they never left.

I was back there. In the car. In the rain. The other car coming at me. The crash. The fire. The smoke. The fear. The pain. All of it. All over again.

I woke up screaming. My roommate came running. Sat with me. Until I could breathe again. Until I could talk again. Until I was back.

I cried. A lot. Because I thought I was better. Because I thought I was healing. Because I thought the nightmares were gone.

But they're not. They're still here. Still part of me. Still haunting me. Still taking me back there. To that night. The night that changed everything.

Dr. Chen said setbacks are normal. That healing isn't linear. That some nights will be worse. That that's okay. That it doesn't mean I'm not getting better. That it doesn't mean I'm not healing.

I know she's right. I know setbacks are normal. I know healing takes time. But it's hard. So hard. To think I'm getting better. To have hope. To believe I can heal. And then to have the nightmare come back. To be reminded that I'm still broken. Still stuck. Still going back there.

I'm trying to remember the good nights. The nights I slept. The nights without nightmares. The nights I felt okay. I'm trying to hold onto those. To remember that they exist. That they're possible.

But it's hard. When the nightmare comes back. When I'm back there. In that moment. In that fear. It's hard to remember that I'm safe now. That it's over. That I survived.

I'm still here. Still fighting. Still trying. Still healing.

Even when it's hard.`,
      2,
      ['nightmare', 'setback', 'hard', 'healing', 'non-linear', 'trying']
    );
    
    // February 26, 2026 - Half page, small moment of peace
    createEntry(
      new Date('2026-02-26'),
      `I went to Sarah's apartment today. My friend. The one with the cat.

We just sat. On her couch. Watched TV. Didn't talk much. Just existed together.

For a few hours, I forgot. Forgot about the crash. Forgot about the nightmares. Forgot about the flashbacks. Forgot about everything.

I was just a person. Sitting with a friend. Watching TV. Petting a cat.

It was nice. Simple. Normal.

I needed that.`,
      3,
      ['friendship', 'distraction', 'peace', 'normalcy', 'small-moments']
    );
    
    // February 28, 2026 - Page-long, therapy about acceptance
    createEntry(
      new Date('2026-02-28'),
      `Dr. Chen asked me today if I can accept that this happened. That the crash happened. That that night happened. The night that changed everything.

I said I don't know. I've been trying to forget. Trying to pretend it didn't happen. Trying to move on. But I can't. Because it did happen. And it changed everything.

She said maybe I need to stop trying to forget. Maybe I need to accept it. Accept that it happened. Accept that it changed me. Accept that I'm different now. Not broken. Not damaged. Just different.

She asked if I can accept that I survived. That I'm here. That I made it. That I'm alive.

I said I don't know. Sometimes I wish I hadn't. Sometimes I wish I hadn't survived. Sometimes I wish I had died too. Because then I wouldn't have to deal with this. With the nightmares. With the flashbacks. With the fear. With the pain.

She said that's normal. That many survivors feel that way. That it's okay to feel that. But that I did survive. That I am here. That I am alive. And that maybe, just maybe, that's a gift. That maybe, just maybe, I can use it. To heal. To grow. To live.

I don't know if I can accept it. Not yet. But I'm thinking about it. I'm trying to understand. That it happened. That I survived. That I'm here. That I'm different. But maybe that's okay. Maybe different isn't bad. Maybe different is just... different.

I don't know. But I'm thinking about it.`,
      2,
      ['therapy', 'acceptance', 'survival', 'different', 'processing']
    );
    
    // March 2, 2026 - Page-long, driving alone for the first time
    createEntry(
      new Date('2026-03-02'),
      `I drove alone today.

For the first time since the crash. Since that night. The night that changed everything.

I was so scared. My hands were shaking. My heart was racing. I almost didn't do it. Almost turned around. Almost went back home.

But I didn't. I kept going. I drove. Just to the store. Just a few blocks. But I drove. By myself. Alone.

I didn't have a flashback. I didn't panic. I didn't crash. I just drove. Like a normal person. Like I used to. Before.

When I got there, I sat in the car for a few minutes. Just breathing. Just being. Just existing. In the car. Alone. Safe.

I went into the store. Bought what I needed. Got back in the car. Drove home.

I did it. I really did it.

When I got home, I cried. But this time it was different. Not from fear. Not from pain. But from relief. From pride. From hope.

I drove. By myself. Alone. And I was okay.

That feels huge. Like maybe, just maybe, I'm getting better. Like maybe, just maybe, I can heal. Like maybe, just maybe, I can live again.

I don't know if I'll drive again tomorrow. Or next week. But I know I can. I know it's possible. I know I'm not stuck. Not forever.

That feels like everything.`,
      4,
      ['driving', 'alone', 'first-time', 'brave', 'progress', 'hope', 'pride']
    );
    
    // Insert all entries
    await JournalEntry.insertMany(entries);
    journal.entriesCount = entries.length;
    await journal.save();
    
    console.log(`  ✓ Created ${entries.length} raw, authentic journal entries`);
    console.log(`  ✓ Entries span from January 3 to March 2, 2026`);
    console.log('\n✅ Successfully created BrokenWings user and journal!');
    console.log(`   Username: BrokenWings`);
    console.log(`   Password: password123`);
    console.log(`   Journal: "The night that changed everything" (Public)`);
    console.log(`   Entries: ${entries.length} entries showing recovery journey`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating BrokenWings:', error);
    process.exit(1);
  }
}

// Run script
createBrokenWings();
