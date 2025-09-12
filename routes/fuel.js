const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const FuelTransaction = require('../models/FuelTransaction');
const FuelDataImporter = require('../services/fuelDataImporter');
const { body, query, validationResult } = require('express-validator');

// Configure multer for file uploads
const upload = multer({
  dest: 'temp/uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.pdf', '.xls', '.xlsx'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, PDF, XLS, and XLSX files are allowed.'));
    }
  }
});

// Initialize fuel data importer
const fuelImporter = new FuelDataImporter();

/**
 * GET /api/fuel/transactions
 * Get fuel transactions with filtering and pagination
 */
router.get('/transactions', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO 8601 format'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid ISO 8601 format'),
  query('driverName').optional().isString().withMessage('Driver name must be a string'),
  query('vehicleId').optional().isString().withMessage('Vehicle ID must be a string'),
  query('status').optional().isIn(['PENDING', 'VALIDATED', 'DISPUTED', 'APPROVED', 'REJECTED']).withMessage('Invalid status')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Extract query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    
    if (req.query.startDate || req.query.endDate) {
      filter.transactionDate = {};
      if (req.query.startDate) filter.transactionDate.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.transactionDate.$lte = new Date(req.query.endDate);
    }
    
    if (req.query.driverName) {
      filter.driverName = { $regex: req.query.driverName, $options: 'i' };
    }
    
    if (req.query.vehicleId) {
      filter.vehicleId = req.query.vehicleId;
    }
    
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Execute queries in parallel
    const [transactions, totalCount] = await Promise.all([
      FuelTransaction.find(filter)
        .sort({ transactionDate: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      FuelTransaction.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords: totalCount,
          hasNextPage,
          hasPrevPage,
          recordsPerPage: limit
        }
      }
    });

  } catch (error) {
    console.error('Error fetching fuel transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fuel transactions',
      error: error.message
    });
  }
});

/**
 * GET /api/fuel/transactions/:id
 * Get a specific fuel transaction by ID
 */
router.get('/transactions/:id', async (req, res) => {
  try {
    const transaction = await FuelTransaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Fuel transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });

  } catch (error) {
    console.error('Error fetching fuel transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fuel transaction',
      error: error.message
    });
  }
});

/**
 * POST /api/fuel/upload
 * Upload and process fuel data file (CSV, PDF, XLS, XLSX)
 */
router.post('/upload', upload.single('fuelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log(`📄 Processing uploaded file: ${req.file.originalname}`);
    
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let recordsProcessed = 0;
    
    if (fileExt === '.csv') {
      // Process CSV file directly
      const records = await fuelImporter.wexSftp.parseCSVFile(req.file.path);
      
      // Create a temporary import batch
      const importBatchId = require('uuid').v4();
      
      // Process the records using the same logic as SFTP import
      const operations = [];
      for (const record of records) {
        try {
          const transformedRecord = await fuelImporter.transformRecord(record, importBatchId);
          if (transformedRecord) {
            operations.push({
              updateOne: {
                filter: { transactionId: transformedRecord.transactionId },
                update: { $setOnInsert: transformedRecord },
                upsert: true
              }
            });
          }
        } catch (error) {
          console.error('Error processing record:', error);
        }
      }
      
      // Execute batch operations
      if (operations.length > 0) {
        const result = await FuelTransaction.bulkWrite(operations, { ordered: false });
        recordsProcessed = result.upsertedCount;
      }
      
    } else if (fileExt === '.pdf') {
      // For PDF files, we'll extract text and look for structured data
      // This is a placeholder - you might need a PDF parsing library
      recordsProcessed = 0;
      
      // Read file content for analysis
      const fileContent = await fs.readFile(req.file.path);
      console.log(`📄 PDF file size: ${fileContent.length} bytes`);
      
      res.json({
        success: true,
        message: 'PDF file uploaded successfully. Manual review required for data extraction.',
        data: {
          filename: req.file.originalname,
          size: fileContent.length,
          recordsProcessed: 0,
          note: 'PDF parsing requires manual configuration based on WEX format'
        }
      });
      
      // Clean up temp file
      await fs.unlink(req.file.path).catch(console.error);
      return;
      
    } else {
      // For XLS/XLSX files, you'd need a library like 'xlsx'
      recordsProcessed = 0;
    }

    // Clean up temp file
    await fs.unlink(req.file.path).catch(console.error);

    res.json({
      success: true,
      message: 'File processed successfully',
      data: {
        filename: req.file.originalname,
        recordsProcessed: recordsProcessed,
        importType: 'MANUAL_UPLOAD'
      }
    });

  } catch (error) {
    console.error('Error processing uploaded file:', error);
    
    // Clean up temp file on error
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    
    res.status(500).json({
      success: false,
      message: 'File processing failed',
      error: error.message
    });
  }
});

