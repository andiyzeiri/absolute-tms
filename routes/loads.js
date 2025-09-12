const express = require('express');
const router = express.Router();
const Load = require('../models/Load');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../public/uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Only allow PDF files
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get all loads
router.get('/', async (req, res) => {
  try {
    const { status, customer, page = 1, limit = 100 } = req.query;
    
    // Build query
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (customer) {
      query.customer = { $regex: customer, $options: 'i' };
    }
    
    // Execute query with pagination
    const loads = await Load.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Load.countDocuments(query);
    
    res.json({
      success: true,
      data: loads,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching loads:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching loads',
      error: error.message
    });
  }
});

// Get a single load by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const load = await Load.findById(id);
    
    if (!load) {
      return res.status(404).json({
        success: false,
        message: 'Load not found'
      });
    }
    
    res.json({
      success: true,
      data: load
    });
  } catch (error) {
    console.error('Error fetching load:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching load',
      error: error.message
    });
  }
});

// Create a new load
router.post('/', async (req, res) => {
  try {
    const {
      loadNumber,
      customer,
      origin,
      destination,
      driver,
      vehicle,
      status,
      pickupDate,
      deliveryDate,
      rate,
      weight,
      commodity
    } = req.body;
    
    // Validate required fields
    if (!loadNumber || !customer || !origin || !destination || !driver || !vehicle || !pickupDate || !deliveryDate || !rate || !weight || !commodity) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Check if load number already exists
    const existingLoad = await Load.findOne({ loadNumber });
    if (existingLoad) {
      return res.status(400).json({
        success: false,
        message: 'Load number already exists'
      });
    }
    
    // Create new load
    const newLoad = new Load({
      loadNumber,
      customer,
      origin,
      destination,
      driver,
      vehicle,
      status: status || 'pending',
      pickupDate: new Date(pickupDate),
      deliveryDate: new Date(deliveryDate),
      rate: parseFloat(rate),
      weight,
      commodity
    });
    
    await newLoad.save();
    
    res.status(201).json({
      success: true,
      message: 'Load created successfully',
      data: newLoad
    });
  } catch (error) {
    console.error('Error creating load:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Load number already exists'
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Error creating load',
      error: error.message
    });
  }
});

// Update a load
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      loadNumber,
      customer,
      origin,
      destination,
      driver,
      vehicle,
      status,
      pickupDate,
      deliveryDate,
      rate,
      weight,
      commodity
    } = req.body;
    
    // Find and update load
    const updatedLoad = await Load.findByIdAndUpdate(
      id,
      {
        loadNumber,
        customer,
        origin,
        destination,
        driver,
        vehicle,
        status,
        pickupDate: pickupDate ? new Date(pickupDate) : undefined,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        rate: rate ? parseFloat(rate) : undefined,
        weight,
        commodity
      },
      { 
        new: true, 
        runValidators: true,
        omitUndefined: true
      }
    );
    
    if (!updatedLoad) {
      return res.status(404).json({
        success: false,
        message: 'Load not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Load updated successfully',
      data: updatedLoad
    });
  } catch (error) {
    console.error('Error updating load:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Load number already exists'
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Error updating load',
      error: error.message
    });
  }
});

// Delete a load
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedLoad = await Load.findByIdAndDelete(id);
    
    if (!deletedLoad) {
      return res.status(404).json({
        success: false,
        message: 'Load not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Load deleted successfully',
      data: {
        deletedLoad: deletedLoad.loadNumber
      }
    });
  } catch (error) {
    console.error('Error deleting load:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting load',
      error: error.message
    });
  }
});

// Get load statistics
router.get('/stats/dashboard', async (req, res) => {
  try {
    // Get counts by status
    const statusCounts = await Load.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get total revenue
    const revenueStats = await Load.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$rate' },
          averageRate: { $avg: '$rate' },
          totalLoads: { $sum: 1 }
        }
      }
    ]);
    
    // Get recent loads (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentLoads = await Load.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    // Format status counts
    const stats = {
      pending: 0,
      in_transit: 0,
      delivered: 0,
      delayed: 0
    };
    
    statusCounts.forEach(item => {
      stats[item._id] = item.count;
    });
    
    const revenue = revenueStats[0] || { totalRevenue: 0, averageRate: 0, totalLoads: 0 };
    
    res.json({
      success: true,
      data: {
        ...stats,
        totalLoads: revenue.totalLoads,
        totalRevenue: revenue.totalRevenue,
        averageRate: revenue.averageRate,
        recentLoads
      }
    });
  } catch (error) {
    console.error('Error fetching load statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching load statistics',
      error: error.message
    });
  }
});

// Upload file for load (proof of delivery or rate confirmation)
router.post('/:id/upload', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'proofOfDelivery' or 'rateConfirmation'
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    if (!type || (type !== 'proofOfDelivery' && type !== 'rateConfirmation')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Must be proofOfDelivery or rateConfirmation'
      });
    }
    
    // For demo mode, we'll just return the file info without database operations
    // since loads are stored in localStorage on frontend
    const fileInfo = {
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      uploadedAt: new Date(),
      size: req.file.size,
      _id: require('mongoose').Types.ObjectId().toString()
    };
    
    // Try to find the load in database, but don't fail if not found (demo mode)
    try {
      const load = await Load.findById(id);
      if (load) {
        // Push new file to the array instead of replacing
        if (!load[type]) {
          load[type] = [];
        }
        load[type].push(fileInfo);
        await load.save();
      }
    } catch (dbError) {
      console.log('Database operation failed (demo mode):', dbError.message);
      // Continue without database update for demo mode
    }
    
    res.json({
      success: true,
      message: `${type === 'proofOfDelivery' ? 'Proof of Delivery' : 'Rate Confirmation'} uploaded successfully`,
      data: {
        loadId: id,
        file: fileInfo
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
});

// Get file by filename
router.get('/files/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../public/uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Set proper headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving file',
      error: error.message
    });
  }
});

// Delete a specific PDF file from a load
router.delete('/:id/files/:fileId', async (req, res) => {
  try {
    const { id, fileId } = req.params;
    const { type } = req.query; // 'proofOfDelivery' or 'rateConfirmation'
    
    if (!type || (type !== 'proofOfDelivery' && type !== 'rateConfirmation')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Must be proofOfDelivery or rateConfirmation'
      });
    }

    let deletedFile = null;
    
    // Try to find and update the load in database
    try {
      const load = await Load.findById(id);
      if (load && load[type]) {
        const fileIndex = load[type].findIndex(file => file._id.toString() === fileId);
        if (fileIndex > -1) {
          deletedFile = load[type][fileIndex];
          load[type].splice(fileIndex, 1);
          await load.save();
        }
      }
    } catch (dbError) {
      console.log('Database operation failed (demo mode):', dbError.message);
      // Continue without database update for demo mode - frontend will handle removal
    }

    // Delete the physical file
    if (deletedFile) {
      try {
        const filePath = path.join(__dirname, '../public', deletedFile.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileError) {
        console.log('File deletion failed:', fileError.message);
      }
    }
    
    res.json({
      success: true,
      message: `${type === 'proofOfDelivery' ? 'Proof of Delivery' : 'Rate Confirmation'} file deleted successfully`,
      data: {
        loadId: id,
        fileId: fileId,
        deletedFile: deletedFile
      }
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
});

module.exports = router;