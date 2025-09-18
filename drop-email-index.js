const mongoose = require('mongoose');
require('dotenv').config();

async function dropEmailIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    console.log('🔍 Checking existing indexes...');
    const indexes = await collection.indexes();
    console.log('Current indexes:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, index.key);
    });

    // Drop the email index if it exists
    try {
      await collection.dropIndex('email_1');
      console.log('✅ Successfully dropped email_1 index');
    } catch (error) {
      if (error.codeName === 'IndexNotFound') {
        console.log('ℹ️ email_1 index does not exist');
      } else {
        console.log('❌ Error dropping email_1 index:', error.message);
      }
    }

    console.log('🔍 Listing updated indexes...');
    const newIndexes = await collection.indexes();
    console.log('Updated indexes:');
    newIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, index.key);
    });

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📴 Disconnected from MongoDB');
  }
}

dropEmailIndex();