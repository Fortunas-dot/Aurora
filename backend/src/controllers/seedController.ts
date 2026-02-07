import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import connectDB from '../config/database';
import User from '../models/User';
import Post from '../models/Post';
import Group from '../models/Group';
import Comment from '../models/Comment';
import JournalEntry from '../models/JournalEntry';
import Message from '../models/Message';
import Notification from '../models/Notification';
import bcrypt from 'bcryptjs';

const sampleUsers = [
  {
    email: 'sarah@test.com',
    password: 'password123',
    username: 'sarah_wellness',
    displayName: 'Sarah',
    bio: 'Mental health advocate | Yoga enthusiast | Always here to listen 💙',
    isAnonymous: false,
    healthInfo: {
      mentalHealth: [
        { condition: 'anxiety', severity: 'moderate' },
        { condition: 'depression', severity: 'mild' },
      ],
      therapies: ['cbt', 'meditation'],
    },
  },
  {
    email: 'mike@test.com',
    password: 'password123',
    username: 'mike_mindful',
    displayName: 'Mike',
    bio: 'Sharing my journey with depression. You are not alone! 🌟',
    isAnonymous: false,
    healthInfo: {
      mentalHealth: [
        { condition: 'depression', severity: 'moderate' },
      ],
      medications: ['sertraline'],
    },
  },
  {
    email: 'lisa@test.com',
    password: 'password123',
    username: 'lisa_healing',
    displayName: 'Lisa',
    bio: 'Therapist in training | Mental health warrior | Spreading positivity ✨',
    isAnonymous: false,
    healthInfo: {
      mentalHealth: [
        { condition: 'anxiety', severity: 'mild' },
        { condition: 'ptsd', severity: 'moderate' },
      ],
      therapies: ['therapy', 'mindfulness'],
    },
  },
  {
    email: 'david@test.com',
    password: 'password123',
    username: 'david_strong',
    displayName: 'David',
    bio: 'Recovering from burnout | Learning to prioritize self-care 🧘',
    isAnonymous: false,
    healthInfo: {
      mentalHealth: [
        { condition: 'burnout', severity: 'severe' },
        { condition: 'anxiety', severity: 'moderate' },
      ],
      physicalHealth: [
        { condition: 'chronic fatigue', severity: 'moderate' },
      ],
    },
  },
  {
    email: 'emma@test.com',
    password: 'password123',
    username: 'emma_hopeful',
    displayName: 'Emma',
    bio: 'Bipolar disorder warrior | Art therapy lover | Living my best life 🎨',
    isAnonymous: false,
    healthInfo: {
      mentalHealth: [
        { condition: 'bipolar', severity: 'moderate' },
      ],
      medications: ['lithium'],
      therapies: ['art therapy'],
    },
  },
  {
    email: 'james@test.com',
    password: 'password123',
    username: 'james_calm',
    displayName: 'James',
    bio: 'ADHD & anxiety | Productivity tips | Coffee enthusiast ☕',
    isAnonymous: false,
    healthInfo: {
      mentalHealth: [
        { condition: 'adhd', severity: 'moderate' },
        { condition: 'anxiety', severity: 'mild' },
      ],
      medications: ['adderall'],
    },
  },
  {
    email: 'sophia@test.com',
    password: 'password123',
    username: 'sophia_zen',
    displayName: 'Sophia',
    bio: 'Mindfulness teacher | Meditation guide | Peace seeker 🧘‍♀️',
    isAnonymous: false,
    healthInfo: {
      mentalHealth: [
        { condition: 'anxiety', severity: 'mild' },
      ],
      therapies: ['meditation', 'yoga'],
    },
  },
  {
    email: 'alex@test.com',
    password: 'password123',
    username: 'alex_recovery',
    displayName: 'Alex',
    bio: 'Eating disorder recovery | Body positivity | Self-love journey 💪',
    isAnonymous: false,
    healthInfo: {
      mentalHealth: [
        { condition: 'eating disorder', severity: 'moderate' },
      ],
      therapies: ['cbt', 'nutrition counseling'],
    },
  },
];

const sampleGroups = [
  {
    name: 'Depression Support',
    description: 'A safe space for people dealing with depression. Share your experiences, tips and support each other.',
    tags: ['depression', 'support', 'mental-health'],
    isPrivate: false,
    avatar: null,
  },
  {
    name: 'Anxiety & Panic',
    description: 'For everyone struggling with anxiety and panic attacks. Together we are stronger.',
    tags: ['anxiety', 'panic', 'support'],
    isPrivate: false,
    avatar: null,
  },
  {
    name: 'Self-Care & Mindfulness',
    description: 'Tips, tricks and inspiration for self-care and mindfulness. Take time for yourself.',
    tags: ['self-care', 'mindfulness', 'wellness'],
    isPrivate: false,
    avatar: null,
  },
  {
    name: 'Bipolar Support',
    description: 'A community for people with bipolar disorder. Share experiences and support each other.',
    tags: ['bipolar', 'support', 'mental-health'],
    isPrivate: true,
    avatar: null,
  },
  {
    name: 'ADHD Community',
    description: 'For people with ADHD. Tips, strategies and understanding from like-minded people.',
    tags: ['adhd', 'neurodiversity', 'support'],
    isPrivate: false,
    avatar: null,
  },
  {
    name: 'Trauma Healing',
    description: 'A safe space for trauma healing and recovery. Professional guidance and peer support.',
    tags: ['trauma', 'healing', 'ptsd'],
    isPrivate: true,
    avatar: null,
  },
];