/**
 * POST /api/fuel/import
 * Trigger manual fuel data import from WEX SFTP
 */
router.post('/import', async (req, res) => {
  try {
    console.log('🚛 Manual fuel data import triggered');
    
    const result = await fuelImporter.importFuelData();
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: {
          batchId: result.batchId,
          stats: result.stats,
          filesProcessed: result.filesProcessed
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
        data: {
          batchId: result.batchId,
          stats: result.stats
        }
      });
    }

  } catch (error) {
    console.error('Error during manual import:', error);
    res.status(500).json({
      success: false,
      message: 'Manual import failed',
      error: error.message
    });
  }
});

/**
 * GET /api/fuel/test-connection
 * Test WEX SFTP connection
 */
router.get('/test-connection', async (req, res) => {
  try {
    console.log('🧪 Testing WEX SFTP connection');
    
    const result = await fuelImporter.testConnection();
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: {
          filesFound: result.filesFound,
          serverInfo: result.serverInfo
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    console.error('Error testing connection:', error);
    res.status(500).json({
      success: false,
      message: 'Connection test failed',
      error: error.message
    });
  }
});

/**
 * GET /api/fuel/stats
 * Get fuel transaction statistics
 */
router.get('/stats', [
  query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO 8601 format'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid ISO 8601 format'),
  query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('Invalid groupBy option')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Build filter
    const filter = {};
    if (req.query.startDate || req.query.endDate) {
      filter.transactionDate = {};
      if (req.query.startDate) filter.transactionDate.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.transactionDate.$lte = new Date(req.query.endDate);
    }

    // Get basic statistics
    const [basicStats] = await FuelTransaction.getFuelStats(filter);
    
    // Get statistics by driver
    const driverStats = await FuelTransaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$driverName',
          totalTransactions: { $sum: 1 },
          totalGallons: { $sum: '$quantity' },
          totalAmount: { $sum: '$totalAmount' },
          averagePrice: { $avg: '$unitPrice' }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 }
    ]);

    // Get statistics by vehicle
    const vehicleStats = await FuelTransaction.aggregate([
      { $match: filter },
      { $match: { vehicleId: { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: '$vehicleId',
          totalTransactions: { $sum: 1 },
          totalGallons: { $sum: '$quantity' },
          totalAmount: { $sum: '$totalAmount' },
          averageMPG: { $avg: '$mpg' }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 }
    ]);

    // Get statistics by product type
    const productStats = await FuelTransaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$productCode',
          productDescription: { $first: '$productDescription' },
          totalTransactions: { $sum: 1 },
          totalGallons: { $sum: '$quantity' },
          totalAmount: { $sum: '$totalAmount' },
          averagePrice: { $avg: '$unitPrice' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Get monthly trends if requested
    let trends = null;
    if (req.query.groupBy) {
      const groupBy = req.query.groupBy;
      let dateGrouping = {};
      
      switch (groupBy) {
        case 'day':
          dateGrouping = {
            year: { $year: '$transactionDate' },
            month: { $month: '$transactionDate' },
            day: { $dayOfMonth: '$transactionDate' }
          };
          break;
        case 'week':
          dateGrouping = {
            year: { $year: '$transactionDate' },
            week: { $week: '$transactionDate' }
          };
          break;
        case 'month':
          dateGrouping = {
            year: { $year: '$transactionDate' },
            month: { $month: '$transactionDate' }
          };
          break;
      }

      trends = await FuelTransaction.aggregate([
        { $match: filter },
        {
          $group: {
            _id: dateGrouping,
            totalTransactions: { $sum: 1 },
            totalGallons: { $sum: '$quantity' },
            totalAmount: { $sum: '$totalAmount' },
            averagePrice: { $avg: '$unitPrice' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
      ]);
    }

    res.json({
      success: true,
      data: {
        overview: basicStats || {
          totalTransactions: 0,
          totalGallons: 0,
          totalAmount: 0,
          averagePrice: 0,
          averageGallons: 0
        },
        topDrivers: driverStats,
        topVehicles: vehicleStats,
        productBreakdown: productStats,
        trends: trends
      }
    });

  } catch (error) {
    console.error('Error fetching fuel statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fuel statistics',
      error: error.message
    });
  }
});

/**
 * PUT /api/fuel/transactions/:id/status
 * Update transaction status
 */
router.put('/transactions/:id/status', [
  body('status').isIn(['PENDING', 'VALIDATED', 'DISPUTED', 'APPROVED', 'REJECTED']).withMessage('Invalid status'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { status, notes } = req.body;
    
    const transaction = await FuelTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Fuel transaction not found'
      });
    }

    // Update transaction
    transaction.status = status;
    if (notes) {
      transaction.notes = notes;
    }
    transaction.updatedBy = req.user?.email || 'SYSTEM'; // Assuming user info from auth middleware

    await transaction.save();

    res.json({
      success: true,
      message: 'Transaction status updated successfully',
      data: transaction
    });

  } catch (error) {
    console.error('Error updating transaction status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update transaction status',
      error: error.message
    });
  }
});

