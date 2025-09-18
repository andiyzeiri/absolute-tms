const express = require('express');
const router = express.Router();
const User = require('../models/User');
const DriverFinancials = require('../models/DriverFinancials');
const { authenticateToken } = require('../middleware/demoAuth');

// Get all drivers with financial data
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type } = req.query; // 'owner_operator' or 'company_driver'
    const currentYear = new Date().getFullYear();

    // Build query - ALWAYS filter by company
    let query = {
      role: 'driver',
      isActive: true,
      company: req.user.company || req.user._id
    };

    // Get drivers
    const drivers = await User.find(query).select('firstName lastName email');
    
    // Get financial data for each driver
    const driversWithFinancials = await Promise.all(
      drivers.map(async (driver) => {
        let financialData = await DriverFinancials.findOne({
          driver: driver._id,
          year: currentYear
        });
        
        // Create default financial record if none exists
        if (!financialData) {
          financialData = new DriverFinancials({
            driver: driver._id,
            driverType: type || 'company_driver',
            year: currentYear
          });
          await financialData.save();
        }
        
        // Filter by type if specified
        if (type && financialData.driverType !== type) {
          return null;
        }
        
        return {
          _id: driver._id,
          name: driver.fullName,
          email: driver.email,
          driverType: financialData.driverType,
          yearlyGross: financialData.yearlyGross,
          profit: financialData.yearlyProfit,
          profitMargin: financialData.profitMargin
        };
      })
    );
    
    // Filter out null results and return
    const filteredDrivers = driversWithFinancials.filter(driver => driver !== null);
    
    res.json({
      success: true,
      data: filteredDrivers,
      count: filteredDrivers.length
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching driver data',
      error: error.message
    });
  }
});

// Create a new driver
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, driverType, yearlyGross, yearlyProfit } = req.body;
    const currentYear = new Date().getFullYear();
    
    // Create user
    const userData = {
      firstName,
      lastName,
      email,
      password: 'defaultPassword123', // Default password
      role: 'driver',
      isActive: true
    };
    
    const newUser = new User(userData);
    await newUser.save();
    
    // Create financial record
    const financialData = new DriverFinancials({
      driver: newUser._id,
      driverType: driverType || 'company_driver',
      year: currentYear,
      yearlyGross: parseFloat(yearlyGross) || 0,
      yearlyProfit: parseFloat(yearlyProfit) || 0
    });
    
    await financialData.save();
    
    res.status(201).json({
      success: true,
      message: 'Driver created successfully',
      data: {
        _id: newUser._id,
        name: newUser.fullName,
        email: newUser.email,
        driverType: financialData.driverType,
        yearlyGross: financialData.yearlyGross,
        profit: financialData.yearlyProfit,
        profitMargin: financialData.profitMargin
      }
    });
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating driver',
      error: error.message
    });
  }
});

// Update driver financial data
router.put('/:driverId/financials', async (req, res) => {
  try {
    const { driverId } = req.params;
    const { yearlyGross, yearlyProfit, driverType } = req.body;
    const currentYear = new Date().getFullYear();
    
    // Validate driver exists
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'driver') {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    // Update or create financial record
    let financialData = await DriverFinancials.findOneAndUpdate(
      { driver: driverId, year: currentYear },
      {
        yearlyGross: yearlyGross || 0,
        yearlyProfit: yearlyProfit || 0,
        driverType: driverType || 'company_driver'
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );
    
    res.json({
      success: true,
      message: 'Driver financial data updated successfully',
      data: {
        driver: driver.fullName,
        yearlyGross: financialData.yearlyGross,
        profit: financialData.yearlyProfit,
        profitMargin: financialData.profitMargin
      }
    });
  } catch (error) {
    console.error('Error updating driver financials:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating driver financial data',
      error: error.message
    });
  }
});

// Get dashboard stats
router.get('/dashboard-stats', authenticateToken, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    // First get drivers from user's company
    const companyDrivers = await User.find({
      role: 'driver',
      isActive: true,
      company: req.user.company || req.user._id
    }).select('_id');

    const driverIds = companyDrivers.map(driver => driver._id);

    // Get financial records only for company drivers
    const financialRecords = await DriverFinancials.find({
      year: currentYear,
      driver: { $in: driverIds }
    }).populate('driver', 'firstName lastName');
    
    // Separate by driver type
    const ownerOperators = financialRecords.filter(record => 
      record.driverType === 'owner_operator'
    );
    const companyDrivers = financialRecords.filter(record => 
      record.driverType === 'company_driver'
    );
    
    // Calculate totals
    const totalRevenue = financialRecords.reduce((sum, record) => 
      sum + record.yearlyGross, 0
    );
    
    // Calculate week and month revenues (simplified - using current totals)
    const weeklyRevenue = Math.round(totalRevenue * 0.02); // ~2% of yearly
    const monthlyRevenue = Math.round(totalRevenue * 0.08); // ~8% of yearly
    
    res.json({
      totalRevenue,
      weeklyRevenue,
      monthlyRevenue,
      yearToDateRevenue: totalRevenue,
      ownerOperators: ownerOperators.length,
      companyDrivers: companyDrivers.length,
      activeDrivers: financialRecords.length
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
});

// Delete a driver
router.delete('/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    
    // Check if driver exists
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'driver') {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    // Delete financial records
    await DriverFinancials.deleteMany({ driver: driverId });
    
    // Delete user
    await User.findByIdAndDelete(driverId);
    
    res.json({
      success: true,
      message: 'Driver deleted successfully',
      data: {
        deletedDriver: driver.fullName
      }
    });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting driver',
      error: error.message
    });
  }
});

module.exports = router;