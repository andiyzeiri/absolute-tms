const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all customers for the company
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
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Customer.countDocuments(query);

    res.json({
      success: true,
      data: customers,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customers',
      error: error.message
    });
  }
});

// Get a single customer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find customer by ID AND company for security
    const customer = await Customer.findOne({
      _id: id,
      company: req.user.company || req.user._id
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer',
      error: error.message
    });
  }
});

// Create a new customer
router.post('/', async (req, res) => {
  try {
    const {
      customerId,
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
      notes,
      motorCarrier
    } = req.body;

    // Validate required fields
    if (!customerId || !companyName || !contactPerson || !email || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID, company name, contact person, email, phone, and address are required'
      });
    }

    // Check if customer ID already exists within the company
    const companyId = req.user.company || req.user._id;
    const existingCustomer = await Customer.findOne({
      customerId,
      company: companyId
    });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID already exists in your company'
      });
    }

    // Create new customer with company
    const newCustomer = new Customer({
      company: companyId,
      customerId,
      companyName,
      contactPerson,
      email: email.toLowerCase(),
      phone,
      address,
      rating: rating || 0,
      status: status || 'active',
      paymentTerms: paymentTerms || 'Net 30',
      creditLimit: creditLimit || 0,
      industry: industry || '',
      notes: notes || '',
      motorCarrier: motorCarrier || ''
    });

    await newCustomer.save();

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: newCustomer
    });
  } catch (error) {
    console.error('Error creating customer:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID already exists'
      });
    }

    res.status(400).json({
      success: false,
      message: 'Error creating customer',
      error: error.message
    });
  }
});

// Update a customer
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.company;
    delete updateData.totalShipments;
    delete updateData.totalRevenue;
    delete updateData.lastShipment;

    // Find and update customer - only if it belongs to user's company
    const updatedCustomer = await Customer.findOneAndUpdate(
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

    if (!updatedCustomer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: updatedCustomer
    });
  } catch (error) {
    console.error('Error updating customer:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID already exists'
      });
    }

    res.status(400).json({
      success: false,
      message: 'Error updating customer',
      error: error.message
    });
  }
});

// Delete a customer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete customer - only if it belongs to user's company
    const deletedCustomer = await Customer.findOneAndDelete({
      _id: id,
      company: req.user.company || req.user._id
    });

    if (!deletedCustomer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: 'Customer deleted successfully',
      data: {
        deletedCustomer: deletedCustomer.companyName
      }
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting customer',
      error: error.message
    });
  }
});

module.exports = router;