import dotenv from 'dotenv';
import connectDB from '../config/database';
import User from '../models/User';
import Journal from '../models/Journal';
import JournalEntry from '../models/JournalEntry';

dotenv.config();

async function clearBrokenWingsEntries() {
  try {
    console.log('🧹 Clearing entries for journal "The night that changed everything"...');

    await connectDB();

    const user = await User.findOne({ username: 'BrokenWings' });
    if (!user) {
      console.log('  ⚠️ User BrokenWings not found, nothing to clear.');
      process.exit(0);
      return;
    }

    const journal = await Journal.findOne({
      owner: user._id,
      name: 'The night that changed everything',
    });

    if (!journal) {
      console.log('  ⚠️ Journal "The night that changed everything" not found, nothing to clear.');
      process.exit(0);
      return;
    }

    const result = await JournalEntry.deleteMany({ journal: journal._id });
    journal.entriesCount = 0;
    await journal.save();

    console.log(`  ✓ Deleted ${result.deletedCount} entries for "The night that changed everything"`);
    console.log('  ✓ Journal now has 0 entries');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing BrokenWings entries:', error);
    process.exit(1);
  }
}

clearBrokenWingsEntries();

