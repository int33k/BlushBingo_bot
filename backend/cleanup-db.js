/**
 * Database cleanup script to remove old indexes and fix schema issues
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function cleanupDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
    });

    console.log('Connected to MongoDB');

    // Get the games collection
    const db = mongoose.connection.db;
    const gamesCollection = db.collection('games');

    // List current indexes
    console.log('Current indexes:');
    const indexes = await gamesCollection.indexes();
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${JSON.stringify(index.key)} - ${index.name}`);
    });

    // Try to drop the challengeCode index if it exists
    try {
      await gamesCollection.dropIndex('challengeCode_1');
      console.log('✅ Dropped challengeCode_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  challengeCode_1 index does not exist (already dropped)');
      } else {
        console.log('❌ Error dropping challengeCode_1 index:', error.message);
      }
    }

    // List indexes after cleanup
    console.log('\nIndexes after cleanup:');
    const newIndexes = await gamesCollection.indexes();
    newIndexes.forEach((index, i) => {
      console.log(`${i + 1}. ${JSON.stringify(index.key)} - ${index.name}`);
    });

    // Clean up any games with null challengeCode
    const result = await gamesCollection.deleteMany({ challengeCode: null });
    console.log(`\n🧹 Cleaned up ${result.deletedCount} games with null challengeCode`);

    console.log('✅ Database cleanup completed');

  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

cleanupDatabase();
