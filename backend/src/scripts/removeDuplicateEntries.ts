import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database';
import User from '../models/User';
import Journal from '../models/Journal';
import JournalEntry from '../models/JournalEntry';

dotenv.config();

async function removeDuplicateEntries() {
  try {
    console.log('🧹 Removing duplicate entries from "My uncle touches me" journal...');

    await connectDB();

    const user = await User.findOne({ username: 'HiddenVoice' });
    if (!user) {
      console.log('  ⚠️ User HiddenVoice not found.');
      process.exit(0);
      return;
    }

    const journal = await Journal.findOne({
      owner: user._id,
      name: 'My uncle touches me',
    });

    if (!journal) {
      console.log('  ⚠️ Journal "My uncle touches me" not found.');
      process.exit(0);
      return;
    }

    // Get all entries for this journal
    const allEntries = await JournalEntry.find({ journal: journal._id }).sort({ createdAt: 1 });
    console.log(`  ✓ Found ${allEntries.length} total entries`);

    // Group entries by content (exact match)
    const contentMap = new Map<string, any[]>();
    
    for (const entry of allEntries) {
      const content = entry.content.trim();
      if (!contentMap.has(content)) {
        contentMap.set(content, []);
      }
      contentMap.get(content)!.push(entry);
    }

    // Find duplicates (entries with same content)
    let duplicatesRemoved = 0;
    const entriesToKeep = new Set<string>();

    for (const [content, entries] of contentMap.entries()) {
      if (entries.length > 1) {
        console.log(`  ⚠️ Found ${entries.length} duplicate entries with same content (${content.substring(0, 50)}...)`);
        
        // Keep the oldest entry (first created), delete the rest
        entries.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        const keepEntry = entries[0];
        entriesToKeep.add(keepEntry._id.toString());
        
        // Delete the duplicates
        for (let i = 1; i < entries.length; i++) {
          await JournalEntry.findByIdAndDelete(entries[i]._id);
          duplicatesRemoved++;
        }
      } else {
        // Single entry, keep it
        entriesToKeep.add(entries[0]._id.toString());
      }
    }

    // Update journal entries count
    const remainingCount = await JournalEntry.countDocuments({ journal: journal._id });
    journal.entriesCount = remainingCount;
    await journal.save();

    console.log(`  ✓ Removed ${duplicatesRemoved} duplicate entries`);
    console.log(`  ✓ Remaining entries: ${remainingCount}`);
    console.log('  ✓ Journal entries count updated');

    console.log('\n✅ Successfully removed duplicate entries!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error removing duplicate entries:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('  ✓ Database connection closed');
  }
}

// Run the script
removeDuplicateEntries();
