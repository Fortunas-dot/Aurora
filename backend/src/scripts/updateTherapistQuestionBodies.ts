import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database';
import Post from '../models/Post';

dotenv.config();

interface BodyUpdate {
  title: string;
  body: string;
}

const QUESTION_BODY_UPDATES: BodyUpdate[] = [
  {
    title: 'How do I stop replaying conversations in my head and analyzing everything I said?',
    body: `After I talk to someone, my brain replays every sentence I said and imagines how it might have sounded wrong or awkward. I know the other person has probably forgotten the conversation already, but I still analyse every detail as if I did something terrible. It’s exhausting and makes me dread social situations. How do you break out of this loop and actually move on from a conversation mentally?`,
  },
  {
    title: 'Why do I feel anxious when things are going well? Like I’m waiting for something bad.',
    body: `Life is finally a bit calmer for once — work is okay, relationships are stable, nothing huge is wrong — and yet I feel more on edge, not less. Instead of enjoying it, I keep waiting for something horrible to happen, like I don’t deserve things going smoothly. It’s like my nervous system doesn’t trust peace and is constantly scanning for the next disaster. Has anyone else felt this, and how did you learn to actually relax into the good moments?`,
  },
  {
    title: 'Is it normal to feel numb instead of sad?',
    body: `Lately, when things hurt or go wrong, I don’t really cry or feel the sadness fully — I just feel kind of flat and disconnected. Part of me worries that I’m broken for not reacting “properly,” but another part is almost relieved not to feel everything so intensely. I’m not sure if this is a sign of burnout, depression, or just my brain protecting itself. Is emotional numbness something others experience, and did it change over time?`,
  },
  {
    title: 'How do I set boundaries without feeling guilty?',
    body: `Whenever I say no to someone or set a limit, I immediately feel like a bad friend, partner, or family member. I was raised to be “easy” and accommodating, so putting my needs first feels selfish even when I’m clearly drained. Logically I know boundaries are healthy, but emotionally I still feel like I’m doing something wrong. How do you handle the guilt that comes up when you start protecting your own energy?`,
  },
  {
    title: 'Why am I tired all the time even when I sleep enough?',
    body: `I can sleep a full night and still wake up feeling like I’ve barely rested. Even on days when I don’t do much physically, I feel completely drained and heavy, like my battery never actually charges. I’m wondering how much of this is emotional or mental exhaustion rather than just sleep. Has anyone figured out the difference between being physically tired and being worn out emotionally, and what actually helped?`,
  },
  {
    title: 'How do you forgive yourself for past mistakes?',
    body: `There are a few things I’ve done in the past that still replay in my mind years later, even though I’ve apologised and tried to grow from them. I find it much easier to forgive other people than to forgive myself, and I keep punishing myself in my head. I know staying stuck in shame isn’t helping anyone, but I don’t know how to move into real self compassion. What has helped you actually let go and stop reliving old mistakes?`,
  },
  {
    title: 'Why do I push people away when I start caring about them?',
    body: `As soon as I start to really care about someone, I notice myself pulling back, replying slower, or finding reasons to create distance. It’s like getting close flips a switch that says “this is dangerous” even if the person has done nothing wrong. I’m scared of being abandoned or hurt, so I end up sabotaging the connection first. If you’ve been through this, how did you learn to stay present in relationships instead of pushing people away?`,
  },
  {
    title: 'How do I know if I’m burnt out or just lazy?',
    body: `I used to be able to push through tasks, but now even simple things feel overwhelming and I label myself as lazy. Part of me still cares and wants to do better, but my body and brain feel like they’re moving through mud. I can’t tell if I’m genuinely depleted or just making excuses. How do you personally tell the difference between burnout and “I just don’t feel like it,” and what did recovery look like for you?`,
  },
  {
    title: 'Why do I cry over small things lately?',
    body: `Recently, the tiniest things set me off — a small comment, a minor inconvenience, or even a song — and I end up in tears. I know the trigger itself isn’t that big, which makes me feel “too sensitive,” but the reaction feels huge in my body. I’m starting to wonder if it’s all the stress and emotions I’ve been holding in finally spilling over. Has anyone else had a phase like this, and did it mean something deeper was going on?`,
  },
  {
    title: 'How do I stop comparing myself to everyone else?',
    body: `I can scroll for a few minutes and suddenly feel like I’m behind in every area of life — career, relationships, looks, everything. Even when I know people only post their highlights, I still end up ranking myself below them. It’s exhausting to constantly measure my worth against strangers and friends online. What has actually helped you shift your focus back to your own path instead of constantly comparing?`,
  },
  {
    title: 'Why do I feel guilty for resting?',
    body: `Any time I try to rest, watch something, or just do nothing for a while, a voice in my head tells me I’m being unproductive or wasting time. Even when I’m clearly exhausted, I feel like I should be “using” that time to improve or achieve something. It’s hard to enjoy downtime when it always comes with guilt and self criticism. How did you learn that rest is allowed and not something you have to earn?`,
  },
  {
    title: 'How do I calm down during a panic attack?',
    body: `When I have a panic attack, my heart races, my chest feels tight, and I’m convinced something terrible is about to happen, even if I logically know I’m “safe.” In the moment it’s hard to remember any coping tools, and I usually just wait it out and feel shaken afterwards. I’d like to have a simple plan I can reach for when it starts, instead of feeling completely powerless. What has genuinely helped you ride out or reduce a panic attack in real time?`,
  },
];

async function updateBodies() {
  try {
    console.log('📝 Updating therapist question post bodies...');
    await connectDB();

    for (const item of QUESTION_BODY_UPDATES) {
      const res = await Post.findOneAndUpdate(
        {
          title: item.title,
          postType: 'question',
        },
        {
          $set: { content: item.body },
        },
        { new: true }
      );

      if (res) {
        console.log(`  ✓ Updated content for "${item.title}"`);
      } else {
        console.log(`  ⚠️  No matching post found for "${item.title}"`);
      }
    }

    console.log('✅ Finished updating question bodies.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating therapist question bodies:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

updateBodies();

