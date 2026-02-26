import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database';
import User from '../models/User';
import Journal from '../models/Journal';
import JournalEntry from '../models/JournalEntry';

dotenv.config();

async function shiftHiddenVoiceJournalDates() {
  try {
    console.log('🕒 Shifting dates for "My uncle touches me" journal...');

    await connectDB();

    const user = await User.findOne({ username: 'HiddenVoice' });
    if (!user) {
      console.log('  ⚠️ User HiddenVoice not found.');
      return;
    }

    const journal = await Journal.findOne({
      owner: user._id,
      name: 'My uncle touches me',
    });

    if (!journal) {
      console.log('  ⚠️ Journal "My uncle touches me" not found.');
      return;
    }

    // We want these entries to be in the past relative to today (2026-02-26).
    // The original script created them in Feb–Mar 2026. We'll move any 2026 entries
    // for this journal one year back to 2025 so they make chronological sense.
    const fromDate = new Date('2026-01-01T00:00:00.000Z');
    const toDate = new Date('2027-01-01T00:00:00.000Z');

    const entries = await JournalEntry.find({
      journal: journal._id,
      createdAt: { $gte: fromDate, $lt: toDate },
    }).sort({ createdAt: 1 });

    if (!entries.length) {
      console.log('  ⚠️ No 2026 entries found to shift. Nothing to do.');
      return;
    }

    console.log(`  ✓ Found ${entries.length} entries in 2026 to shift back one year.`);

    const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

    for (const entry of entries) {
      const oldCreated = entry.createdAt;
      const oldUpdated = entry.updatedAt;

      entry.createdAt = new Date(oldCreated.getTime() - ONE_YEAR_MS);
      entry.updatedAt = new Date(oldUpdated.getTime() - ONE_YEAR_MS);
      await entry.save();

      console.log(
        `    • Shifted entry "${String(entry._id)}" from ${oldCreated.toISOString()} to ${entry.createdAt.toISOString()}`
      );
    }

    console.log('  ✓ Finished shifting entry dates.');

    // Optionally, also move the journal timestamps back a year so metadata matches
    if (journal.createdAt >= fromDate && journal.createdAt < toDate) {
      const oldJournalCreated = journal.createdAt;
      const oldJournalUpdated = journal.updatedAt;
      journal.createdAt = new Date(oldJournalCreated.getTime() - ONE_YEAR_MS);
      journal.updatedAt = new Date(oldJournalUpdated.getTime() - ONE_YEAR_MS);
      await journal.save();
      console.log(
        `  ✓ Shifted journal timestamps from ${oldJournalCreated.toISOString()} to ${journal.createdAt.toISOString()}`
      );
    }

    console.log('\n✅ Successfully shifted dates for HiddenVoice journal.');
  } catch (error) {
    console.error('❌ Error shifting HiddenVoice journal dates:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('  ✓ Database connection closed');
  }
}

shiftHiddenVoiceJournalDates();

