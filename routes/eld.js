const express = require('express');
const router = express.Router();
const EldWebTokenService = require('../services/eldWebTokenService');
const DriverLog = require('../models/DriverLog');
const EldDevice = require('../models/EldDevice');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Initialize ELD service
const eldService = new EldWebTokenService();

// Middleware for ELD service initialization
router.use(async (req, res, next) => {
  if (!eldService.accessToken && req.path !== '/test-connection') {
    try {
      await eldService.initialize();
    } catch (error) {
      console.log('⚠️ ELD service not initialized:', error.message);
    }
  }
  next();
});

/**
 * @route   GET /api/eld/test-connection
 * @desc    Test ELD provider connection and authentication
 * @access  Private (Admin)
 */
router.get('/test-connection', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const connectionTest = await eldService.testConnection();
    
    res.json({
      success: connectionTest.success,
      message: connectionTest.message,
      data: {
        tokenValid: connectionTest.tokenValid,
        apiBaseUrl: connectionTest.apiBaseUrl,
        testResponse: connectionTest.testResponse
      }
    });
    
  } catch (error) {
    console.error('ELD connection test error:', error);
    res.status(500).json({
      success: false,
      message: 'ELD connection test failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/eld/status
 * @desc    Get ELD service status and statistics
 * @access  Private (Admin/Manager)
 */
router.get('/status', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const serviceStatus = eldService.getStatus();
    
    // Get database statistics
    const [totalLogs, totalDevices, recentViolations] = await Promise.all([
      DriverLog.countDocuments(),
      EldDevice.countDocuments(),
      DriverLog.countDocuments({ 
        hasViolations: true, 
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    ]);
    
    res.json({
      success: true,
      data: {
        service: serviceStatus,
        database: {
          totalLogs,
          totalDevices,
          recentViolations
        }
      }
    });
    
  } catch (error) {
    console.error('ELD status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ELD status',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/eld/sync-driver/:driverId
 * @desc    Sync specific driver's HOS data from ELD provider
 * @access  Private (Admin/Manager)
 */
router.post('/sync-driver/:driverId', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { driverId } = req.params;
    const { startDate, endDate } = req.body;
    
    // Verify driver exists
    const driver = await User.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    // Get HOS data from ELD provider
    const hosData = await eldService.getDriverHOS(driverId, startDate, endDate);
    
    // Get driver logs for the date range
    const logsPromises = [];
    const currentDate = new Date(startDate || Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDateObj = new Date(endDate || Date.now());
    
    while (currentDate <= endDateObj) {
      const dateStr = currentDate.toISOString().split('T')[0];
      logsPromises.push(eldService.getDriverLogs(driverId, dateStr));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const logsData = await Promise.all(logsPromises);
    
    // Process and store logs
    const processedLogs = [];
    for (const logData of logsData) {
      if (logData && logData.dutyStatusChanges.length > 0) {
        const processedLog = await this.processAndStoreDriverLog(logData);
        processedLogs.push(processedLog);
      }
    }
    
    res.json({
      success: true,
      message: `Successfully synced ${processedLogs.length} logs for driver ${driver.firstName} ${driver.lastName}`,
      data: {
        driverId,
        driverName: `${driver.firstName} ${driver.lastName}`,
        hosData,
        logsProcessed: processedLogs.length,
        dateRange: { startDate, endDate }
      }
    });
    
  } catch (error) {
    console.error('Driver sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync driver data',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/eld/sync-all
 * @desc    Sync all active drivers' data from ELD provider
 * @access  Private (Admin)
 */
router.post('/sync-all', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Get all active drivers
    const activeDrivers = await eldService.getAllActiveDrivers();
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Process each driver
    for (const driverData of activeDrivers) {
      try {
        // Get driver logs for the date
        const logData = await eldService.getDriverLogs(driverData.driverId, targetDate);
        
        if (logData && logData.dutyStatusChanges.length > 0) {
          await this.processAndStoreDriverLog(logData);
          successCount++;
        }
        
      } catch (error) {
        errorCount++;
        errors.push({
          driverId: driverData.driverId,
          driverName: driverData.name,
          error: error.message
        });
        console.error(`Failed to sync driver ${driverData.driverId}:`, error.message);
      }
    }
    
    res.json({
      success: true,
      message: `Sync completed: ${successCount} successful, ${errorCount} errors`,
      data: {
        date: targetDate,
        totalDrivers: activeDrivers.length,
        successCount,
        errorCount,
        errors
      }
    });
    
  } catch (error) {
    console.error('Bulk sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync all drivers',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/eld/logs/:driverId
 * @desc    Get driver logs with optional date filtering
 * @access  Private
 */
router.get('/logs/:driverId', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.params;
    const { startDate, endDate, page = 1, limit = 30 } = req.query;
    
    // Build query
    const query = { driverId };
    if (startDate || endDate) {
      query.logDate = {};
      if (startDate) query.logDate.$gte = startDate;
      if (endDate) query.logDate.$lte = endDate;
    }
    
    // Get logs with pagination
    const [logs, totalLogs] = await Promise.all([
      DriverLog.find(query)
        .populate('driverId', 'firstName lastName email')
        .populate('vehicleId', 'vehicleNumber make model')
        .sort({ logDate: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit),
      DriverLog.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalLogs / limit),
          totalLogs,
          hasNext: page * limit < totalLogs,
          hasPrev: page > 1
        }
      }
    });
    
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get driver logs',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/eld/logs/:driverId/current
 * @desc    Get driver's current day log and status
 * @access  Private
 */
router.get('/logs/:driverId/current', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.params;
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's log
    let currentLog = await DriverLog.findOne({ driverId, logDate: today })
      .populate('driverId', 'firstName lastName email')
      .populate('vehicleId', 'vehicleNumber make model');
    
    // If no log exists, try to fetch from ELD
    if (!currentLog) {
      try {
        const eldLogData = await eldService.getDriverLogs(driverId, today);
        if (eldLogData && eldLogData.dutyStatusChanges.length > 0) {
          currentLog = await this.processAndStoreDriverLog(eldLogData);
        }
      } catch (eldError) {
        console.log('Could not fetch from ELD:', eldError.message);
      }
    }
    
    // Get HOS data
    let hosData = null;
    try {
      hosData = await eldService.getDriverHOS(driverId);
    } catch (eldError) {
      console.log('Could not fetch HOS data:', eldError.message);
    }
    
    res.json({
      success: true,
      data: {
        currentLog,
        hosData,
        date: today
      }
    });
    
  } catch (error) {
    console.error('Get current log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get current driver log',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/eld/compliance/report
 * @desc    Get fleet-wide compliance report
 * @access  Private (Admin/Manager)
 */
router.get('/compliance/report', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get compliance data from database
    const complianceReport = await DriverLog.getComplianceReport(startDate, endDate);
    
    // Get ELD provider compliance summary
    let eldCompliance = null;
    try {
      eldCompliance = await eldService.getComplianceSummary();
    } catch (eldError) {
      console.log('Could not fetch ELD compliance data:', eldError.message);
    }
    
    // Get recent violations
    const recentViolations = await DriverLog.find({
      hasViolations: true,
      ...(startDate || endDate ? {
        logDate: {
          ...(startDate && { $gte: startDate }),
          ...(endDate && { $lte: endDate })
        }
      } : {})
    })
    .populate('driverId', 'firstName lastName')
    .sort({ logDate: -1 })
    .limit(50);
    
    res.json({
      success: true,
      data: {
        databaseReport: complianceReport[0] || {},
        eldProviderData: eldCompliance,
        recentViolations,
        dateRange: { startDate, endDate }
      }
    });
    
  } catch (error) {
    console.error('Compliance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate compliance report',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/eld/logs/:logId/approve
 * @desc    Approve/reject a driver log
 * @access  Private (Admin/Manager)
 */
router.put('/logs/:logId/approve', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { logId } = req.params;
    const { status, notes } = req.body;
    
    const log = await DriverLog.findById(logId);
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Driver log not found'
      });
    }
    
    log.status = status;
    log.approvedBy = req.user.id;
    log.approvedAt = new Date();
    
    if (status === 'REJECTED' && notes) {
      log.rejectionReason = notes;
    }
    
    await log.save();
    
    res.json({
      success: true,
      message: `Log ${status.toLowerCase()} successfully`,
      data: log
    });
    
  } catch (error) {
    console.error('Log approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update log status',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/eld/devices
 * @desc    Get all ELD devices
 * @access  Private (Admin/Manager)
 */
router.get('/devices', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = status ? { status } : {};
    
    const [devices, totalDevices] = await Promise.all([
      EldDevice.find(query)
        .populate('vehicleId', 'vehicleNumber make model')
        .sort({ lastCommunication: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit),
      EldDevice.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: {
        devices,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalDevices / limit),
          totalDevices,
          hasNext: page * limit < totalDevices,
          hasPrev: page > 1
        }
      }
    });
    
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ELD devices',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/eld/devices/health
 * @desc    Get fleet health summary
 * @access  Private (Admin/Manager)
 */
router.get('/devices/health', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const healthSummary = await EldDevice.getFleetHealthSummary();
    
    res.json({
      success: true,
      data: healthSummary[0] || {}
    });
    
  } catch (error) {
    console.error('Fleet health error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get fleet health summary',
      error: error.message
    });
  }
});

// Helper function to process and store driver log
async function processAndStoreDriverLog(logData) {
  try {
    // Check if log already exists
    const existingLog = await DriverLog.findOne({
      driverId: logData.driverId,
      logDate: logData.logDate
    });
    
    if (existingLog) {
      // Update existing log
      existingLog.dutyStatusChanges = logData.dutyStatusChanges;
      existingLog.lastSyncAt = new Date();
      existingLog.syncStatus = 'SYNCED';
      return await existingLog.save();
    } else {
      // Create new log
      const newLog = new DriverLog({
        ...logData,
        dataSource: 'API_IMPORT',
        lastSyncAt: new Date(),
        syncStatus: 'SYNCED'
      });
      return await newLog.save();
    }
    
  } catch (error) {
    console.error('Error processing driver log:', error);
    throw error;
  }
}

// Add helper function to router for access
router.processAndStoreDriverLog = processAndStoreDriverLog;

module.exports = router;