const samplePosts = [
  {
    title: 'Small Steps Forward',
    content: 'Today was a difficult day, but I\'m proud of myself for getting through it. Small steps are still steps forward! 💪',
    postType: 'post' as const,
    tags: ['depression', 'self-care', 'motivation'],
  },
  {
    title: 'How do you manage panic attacks when they happen in public?',
    content: `I've been struggling with panic attacks for about a year now, and while I've gotten better at managing them at home, I'm really struggling when they happen in public places. Last week I had one at the grocery store and I had to leave my cart and go sit in my car for 20 minutes before I could drive home. It was so embarrassing and scary.

The physical symptoms are the worst part for me - my heart races, I feel like I can't breathe, my hands shake, and I get dizzy. I know logically that I'm not having a heart attack, but in the moment it feels so real and terrifying. I've tried breathing exercises, but when I'm panicking, it's hard to remember to do them or to do them correctly.

I'm looking for practical strategies that work in the moment when you're in a public place. What do you do when you feel a panic attack coming on? Are there specific techniques that help you ground yourself quickly? How do you handle the embarrassment of having to leave or step away from a situation?

I'm also curious about prevention - are there things you do regularly that help reduce the frequency of panic attacks? I've noticed mine seem to be triggered by crowds, feeling trapped, or when I'm already stressed about other things. Any advice would be so appreciated. Thank you for reading.`,
    postType: 'question' as const,
    tags: ['anxiety', 'panic', 'question', 'coping-strategies', 'public-places'],
  },
  {
    title: 'My Depression Journey: Finding Light in the Darkness',
    content: `Three years ago, I found myself in a place I never thought I'd be. The world that once felt vibrant and full of possibilities had suddenly become gray, muted, and suffocating. I didn't recognize it at first—I thought I was just tired, maybe going through a rough patch. But the days turned into weeks, and the weeks into months, and I realized something was deeply wrong.

Getting out of bed became a monumental task. The simplest activities—showering, eating, even talking to friends—felt like climbing a mountain. I would lie in bed for hours, staring at the ceiling, feeling nothing and everything all at once. The weight on my chest was constant, making every breath feel like a struggle.

I remember the day I finally admitted I needed help. I was sitting in my car in a grocery store parking lot, unable to go inside. The thought of navigating the bright lights, the people, the decisions about what to buy—it all felt impossible. That's when I called my doctor.

Therapy wasn't a magic cure, but it was a start. My therapist helped me understand that depression wasn't a character flaw or a weakness—it was an illness, and like any illness, it could be treated. We worked through cognitive behavioral therapy, and slowly, I began to see patterns in my thinking that were keeping me stuck.

Medication was another piece of the puzzle. It took time to find the right one, and there were side effects and adjustments, but eventually, I found something that helped lift the fog just enough for me to start doing the work.

The journey wasn't linear. There were setbacks, days when I felt like I was back at square one. But I learned to celebrate small victories: getting out of bed before noon, making myself a meal, reaching out to a friend. These weren't small things—they were everything.

Today, I'm in a much better place. I still have difficult days, but I have tools now. I know how to recognize the warning signs, I have a support system, and most importantly, I know that I'm not alone. If you're reading this and you're in that dark place, please know that there is hope. Reach out. Ask for help. Your story isn't over yet. 🌟`,
    postType: 'story' as const,
    tags: ['depression', 'story', 'hope', 'recovery', 'therapy'],
  },
  {
    title: 'What mindfulness or meditation practices have actually helped you with anxiety and depression?',
    content: `I've been dealing with anxiety and depression for a while now, and my therapist keeps recommending mindfulness and meditation. I've tried a few apps and YouTube videos, but I'm struggling to stick with it and I'm not sure if it's really helping. I know it's supposed to be good for mental health, but I find it hard to quiet my mind - my thoughts just race even more when I try to sit still and focus.

I'm wondering what specific practices have actually worked for people here. Are there particular types of meditation that are better for anxiety? What about for depression when you feel too low to even want to try? How long did it take before you noticed any benefits?

I'm also curious about practical questions: How long do you meditate for? Do you do it at a specific time of day? What do you do when your mind wanders (which mine does constantly)? Are there any guided meditations or teachers you'd recommend?

I really want to give this a fair shot, but I'm feeling discouraged. I'd love to hear from people who have actually found mindfulness helpful, especially if you also struggled with it at first. What made it click for you? What would you tell someone who's just starting out?`,
    postType: 'question' as const,
    tags: ['mindfulness', 'meditation', 'anxiety', 'depression', 'self-care', 'question'],
  },
  {
    title: 'A Good Day',
    content: 'Today I had a good day for the first time in weeks. I feel hopeful. 🌈',
    postType: 'post' as const,
    tags: ['hope', 'positive', 'progress'],
  },
  {
    title: 'How do you handle social anxiety at work or in professional settings?',
    content: `I've been dealing with social anxiety for years, but it's become a real problem at my new job. I work in an office where there are a lot of team meetings, presentations, and networking events. Every time I have to speak up in a meeting, my heart starts racing, my voice shakes, and I feel like everyone can see how anxious I am. I've started avoiding speaking up even when I have good ideas, which is affecting my career.

The worst part is the anticipatory anxiety - I'll spend days worrying about an upcoming presentation or meeting. I can't sleep the night before, and I feel sick to my stomach. Afterward, I replay everything I said in my head, convinced I made a fool of myself (even though logically I know I probably didn't).

I'm looking for practical advice from people who've dealt with this. How do you manage the physical symptoms when you have to speak in meetings? Are there preparation strategies that help? How do you handle the self-criticism afterward?

I'm also wondering about disclosure - has anyone told their boss or HR about their social anxiety? I'm worried about stigma, but I'm also worried that if I don't say something, my performance will suffer. I'm in therapy and working on this, but I need strategies that work in the moment at work.

Any advice would be so helpful. Thank you.`,
    postType: 'question' as const,
    tags: ['anxiety', 'social-anxiety', 'work', 'professional', 'question', 'coping'],
  },
  {
    title: 'Embracing My ADHD: A Journey of Self-Acceptance',
    content: `Growing up, I always felt like I was running on a different operating system than everyone else. While my classmates could sit still and focus for hours, my mind was like a browser with 50 tabs open, each one playing a different video. I was labeled as "lazy," "disruptive," and "not living up to my potential." The truth was, I was trying harder than anyone knew.

I wasn't diagnosed until I was 25. By then, I had developed a lifetime of coping mechanisms, most of them unhealthy. I thought my inability to focus, my impulsivity, my emotional dysregulation—these were all personal failures. I spent years feeling broken, like there was something fundamentally wrong with me that I just needed to "fix."

The diagnosis was both a relief and a grief. Relief because finally, there was a name for what I was experiencing. Grief because I thought about all those years I spent hating myself, thinking I was just not trying hard enough.

Learning about ADHD changed everything. I discovered that my brain isn't broken—it's different. The same traits that made school difficult—hyperfocus, creativity, thinking outside the box—are also my greatest strengths. When I'm passionate about something, I can dive deeper than anyone. My mind makes connections others don't see. I see patterns and possibilities that linear thinkers miss.

Medication helped, but it wasn't the whole answer. I had to learn to work with my brain instead of against it. I use timers, break tasks into tiny pieces, and embrace my need for movement. I've learned that fidgeting isn't a distraction—it's how I think. I've accepted that I'll never be the person who remembers appointments without a calendar, and that's okay.

The hardest part was unlearning the shame. Years of being told I wasn't trying hard enough, that I was "too much" or "not enough," had left deep scars. But I'm learning to see my neurodivergence as a superpower, not a disability. My ADHD brain has given me resilience, creativity, and a unique perspective on the world.

To anyone else navigating this journey: you're not broken. Your brain works differently, and that's not a flaw—it's a feature. Neurodiversity is a strength. We need different kinds of minds to solve the world's problems. Your way of thinking is valuable, even if the world hasn't always made space for it. 🧠✨`,
    postType: 'story' as const,
    tags: ['adhd', 'neurodiversity', 'acceptance', 'self-love', 'mental-health'],
  },
  {
    title: 'Self-Care Tip of the Day',
    content: 'Self-care tip of the day: take a warm bath, put on your favorite music and read a good book. You deserve it! 🛁📚',
    postType: 'post' as const,
    tags: ['self-care', 'tip', 'wellness'],
  },
  {
    title: 'What was your experience starting anxiety medication? I\'m scared but considering it.',
    content: `I've been struggling with severe anxiety for about two years now. I've been in therapy and tried various coping strategies, but my anxiety is still significantly impacting my daily life. My therapist and doctor have both suggested that medication might help, but I'm really scared to try it.

I have a lot of concerns: What if the side effects are worse than my anxiety? What if I become dependent on it? What if it changes my personality? I've heard horror stories about people feeling like zombies or having terrible withdrawal symptoms. But I've also heard that medication can be life-changing for some people.

I'm wondering if people could share their honest experiences - both positive and negative. What medication did you try? How long did it take to work? What side effects did you experience, and did they go away? How did you know it was working?

I'm also curious about the process: How did you decide it was time to try medication? Did you try therapy first? How do you work with your doctor to find the right medication and dosage? What questions should I ask my doctor?

I know medication isn't a magic cure, and I plan to continue therapy. But I'm at a point where I feel like I need more help. I'd really appreciate hearing from people who've been through this decision. Thank you for sharing.`,
    postType: 'question' as const,
    tags: ['anxiety', 'medication', 'treatment', 'side-effects', 'question', 'therapy'],
  },
  {
    title: 'Setting Boundaries',
    content: 'Today I was proud of myself for saying "no" to something that was giving me too much stress. Setting boundaries is important! 💪',
    postType: 'post' as const,
    tags: ['boundaries', 'self-care', 'assertiveness'],
  },
  {
    title: 'Recovery from an Eating Disorder: Reclaiming My Relationship with Food',
    content: `My eating disorder didn't start with a diet. It started with a comment, a comparison, a moment of feeling like I wasn't enough. What began as "just being healthy" slowly became an obsession that consumed every waking moment of my life.

At first, it felt like control. In a world that felt chaotic and uncertain, controlling what I ate gave me a sense of power. I counted every calorie, weighed myself multiple times a day, and exercised compulsively. But the control I thought I had was actually controlling me.

Food became the enemy. Every meal was a battle, every bite a calculation. I would spend hours planning what I would eat, then feel overwhelming guilt and shame when I deviated from my plan. Social events became nightmares because they involved food. I started isolating myself, canceling plans, avoiding situations where I might have to eat in front of others.

My body was breaking down. I was cold all the time, my hair was falling out, and I was constantly exhausted. But the voice in my head told me I wasn't sick enough, that I needed to lose more weight, that I was still too much. The scale became my judge, jury, and executioner.

The turning point came when I collapsed at work. My body had simply had enough. In the hospital, a kind nurse looked at me and said, "You don't have to live like this." Something in me broke open. I was so tired of fighting, of calculating, of hating myself.

Recovery was the hardest thing I've ever done. It meant facing the feelings I had been numbing with restriction. It meant learning to eat again, to trust my body, to challenge the voice that told me I wasn't worthy. It meant gaining weight, which felt terrifying, but it also meant gaining my life back.

Therapy helped me understand that my eating disorder wasn't about food—it was about control, about perfectionism, about trying to be enough in a world that constantly told me I wasn't. I had to learn to sit with discomfort, to feel my feelings instead of numbing them, to be kind to myself.

Nutritional counseling taught me that food is fuel, not the enemy. I learned to eat intuitively, to listen to my body's signals, to honor my hunger and my fullness. It took time, but slowly, meals became less about control and more about nourishment.

Today, I'm in recovery. Not "recovered" in the sense that it's behind me forever—I still have difficult days, still have to be mindful of my thoughts and behaviors. But I'm living. I'm eating meals with friends, trying new foods, and most importantly, I'm learning to see my body as my home, not my enemy.

If you're struggling with an eating disorder, please know that recovery is possible. It's hard, and it's messy, and it's not linear. But you deserve to be free from this. You deserve to eat without fear, to live without constant calculation, to exist in your body without hating it. Help is available. You are not alone. ❤️`,
    postType: 'story' as const,
    tags: ['eating-disorder', 'recovery', 'hope', 'body-image', 'healing'],
  },
  {
    title: 'How do you manage chronic stress and prevent burnout?',
    content: `I feel like I'm constantly stressed and on the verge of burnout. I work a demanding job, have family responsibilities, and I'm also dealing with some personal health issues. Every day feels like I'm running on empty, and I'm starting to notice it's affecting my mental and physical health - I'm having trouble sleeping, I'm irritable, and I feel like I can't enjoy anything anymore.

I know I need to make changes, but I don't know where to start. I feel guilty taking time for myself because there's always so much to do. When I do try to relax, I can't turn my brain off - I'm constantly thinking about what I should be doing or worrying about what might go wrong.

I'm looking for practical strategies from people who've been in similar situations. What helped you when you were feeling overwhelmed? How do you prioritize self-care when you feel like you don't have time? Are there specific techniques for managing stress in the moment when you can't take a break?

I'm also curious about boundaries - how do you say no to additional responsibilities when you're already overwhelmed? I struggle with this because I don't want to let people down, but I know I'm spreading myself too thin.

I'm starting to realize that I can't keep going like this, but I don't know how to change. Any advice or strategies that have worked for you would be so appreciated. Thank you.`,
    postType: 'question' as const,
    tags: ['stress', 'burnout', 'self-care', 'boundaries', 'coping', 'question'],
  },
  {
    title: 'How do you know when it\'s time to seek professional help for mental health?',
    content: `I've been struggling with my mental health for a while now, but I'm not sure if it's "bad enough" to warrant seeing a therapist or psychiatrist. I keep telling myself that other people have it worse, that I should be able to handle this on my own, that I'm just being dramatic. But I'm also not functioning well - I'm having trouble at work, my relationships are suffering, and I feel miserable most of the time.

I've been dealing with what I think might be depression and anxiety for about 6 months. I have trouble sleeping, I've lost interest in things I used to enjoy, I feel anxious and worried all the time, and I'm having trouble concentrating. Some days I can barely get out of bed. But then I think - maybe this is just a rough patch? Maybe I should just try harder?

I'm wondering how other people knew it was time to seek help. What were the signs for you? Did you also struggle with feeling like you weren't "sick enough"? How did you overcome that barrier?

I'm also curious about the practical side - how did you find a therapist? What was the process like? How long did it take before you started feeling better? I'm worried about the cost and time commitment, but I'm also worried about continuing to feel this way.

Any guidance would be really helpful. I feel stuck and don't know what to do.`,
    postType: 'question' as const,
    tags: ['therapy', 'help-seeking', 'mental-health', 'depression', 'anxiety', 'question'],
  },
  {
    title: 'How do you support a loved one with mental health struggles without burning out?',
    content: `My partner has been dealing with severe depression for the past year. I love them deeply and want to be supportive, but I'm really struggling. I feel like I'm walking on eggshells all the time, trying to say the right thing, trying to help, but nothing I do seems to make a difference. They're in therapy and on medication, but progress is slow, and some days are really hard.

I'm exhausted. I feel like I'm carrying the weight of both of our mental health, and I don't know how much longer I can do it. I feel guilty for feeling this way - they're the one who's suffering, not me. But I'm also struggling with my own anxiety and stress from trying to support them.

I'm looking for advice from people who've been in similar situations. How do you balance being supportive with protecting your own mental health? What boundaries have you had to set? How do you deal with the guilt of needing to take care of yourself?

I also want to know what actually helps. What can I do or say that's actually supportive? What should I avoid? I feel like I'm constantly second-guessing myself, worried I'm going to say the wrong thing and make things worse.

I don't want to give up on them, but I also can't keep going like this. How do you maintain a relationship when one person is struggling with severe mental health issues? Is there hope for things to get better?`,
    postType: 'question' as const,
    tags: ['relationships', 'support', 'caregiver', 'depression', 'boundaries', 'question'],
  },
  {
    title: 'What helps with insomnia related to anxiety and depression?',
    content: `I've been struggling with insomnia for months now, and it's making everything worse. I lie in bed for hours, my mind racing with anxious thoughts and worries. When I do finally fall asleep, I wake up multiple times during the night, and I'm exhausted when my alarm goes off. The lack of sleep is making my anxiety and depression worse, which makes it even harder to sleep - it's a vicious cycle.

I've tried all the basic sleep hygiene stuff - no screens before bed, regular sleep schedule, avoiding caffeine, etc. But my mind just won't shut off. I'll be exhausted, but as soon as I lie down, my brain starts going through everything I'm worried about, everything I need to do, everything that could go wrong.

I'm wondering what has actually worked for people who've dealt with this. Are there specific techniques for quieting an anxious mind at bedtime? Has medication helped? What about therapy - did addressing the underlying anxiety help with sleep?

I'm also curious about the short-term - what do you do when you're lying in bed at 2am and can't sleep? Do you get up? Stay in bed? I've heard conflicting advice about this.

I'm desperate for better sleep. It feels like everything would be more manageable if I could just get some rest. Any advice would be so appreciated.`,
    postType: 'question' as const,
    tags: ['insomnia', 'sleep', 'anxiety', 'depression', 'question', 'coping'],
  },
  {
    title: 'Overcoming Social Anxiety: From Isolation to Connection',
    content: `For as long as I can remember, social situations felt like walking through a minefield. Every conversation was a potential disaster. What if I said something stupid? What if they could see how anxious I was? What if I had nothing interesting to contribute? These thoughts would race through my mind, making even simple interactions feel overwhelming.

I became a master at avoidance. I'd decline invitations, make excuses, find reasons to stay home. I convinced myself I was an introvert, that I just preferred being alone. But the truth was, I was lonely. I wanted connection, I wanted friends, I wanted to feel like I belonged somewhere. The fear was just too strong.

The panic attacks started in college. I'd be in a group setting, and suddenly my heart would race, my palms would sweat, and I'd feel like I couldn't breathe. I'd have to leave, find a bathroom, lock myself in a stall until the wave of terror passed. I thought I was going crazy.

It took me years to realize that what I was experiencing had a name: social anxiety disorder. Knowing it was a real condition, not just me being "weird" or "shy," was validating. But it also meant I had to face it.

Therapy was terrifying at first. Talking to a stranger about my deepest fears? But my therapist was patient and kind. We started small—exposure therapy, challenging my catastrophic thinking, learning coping strategies. I practiced breathing exercises, learned to recognize when my thoughts were spiraling, and gradually started putting myself in situations that scared me.

The first time I went to a party and stayed the whole time, I cried in my car afterward. Not from sadness, but from relief. I had done it. I had survived. And slowly, it got easier. Not easy—I still get anxious, I still have moments where I want to run. But I've learned that I can do hard things, that the fear doesn't have to control me.

I've made friends now. Real friends, people who know about my anxiety and accept me anyway. I've learned that most people are too busy worrying about themselves to judge me as harshly as I judge myself. I've discovered that vulnerability is actually a strength—when I'm honest about my struggles, people often open up about their own.

Social anxiety still visits me sometimes, but it's no longer the boss of my life. I go to events, I speak up in meetings, I make small talk with strangers. Some days are harder than others, and that's okay. Progress isn't linear. But I'm living now, not just surviving. And that's everything.`,
    postType: 'story' as const,
    tags: ['anxiety', 'social-anxiety', 'recovery', 'therapy', 'courage'],
  },
  {
    title: 'Living with Bipolar Disorder: Finding Balance in the Extremes',
    content: `My life has always felt like a roller coaster, but I didn't know why. There were periods where I felt invincible—I'd stay up for days, start multiple projects, feel like I could conquer the world. Then, without warning, I'd crash. The world would become gray, everything would feel impossible, and I'd struggle to get out of bed for weeks.

I thought this was just how life was. I thought everyone experienced these extreme highs and lows. It wasn't until my early thirties, after a particularly severe manic episode that led to hospitalization, that I received a diagnosis: bipolar disorder type II.

The diagnosis explained so much. The periods of intense creativity and energy weren't just "good moods"—they were hypomanic episodes. The crushing depressions weren't just "bad days"—they were part of a cycle I couldn't control. Understanding this was both a relief and a challenge.

Medication became essential. Finding the right combination took time—there were side effects, adjustments, periods where I felt like a zombie. But eventually, we found something that helped stabilize my moods without completely flattening me. I still feel things deeply, but now within a more manageable range.

Therapy taught me to recognize the warning signs. When I'm starting to go up, I notice: decreased need for sleep, racing thoughts, increased impulsivity. When I'm starting to go down, I notice: loss of interest, fatigue, hopeless thoughts. Recognizing these patterns early helps me take action before things spiral.

I've had to make lifestyle changes. Regular sleep is non-negotiable—disrupted sleep can trigger episodes. I've learned to manage stress, to say no when I need to, to prioritize my mental health. I've built routines that keep me grounded: morning meditation, regular exercise, consistent meal times.

The hardest part has been dealing with the stigma. People don't understand bipolar disorder. They think it means I'm "crazy" or unpredictable. But I'm not—I'm managing a chronic condition, just like someone with diabetes manages their blood sugar. I'm not my diagnosis; it's just one part of who I am.

I've learned to embrace both sides of myself. The hypomanic episodes, when managed, can be periods of incredible productivity and creativity. The depressive episodes, while painful, have given me deep empathy and understanding. I've learned to find balance, to ride the waves instead of fighting them.

Living with bipolar disorder isn't easy, but it's my reality. And I'm learning to make peace with it, to work with it instead of against it. I'm learning that stability doesn't mean boring—it means having the foundation to build a life I want to live.`,
    postType: 'story' as const,
    tags: ['bipolar', 'mental-health', 'recovery', 'stigma', 'resilience'],
  },
  {
    title: 'Healing from Trauma: A Journey of Reclaiming My Life',
    content: `Trauma doesn't always look like what you see in movies. It's not always a single, dramatic event. Sometimes it's a series of smaller hurts that accumulate over time, building into something that feels insurmountable. That's what happened to me.

I spent years not understanding why I reacted the way I did to certain situations. Why I'd freeze when someone raised their voice. Why I'd dissociate during conflict. Why I couldn't trust people, even when they showed me kindness. I thought there was something fundamentally broken about me.

It wasn't until I started therapy that I began to connect the dots. The childhood experiences I had minimized, the relationships I had normalized—these were traumas. They had shaped how my nervous system responded to the world, leaving me in a constant state of hypervigilance or shutdown.

The body keeps the score, as they say. My trauma lived in my body. The tension in my shoulders, the way I'd startle at sudden sounds, the difficulty I had feeling safe even in my own home—these were all my body's way of trying to protect me, even when the danger was long past.

Healing has been the hardest work of my life. It's meant revisiting painful memories, feeling feelings I had numbed for years, learning to sit with discomfort instead of running from it. It's meant learning that I'm safe now, that the danger is over, even when my body doesn't believe it yet.

EMDR therapy was a game-changer for me. It helped me process traumatic memories in a way that didn't retraumatize me. I learned that I could remember without reliving, that I could acknowledge what happened without being consumed by it.

Somatic therapy taught me to listen to my body, to understand its signals, to help it feel safe again. I learned breathing techniques, grounding exercises, ways to regulate my nervous system when it goes into fight-or-flight mode.

Building safety has been crucial. I've learned to set boundaries, to recognize red flags, to trust my instincts. I've surrounded myself with people who respect my boundaries, who understand that "no" is a complete sentence, who don't push when I need space.

The journey isn't over. I still have triggers, still have days when the past feels present. But I'm learning that healing isn't about erasing what happened—it's about integrating it, learning from it, and moving forward with wisdom and strength.

I'm learning to trust again, slowly. I'm learning that not everyone will hurt me, that I can be vulnerable and safe at the same time. I'm learning that my trauma responses were survival strategies, and I can honor them while also learning new ways of being in the world.

If you're on a similar journey, please know that healing is possible. It's not linear, and it's not easy, but it's worth it. You deserve to feel safe. You deserve to reclaim your life. Your trauma doesn't define you—it's just one part of your story, and you get to write the rest.`,
    postType: 'story' as const,
    tags: ['trauma', 'ptsd', 'healing', 'therapy', 'resilience', 'recovery'],
  },
  {
    title: 'Navigating Life with OCD: Beyond the Stereotypes',
    content: `When people think of OCD, they often picture someone who's overly organized, who likes things clean, who's a "perfectionist." But that's not what my OCD looks like. My OCD is intrusive thoughts that won't stop, compulsions I can't resist, and a constant feeling that something terrible will happen if I don't do things exactly right.

It started subtly. I'd have a thought—"What if I left the stove on?"—and even though I knew I had checked it, I'd have to go back and check again. And again. And again. The thought wouldn't leave until I had "proven" to myself that everything was safe. But the relief was temporary. The thought would come back, and the cycle would repeat.

The thoughts got darker. "What if I hurt someone?" "What if I'm a bad person?" "What if something terrible happens to my family?" These weren't desires—they were fears. But my brain couldn't tell the difference. I'd spend hours trying to prove to myself that I wasn't a monster, that I wouldn't do these things, that I was safe.

The compulsions took over my life. I'd wash my hands until they bled. I'd check locks dozens of times. I'd avoid certain numbers, certain words, certain situations that triggered my anxiety. I'd arrange things in specific ways, repeat actions until they felt "right," count things obsessively.

I thought I was going crazy. I thought I was the only person in the world who had these thoughts, who did these things. The shame was overwhelming. I hid it from everyone, even my family. I became a master at disguising my compulsions, at explaining away my behaviors.

It wasn't until I stumbled upon information about OCD online that I realized what I was experiencing had a name. Reading about intrusive thoughts, about how common they are, about how they don't reflect who you are—it was like a weight lifted. I wasn't crazy. I wasn't a bad person. I had a treatable condition.

Exposure and Response Prevention (ERP) therapy changed my life. It was terrifying at first—the idea of facing my fears, of not performing my compulsions, felt impossible. But my therapist guided me through it, starting small and building up. I learned that the anxiety would pass, that I could tolerate discomfort, that the thoughts were just thoughts, not predictions or commands.

Medication helped too. It didn't make the thoughts go away completely, but it made them quieter, less urgent, easier to ignore. Combined with therapy, it gave me the space to do the work of recovery.

Recovery from OCD isn't about making the thoughts stop—it's about learning to live with them, to not let them control you. I still have intrusive thoughts sometimes. But now I can recognize them for what they are: just thoughts, not reality. I can let them pass without engaging with them, without performing compulsions to make them go away.

I've learned that my brain is just trying to protect me, in its own misguided way. The intrusive thoughts, the compulsions—they're my brain's attempt to control uncertainty, to prevent harm. But I don't need to control everything. I can live with uncertainty. I can trust that I'm safe, even when my brain tells me I'm not.

If you're struggling with OCD, please know that you're not alone, and you're not your thoughts. Help is available. Recovery is possible. You don't have to live in fear. You can learn to live with uncertainty, to tolerate discomfort, to break free from the cycle of obsessions and compulsions.`,
    postType: 'story' as const,
    tags: ['ocd', 'anxiety', 'mental-health', 'therapy', 'recovery', 'hope'],
  },
];

