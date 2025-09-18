const mongoose = require('mongoose');
require('dotenv').config();

async function fixProductionDatabase() {
  try {
    // Connect to the same database used in production
    const mongoUri = process.env.MONGODB_URI;
    console.log('🔗 Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to production database');

    const db = mongoose.connection.db;

    // 1. Drop email index from users collection if it exists
    console.log('\n🔍 Fixing users collection indexes...');
    const usersCollection = db.collection('users');

    try {
      const indexes = await usersCollection.indexes();
      console.log('Current user indexes:');
      indexes.forEach(index => {
        console.log(`  - ${index.name}:`, index.key);
      });

      // Drop email index if it exists
      try {
        await usersCollection.dropIndex('email_1');
        console.log('✅ Successfully dropped email_1 index');
      } catch (error) {
        if (error.codeName === 'IndexNotFound') {
          console.log('ℹ️ email_1 index does not exist (already fixed)');
        } else {
          console.log('❌ Error dropping email_1 index:', error.message);
        }
      }
    } catch (error) {
      console.log('❌ Error checking user indexes:', error.message);
    }

    // 2. Check for data sharing issues in existing data
    console.log('\n🔍 Checking for data sharing issues...');

    // Count users by company
    const usersByCompany = await usersCollection.aggregate([
      { $group: { _id: '$company', count: { $sum: 1 }, users: { $push: { email: '$email', role: '$role' } } } },
      { $sort: { count: -1 } }
    ]).toArray();

    console.log('Users grouped by company:');
    usersByCompany.forEach(group => {
      console.log(`  Company ${group._id}: ${group.count} users`);
      group.users.forEach(user => {
        console.log(`    - ${user.email} (${user.role})`);
      });
    });

    // 3. Check for drivers without company assignment
    console.log('\n🔍 Checking drivers without company assignment...');
    const driversWithoutCompany = await usersCollection.find({
      role: 'driver',
      $or: [
        { company: { $exists: false } },
        { company: null }
      ]
    }).toArray();

    if (driversWithoutCompany.length > 0) {
      console.log(`⚠️ Found ${driversWithoutCompany.length} drivers without company assignment:`);
      driversWithoutCompany.forEach(driver => {
        console.log(`  - ${driver.email || 'No email'} (ID: ${driver._id})`);
      });

      // These drivers need manual assignment or deletion
      console.log('\n💡 These drivers should be assigned to a company or deleted');
    } else {
      console.log('✅ All drivers have company assignments');
    }

    // 4. Check driver financials collection
    console.log('\n🔍 Checking driver financials...');
    const financialsCollection = db.collection('driverfinancials');
    const financialsCount = await financialsCollection.countDocuments();
    console.log(`📊 Total driver financial records: ${financialsCount}`);

    // 5. Summary
    console.log('\n📋 Summary:');
    console.log(`- Total users: ${await usersCollection.countDocuments()}`);
    console.log(`- Total companies: ${usersByCompany.length}`);
    console.log(`- Drivers without company: ${driversWithoutCompany.length}`);
    console.log(`- Driver financial records: ${financialsCount}`);

    console.log('\n🎯 Recommended actions:');
    if (driversWithoutCompany.length > 0) {
      console.log('1. Assign orphaned drivers to appropriate companies');
      console.log('2. Or delete orphaned drivers if they are test data');
    }
    console.log('3. Verify application is using the latest code with authentication fixes');
    console.log('4. Test driver creation and company isolation');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📴 Disconnected from database');
  }
}

fixProductionDatabase();