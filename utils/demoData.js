const bcrypt = require('bcryptjs');

// Demo users for immediate functionality when MongoDB is not available
const createDemoUsers = async () => {
  const demoUsers = [
    {
      _id: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@tms.com',
      password: await bcrypt.hash('demo123', 12),
      role: 'admin',
      phone: '+1-555-0123',
      isActive: true,
      fullName: 'Admin User',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'driver123',
      firstName: 'John',
      lastName: 'Driver',
      email: 'john.driver@tms.com',
      password: await bcrypt.hash('demo123', 12),
      role: 'driver',
      phone: '+1-555-0124',
      isActive: true,
      fullName: 'John Driver',
      licenseNumber: 'DL123456789',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  return demoUsers;
};

const demoStats = {
  activeTrips: Math.floor(Math.random() * 20) + 15,
  totalVehicles: Math.floor(Math.random() * 10) + 25,
  activeDrivers: Math.floor(Math.random() * 5) + 12,
  pendingInvoices: Math.floor(Math.random() * 8) + 5,
  totalRevenue: Math.floor(Math.random() * 50000) + 150000,
  // Revenue breakdown by time period
  weeklyRevenue: Math.floor(Math.random() * 15000) + 25000,
  monthlyRevenue: Math.floor(Math.random() * 50000) + 150000,
  yearToDateRevenue: Math.floor(Math.random() * 200000) + 850000
};

module.exports = {
  createDemoUsers,
  demoStats
};