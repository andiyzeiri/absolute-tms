const express = require('express');
const router = express.Router();
const Broker = require('../models/Broker');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all brokers for the company
router.get('/', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 100 } = req.query;

    // Build query - ALWAYS filter by company
    let query = {
      company: req.user.company || req.user._id
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const brokers = await Broker.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Broker.countDocuments(query);

    res.json({
      success: true,
      data: brokers,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching brokers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching brokers',
      error: error.message
    });
  }
});

// Get a single broker by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find broker by ID AND company for security
    const broker = await Broker.findOne({
      _id: id,
      company: req.user.company || req.user._id
    });

    if (!broker) {
      return res.status(404).json({
        success: false,
        message: 'Broker not found'
      });
    }

    res.json({
      success: true,
      data: broker
    });
  } catch (error) {
    console.error('Error fetching broker:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching broker',
      error: error.message
    });
  }
});

// Create a new broker
router.post('/', async (req, res) => {
  try {
    const {
      brokerId,
      companyName,
      contactPerson,
      email,
      phone,
      address,
      rating,
      status,
      paymentTerms,
      creditLimit,
      industry,
      notes
    } = req.body;

    // Validate required fields
    if (!brokerId || !companyName || !contactPerson || !email || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: 'Broker ID, company name, contact person, email, phone, and address are required'
      });
    }

    // Check if broker ID already exists within the company
    const companyId = req.user.company || req.user._id;
    const existingBroker = await Broker.findOne({
      brokerId,
      company: companyId
    });
    if (existingBroker) {
      return res.status(400).json({
        success: false,
        message: 'Broker ID already exists in your company'
      });
    }

    // Create new broker with company
    const newBroker = new Broker({
      company: companyId,
      brokerId,
      companyName,
      contactPerson,
      email: email.toLowerCase(),
      phone,
      address,
      rating: rating || 0,
      status: status || 'active',
      paymentTerms: paymentTerms || 'Net 30',
      creditLimit: creditLimit || 0,
      industry: industry || 'Freight Brokerage',
      notes: notes || ''
    });

    await newBroker.save();

    res.status(201).json({
      success: true,
      message: 'Broker created successfully',
      data: newBroker
    });
  } catch (error) {
    console.error('Error creating broker:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Broker ID already exists'
      });
    }

    res.status(400).json({
      success: false,
      message: 'Error creating broker',
      error: error.message
    });
  }
});

// Update a broker
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.company;
    delete updateData.totalShipments;
    delete updateData.totalRevenue;
    delete updateData.lastShipment;

    // Find and update broker - only if it belongs to user's company
    const updatedBroker = await Broker.findOneAndUpdate(
      {
        _id: id,
        company: req.user.company || req.user._id
      },
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedBroker) {
      return res.status(404).json({
        success: false,
        message: 'Broker not found'
      });
    }

    res.json({
      success: true,
      message: 'Broker updated successfully',
      data: updatedBroker
    });
  } catch (error) {
    console.error('Error updating broker:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Broker ID already exists'
      });
    }

    res.status(400).json({
      success: false,
      message: 'Error updating broker',
      error: error.message
    });
  }
});

// Delete a broker
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete broker - only if it belongs to user's company
    const deletedBroker = await Broker.findOneAndDelete({
      _id: id,
      company: req.user.company || req.user._id
    });

    if (!deletedBroker) {
      return res.status(404).json({
        success: false,
        message: 'Broker not found'
      });
    }

    res.json({
      success: true,
      message: 'Broker deleted successfully',
      data: {
        deletedBroker: deletedBroker.companyName
      }
    });
  } catch (error) {
    console.error('Error deleting broker:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting broker',
      error: error.message
    });
  }
});

module.exports = router;