const sampleComments = [
  'You are so strong! Keep going 💪',
  'I relate to this so much. Thanks for sharing.',
  'Try breathing exercises, they always help me.',
  'You are not alone. We are in this together.',
  'What beautiful progress! Proud of you 🌟',
  'Thank you for this tip, I\'m going to try it.',
  'I\'ve been through the same. If you want to talk, I\'m here to listen.',
  'What an inspiring story! This gives me hope.',
];

// @desc    Seed database with test data
// @route   POST /api/seed
// @access  Public (for development - should be protected in production)
export const seedDatabase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('🌱 Starting database seeding via API...');
    
    // Ensure database is connected
    await connectDB();
    
    // Clear existing data (but preserve protected accounts)
    console.log('🗑️  Clearing existing data...');
    
    // Preserve protected accounts (Apple review account, etc.)
    const protectedUsers = await User.find({ isProtected: true });
    const protectedEmails = protectedUsers.map(u => u.email);
    
    if (protectedUsers.length > 0) {
      console.log(`  ✓ Preserving ${protectedUsers.length} protected account(s):`);
      protectedUsers.forEach(user => {
        console.log(`    - ${user.email} (${user.username})`);
      });
    }
    
    // Clear all data except protected accounts
    if (protectedEmails.length > 0) {
      await User.deleteMany({ email: { $nin: protectedEmails } });
    } else {
      await User.deleteMany({});
    }
    // Update all existing groups to remove avatars BEFORE deleting (in case there are groups not created via seed)
    await Group.updateMany({}, { avatar: null }); // Force all groups to have null avatar
    
    await Post.deleteMany({});
    await Group.deleteMany({});
    await Comment.deleteMany({});
    await JournalEntry.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});
    
    // Create users
    console.log('👥 Creating users...');
    const usersToInsert = [];
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const { password, ...restData } = userData;
      usersToInsert.push({
        ...restData,
        password: hashedPassword,
      });
    }
    const insertedUsers = await User.insertMany(usersToInsert);
    const createdUsers = [...insertedUsers];
    
    // Add protected users to createdUsers array if they exist
    if (protectedUsers.length > 0) {
      protectedUsers.forEach(user => {
        // Ensure displayName is set (required field)
        if (!user.displayName) {
          user.displayName = user.username || user.email || 'User';
          user.save();
        }
        createdUsers.push(user as any);
        console.log(`  ✓ Preserved protected user: ${user.username || user.email}`);
      });
    }
    
    // Create groups
    console.log('👥 Creating groups...');
    const createdGroups = [];
    for (let i = 0; i < sampleGroups.length; i++) {
      const groupData = sampleGroups[i];
      const admin = createdUsers[i % createdUsers.length];
      const members = createdUsers.slice(0, Math.min(4, createdUsers.length));
      
      const group = await Group.create({
        ...groupData,
        admins: [admin._id],
        members: members.map(u => u._id),
        avatar: null, // Explicitly set to null - no person photos
      });
      createdGroups.push(group);
    }
    
    // Force update all groups to ensure avatar is null (safety check)
    await Group.updateMany({}, { avatar: null });
    
    // Create posts
    console.log('📝 Creating posts...');
    const createdPosts = [];
    for (let i = 0; i < samplePosts.length; i++) {
      const postData = samplePosts[i];
      const author = createdUsers[i % createdUsers.length];
      const group = i < createdGroups.length ? createdGroups[i] : null;
      
      const post = await Post.create({
        ...postData,
        author: author._id,
        groupId: group?._id,
        likes: createdUsers.slice(0, Math.floor(Math.random() * 5)).map(u => u._id),
        commentsCount: 0,
      });
      createdPosts.push(post);
    }
    
    // Create comments
    console.log('💬 Creating comments...');
    for (let i = 0; i < createdPosts.length; i++) {
      const post = createdPosts[i];
      const numComments = Math.floor(Math.random() * 4) + 1;
      
      for (let j = 0; j < numComments; j++) {
        const commentAuthor = createdUsers[Math.floor(Math.random() * createdUsers.length)];
        const comment = await Comment.create({
          post: post._id,
          author: commentAuthor._id,
          content: sampleComments[Math.floor(Math.random() * sampleComments.length)],
          likes: [],
        });
        
        post.commentsCount += 1;
        await post.save();
      }
    }
    
    // Create follow relationships
    console.log('🔗 Creating follow relationships...');
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      const numFollowing = Math.floor(Math.random() * 3) + 1;
      const following = createdUsers
        .filter(u => u._id.toString() !== user._id.toString())
        .sort(() => Math.random() - 0.5)
        .slice(0, numFollowing);
      
      user.following = following.map(u => u._id);
      await user.save();
    }
    
    const summary = {
      users: createdUsers.length,
      groups: createdGroups.length,
      posts: createdPosts.length,
      comments: await Comment.countDocuments(),
      journalEntries: await JournalEntry.countDocuments(),
      messages: await Message.countDocuments(),
      notifications: await Notification.countDocuments(),
    };
    
    console.log('✅ Database seeding completed successfully!');
    console.log('📊 Summary:', summary);
    
    res.json({
      success: true,
      message: 'Database seeded successfully',
      data: summary,
    });
  } catch (error: any) {
    console.error('❌ Error seeding database:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error seeding database',
    });
  }
};

