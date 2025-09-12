const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const DriverFinancials = require('../models/DriverFinancials');

const sampleDrivers = [
  // Owner Operators
  {
    firstName: 'John',
    lastName: 'Stevens',
    email: 'john.stevens@email.com',
    password: 'driver123',
    role: 'driver',
    phone: '+1-555-0101',
    licenseNumber: 'DL001',
    isActive: true,
    driverType: 'owner_operator',
    yearlyGross: 185500,
    yearlyProfit: 52300
  },
  {
    firstName: 'Maria',
    lastName: 'Rodriguez',
    email: 'maria.rodriguez@email.com',
    password: 'driver123',
    role: 'driver',
    phone: '+1-555-0102',
    licenseNumber: 'DL002',
    isActive: true,
    driverType: 'owner_operator',
    yearlyGross: 178200,
    yearlyProfit: 48900
  },
  {
    firstName: 'David',
    lastName: 'Chen',
    email: 'david.chen@email.com',
    password: 'driver123',
    role: 'driver',
    phone: '+1-555-0103',
    licenseNumber: 'DL003',
    isActive: true,
    driverType: 'owner_operator',
    yearlyGross: 192800,
    yearlyProfit: 56700
  },
  {
    firstName: 'Sarah',
    lastName: 'Thompson',
    email: 'sarah.thompson@email.com',
    password: 'driver123',
    role: 'driver',
    phone: '+1-555-0104',
    licenseNumber: 'DL004',
    isActive: true,
    driverType: 'owner_operator',
    yearlyGross: 167300,
    yearlyProfit: -2800
  },
  // Company Drivers
  {
    firstName: 'James',
    lastName: 'Brown',
    email: 'james.brown@email.com',
    password: 'driver123',
    role: 'driver',
    phone: '+1-555-0201',
    licenseNumber: 'DL101',
    isActive: true,
    driverType: 'company_driver',
    yearlyGross: 89500,
    yearlyProfit: 18900
  },
  {
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@email.com',
    password: 'driver123',
    role: 'driver',
    phone: '+1-555-0202',
    licenseNumber: 'DL102',
    isActive: true,
    driverType: 'company_driver',
    yearlyGross: 92300,
    yearlyProfit: 21400
  },
  {
    firstName: 'Carlos',
    lastName: 'Martinez',
    email: 'carlos.martinez@email.com',
    password: 'driver123',
    role: 'driver',
    phone: '+1-555-0203',
    licenseNumber: 'DL103',
    isActive: true,
    driverType: 'company_driver',
    yearlyGross: 87600,
    yearlyProfit: -1200
  },
  {
    firstName: 'Jennifer',
    lastName: 'Lee',
    email: 'jennifer.lee@email.com',
    password: 'driver123',
    role: 'driver',
    phone: '+1-555-0204',
    licenseNumber: 'DL104',
    isActive: true,
    driverType: 'company_driver',
    yearlyGross: 94800,
    yearlyProfit: 23100
  }
];

const seedDrivers = async () => {
  try {
    console.log('🌱 Starting driver seeding process...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tms_development', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data
    await User.deleteMany({ role: 'driver' });
    await DriverFinancials.deleteMany({});
    console.log('🧹 Cleared existing driver data');
    
    const currentYear = new Date().getFullYear();
    
    // Create drivers and their financial records
    for (const driverData of sampleDrivers) {
      // Extract financial data
      const { driverType, yearlyGross, yearlyProfit, ...userData } = driverData;
      
      // Create user
      const user = new User(userData);
      await user.save();
      console.log(`👤 Created driver: ${user.fullName}`);
      
      // Create financial record
      const financialData = new DriverFinancials({
        driver: user._id,
        driverType,
        year: currentYear,
        yearlyGross,
        yearlyProfit: yearlyProfit
      });
      
      await financialData.save();
      console.log(`💰 Created financial record for ${user.fullName}: $${yearlyGross} gross, $${yearlyProfit} profit`);
    }
    
    console.log('✅ Driver seeding completed successfully!');
    console.log(`📊 Created ${sampleDrivers.length} drivers with financial data`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding drivers:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedDrivers();
}

module.exports = seedDrivers;