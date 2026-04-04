import cron from 'node-cron';
import User from '../models/User';
import { sendPushNotification } from '../services/pushNotification.service';

const INACTIVITY_DAYS = 5;
const COOLDOWN_DAYS = 7; // Don't re-send within 7 days of the previous inactivity notification

const MESSAGES: Array<{ title: string; body: string }> = [
  {
    title: 'Hey, how are you doing?',
    body: "We haven't seen you in a while. Just checking in \u2013 your Aurora community is here for you.",
  },
  {
    title: 'We miss you',
    body: "It's been a few days. Remember, you're not alone \u2013 your community is always here when you need it.",
  },
  {
    title: 'Just checking in',
    body: "How have you been? Take a moment to share how you're feeling \u2013 we're here to listen.",
  },
  {
    title: 'Thinking of you',
    body: "It's okay to take a break, but know that your Aurora community is here whenever you're ready.",
  },
  {
    title: 'Your community misses you',
    body: "It's been a while since your last visit. Drop by and see what others have shared \u2013 you might find something that resonates.",
  },
  {
    title: 'How are you feeling today?',
    body: "We noticed you've been away. Whatever you're going through, Aurora is a safe space to talk about it.",
  },
];

function pickRandom(): { title: string; body: string } {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}

async function sendInactivityNotifications(): Promise<void> {
  const now = new Date();
  const inactiveBefore = new Date(now.getTime() - INACTIVITY_DAYS * 24 * 60 * 60 * 1000);
  const cooldownBefore = new Date(now.getTime() - COOLDOWN_DAYS * 24 * 60 * 60 * 1000);

  try {
    const inactiveUsers = await User.find({
      lastActiveAt: { $lt: inactiveBefore },
      'pushTokens.0': { $exists: true },
      $or: [
        { lastInactivityNotificationAt: null },
        { lastInactivityNotificationAt: { $lt: cooldownBefore } },
      ],
    }).select('_id');

    if (inactiveUsers.length === 0) return;

    console.log(`[InactivityJob] Found ${inactiveUsers.length} inactive user(s). Sending notifications…`);

    for (const user of inactiveUsers) {
      const { title, body } = pickRandom();
      try {
        await sendPushNotification({
          userId: user._id.toString(),
          title,
          body,
          data: { type: 'inactivity_checkin' },
        });
        await User.updateOne(
          { _id: user._id },
          { $set: { lastInactivityNotificationAt: now } },
        );
      } catch (err) {
        console.warn(`[InactivityJob] Failed for user ${user._id}:`, err);
      }
    }

    console.log(`[InactivityJob] Done.`);
  } catch (err) {
    console.error('[InactivityJob] Error:', err);
  }
}

/**
 * Schedule the inactivity check-in notification job.
 * Runs daily at 10:00 UTC.
 */
export function startInactivityCron(): void {
  cron.schedule('0 10 * * *', () => {
    sendInactivityNotifications();
  });
  console.log('[InactivityJob] Cron scheduled – daily at 10:00 UTC');
}
