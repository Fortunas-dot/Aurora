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
          { condition: 'Eating Disorder', type: 'Anorexia nervosa', severity: mood <= 2 ? 'severe' : mood <= 4 ? 'moderate' : 'mild' },
          { condition: 'Anxiety Disorder', severity: mood <= 2 ? 'severe' : mood <= 4 ? 'moderate' : 'mild' },
          { condition: 'Depression', severity: mood <= 2 ? 'severe' : mood <= 4 ? 'moderate' : 'mild' },
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
      `I stepped on the scale today. 88 pounds.

Down from 90 last week. I should be happy. But I'm not. The number is never low enough. Never good enough. I look in the mirror and all I see is fat. I know I'm not. I know I'm too thin. But the voice in my head won't stop. You're huge. You're disgusting. You need to lose more.

I counted every calorie today. 150. That's all. An apple in the morning. A few sips of water. That's it. I'm so hungry. My stomach hurts all the time. But the hunger feels good. It means I'm in control. It means I'm winning. It means I'm strong.

I exercised for two hours today. Running. Crunches. Anything to burn calories. I can't stop. If I stop, I'll gain weight. If I gain weight, I'll be worthless. I'll be nothing.

My mom asked me to eat dinner with them tonight. I said I already ate. I lied. She looked worried. But I don't care. Food is the enemy. Food makes me weak. Food makes me fat.

I'm so cold all the time. My hands are always freezing. My hair is falling out. My period stopped months ago. I know that's bad. I know my body is shutting down. But I don't care. It means I'm winning. It means I'm thin enough.

Nothing else matters.`,
      1,
      ['anorexia', 'scale', 'restriction', 'dark', 'control']
    );
    
    // January 5, 2026 - Still dark, shorter entry
    createEntry(
      new Date('2026-01-05'),
      `Ate 200 calories today. Too much. Way too much.

I feel so guilty. So disgusting. I need to exercise more. Burn it off. Make up for it.

I can't stop. I don't know how to stop.`,
      1,
      ['guilt', 'calories', 'exercise', 'restriction']
    );
    
    // January 7, 2026 - Page-long, fainting, awareness
    createEntry(
      new Date('2026-01-07'),
      `I fainted today.

I was at school. In the hallway. Just walking. Then everything went black. Next thing I know, I'm on the floor. People are standing around me. Someone's calling my name. I can't focus. Can't see clearly.

The nurse called my mom. She came to get me. Took me to the hospital. The doctor said my heart rate is too low. My blood pressure is too low. My body is shutting down. They're talking about putting me in the hospital. Force feeding me. Making me eat.

I'm so scared. But also... maybe I need it? Maybe this isn't okay? Maybe I'm killing myself?

I tried to eat something today. Just a small apple. Couldn't do it. My hands shook. My heart raced. I felt like I was going to die. But I wanted to. I really wanted to try.

My mom cried. I've never seen her so scared. She said she's been watching me. Watching me disappear. Watching me die. She said she can't lose me. That she loves me. That I need help.

Maybe she's right. Maybe I do need help. Maybe this isn't okay. Maybe I'm not okay.`,
      2,
      ['fainting', 'hospital', 'awareness', 'mom', 'scared', 'help']
    );
    
    // January 9, 2026 - Half page, therapy appointment
    createEntry(
      new Date('2026-01-09'),
      `I have a therapy appointment tomorrow.

My mom made it. She found someone who works with eating disorders. I'm scared. I don't want to go. But I said I would. For her. For me. Maybe.

I don't know what I'll say. I don't know if I can talk about it. I don't know if I want to get better. But I'm going to try.`,
      2,
      ['therapy', 'appointment', 'scared', 'trying']
    );
    
    // January 11, 2026 - Page-long, first therapy session
    createEntry(
      new Date('2026-01-11'),
      `I went to therapy today.

I almost didn't go. Sat in the car outside the building for thirty minutes. Almost drove away. But I went in.

Her name is Dr. Martinez. She was nice. Had kind eyes. Asked me why I was there. I said my mom made me come. She said that's okay. That sometimes we need someone to help us take the first step.

I told her about the scale. About counting calories. About exercising. About how I can't stop. About how I'm so hungry but I can't eat. About how I look in the mirror and see fat even though I know I'm not.

She listened. Really listened. Didn't judge. Didn't tell me to just eat. Just listened.

She asked me when it started. I said I don't know. Maybe six months ago? Maybe longer. I just wanted to lose a few pounds. Feel better about myself. But it became something else. Something I can't control.

She asked me if I want to get better. I said I don't know. Part of me wants to. Part of me is so tired. So cold. So empty. But part of me is scared. Scared of gaining weight. Scared of losing control. Scared of being fat.

She said that's normal. That it's okay to be scared. That recovery is scary. But that it's possible. That I can get better. That I can learn to eat again. To live again.

I don't know if I believe her. But I'm going back next week.`,
      2,
      ['therapy', 'first-session', 'talking', 'scared', 'hope']
    );
    
    // January 13, 2026 - Page-long, trying to eat, panic
    createEntry(
      new Date('2026-01-13'),
      `Dr. Martinez asked me to try eating something today. Just one thing. Anything. Just try.

I said I can't. I'm too scared. Too panicked. I can't do it.

She said that's okay. That I don't have to do it now. That we can work up to it. Slowly. One step at a time.

But I wanted to try. I really wanted to try. So when I got home, I tried. I took an apple. Just an apple. Small one. I held it. Looked at it. For ten minutes. Just holding it. My hands shaking.

I took one bite. Just one. Chewed it. Swallowed it. And then the panic hit. Full force. My heart racing. Can't breathe. Feel like I'm going to die. I threw the apple away. Ran to the bathroom. Stood there shaking. Crying.

I felt so guilty. So disgusting. So weak. I wanted to exercise. To burn it off. To make up for it. But I didn't. I called Dr. Martinez instead. Left a message. Said I tried. That I panicked. That I failed.

She called me back. Said I didn't fail. That trying is the first step. That the panic is normal. That it's the eating disorder fighting back. That I'm fighting back too. By trying. By calling her. By not exercising.

She said that's progress. Real progress.

I don't know if I believe her. But I'm trying to.`,
      2,
      ['trying', 'eating', 'panic', 'therapy', 'progress', 'guilt']
    );
    
    // January 15, 2026 - Half page, second therapy session
    createEntry(
      new Date('2026-01-15'),
      `Second therapy session today.

We talked about what happened. About me trying to eat. About the panic. About the guilt.

Dr. Martinez said the voice in my head. The one that tells me I'm fat. That tells me I'm weak. That tells me I need to lose more weight. That's the eating disorder. Not me. That I can learn to fight it. To talk back to it. To tell it it's wrong.

She said I'm not weak for eating. I'm strong. That eating takes courage. That recovery takes courage.

I don't know if I believe her yet. But I'm trying.`,
      2,
      ['therapy', 'second-session', 'voice', 'courage', 'trying']
    );
    
    // January 17, 2026 - Page-long, food diary homework
    createEntry(
      new Date('2026-01-17'),
      `Dr. Martinez gave me homework.

She asked me to write down what I eat. Not to count calories. Not to judge it. Just to notice. To see the patterns. To see how little I'm eating. To see how much the voice in my head controls me.

I didn't want to do it. I don't like seeing it on paper. It makes it too real. But I said I would try.

Today I wrote it down.

Breakfast: black coffee. No food.

Lunch: half an apple. I threw the other half away.

Snack: water. Lots of it. To make the hunger go away.

Dinner: I sat at the table with my family. I moved food around my plate. Cut everything into tiny pieces. Took a few bites. Said I wasn't hungry. Said I ate earlier. I didn't.

Seeing it written out like that makes me feel strange. Part of me is proud. Look how little I ate. Look how strong I am. Another part of me feels scared. This isn't normal. This isn't okay.

Dr. Martinez said the homework isn't about judging. It's about noticing. About being honest. About seeing the eating disorder on the page, not just in my head.

I'm trying to be honest. Even when it hurts.`,
      2,
      ['homework', 'food-diary', 'awareness', 'honesty', 'therapy']
    );

    // January 19, 2026 - Half page, telling a friend
    createEntry(
      new Date('2026-01-19'),
      `I told Emma today.

Not everything. But enough.

We were walking home from school. She said I've looked tired lately. Asked if I was okay. I almost said I'm fine. I always say I'm fine. But this time I didn't.

I said, "I've been struggling with food."

She stopped walking. Looked at me. Really looked. Asked what I meant. I told her a little. That I'm seeing a therapist. That I'm trying to eat. That it's hard.

She didn't laugh. She didn't say I'm being dramatic. She just said, "I'm glad you told me." And then she asked what she can do to help.

I didn't know what to say. I just said, "Please don't comment on what I eat."

She said okay.

It felt scary. But also... lighter.`,
      3,
      ['friendship', 'vulnerability', 'support', 'talking']
    );

    // January 21, 2026 - Page-long, first full meal in treatment
    createEntry(
      new Date('2026-01-21'),
      `I ate a full meal today.

Breakfast in the treatment center. Two slices of toast with peanut butter. A banana. A glass of orange juice. It looked huge. Like way too much. My brain was screaming. The voice was screaming. You're going to get fat. You're losing control. You're weak.

The nurse sat with me. So did two other girls. They were eating too. One of them smiled at me. Said, "The first full meal is the hardest."

I wanted to cry. I wanted to run. I wanted to throw the plate on the floor. But I didn't. I took a bite. Then another. And another.

My hands were shaking. My heart was racing. I thought I was going to throw up. But I kept going. One bite at a time. One small step at a time.

When I finished, I felt so guilty. So disgusting. I wanted to exercise. I wanted to punish myself. But in treatment, I'm not allowed. No exercise. No bathroom alone right after meals. They watch us. To keep us safe. To keep us from hurting ourselves.

Part of me hates it. Hates them. Hates the rules. Another part of me feels... safe. Like someone else is holding the control for a while. So I don't have to.

Dr. Martinez said eating is an act of courage. That today I was brave.

I don't feel brave. I feel scared. But I ate. A full meal. That's something.`,
      2,
      ['treatment', 'full-meal', 'guilt', 'bravery', 'support']
    );

    // January 23, 2026 - Short entry, small win
    createEntry(
      new Date('2026-01-23'),
      `I drank a glass of milk today.

I haven't done that in months. It felt huge. Stupid thing to cry about. But I did.

It tasted like being a kid again. Before all of this.`,
      3,
      ['small-win', 'milk', 'childhood', 'recovery']
    );

    // January 25, 2026 - Page-long, body image and mirror
    createEntry(
      new Date('2026-01-25'),
      `I stood in front of the mirror today.

Really stood there. Not just a quick glance. Not just looking at my stomach and hating it. I looked at my whole body. My face. My shoulders. My arms. My legs. All of me.

The voice started right away. You're huge. Your thighs are disgusting. Your stomach sticks out. You shouldn't have eaten that breakfast. You shouldn't have drunk that milk. You should skip dinner. You should lose more weight.

I felt the panic rise. The familiar tightness in my chest. The urge to cry. To run. To hide the mirror. To hide myself.

But I remembered what Dr. Martinez said. That the voice is not me. That it's the eating disorder. That I can talk back to it.

So I tried.

I said, out loud, in a very small voice, "I'm not huge. I'm sick. I'm trying to get better."

The voice didn't like that. It screamed louder. But for a second, just a second, I felt something else. Like a tiny spark. A tiny part of me that didn't agree with the voice.

I noticed things I never look at. My eyes. They looked tired, but also kind. My shoulders. Narrow, but strong. My legs. Thin, but they still hold me up. They still move me through the world.

I'm not ready to say I like my body. I'm not ready to say I accept it. But today, for a few minutes, I looked at it without tearing it apart completely.

That's new.

Maybe that's a start.`,
      3,
      ['body-image', 'mirror', 'inner-voice', 'small-progress']
    );
    
    // January 27, 2026 - Page-long, family dinner tension
    createEntry(
      new Date('2026-01-27'),
      `Family dinner tonight.

My mom made pasta. Real pasta. With sauce and cheese. The kind I used to love. Before all of this.

Everyone sat at the table. My dad. My little brother. My mom kept looking at me. At my plate. At my arms. At my face. Like she was trying to read my thoughts.

She put a normal portion on my plate. My brain panicked. The voice started screaming. Too much. Way too much. You can't eat that. You'll gain weight. You'll lose control.

I started cutting everything into tiny pieces. Moving it around. Pretending to eat. My brother asked if I was going to finish it. My dad told him to be quiet. The whole table went silent.

My mom said, very softly, "Lisa, can you try a few bites? Just a little. Please."

I wanted to scream at her. To tell her to stop looking at me. To stop counting my bites. To stop making everything about food. But I could see the fear in her eyes. The way her hands were shaking.

So I took a bite. A small one. Then another. And another. The voice was going crazy. You're disgusting. You're weak. You said you'd do better today. You failed.

Halfway through, I put my fork down. Said I was full. My mom didn't push. She just nodded. Her eyes were shiny, like she was trying not to cry.

After dinner, I went to my room and cried. Because I felt like I had eaten too much. And also because I knew it was nothing. That a normal person would have finished the plate. Maybe even taken more.

I hate that food has turned into this. A battle. A test. A way to measure if I'm "good" or "bad" that day.

Dr. Martinez says every bite counts. That tonight I did more than I could last month.

I don't feel proud. But I'm writing it down. So I don't forget that I tried.`,
      2,
      ['family', 'dinner', 'tension', 'trying', 'guilt']
    );

    // January 29, 2026 - Half page, group session
    createEntry(
      new Date('2026-01-29'),
      `Had my first group session today.

It was weird at first. Sitting in a circle with other girls who all hate their bodies in different ways. We didn't look at each other much. Just at the floor. Or our hands.

One girl talked about how she feels guilty every time she eats bread. Another said she still counts every calorie even in treatment. I nodded so much my neck hurt.

For the first time, I didn't feel like a freak. Just... like one of them.

I didn't share much. Just said my name. And that I'm here because I'm tired of being hungry all the time.

That felt honest.`,
      3,
      ['group', 'not-alone', 'vulnerability', 'treatment']
    );

    // January 31, 2026 - Page-long, small routine in treatment
    createEntry(
      new Date('2026-01-31'),
      `I'm starting to have a routine here.

Wake up. Vitals check. Breakfast. Group. Snack. Individual therapy. Lunch. Free time. Snack. Family session sometimes. Dinner. Night check-in. Sleep, if I can.

It sounds simple written down. It doesn't feel simple.

The hardest part is the moments in between. After meals. Before groups. When I'm alone with my thoughts. The voice is the loudest then. Telling me I'm eating too much. That I'm getting bigger. That everyone can see it. That I'm failing.

But there are small moments that feel different.

Like this morning. After breakfast, one of the girls sat with me in the common room. We drew stupid little doodles on scrap paper. Hearts. Flowers. Tiny cartoons. We laughed at how bad they looked.

For half an hour, we didn't talk about food. Or weight. Or bodies. We just existed. Two people, drawing badly.

In group today, I said more than my name. I said I'm scared that if I get better, I won't know who I am. That the eating disorder has been my whole identity for so long.

The therapist said, "That's okay. Part of recovery is getting to find out who Lisa is, without anorexia."

I don't know who that is yet. But the idea didn't feel as scary as before. It almost felt... interesting.

Maybe there is a version of me who can laugh and eat and exist without counting everything.

I can't imagine her fully yet. But I'm starting to wonder what she'd be like.`,
      3,
      ['routine', 'treatment', 'identity', 'small-moments', 'curiosity']
    );

    // February 2, 2026 - Short entry, weighing in
    createEntry(
      new Date('2026-02-02'),
      `Weigh-in day.

Up two pounds.

I wanted to cry. To scream. To run. But I stayed. I went to breakfast. I ate.

Dr. Martinez said, "That's your body saying thank you."`,
      3,
      ['weigh-in', 'weight-gain', 'fear', 'reframe']
    );

    // February 4, 2026 - Page-long, bad body image day
    createEntry(
      new Date('2026-02-04'),
      `Today was hard.

Nothing big happened. No fainting. No hospital. No big fight. Just a hundred small moments that all felt heavy.

My jeans felt tighter this morning. Maybe they weren't. Maybe it was just in my head. But it felt like they were. I stared at myself in the mirror for way too long. Pinched my stomach. Turned to the side. Tried to see if my thighs touched more than yesterday.

At breakfast, the cereal looked bigger than usual. Same bowl. Same milk. Same spoon. But my brain said, "Too much. Way too much." I ate it anyway. Bite by bite. The guilt sat in my chest like a rock.

All day I felt like people were looking at me. At my body. At my arms. At my legs. Like they could tell I had gained two pounds. Like they were judging me for it.

No one said anything. Of course they didn't. They were just living their own lives. But the voice in my head kept whispering that they were thinking it. That they were all silently agreeing that I looked worse.

In therapy, I told Dr. Martinez that I feel like I'm taking up more space. That gaining weight feels like I'm failing. Like I'm going backwards.

She asked, "Failing at what? At starving yourself?"

I didn't know what to say.

She said my body image will probably get worse before it gets better. That as my body changes, my brain will panic. That it needs time to catch up. To learn that "bigger" doesn't mean "bad." That "healthier" doesn't mean "worthless."

I left feeling confused. Still scared. Still heavy. But also a tiny bit understood.

It's strange. I hate my body more on days like this. But I'm also feeding it more than I ever did before.

Maybe that's what courage looks like right now. Hating it and still eating anyway.`,
      2,
      ['body-image', 'weight-gain', 'therapy', 'hard-day', 'courage']
    );

    // February 6, 2026 - Half page, laughing for a moment
    createEntry(
      new Date('2026-02-06'),
      `Something strange happened today. I laughed. Really laughed.

We were in group and one of the girls made a joke about how the hospital socks make everyone look like sad penguins. It was stupid. But we all started laughing. The kind of laugh where your stomach hurts and you can't stop.

For a few seconds, I forgot about my body. I forgot about calories. I forgot about the number on the scale. I was just a girl in ugly socks, laughing with other girls in ugly socks.

After group, the voice tried to ruin it. Said I didn't deserve to feel happy. That I hadn't worked hard enough. That I'm still not "sick enough."

But the memory of that laugh felt louder than the voice. Just for a moment.

I want more moments like that.`,
      4,
      ['group', 'laughter', 'relief', 'connection', 'small-moment']
    );

    // February 8, 2026 - Page-long, weekend home visit
    createEntry(
      new Date('2026-02-08'),
      `I went home for the weekend.

They call it a "home visit." A test, I guess. To see how I do outside of treatment. To see if I can handle meals without nurses watching every bite.

Being back in my house felt weird. Familiar and wrong at the same time. My room looked the same. Same posters. Same bed. Same mirror. But I felt different in it. Heavier. Not just in my body. In my head.

My mom tried so hard. She made a meal plan with the dietitian. Simple stuff. Toast with peanut butter. Soup and bread. Pasta with some vegetables. Nothing crazy.

At breakfast, she sat across from me. Tried to act normal. Talked about work. About my brother. About the neighbour's dog. But I could see her counting my bites in her head.

I ate. Not everything. But more than I would have a month ago.

The voice was loud all weekend. Telling me I should skip this. Hide that. Pretend I already ate. It felt stronger at home than in treatment. Like the walls remembered all the times I lied about food.

On Sunday night, before I went back, my mom hugged me. Really hugged me. She said, "I'm proud of you. I know this is hard."

I didn't know what to say. So I just said, "I'm trying."

And I am. Even when it feels like I'm failing every second.`,
      2,
      ['home-visit', 'family', 'meals', 'voice', 'trying']
    );

    // February 10, 2026 - Short entry, choosing a snack
    createEntry(
      new Date('2026-02-10'),
      `We had snack time today and they let us choose.

I picked the yogurt with granola instead of the lowest-calorie option.

It felt like jumping off a cliff. But I ate it. All of it.`,
      4,
      ['snack', 'choice', 'fear', 'small-win']
    );

    // February 12, 2026 - Page-long, writing a letter to the eating disorder
    createEntry(
      new Date('2026-02-12'),
      `Dr. Martinez asked me to write a letter today.

Not to myself. Not to my mom. To the eating disorder.

At first I thought it was stupid. How do you write a letter to something that's in your head? But I did it anyway. Because I said I would try.

I wrote:

"You made me feel special at first. Like I was good at something. Every time the number on the scale went down, you told me I was strong. Every time I skipped a meal, you said I was winning. You made me feel like being hungry meant I had control.

But you lied.

You took everything from me. My energy. My friends. My smile. My period. My hair. My sleep. My peace. You made me cold all the time. You made me faint. You made my mom cry. You almost killed me.

You told me if I got help, I'd be weak. That if I ate, I'd be a failure. But every day I fight you, I see that's not true. Eating is harder than starving. Staying is harder than disappearing.

I don't know who I am without you yet. And that scares me. A lot. But I know I don't want to belong to you forever.

I'm not ready to say goodbye. Not yet. But I'm starting to see that maybe you're not my friend. Maybe you're the one I need to walk away from."

When I finished reading it out loud, I was shaking. My throat hurt. My eyes hurt. But there was also this feeling in my chest. Like space. Like I had said something important.

Dr. Martinez said that's a big step.

I don't know what happens next. But writing it down made it feel a little more real.

Maybe one day I really will say goodbye.`,
      3,
      ['letter', 'eating-disorder', 'awareness', 'anger', 'hope']
    );
    
    // February 14, 2026 - Page-long, relapse thoughts, fighting back
    createEntry(
      new Date('2026-02-14'),
      `The voice was really loud today.

After lunch, I went to my room and just sat there. The voice kept going. You ate too much. You're getting fat. Everyone can see it. You should skip dinner. You should exercise. You should go back to how you were. You were better then. You were in control.

I wanted to listen. I wanted to give in. I wanted to go back to the way things were. When I felt in control. When the hunger felt like winning.

But then I thought about the letter. About what I wrote. About how the eating disorder almost killed me. About how it took everything.

I called Dr. Martinez. Left a message. Said the voice was loud. That I was scared. That I wanted to give in.

She called me back. Said that's normal. That the eating disorder fights hardest when we're making progress. That it's scared too. Scared of losing control. Scared of being left behind.

She asked me what I wanted. Really wanted. Not what the voice wanted. What I wanted.

I thought about it. Really thought. I want to sleep through the night. I want to not be cold all the time. I want to have energy. I want to laugh with my friends. I want my mom to stop worrying. I want to live. Not just exist. Live.

I went to dinner. I ate. Not all of it. But more than I would have if I'd listened to the voice.

I'm still scared. The voice is still there. But I'm fighting back. One meal at a time.`,
      2,
      ['relapse-thoughts', 'voice', 'fighting-back', 'therapy', 'choice']
    );
    
    // February 16, 2026 - Half page, small moment of peace
    createEntry(
      new Date('2026-02-16'),
      `Emma came to visit today.

We sat in the common room. Didn't talk about food. Or treatment. Or anything heavy. Just talked. About school. About stupid TV shows. About nothing important.

For an hour, I forgot. Forgot about the scale. Forgot about calories. Forgot about the voice. Forgot about everything.

I was just Lisa. Sitting with her friend. Laughing. Being normal.

I needed that.`,
      3,
      ['friendship', 'visitor', 'normalcy', 'distraction', 'peace']
    );
    
    // February 18, 2026 - Page-long, therapy about control
    createEntry(
      new Date('2026-02-18'),
      `Dr. Martinez asked me today what control means to me.

I said it means being able to decide. To choose. To have power over my body. Over my life.

She asked if I feel in control now. When I'm restricting. When I'm counting calories. When I'm exercising.

I thought about it. Really thought. And I realized... I don't. I don't feel in control at all. The eating disorder controls me. It tells me what to eat. When to eat. How much to exercise. What to think. How to feel. I'm not in control. The eating disorder is.

She asked what real control would look like. What it would feel like.

I said I don't know. I've been so focused on the fake control. The one that feels like power but is actually a prison.

She said real control is being able to choose. To choose to eat when I'm hungry. To choose to rest when I'm tired. To choose to say no when I don't want something. To choose to say yes when I do. That's control. Not restriction. Not rules. Choice.

I don't know if I can have that yet. But I want to. I really want to.`,
      3,
      ['therapy', 'control', 'choice', 'awareness', 'reflection']
    );
    
    // February 20, 2026 - Short entry, eating with others
    createEntry(
      new Date('2026-02-20'),
      `Ate lunch with the other girls today.

We all sat together. All eating. All scared. All trying.

One of them said, "This is the hardest thing I've ever done."

We all nodded. Because it is.`,
      3,
      ['group', 'eating', 'support', 'hard', 'together']
    );
    
    // February 22, 2026 - Page-long, body checking, trying to stop
    createEntry(
      new Date('2026-02-22'),
      `I caught myself body checking today.

Standing in front of the mirror. Poking my stomach. Pinching my thighs. Turning sideways. Checking if my arms look bigger. Checking if my face looks fatter.

I do it without thinking. It's automatic. Like breathing. I don't even realize I'm doing it until I'm already there. Already checking. Already hating.

Dr. Martinez said body checking is part of the eating disorder. That it keeps me stuck. That it feeds the voice. That I need to try to stop. Or at least notice when I'm doing it.

So today, when I caught myself, I tried something different. I didn't look. I didn't check. I just walked away from the mirror. Put on my clothes. Left the room.

The voice was screaming. You need to check. You need to see. You need to know if you're getting bigger. You need to know if you're failing.

But I didn't. I just walked away.

It felt weird. Like I was missing something. Like I needed to know. But I didn't check. I just... didn't.

I don't know if I can keep doing it. But today I did. That's something.`,
      2,
      ['body-checking', 'mirror', 'stopping', 'voice', 'small-step']
    );
    
    // February 24, 2026 - Half page, period came back
    createEntry(
      new Date('2026-02-24'),
      `My period came back today.

After almost a year without it.

I cried. Not from sadness. From relief. From something else I can't name.

My body is working again. It's healing. It's coming back to life.

That feels important.`,
      4,
      ['period', 'healing', 'body', 'recovery', 'hope']
    );
    
    // February 26, 2026 - Page-long, one month in treatment, reflection
    createEntry(
      new Date('2026-02-26'),
      `It's been a month since I started treatment.

A whole month. I can't believe it.

I'm still here. Still fighting. Still trying. Still scared. Still struggling. But I'm here.

I've gained weight. I don't know how much. They don't tell us the numbers anymore. But I can feel it. In my clothes. In my body. In the way I look.

The voice hates it. Screams about it constantly. Tells me I'm failing. That I'm getting fat. That I'm losing control.

But I'm also sleeping better. I have more energy. I'm not fainting anymore. My period came back. My hair stopped falling out. My hands aren't always freezing.

I'm eating. Real meals. Not all of them. Not perfectly. But I'm eating. More than I was. More than I thought I could.

I'm talking. In therapy. In group. To my mom. To Emma. About what's happening. About how I feel. About the voice. About the fear.

I'm not cured. I'm not fixed. I'm not even close. But I'm different. Better. A little better.

Dr. Martinez says I'm making progress. That I'm doing the work. That recovery takes time. That I'm doing great.

I don't always see it. But I'm trying to trust her. Trying to trust the process. Trying to believe it will get better.

Maybe it will. Maybe it won't. But I'm going to keep trying. Keep fighting. Keep healing.

One day at a time.`,
      3,
      ['one-month', 'reflection', 'progress', 'weight-gain', 'healing', 'hope']
    );
    
    // Insert all entries
    await JournalEntry.insertMany(entries);
    journal.entriesCount = entries.length;
    await journal.save();
    
    console.log(`  ✓ Created ${entries.length} raw, authentic journal entries`);
    console.log(`  ✓ Entries span from January 3 to February 26, 2026`);
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
