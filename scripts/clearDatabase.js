const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const User = require('../models/User');
const Company = require('../models/Company');
const Load = require('../models/Load');
const Vehicle = require('../models/Vehicle');
const DriverFinancials = require('../models/DriverFinancials');
const FuelTransaction = require('../models/FuelTransaction');
const DriverLog = require('../models/DriverLog');
const EldDevice = require('../models/EldDevice');

async function clearDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tms');
    console.log('✅ Connected to MongoDB');

    console.log('🗑️  Clearing all data from database...');

    // Clear all collections
    const collections = [
      { model: User, name: 'Users' },
      { model: Company, name: 'Companies' },
      { model: Load, name: 'Loads' },
      { model: Vehicle, name: 'Vehicles' },
      { model: DriverFinancials, name: 'Driver Financials' },
      { model: FuelTransaction, name: 'Fuel Transactions' },
      { model: DriverLog, name: 'Driver Logs' },
      { model: EldDevice, name: 'ELD Devices' }
    ];

    for (const { model, name } of collections) {
      try {
        const count = await model.countDocuments();
        if (count > 0) {
          await model.deleteMany({});
          console.log(`✅ Deleted ${count} ${name} records`);
        } else {
          console.log(`ℹ️  No ${name} records to delete`);
        }
      } catch (error) {
        console.log(`⚠️  Could not clear ${name}:`, error.message);
      }
    }

    // Also clear any other collections that might exist
    const db = mongoose.connection.db;
    const allCollections = await db.listCollections().toArray();

    for (const collection of allCollections) {
      const collectionName = collection.name;
      if (!['users', 'companies', 'loads', 'vehicles', 'driverfinancials', 'fueltransactions', 'driverlogs', 'elddevices'].includes(collectionName)) {
        try {
          const count = await db.collection(collectionName).countDocuments();
          if (count > 0) {
            await db.collection(collectionName).deleteMany({});
            console.log(`✅ Deleted ${count} records from ${collectionName} collection`);
          }
        } catch (error) {
          console.log(`⚠️  Could not clear ${collectionName}:`, error.message);
        }
      }
    }

    console.log('🎉 Database cleared successfully!');
    console.log('📝 Summary:');
    console.log('   - All user accounts deleted');
    console.log('   - All company data deleted');
    console.log('   - All loads deleted');
    console.log('   - All vehicles deleted');
    console.log('   - All driver financial records deleted');
    console.log('   - All fuel transactions deleted');
    console.log('   - All driver logs deleted');
    console.log('   - All ELD device records deleted');
    console.log('');
    console.log('✨ Ready for fresh data! You can now:');
    console.log('   1. Create new user accounts');
    console.log('   2. Each signup will get their own isolated company');
    console.log('   3. All data will be properly separated by company');

  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the script
clearDatabase();