/**
 * GET /api/fuel/validation-report
 * Get validation report for transactions with flags
 */
router.get('/validation-report', async (req, res) => {
  try {
    // Find transactions with validation flags
    const flaggedTransactions = await FuelTransaction.find({
      'validationFlags.0': { $exists: true }
    })
    .sort({ processedDate: -1 })
    .limit(500)
    .lean();

    // Group by flag type
    const flagSummary = {};
    flaggedTransactions.forEach(transaction => {
      transaction.validationFlags.forEach(flag => {
        if (!flagSummary[flag.flag]) {
          flagSummary[flag.flag] = {
            count: 0,
            description: flag.description,
            severity: flag.severity,
            transactions: []
          };
        }
        flagSummary[flag.flag].count++;
        flagSummary[flag.flag].transactions.push({
          id: transaction._id,
          transactionId: transaction.transactionId,
          transactionDate: transaction.transactionDate,
          driverName: transaction.driverName,
          totalAmount: transaction.totalAmount
        });
      });
    });

    res.json({
      success: true,
      data: {
        totalFlaggedTransactions: flaggedTransactions.length,
        flagSummary,
        flaggedTransactions: flaggedTransactions.slice(0, 100) // Limit for performance
      }
    });

  } catch (error) {
    console.error('Error generating validation report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate validation report',
      error: error.message
    });
  }
});

/**
 * GET /api/fuel/import-status
 * Get status of fuel import service
 */
router.get('/import-status', async (req, res) => {
  try {
    const wexSftpStatus = fuelImporter.wexSftp.getStatus();
    const importStats = fuelImporter.getStats();
    
    // Get recent import batches
    const recentBatches = await FuelTransaction.aggregate([
      {
        $group: {
          _id: '$importBatch',
          importDate: { $min: '$processedDate' },
          transactionCount: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { importDate: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        sftpStatus: wexSftpStatus,
        currentImportStats: importStats,
        recentImportBatches: recentBatches
      }
    });

  } catch (error) {
    console.error('Error getting import status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get import status',
      error: error.message
    });
  }
});

module.exports = router;